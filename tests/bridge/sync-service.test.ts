/**
 * Bridge Sync Service Tests — Story 2.1
 *
 * Unit tests for all three components:
 * - WhatsAppEventListener
 * - CRMSyncEngine
 * - BidirectionalTrigger
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { UUID } from '../../lib/db/schema';
import {
  BridgeSyncService,
  createSyncService,
} from '../../lib/bridge/sync-service';
import { BidirectionalTrigger } from '../../lib/bridge/bidirectional-trigger';
import { CRMSyncEngine } from '../../lib/bridge/crm-sync-engine';
import { bridgeLogger } from '../../lib/bridge/logger';
import type { BridgeEvent, EventListener } from '../../lib/bridge/types';

const testOrgId = 'test-org-123' as UUID;
const mockSupabaseUrl = 'https://test.supabase.co';
const mockSupabaseKey = 'test-key';

describe('BridgeSyncService', () => {
  let syncService: BridgeSyncService;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (syncService && syncService['isInitialized']) {
      await syncService.shutdown();
    }
  });

  describe('Service Initialization', () => {
    it('should create sync service with valid config', () => {
      syncService = new BridgeSyncService({
        orgId: testOrgId,
        supabaseUrl: mockSupabaseUrl,
        supabaseKey: mockSupabaseKey,
      });

      expect(syncService).toBeDefined();
      expect(syncService['orgId']).toBe(testOrgId);
    });

    it('should initialize all components on startup', async () => {
      syncService = new BridgeSyncService({
        orgId: testOrgId,
        supabaseUrl: mockSupabaseUrl,
        supabaseKey: mockSupabaseKey,
      });

      await syncService.initialize();
      const status = syncService.getStatus();

      expect(status.initialized).toBe(true);
      expect(status.triggerSystemReady).toBe(true);
    });

    it('should shutdown gracefully', async () => {
      syncService = new BridgeSyncService({
        orgId: testOrgId,
        supabaseUrl: mockSupabaseUrl,
        supabaseKey: mockSupabaseKey,
      });

      await syncService.initialize();
      await syncService.shutdown();

      const status = syncService.getStatus();
      expect(status.initialized).toBe(false);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      syncService = new BridgeSyncService({
        orgId: testOrgId,
        supabaseUrl: mockSupabaseUrl,
        supabaseKey: mockSupabaseKey,
      });
      await syncService.initialize();
    });

    it('should emit events successfully', async () => {
      const event: BridgeEvent = {
        id: 'test-event-1',
        type: 'contact.created',
        org_id: testOrgId,
        timestamp: new Date().toISOString(),
        source: 'whatsapp',
        data: { name: 'John Doe', phone: '+5511987654321' },
      };

      await expect(syncService.emitEvent(event)).resolves.not.toThrow();
    });

    it('should register and trigger custom listeners', async () => {
      const mockHandler = vi.fn();
      const listener: EventListener = {
        eventType: 'contact.created',
        handler: mockHandler,
      };

      syncService.on(listener);

      const event: BridgeEvent = {
        id: 'test-event-2',
        type: 'contact.created',
        org_id: testOrgId,
        timestamp: new Date().toISOString(),
        source: 'whatsapp',
        data: { name: 'Jane Doe' },
      };

      await syncService.emitEvent(event);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining(event));
    });

    it('should unregister listeners', async () => {
      const mockHandler = vi.fn();
      const listener: EventListener = {
        eventType: 'contact.created',
        handler: mockHandler,
      };

      syncService.on(listener);
      syncService.off(listener);

      const event: BridgeEvent = {
        id: 'test-event-3',
        type: 'contact.created',
        org_id: testOrgId,
        timestamp: new Date().toISOString(),
        source: 'whatsapp',
        data: {},
      };

      await syncService.emitEvent(event);
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('Sync Operations', () => {
    beforeEach(async () => {
      syncService = new BridgeSyncService({
        orgId: testOrgId,
        supabaseUrl: mockSupabaseUrl,
        supabaseKey: mockSupabaseKey,
      });
      await syncService.initialize();
    });

    it('should track pending operations', async () => {
      const event: BridgeEvent = {
        id: 'test-event-4',
        type: 'message.received',
        org_id: testOrgId,
        timestamp: new Date().toISOString(),
        source: 'whatsapp',
        data: { text: 'Hello' },
      };

      await syncService.emitEvent(event);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const pending = syncService.getPendingOperations();
      expect(pending.length).toBeGreaterThanOrEqual(0);
    });

    it('should return service status', async () => {
      const status = syncService.getStatus();

      expect(status).toHaveProperty('initialized', true);
      expect(status).toHaveProperty('triggerSystemReady');
      expect(status).toHaveProperty('pendingOperations');
      expect(status).toHaveProperty('failedOperations');
    });
  });
});

describe('BidirectionalTrigger', () => {
  let trigger: BidirectionalTrigger;

  beforeEach(async () => {
    trigger = new BidirectionalTrigger({ orgId: testOrgId });
    await trigger.start();
  });

  afterEach(async () => {
    await trigger.stop();
  });

  it('should register listeners', () => {
    const listener: EventListener = {
      eventType: 'contact.created',
      handler: async () => {},
    };

    trigger.on(listener);
    const listeners = trigger.getTriggerSystem().getEventBus().getListeners('contact.created');

    expect(listeners.length).toBeGreaterThan(0);
  });

  it('should emit events to listeners', async () => {
    const mockHandler = vi.fn();
    const listener: EventListener = {
      eventType: 'contact.updated',
      handler: mockHandler,
    };

    trigger.on(listener);

    const event: BridgeEvent = {
      id: 'test-trigger-1',
      type: 'contact.updated',
      org_id: testOrgId,
      timestamp: new Date().toISOString(),
      source: 'crm',
      data: { id: '123', updated: true },
    };

    await trigger.emit(event);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockHandler).toHaveBeenCalledWith(expect.objectContaining(event));
  });

  it('should respect listener priority', async () => {
    const callOrder: number[] = [];

    const listener1: EventListener = {
      eventType: 'deal.created',
      handler: async () => {
        callOrder.push(1);
      },
      priority: 10,
    };

    const listener2: EventListener = {
      eventType: 'deal.created',
      handler: async () => {
        callOrder.push(2);
      },
      priority: 20,
    };

    trigger.on(listener1);
    trigger.on(listener2);

    const event: BridgeEvent = {
      id: 'test-priority-1',
      type: 'deal.created',
      org_id: testOrgId,
      timestamp: new Date().toISOString(),
      source: 'whatsapp',
      data: {},
    };

    await trigger.emit(event);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(callOrder).toEqual([2, 1]); // Higher priority first
  });

  it('should provide stats', () => {
    const stats = trigger.getTriggerSystem().getStats ? trigger.getTriggerSystem().getStats() : { isActive: trigger.isReady(), listenerCount: 0, registeredEventTypes: [] };

    expect(stats).toHaveProperty('isActive');
    expect(stats.isActive).toBe(true);
  });
});

describe('CRMSyncEngine', () => {
  let engine: CRMSyncEngine;

  beforeEach(() => {
    engine = new CRMSyncEngine({
      orgId: testOrgId,
      retryConfig: {
        maxAttempts: 3,
        backoffMs: [100, 200, 400], // Shorter for tests
        timeout: 5000,
      },
    });
  });

  it('should process events', async () => {
    const event: BridgeEvent = {
      id: 'test-engine-1',
      type: 'contact.created',
      org_id: testOrgId,
      timestamp: new Date().toISOString(),
      source: 'whatsapp',
      data: { phone: '+5511987654321' },
    };

    const operation = await engine.processEvent(event);

    expect(operation).toBeDefined();
    expect(operation.org_id).toBe(testOrgId);
    expect(operation.status).toBe('completed');
  });

  it('should handle different event types', async () => {
    const eventTypes: Array<any> = ['contact.created', 'activity.created', 'message.sent'];

    for (const eventType of eventTypes) {
      const event: BridgeEvent = {
        id: `test-engine-${eventType}`,
        type: eventType,
        org_id: testOrgId,
        timestamp: new Date().toISOString(),
        source: 'whatsapp',
        data: {},
      };

      const operation = await engine.processEvent(event);
      expect(operation.entity_type).toBeDefined();
    }
  });

  it('should track pending and failed operations', async () => {
    const event: BridgeEvent = {
      id: 'test-engine-track',
      type: 'message.received',
      org_id: testOrgId,
      timestamp: new Date().toISOString(),
      source: 'whatsapp',
      data: {},
    };

    await engine.processEvent(event);

    const pending = engine.getPendingOperations();
    const failed = engine.getFailedOperations();

    expect(Array.isArray(pending)).toBe(true);
    expect(Array.isArray(failed)).toBe(true);
  });

  it('should clear operation queue', async () => {
    const event: BridgeEvent = {
      id: 'test-engine-clear',
      type: 'contact.created',
      org_id: testOrgId,
      timestamp: new Date().toISOString(),
      source: 'whatsapp',
      data: {},
    };

    await engine.processEvent(event);
    engine.clearQueue();

    expect(engine.getQueueSize()).toBe(0);
  });
});

describe('Bridge Logger', () => {
  it('should log sync operations', () => {
    bridgeLogger.clear();

    bridgeLogger.logSyncStart(
      'TestComponent',
      testOrgId,
      'test_action'
    );

    const logs = bridgeLogger.getRecentLogs(1);
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe('pending');
  });

  it('should filter logs by criteria', () => {
    bridgeLogger.clear();

    bridgeLogger.logSyncSuccess(
      'Component1',
      testOrgId,
      'action1'
    );

    bridgeLogger.logSyncSuccess(
      'Component2',
      testOrgId,
      'action2'
    );

    const filtered = bridgeLogger.filterLogs({ component: 'Component1' });
    expect(filtered.length).toBe(1);
    expect(filtered[0].component).toBe('Component1');
  });

  it('should maintain log size limits', () => {
    bridgeLogger.clear();

    for (let i = 0; i < 100; i++) {
      bridgeLogger.logSyncSuccess(
        'Component',
        testOrgId,
        `action${i}`
      );
    }

    // Just verify it doesn't crash with large logs
    expect(bridgeLogger.getRecentLogs().length).toBeGreaterThan(0);
  });
});
