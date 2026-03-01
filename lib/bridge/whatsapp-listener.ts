/**
 * WhatsApp Event Listener — Story 2.1
 *
 * Subscribes to WhatsApp events via Supabase Realtime (no polling).
 * Emits structured events to the BridgeEventBus.
 */

import { RealtimeChannel, RealtimeClient } from '@supabase/supabase-js';
import type { UUID } from '../db/schema';
import type { BridgeEvent, ListenerRegistry } from './types';
import { bridgeLogger } from './logger';

interface WhatsAppEventListenerConfig {
  supabaseUrl: string;
  supabaseKey: string;
  orgId: UUID;
  eventBus: ListenerRegistry;
}

export class WhatsAppEventListener {
  private realtimeClient: RealtimeClient;
  private channel: RealtimeChannel | null = null;
  private orgId: UUID;
  private eventBus: ListenerRegistry;
  private isConnected = false;

  constructor(config: WhatsAppEventListenerConfig) {
    this.orgId = config.orgId;
    this.eventBus = config.eventBus;

    // Initialize Realtime client
    this.realtimeClient = new RealtimeClient(config.supabaseUrl, {
      headers: {
        authorization: `Bearer ${config.supabaseKey}`,
      },
    });
  }

  /**
   * Start listening to WhatsApp events
   */
  async start(): Promise<void> {
    try {
      bridgeLogger.logSyncStart(
        'WhatsAppEventListener',
        this.orgId,
        'start_realtime_subscription'
      );

      const channelName = `whatsapp:org:${this.orgId}`;

      this.channel = this.realtimeClient.channel(channelName);

      // Subscribe to events
      this.channel
        .on('broadcast', { event: 'message:new' }, (payload) =>
          this.handleMessageReceived(payload)
        )
        .on('broadcast', { event: 'contact:sync' }, (payload) =>
          this.handleContactSync(payload)
        )
        .on('broadcast', { event: 'status:update' }, (payload) =>
          this.handleStatusUpdate(payload)
        )
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            bridgeLogger.logSyncSuccess(
              'WhatsAppEventListener',
              this.orgId,
              'realtime_subscription_established'
            );
          }
        });
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'WhatsAppEventListener',
        this.orgId,
        'start_realtime_subscription',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Stop listening to WhatsApp events
   */
  async stop(): Promise<void> {
    try {
      if (this.channel) {
        await this.realtimeClient.removeChannel(this.channel);
        this.channel = null;
        this.isConnected = false;

        bridgeLogger.logSyncSuccess(
          'WhatsAppEventListener',
          this.orgId,
          'stop_realtime_subscription'
        );
      }
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'WhatsAppEventListener',
        this.orgId,
        'stop_realtime_subscription',
        error as Error
      );
    }
  }

  /**
   * Handle incoming message event
   */
  private async handleMessageReceived(payload: any): Promise<void> {
    try {
      const event: BridgeEvent = {
        id: payload.id || `msg-${Date.now()}`,
        type: 'message.received',
        org_id: this.orgId,
        timestamp: new Date().toISOString(),
        source: 'whatsapp',
        data: payload.message || {},
      };

      await this.eventBus.emit(event);

      bridgeLogger.logSyncSuccess(
        'WhatsAppEventListener',
        this.orgId,
        'message_received_processed',
        { messageId: event.id }
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'WhatsAppEventListener',
        this.orgId,
        'handle_message_received',
        error as Error,
        { payload }
      );
    }
  }

  /**
   * Handle contact sync event
   */
  private async handleContactSync(payload: any): Promise<void> {
    try {
      const event: BridgeEvent = {
        id: payload.id || `contact-${Date.now()}`,
        type: 'contact.created',
        org_id: this.orgId,
        timestamp: new Date().toISOString(),
        source: 'whatsapp',
        data: payload.contact || {},
      };

      await this.eventBus.emit(event);

      bridgeLogger.logSyncSuccess(
        'WhatsAppEventListener',
        this.orgId,
        'contact_sync_processed',
        { contactId: event.id }
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'WhatsAppEventListener',
        this.orgId,
        'handle_contact_sync',
        error as Error,
        { payload }
      );
    }
  }

  /**
   * Handle status update event
   */
  private async handleStatusUpdate(payload: any): Promise<void> {
    try {
      const event: BridgeEvent = {
        id: payload.id || `status-${Date.now()}`,
        type: 'message.sent',
        org_id: this.orgId,
        timestamp: new Date().toISOString(),
        source: 'whatsapp',
        data: payload.status || {},
      };

      await this.eventBus.emit(event);

      bridgeLogger.logSyncSuccess(
        'WhatsAppEventListener',
        this.orgId,
        'status_update_processed',
        { statusId: event.id }
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'WhatsAppEventListener',
        this.orgId,
        'handle_status_update',
        error as Error,
        { payload }
      );
    }
  }

  /**
   * Check if listener is connected
   */
  isReady(): boolean {
    return this.isConnected;
  }
}
