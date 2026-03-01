/**
 * Automation Trigger — Story 2.5
 *
 * Manages automation configurations and triggers on deal stage changes.
 * Handles PL/pgSQL trigger integration and QStash job enqueueing.
 */

import type { UUID } from '../db/schema';
import { bridgeLogger } from './logger';

export interface Automation {
  id: UUID;
  org_id: UUID;
  event_type: 'stage_changed';
  event_value: UUID; // stage_id
  action_type: 'send_whatsapp';
  template_id: UUID;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

interface AutomationTriggerConfig {
  orgId: UUID;
  supabaseClient?: any;
  qstashClient?: any;
}

interface DealStageChangeEvent {
  dealId: UUID;
  contactId: UUID;
  oldStageId: UUID;
  newStageId: UUID;
  dealName: string;
  contactName?: string;
}

export class AutomationTrigger {
  private orgId: UUID;
  private supabaseClient: any;
  private qstashClient: any;
  private automations: Automation[] = [];

  constructor(config: AutomationTriggerConfig) {
    this.orgId = config.orgId;
    this.supabaseClient = config.supabaseClient;
    this.qstashClient = config.qstashClient;
  }

  /**
   * Create automation configuration
   */
  async createAutomation(params: {
    eventType: 'stage_changed';
    stageId: UUID;
    templateId: UUID;
    enabled?: boolean;
  }): Promise<Automation> {
    try {
      bridgeLogger.logSyncStart(
        'AutomationTrigger',
        this.orgId,
        'create_automation'
      );

      const automation: Automation = {
        id: `auto-${Date.now()}` as UUID,
        org_id: this.orgId,
        event_type: 'stage_changed',
        event_value: params.stageId,
        action_type: 'send_whatsapp',
        template_id: params.templateId,
        enabled: params.enabled !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Would insert into database
      // const { data, error } = await this.supabaseClient
      //   .from('automations')
      //   .insert(automation);

      this.automations.push(automation);

      bridgeLogger.logSyncSuccess(
        'AutomationTrigger',
        this.orgId,
        'automation_created',
        {
          automationId: automation.id,
          stageId: params.stageId,
          templateId: params.templateId,
        }
      );

      return automation;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'AutomationTrigger',
        this.orgId,
        'create_automation',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Handle deal stage change event
   * This would be called from PL/pgSQL trigger
   */
  async onDealStageChange(event: DealStageChangeEvent): Promise<void> {
    try {
      bridgeLogger.logSyncStart(
        'AutomationTrigger',
        this.orgId,
        'on_deal_stage_change'
      );

      // Find automation for this stage
      const automation = this.automations.find(
        (a) =>
          a.enabled &&
          a.event_type === 'stage_changed' &&
          a.event_value === event.newStageId
      );

      if (!automation) {
        bridgeLogger.logSyncSuccess(
          'AutomationTrigger',
          this.orgId,
          'no_automation_found_for_stage',
          { stageId: event.newStageId }
        );
        return;
      }

      // Enqueue message send in QStash
      await this.enqueueMessage(event, automation);

      bridgeLogger.logSyncSuccess(
        'AutomationTrigger',
        this.orgId,
        'automation_triggered',
        {
          dealId: event.dealId,
          automationId: automation.id,
          templateId: automation.template_id,
        }
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'AutomationTrigger',
        this.orgId,
        'on_deal_stage_change',
        error as Error,
        { dealId: event.dealId }
      );
      throw error;
    }
  }

  /**
   * Enqueue message in QStash for async processing
   */
  private async enqueueMessage(
    event: DealStageChangeEvent,
    automation: Automation
  ): Promise<string> {
    try {
      const jobPayload = {
        dealId: event.dealId,
        contactId: event.contactId,
        templateId: automation.template_id,
        variables: {
          contact_name: event.contactName,
          deal_name: event.dealName,
          stage_name: event.newStageId, // Would be actual stage name
        },
      };

      // Would call QStash API
      // const response = await this.qstashClient.publishJSON({
      //   topic: `whatsapp-send-${this.orgId}`,
      //   body: jobPayload,
      //   delay: 0,
      // });

      const jobId = `job-${Date.now()}`;

      // Create message status record
      await this.createMessageStatus(
        event.contactId,
        jobId,
        'queued'
      );

      bridgeLogger.logSyncSuccess(
        'AutomationTrigger',
        this.orgId,
        'message_enqueued',
        {
          jobId,
          dealId: event.dealId,
          template: automation.template_id,
        }
      );

      return jobId;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'AutomationTrigger',
        this.orgId,
        'enqueue_message',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Create message status tracking record
   */
  private async createMessageStatus(
    contactId: UUID,
    jobId: string,
    status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
  ): Promise<void> {
    try {
      // Would insert into database
      // const { data, error } = await this.supabaseClient
      //   .from('message_status')
      //   .insert({
      //     org_id: this.orgId,
      //     contact_id: contactId,
      //     job_id: jobId,
      //     status,
      //     created_at: new Date().toISOString(),
      //   });
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'AutomationTrigger',
        this.orgId,
        'create_message_status',
        error as Error
      );
      // Don't rethrow - status tracking is non-critical
    }
  }

  /**
   * Get all automations
   */
  getAutomations(): Automation[] {
    return this.automations;
  }

  /**
   * Get enabled automations
   */
  getEnabledAutomations(): Automation[] {
    return this.automations.filter((a) => a.enabled);
  }

  /**
   * Update automation
   */
  updateAutomation(id: UUID, updates: Partial<Automation>): Automation | null {
    const automation = this.automations.find((a) => a.id === id);
    if (!automation) return null;

    const updated = { ...automation, ...updates };
    const index = this.automations.findIndex((a) => a.id === id);
    this.automations[index] = updated;

    bridgeLogger.logSyncSuccess(
      'AutomationTrigger',
      this.orgId,
      'automation_updated',
      { automationId: id }
    );

    return updated;
  }

  /**
   * Delete automation
   */
  deleteAutomation(id: UUID): boolean {
    const index = this.automations.findIndex((a) => a.id === id);
    if (index === -1) return false;

    this.automations.splice(index, 1);

    bridgeLogger.logSyncSuccess(
      'AutomationTrigger',
      this.orgId,
      'automation_deleted',
      { automationId: id }
    );

    return true;
  }

  /**
   * Get stats
   */
  getStats(): {
    totalAutomations: number;
    enabledAutomations: number;
  } {
    return {
      totalAutomations: this.automations.length,
      enabledAutomations: this.automations.filter((a) => a.enabled).length,
    };
  }
}
