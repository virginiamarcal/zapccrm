/**
 * Bridge Sync Service — Story 2.1
 *
 * Main entry point for WhatsApp↔CRM synchronization.
 * Coordinates: WhatsAppEventListener, CRMSyncEngine, and BidirectionalTrigger.
 */

import type { UUID } from '../db/schema';
import { WhatsAppEventListener } from './whatsapp-listener';
import { CRMSyncEngine } from './crm-sync-engine';
import { BidirectionalTrigger, EventListenerRegistry } from './bidirectional-trigger';
import { bridgeLogger } from './logger';
import type { BridgeEvent, EventListener, RetryConfig } from './types';

interface SyncServiceConfig {
  orgId: UUID;
  supabaseUrl: string;
  supabaseKey: string;
  retryConfig?: Partial<RetryConfig>;
}

export class BridgeSyncService {
  private orgId: UUID;
  private whatsappListener: WhatsAppEventListener;
  private syncEngine: CRMSyncEngine;
  private bidirectionalTrigger: BidirectionalTrigger;
  private isInitialized = false;

  constructor(config: SyncServiceConfig) {
    this.orgId = config.orgId;

    // Initialize trigger system (event bus)
    this.bidirectionalTrigger = new BidirectionalTrigger({
      orgId: config.orgId,
    });

    // Initialize sync engine
    this.syncEngine = new CRMSyncEngine({
      orgId: config.orgId,
      retryConfig: config.retryConfig,
    });

    // Initialize WhatsApp listener
    this.whatsappListener = new WhatsAppEventListener({
      supabaseUrl: config.supabaseUrl,
      supabaseKey: config.supabaseKey,
      orgId: config.orgId,
      eventBus: this.bidirectionalTrigger.getEventBus(),
    });
  }

  /**
   * Initialize and start the sync service
   */
  async initialize(): Promise<void> {
    try {
      bridgeLogger.logSyncStart(
        'BridgeSyncService',
        this.orgId,
        'initialize'
      );

      // Start bidirectional trigger
      await this.bidirectionalTrigger.start();

      // Start WhatsApp listener (Realtime subscriptions)
      await this.whatsappListener.start();

      // Register default sync handler
      this.registerSyncHandler();

      this.isInitialized = true;

      bridgeLogger.logSyncSuccess(
        'BridgeSyncService',
        this.orgId,
        'initialize',
        {
          components: ['bidirectionalTrigger', 'whatsappListener', 'syncEngine'],
        }
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'BridgeSyncService',
        this.orgId,
        'initialize',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Shut down the sync service
   */
  async shutdown(): Promise<void> {
    try {
      bridgeLogger.logSyncStart(
        'BridgeSyncService',
        this.orgId,
        'shutdown'
      );

      await this.whatsappListener.stop();
      await this.bidirectionalTrigger.stop();

      this.isInitialized = false;

      bridgeLogger.logSyncSuccess(
        'BridgeSyncService',
        this.orgId,
        'shutdown'
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'BridgeSyncService',
        this.orgId,
        'shutdown',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Register a custom listener
   */
  on(listener: EventListener): void {
    this.bidirectionalTrigger.on(listener);
    bridgeLogger.logSyncSuccess(
      'BridgeSyncService',
      this.orgId,
      'listener_registered',
      { eventType: listener.eventType }
    );
  }

  /**
   * Unregister a listener
   */
  off(listener: EventListener): void {
    this.bidirectionalTrigger.off(listener);
  }

  /**
   * Manually emit an event
   */
  async emitEvent(event: BridgeEvent): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('BridgeSyncService is not initialized');
    }
    await this.bidirectionalTrigger.emit(event);
  }

  /**
   * Get service status
   */
  getStatus(): {
    initialized: boolean;
    whatsappListenerReady: boolean;
    triggerSystemReady: boolean;
    pendingOperations: number;
    failedOperations: number;
  } {
    return {
      initialized: this.isInitialized,
      whatsappListenerReady: this.whatsappListener.isReady(),
      triggerSystemReady: this.bidirectionalTrigger.isReady(),
      pendingOperations: this.syncEngine.getPendingOperations().length,
      failedOperations: this.syncEngine.getFailedOperations().length,
    };
  }

  /**
   * Get all pending operations
   */
  getPendingOperations() {
    return this.syncEngine.getPendingOperations();
  }

  /**
   * Get all failed operations
   */
  getFailedOperations() {
    return this.syncEngine.getFailedOperations();
  }

  /**
   * Get sync engine (for advanced use)
   */
  getSyncEngine(): CRMSyncEngine {
    return this.syncEngine;
  }

  /**
   * Get trigger system (for advanced use)
   */
  getTriggerSystem(): BidirectionalTrigger {
    return this.bidirectionalTrigger;
  }

  /**
   * Register default sync handler that processes events through the engine
   */
  private registerSyncHandler(): void {
    const defaultListener: EventListener = {
      eventType: 'message.received',
      handler: async (event: BridgeEvent) => {
        await this.syncEngine.processEvent(event);
      },
      priority: 100, // High priority
    };

    this.bidirectionalTrigger.on(defaultListener);

    // Register handlers for other event types
    const eventTypes: Array<
      'contact.created' | 'contact.updated' | 'activity.created' | 'deal.created' | 'deal.updated' | 'message.sent'
    > = ['contact.created', 'contact.updated', 'activity.created', 'deal.created', 'deal.updated', 'message.sent'];

    for (const eventType of eventTypes) {
      this.bidirectionalTrigger.on({
        eventType,
        handler: async (event: BridgeEvent) => {
          await this.syncEngine.processEvent(event);
        },
        priority: 100,
      });
    }
  }
}

/**
 * Singleton instance manager
 */
let instance: BridgeSyncService | null = null;

export function createSyncService(config: SyncServiceConfig): BridgeSyncService {
  if (instance && instance['orgId'] === config.orgId) {
    return instance;
  }
  instance = new BridgeSyncService(config);
  return instance;
}

export function getSyncService(): BridgeSyncService {
  if (!instance) {
    throw new Error('BridgeSyncService not initialized. Call createSyncService first.');
  }
  return instance;
}

export { BridgeSyncService };
