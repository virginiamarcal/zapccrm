/**
 * Deal Creator — Story 2.4
 *
 * Creates deals automatically when keyword-triggered messages received.
 * Handles deal naming, default values, and notification emission.
 */

import type { UUID } from '../db/schema';
import { bridgeLogger } from './logger';

export interface Deal {
  id: UUID;
  org_id: UUID;
  contact_id: UUID;
  board_id: UUID;
  stage_id: UUID;
  name: string;
  deal_value?: number;
  status: 'active' | 'closed_won' | 'closed_lost';
  created_at: string;
  updated_at: string;
}

interface DealCreatorConfig {
  orgId: UUID;
  supabaseClient?: any;
}

export class DealCreator {
  private orgId: UUID;
  private supabaseClient: any;
  private defaultBoardId = 'board-web-leads' as UUID;
  private defaultStageName = 'Novo';

  constructor(config: DealCreatorConfig) {
    this.orgId = config.orgId;
    this.supabaseClient = config.supabaseClient;
  }

  /**
   * Create deal from keyword match
   */
  async createDeal(params: {
    contactId: UUID;
    contactName?: string;
    boardId: UUID;
    stageId: UUID;
    messageContent?: string;
  }): Promise<Deal> {
    try {
      bridgeLogger.logSyncStart(
        'DealCreator',
        this.orgId,
        'create_deal'
      );

      // Generate deal name
      const dealName = this.generateDealName(
        params.contactName,
        new Date()
      );

      // Create deal record
      const deal: Deal = {
        id: `deal-${params.contactId}-${Date.now()}` as UUID,
        org_id: this.orgId,
        contact_id: params.contactId,
        board_id: params.boardId,
        stage_id: params.stageId,
        name: dealName,
        deal_value: undefined, // Default null
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Would insert into database
      // const { data, error } = await this.supabaseClient
      //   .from('deals')
      //   .insert(deal);

      bridgeLogger.logSyncSuccess(
        'DealCreator',
        this.orgId,
        'deal_created',
        {
          dealId: deal.id,
          contactId: params.contactId,
          dealName: dealName,
          boardId: params.boardId,
          stageId: params.stageId,
        }
      );

      // Emit notification event
      await this.emitDealCreatedNotification(deal);

      return deal;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'DealCreator',
        this.orgId,
        'create_deal',
        error as Error,
        { contactId: params.contactId }
      );
      throw error;
    }
  }

  /**
   * Generate deal name from contact and date
   */
  private generateDealName(contactName: string | undefined, date: Date): string {
    const dateStr = date.toLocaleDateString('pt-BR');
    const name = contactName ? `${contactName} - ${dateStr}` : `Lead from WhatsApp - ${dateStr}`;
    return `Lead from WhatsApp - ${name}`;
  }

  /**
   * Emit notification event for deal creation
   */
  private async emitDealCreatedNotification(deal: Deal): Promise<void> {
    try {
      // Would emit event to notification system
      // This would trigger Slack/Email notifications
      // const event = {
      //   type: 'deal.created',
      //   org_id: this.orgId,
      //   data: deal
      // };
      // await eventBus.emit(event);

      bridgeLogger.logSyncSuccess(
        'DealCreator',
        this.orgId,
        'notification_event_emitted',
        { dealId: deal.id }
      );
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'DealCreator',
        this.orgId,
        'emit_notification',
        error as Error,
        { dealId: deal.id }
      );
      // Don't rethrow - notification failure shouldn't block deal creation
    }
  }

  /**
   * Get deal by ID
   */
  async getDeal(dealId: UUID): Promise<Deal | null> {
    try {
      // Would query: SELECT * FROM deals WHERE id = ? AND org_id = ?
      return null;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'DealCreator',
        this.orgId,
        'get_deal',
        error as Error
      );
      throw error;
    }
  }

  /**
   * List deals for contact
   */
  async getContactDeals(contactId: UUID): Promise<Deal[]> {
    try {
      // Would query: SELECT * FROM deals WHERE contact_id = ? AND org_id = ?
      return [];
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'DealCreator',
        this.orgId,
        'list_contact_deals',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Update deal
   */
  async updateDeal(dealId: UUID, updates: Partial<Deal>): Promise<Deal> {
    try {
      // Would query: UPDATE deals SET ... WHERE id = ?
      const updatedDeal: Deal = {
        id: dealId,
        org_id: this.orgId,
        contact_id: '' as UUID,
        board_id: '' as UUID,
        stage_id: '' as UUID,
        name: '',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...updates,
      };

      bridgeLogger.logSyncSuccess(
        'DealCreator',
        this.orgId,
        'deal_updated',
        { dealId }
      );

      return updatedDeal;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'DealCreator',
        this.orgId,
        'update_deal',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Set default board for deals
   */
  setDefaultBoard(boardId: UUID): void {
    this.defaultBoardId = boardId;
    bridgeLogger.logSyncSuccess(
      'DealCreator',
      this.orgId,
      'default_board_set',
      { boardId }
    );
  }

  /**
   * Get default board
   */
  getDefaultBoard(): UUID {
    return this.defaultBoardId;
  }
}
