/**
 * Bidirectional Trigger — Story 2.1
 *
 * Orchestrates the complete sync flow: listens to events,
 * processes them through sync engine, and manages the event bus.
 */

import type { UUID } from '../db/schema';
import type { BridgeEvent, BridgeEventType, EventListener, ListenerRegistry } from './types';
import { bridgeLogger } from './logger';

interface BidirectionalTriggerConfig {
  orgId: UUID;
}

/**
 * In-memory event listener registry
 */
class EventListenerRegistry implements ListenerRegistry {
  private listeners: Map<BridgeEventType, EventListener[]> = new Map();

  register(listener: EventListener): void {
    const eventType = listener.eventType;
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const list = this.listeners.get(eventType)!;
    list.push(listener);

    // Sort by priority (higher first)
    list.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  unregister(listener: EventListener): void {
    const list = this.listeners.get(listener.eventType);
    if (list) {
      const idx = list.indexOf(listener);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    }
  }

  async emit(event: BridgeEvent): Promise<void> {
    const listeners = this.listeners.get(event.type) || [];

    // Run listeners in sequence
    for (const listener of listeners) {
      try {
        await listener.handler(event);
      } catch (error) {
        bridgeLogger.logSyncFailure(
          'EventListenerRegistry',
          event.org_id,
          `listener_execution_failed_${event.type}`,
          error as Error,
          {
            eventId: event.id,
            eventType: event.type,
          }
        );
      }
    }
  }

  getListeners(eventType: BridgeEventType): EventListener[] {
    return this.listeners.get(eventType) || [];
  }

  /**
   * Get count of all registered listeners
   */
  getListenerCount(): number {
    let count = 0;
    for (const listeners of this.listeners.values()) {
      count += listeners.length;
    }
    return count;
  }

  /**
   * Clear all listeners
   */
  clear(): void {
    this.listeners.clear();
  }
}

/**
 * Bidirectional Trigger orchestrator
 */
export class BidirectionalTrigger {
  private orgId: UUID;
  private eventBus: EventListenerRegistry;
  private isActive = false;

  constructor(config: BidirectionalTriggerConfig) {
    this.orgId = config.orgId;
    this.eventBus = new EventListenerRegistry();
  }

  /**
   * Start the trigger system
   */
  async start(): Promise<void> {
    try {
      this.isActive = true;
      bridgeLogger.logSyncStart(
        'BidirectionalTrigger',
        this.orgId,
        'trigger_system_started'
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'BidirectionalTrigger',
        this.orgId,
        'start_trigger_system',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Stop the trigger system
   */
  async stop(): Promise<void> {
    try {
      this.isActive = false;
      this.eventBus.clear();
      bridgeLogger.logSyncSuccess(
        'BidirectionalTrigger',
        this.orgId,
        'trigger_system_stopped'
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'BidirectionalTrigger',
        this.orgId,
        'stop_trigger_system',
        error as Error
      );
    }
  }

  /**
   * Register a listener for a specific event type
   */
  on(listener: EventListener): void {
    if (!this.isActive) {
      throw new Error('BidirectionalTrigger is not active');
    }
    this.eventBus.register(listener);
  }

  /**
   * Unregister a listener
   */
  off(listener: EventListener): void {
    this.eventBus.unregister(listener);
  }

  /**
   * Emit an event to all registered listeners
   */
  async emit(event: BridgeEvent): Promise<void> {
    if (!this.isActive) {
      throw new Error('BidirectionalTrigger is not active');
    }

    try {
      await this.eventBus.emit(event);
      bridgeLogger.logSyncSuccess(
        'BidirectionalTrigger',
        this.orgId,
        'event_emitted',
        {
          eventId: event.id,
          eventType: event.type,
          source: event.source,
          listenerCount: this.eventBus.getListeners(event.type).length,
        }
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'BidirectionalTrigger',
        this.orgId,
        'event_emission_failed',
        error as Error,
        {
          eventId: event.id,
          eventType: event.type,
        }
      );
      throw error;
    }
  }

  /**
   * Get registered event bus
   */
  getEventBus(): ListenerRegistry {
    return this.eventBus;
  }

  /**
   * Check if active
   */
  isReady(): boolean {
    return this.isActive;
  }

  /**
   * Get stats
   */
  getStats(): {
    isActive: boolean;
    listenerCount: number;
    registeredEventTypes: BridgeEventType[];
  } {
    const eventTypes: BridgeEventType[] = [];
    const listenerCount = this.eventBus.getListenerCount();

    // Collect all registered event types
    const allTypes: BridgeEventType[] = [
      'contact.created',
      'contact.updated',
      'contact.deleted',
      'activity.created',
      'deal.created',
      'deal.updated',
      'message.sent',
      'message.received',
      'sync.started',
      'sync.completed',
      'sync.failed',
    ];

    for (const eventType of allTypes) {
      if (this.eventBus.getListeners(eventType).length > 0) {
        eventTypes.push(eventType);
      }
    }

    return {
      isActive: this.isActive,
      listenerCount,
      registeredEventTypes: eventTypes,
    };
  }
}

/**
 * Export event registry for direct use
 */
export { EventListenerRegistry };
