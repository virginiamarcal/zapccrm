/**
 * CRM Sync Engine — Story 2.1
 *
 * Processes sync operations with retry logic, error handling,
 * and bidirectional synchronization between WhatsApp and CRM.
 */

import type { UUID } from '../db/schema';
import type { BridgeEvent, SyncOperation, RetryConfig } from './types';
import { bridgeLogger } from './logger';

interface CRMSyncEngineConfig {
  orgId: UUID;
  retryConfig?: Partial<RetryConfig>;
}

export class CRMSyncEngine {
  private orgId: UUID;
  private retryConfig: RetryConfig;
  private operationQueue: Map<string, SyncOperation> = new Map();

  constructor(config: CRMSyncEngineConfig) {
    this.orgId = config.orgId;
    this.retryConfig = {
      maxAttempts: 3,
      backoffMs: [1000, 2000, 4000], // Exponential backoff
      timeout: 30000,
      ...config.retryConfig,
    };
  }

  /**
   * Process a bridge event
   */
  async processEvent(event: BridgeEvent): Promise<SyncOperation> {
    const operation: SyncOperation = {
      id: `sync-${event.id}-${Date.now()}`,
      org_id: this.orgId,
      entity_type: this.extractEntityType(event.type),
      direction:
        event.source === 'whatsapp' ? 'whatsapp_to_crm' : 'crm_to_whatsapp',
      operation: this.extractOperation(event.type),
      status: 'pending',
      attempt: 1,
      max_attempts: this.retryConfig.maxAttempts,
      started_at: new Date().toISOString(),
    };

    this.operationQueue.set(operation.id, operation);

    try {
      await this.executeSync(operation, event);
      operation.status = 'completed';
      operation.completed_at = new Date().toISOString();

      bridgeLogger.logSyncSuccess(
        'CRMSyncEngine',
        this.orgId,
        'sync_operation_completed',
        {
          operationId: operation.id,
          entityType: operation.entity_type,
          direction: operation.direction,
        }
      );
    } catch (error) {
      await this.handleSyncError(operation, error as Error, event);
    }

    return operation;
  }

  /**
   * Execute a sync operation with retry logic
   */
  private async executeSync(
    operation: SyncOperation,
    event: BridgeEvent
  ): Promise<void> {
    operation.status = 'in_progress';

    try {
      // Simulate sync operation (actual implementation depends on entity type)
      await this.performSync(operation, event);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Actual sync operation (stubbed for now)
   */
  private async performSync(
    operation: SyncOperation,
    event: BridgeEvent
  ): Promise<void> {
    // This would call different handlers based on entity_type
    // For now, just log the operation
    bridgeLogger.logSyncStart(
      'CRMSyncEngine',
      this.orgId,
      `sync_${operation.entity_type}`,
    );

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 100));

    bridgeLogger.logSyncSuccess(
      'CRMSyncEngine',
      this.orgId,
      `sync_${operation.entity_type}`,
      {
        entityType: operation.entity_type,
        eventData: event.data,
      }
    );
  }

  /**
   * Handle sync errors with retry
   */
  private async handleSyncError(
    operation: SyncOperation,
    error: Error,
    event: BridgeEvent
  ): Promise<void> {
    operation.attempt++;
    operation.error = error.message;

    if (operation.attempt <= operation.max_attempts) {
      // Calculate backoff
      const backoffIndex = Math.min(
        operation.attempt - 1,
        this.retryConfig.backoffMs.length - 1
      );
      const backoffMs = this.retryConfig.backoffMs[backoffIndex];

      operation.status = 'pending';
      operation.next_retry_at = new Date(
        Date.now() + backoffMs
      ).toISOString();

      bridgeLogger.logSyncFailure(
        'CRMSyncEngine',
        this.orgId,
        'sync_operation_failed_will_retry',
        error,
        {
          operationId: operation.id,
          attempt: operation.attempt,
          maxAttempts: operation.max_attempts,
          nextRetryIn: `${backoffMs}ms`,
        }
      );

      // Schedule retry
      setTimeout(() => {
        this.executeSync(operation, event).catch((retryError) => {
          this.handleSyncError(operation, retryError, event);
        });
      }, backoffMs);
    } else {
      operation.status = 'failed';
      operation.completed_at = new Date().toISOString();

      bridgeLogger.logSyncFailure(
        'CRMSyncEngine',
        this.orgId,
        'sync_operation_failed_max_retries',
        error,
        {
          operationId: operation.id,
          attempts: operation.attempt,
          maxAttempts: operation.max_attempts,
        }
      );
    }
  }

  /**
   * Extract entity type from event type
   */
  private extractEntityType(
    eventType: string
  ): 'contact' | 'activity' | 'deal' | 'message' {
    if (eventType.startsWith('contact.')) return 'contact';
    if (eventType.startsWith('activity.')) return 'activity';
    if (eventType.startsWith('deal.')) return 'deal';
    if (eventType.startsWith('message.')) return 'message';
    return 'message';
  }

  /**
   * Extract operation type from event type
   */
  private extractOperation(
    eventType: string
  ): 'create' | 'update' | 'delete' {
    if (eventType.includes('created')) return 'create';
    if (eventType.includes('updated')) return 'update';
    if (eventType.includes('deleted')) return 'delete';
    return 'create';
  }

  /**
   * Get operation status
   */
  getOperation(operationId: string): SyncOperation | undefined {
    return this.operationQueue.get(operationId);
  }

  /**
   * Get all pending operations
   */
  getPendingOperations(): SyncOperation[] {
    return Array.from(this.operationQueue.values()).filter(
      (op) => op.status === 'pending' || op.status === 'in_progress'
    );
  }

  /**
   * Get all failed operations
   */
  getFailedOperations(): SyncOperation[] {
    return Array.from(this.operationQueue.values()).filter(
      (op) => op.status === 'failed'
    );
  }

  /**
   * Clear operation queue
   */
  clearQueue(): void {
    this.operationQueue.clear();
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.operationQueue.size;
  }
}
