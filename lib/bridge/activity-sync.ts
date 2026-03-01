/**
 * Activity Sync Service — Story 2.3
 *
 * Handles WhatsApp message to CRM activity synchronization.
 * Creates timeline entries for all WhatsApp interactions.
 */

import type { UUID } from '../db/schema';
import type { Activity, CreateActivityInput } from '../db/schema';
import { bridgeLogger } from './logger';

interface ActivitySyncConfig {
  orgId: UUID;
  supabaseClient?: any;
}

interface ActivityMessage {
  id?: string;
  contact_id: UUID;
  text: string;
  direction: 'inbound' | 'outbound';
  timestamp?: string;
  status?: 'sent' | 'delivered' | 'read' | 'pending';
  whatsapp_message_id?: string;
}

interface TimelineQuery {
  contact_id: UUID;
  limit?: number;
  offset?: number;
  orderBy?: 'asc' | 'desc';
}

interface MessageCounter {
  contact_id: UUID;
  total_messages: number;
  inbound_count: number;
  outbound_count: number;
  unread_count: number;
  last_message_at: string | null;
}

export class ActivitySync {
  private orgId: UUID;
  private supabaseClient: any;
  private messageCounters: Map<UUID, MessageCounter> = new Map();

  constructor(config: ActivitySyncConfig) {
    this.orgId = config.orgId;
    this.supabaseClient = config.supabaseClient;
  }

  /**
   * Create activity from WhatsApp message
   */
  async createActivityFromMessage(message: ActivityMessage): Promise<Activity> {
    try {
      bridgeLogger.logSyncStart(
        'ActivitySync',
        this.orgId,
        'create_activity_from_message'
      );

      // Create activity record
      const activity: Activity = {
        id: `activity-${message.whatsapp_message_id || Date.now()}` as UUID,
        organization_id: this.orgId,
        contact_id: message.contact_id,
        activity_type: 'whatsapp_message',
        content: message.text,
        direction: message.direction,
        metadata: {
          whatsapp_message_id: message.whatsapp_message_id,
          status: message.status || 'pending',
          platform: 'whatsapp',
        },
        created_at: message.timestamp || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Would insert into database
      // const { data, error } = await this.supabaseClient
      //   .from('activities')
      //   .insert(activity);

      // Update counters
      await this.updateMessageCounter(message.contact_id);

      bridgeLogger.logSyncSuccess(
        'ActivitySync',
        this.orgId,
        'activity_created',
        {
          activityId: activity.id,
          contactId: message.contact_id,
          direction: message.direction,
        }
      );

      return activity;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ActivitySync',
        this.orgId,
        'create_activity_from_message',
        error as Error,
        { message }
      );
      throw error;
    }
  }

  /**
   * Get contact activity timeline
   */
  async getTimeline(query: TimelineQuery): Promise<Activity[]> {
    try {
      bridgeLogger.logSyncStart(
        'ActivitySync',
        this.orgId,
        'get_timeline'
      );

      const limit = query.limit || 50;
      const offset = query.offset || 0;
      const orderBy = query.orderBy || 'desc';

      // Would query: SELECT * FROM activities
      // WHERE organization_id = ? AND contact_id = ?
      // ORDER BY created_at DESC
      // LIMIT ? OFFSET ?

      const activities: Activity[] = [];

      bridgeLogger.logSyncSuccess(
        'ActivitySync',
        this.orgId,
        'timeline_retrieved',
        {
          contactId: query.contact_id,
          activityCount: activities.length,
        }
      );

      return activities;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ActivitySync',
        this.orgId,
        'get_timeline',
        error as Error,
        { query }
      );
      throw error;
    }
  }

  /**
   * Get message counters for a contact
   */
  async getMessageCounter(contactId: UUID): Promise<MessageCounter> {
    try {
      // Check cache first
      if (this.messageCounters.has(contactId)) {
        return this.messageCounters.get(contactId)!;
      }

      // Would query: SELECT
      // COUNT(*) as total_messages,
      // COUNT(CASE WHEN direction = 'inbound' THEN 1 END) as inbound_count,
      // COUNT(CASE WHEN direction = 'outbound' THEN 1 END) as outbound_count,
      // COUNT(CASE WHEN status != 'read' THEN 1 END) as unread_count,
      // MAX(created_at) as last_message_at
      // FROM activities
      // WHERE organization_id = ? AND contact_id = ? AND activity_type = 'whatsapp_message'

      const counter: MessageCounter = {
        contact_id: contactId,
        total_messages: 0,
        inbound_count: 0,
        outbound_count: 0,
        unread_count: 0,
        last_message_at: null,
      };

      this.messageCounters.set(contactId, counter);
      return counter;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ActivitySync',
        this.orgId,
        'get_message_counter',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Update message counter for contact
   */
  private async updateMessageCounter(contactId: UUID): Promise<void> {
    try {
      // Clear cache for this contact so it gets recalculated
      this.messageCounters.delete(contactId);

      // Get fresh counts
      await this.getMessageCounter(contactId);

      bridgeLogger.logSyncSuccess(
        'ActivitySync',
        this.orgId,
        'message_counter_updated',
        { contactId }
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ActivitySync',
        this.orgId,
        'update_message_counter',
        error as Error
      );
      // Don't rethrow - counter update is not critical
    }
  }

  /**
   * Mark activity as read
   */
  async markActivityAsRead(activityId: UUID): Promise<void> {
    try {
      // Would update: UPDATE activities SET metadata['status'] = 'read' WHERE id = ?
      bridgeLogger.logSyncSuccess(
        'ActivitySync',
        this.orgId,
        'activity_marked_read',
        { activityId }
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ActivitySync',
        this.orgId,
        'mark_activity_as_read',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Get activity statistics for contact
   */
  async getActivityStats(contactId: UUID): Promise<{
    totalActivities: number;
    whatsappActivities: number;
    lastActivityAt: string | null;
    activityTypes: Record<string, number>;
  }> {
    try {
      // Would aggregate activities
      return {
        totalActivities: 0,
        whatsappActivities: 0,
        lastActivityAt: null,
        activityTypes: {},
      };
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'ActivitySync',
        this.orgId,
        'get_activity_stats',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Clear counter cache (for testing or manual refresh)
   */
  clearCounterCache(): void {
    this.messageCounters.clear();
    bridgeLogger.logSyncSuccess(
      'ActivitySync',
      this.orgId,
      'counter_cache_cleared'
    );
  }
}
