/**
 * Bridge Service Types — Story 2.1
 *
 * Core type definitions for WhatsApp↔CRM synchronization bridge.
 */

import type { UUID, Timestamp } from '../db/schema';

// ============================================================================
// Event Types
// ============================================================================

export interface BridgeEvent<T = Record<string, any>> {
  id: string;
  type: BridgeEventType;
  org_id: UUID;
  timestamp: Timestamp;
  source: 'whatsapp' | 'crm';
  data: T;
}

export type BridgeEventType =
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'activity.created'
  | 'deal.created'
  | 'deal.updated'
  | 'message.sent'
  | 'message.received'
  | 'sync.started'
  | 'sync.completed'
  | 'sync.failed';

// ============================================================================
// Sync Operation Types
// ============================================================================

export interface SyncOperation {
  id: string;
  org_id: UUID;
  entity_type: 'contact' | 'activity' | 'deal' | 'message';
  entity_id?: UUID;
  direction: 'whatsapp_to_crm' | 'crm_to_whatsapp';
  operation: 'create' | 'update' | 'delete';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  attempt: number;
  max_attempts: number;
  started_at: Timestamp;
  completed_at?: Timestamp;
  next_retry_at?: Timestamp;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffMs: number[]; // [1000, 2000, 4000] for exponential backoff
  timeout: number; // 30000ms default
}

// ============================================================================
// Listener Types
// ============================================================================

export interface EventListener<T = Record<string, any>> {
  eventType: BridgeEventType;
  handler: (event: BridgeEvent<T>) => Promise<void>;
  priority?: number; // Higher priority runs first
}

export interface ListenerRegistry {
  register(listener: EventListener): void;
  unregister(listener: EventListener): void;
  emit(event: BridgeEvent): Promise<void>;
  getListeners(eventType: BridgeEventType): EventListener[];
}

// ============================================================================
// Logger Types
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: Timestamp;
  level: LogLevel;
  component: string;
  action: string;
  org_id?: UUID;
  status: 'success' | 'failure' | 'pending';
  details?: Record<string, any>;
  error?: string;
}

// ============================================================================
// Subscriber Types (Realtime)
// ============================================================================

export interface RealtimeSubscriber {
  channel: string;
  onData: (payload: any) => Promise<void>;
  onError: (error: Error) => void;
  onClose: () => void;
}
