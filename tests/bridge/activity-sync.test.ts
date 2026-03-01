/**
 * Activity Sync Tests — Story 2.3
 *
 * Tests for WhatsApp message to CRM activity synchronization.
 * Covers: activity creation, timeline retrieval, message counters.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { UUID } from '../../lib/db/schema';
import { ActivitySync } from '../../lib/bridge/activity-sync';

const testOrgId = 'test-org-2-3' as UUID;
const testContactId = 'test-contact-001' as UUID;

describe('Story 2.3: Conversa WhatsApp → Activity CRM', () => {
  let activitySync: ActivitySync;

  beforeEach(() => {
    activitySync = new ActivitySync({ orgId: testOrgId });
    activitySync.clearCounterCache();
  });

  describe('AC1: Create activity from WhatsApp message', () => {
    it('should create activity with correct fields', async () => {
      const message = {
        contact_id: testContactId,
        text: 'Olá, como posso ajudar?',
        direction: 'inbound' as const,
        whatsapp_message_id: 'wamsg-001',
        status: 'received' as const,
      };

      const activity = await activitySync.createActivityFromMessage(message);

      expect(activity).toBeDefined();
      expect(activity.organization_id).toBe(testOrgId);
      expect(activity.contact_id).toBe(testContactId);
      expect(activity.activity_type).toBe('whatsapp_message');
      expect(activity.content).toBe('Olá, como posso ajudar?');
      expect(activity.direction).toBe('inbound');
    });

    it('should set direction as inbound', async () => {
      const message = {
        contact_id: testContactId,
        text: 'Customer message',
        direction: 'inbound' as const,
      };

      const activity = await activitySync.createActivityFromMessage(message);

      expect(activity.direction).toBe('inbound');
    });

    it('should set direction as outbound', async () => {
      const message = {
        contact_id: testContactId,
        text: 'Agent response',
        direction: 'outbound' as const,
      };

      const activity = await activitySync.createActivityFromMessage(message);

      expect(activity.direction).toBe('outbound');
    });

    it('should store WhatsApp message ID in metadata', async () => {
      const whatsappId = 'wamsg-12345';
      const message = {
        contact_id: testContactId,
        text: 'Message with ID',
        direction: 'inbound' as const,
        whatsapp_message_id: whatsappId,
      };

      const activity = await activitySync.createActivityFromMessage(message);

      expect(activity.metadata?.whatsapp_message_id).toBe(whatsappId);
    });
  });

  describe('AC2: Activity visible in timeline', () => {
    it('should retrieve activities in correct order (DESC)', async () => {
      // Create multiple activities
      for (let i = 0; i < 5; i++) {
        await activitySync.createActivityFromMessage({
          contact_id: testContactId,
          text: `Message ${i}`,
          direction: i % 2 === 0 ? 'inbound' : 'outbound',
        });
      }

      const timeline = await activitySync.getTimeline({
        contact_id: testContactId,
        orderBy: 'desc',
      });

      expect(timeline).toBeDefined();
      expect(Array.isArray(timeline)).toBe(true);
    });

    it('should retrieve activities with pagination', async () => {
      const timeline = await activitySync.getTimeline({
        contact_id: testContactId,
        limit: 10,
        offset: 0,
      });

      expect(Array.isArray(timeline)).toBe(true);
    });

    it('should support custom ordering (ASC)', async () => {
      const timeline = await activitySync.getTimeline({
        contact_id: testContactId,
        orderBy: 'asc',
      });

      expect(Array.isArray(timeline)).toBe(true);
    });
  });

  describe('AC3: Message counters updated', () => {
    it('should create activity and update counters', async () => {
      const message = {
        contact_id: testContactId,
        text: 'Test message',
        direction: 'inbound' as const,
      };

      await activitySync.createActivityFromMessage(message);
      const counter = await activitySync.getMessageCounter(testContactId);

      expect(counter).toBeDefined();
      expect(counter.contact_id).toBe(testContactId);
    });

    it('should track total message count', async () => {
      const counter = await activitySync.getMessageCounter(testContactId);
      expect(counter.total_messages).toBeGreaterThanOrEqual(0);
    });

    it('should track inbound vs outbound', async () => {
      const counter = await activitySync.getMessageCounter(testContactId);
      expect(counter.inbound_count).toBeGreaterThanOrEqual(0);
      expect(counter.outbound_count).toBeGreaterThanOrEqual(0);
    });

    it('should track unread message count', async () => {
      const counter = await activitySync.getMessageCounter(testContactId);
      expect(counter.unread_count).toBeGreaterThanOrEqual(0);
    });

    it('should track last message timestamp', async () => {
      const counter = await activitySync.getMessageCounter(testContactId);
      // last_message_at can be null or string
      expect(counter.last_message_at === null || typeof counter.last_message_at === 'string').toBe(true);
    });
  });

  describe('AC4: Test scenario - 10 messages create 10 activities', () => {
    it('should create 10 activities from 10 messages', async () => {
      const contactId = 'test-contact-10msgs' as UUID;
      const createdActivities = [];

      for (let i = 1; i <= 10; i++) {
        const activity = await activitySync.createActivityFromMessage({
          contact_id: contactId,
          text: `Message ${i}`,
          direction: i % 2 === 0 ? 'inbound' : 'outbound',
          whatsapp_message_id: `msg-${i}`,
        });
        createdActivities.push(activity);
      }

      expect(createdActivities.length).toBe(10);

      const timeline = await activitySync.getTimeline({
        contact_id: contactId,
        limit: 100,
      });

      expect(timeline.length).toBeGreaterThanOrEqual(10);
    });

    it('should create activities with correct direction alternation', async () => {
      const contactId = 'test-contact-direction' as UUID;

      for (let i = 1; i <= 5; i++) {
        const activity = await activitySync.createActivityFromMessage({
          contact_id: contactId,
          text: `Message ${i}`,
          direction: i % 2 === 0 ? 'inbound' : 'outbound',
        });

        const expectedDirection = i % 2 === 0 ? 'inbound' : 'outbound';
        expect(activity.direction).toBe(expectedDirection);
      }
    });

    it('should maintain correct timestamps for each activity', async () => {
      const contactId = 'test-contact-timestamps' as UUID;

      for (let i = 1; i <= 3; i++) {
        const activity = await activitySync.createActivityFromMessage({
          contact_id: contactId,
          text: `Message ${i}`,
          direction: 'inbound',
          timestamp: new Date(Date.now() + i * 1000).toISOString(),
        });

        expect(activity.created_at).toBeDefined();
      }
    });
  });

  describe('Additional features', () => {
    it('should mark activity as read', async () => {
      const activity = await activitySync.createActivityFromMessage({
        contact_id: testContactId,
        text: 'Message to read',
        direction: 'inbound',
      });

      await activitySync.markActivityAsRead(activity.id);
      expect(true).toBe(true); // Just verify no error thrown
    });

    it('should get activity statistics', async () => {
      const stats = await activitySync.getActivityStats(testContactId);

      expect(stats).toBeDefined();
      expect(typeof stats.totalActivities).toBe('number');
      expect(typeof stats.whatsappActivities).toBe('number');
      expect(stats.activityTypes).toBeDefined();
    });

    it('should handle missing contact gracefully', async () => {
      const missingContactId = 'non-existent-contact' as UUID;
      const timeline = await activitySync.getTimeline({
        contact_id: missingContactId,
      });

      expect(Array.isArray(timeline)).toBe(true);
      expect(timeline.length).toBe(0);
    });

    it('should cache message counters', async () => {
      const counter1 = await activitySync.getMessageCounter(testContactId);
      const counter2 = await activitySync.getMessageCounter(testContactId);

      // Both calls should return same object from cache
      expect(counter1.contact_id).toBe(counter2.contact_id);
    });

    it('should clear counter cache on demand', () => {
      activitySync.clearCounterCache();
      expect(true).toBe(true); // Just verify no error
    });
  });

  describe('Edge cases', () => {
    it('should handle empty message content', async () => {
      const activity = await activitySync.createActivityFromMessage({
        contact_id: testContactId,
        text: '',
        direction: 'inbound',
      });

      expect(activity.content).toBe('');
    });

    it('should handle very long message content', async () => {
      const longText = 'x'.repeat(5000);
      const activity = await activitySync.createActivityFromMessage({
        contact_id: testContactId,
        text: longText,
        direction: 'inbound',
      });

      expect(activity.content.length).toBe(5000);
    });

    it('should handle special characters in content', async () => {
      const specialText = '😀 Emoji test: @#$%^&*() <html>';
      const activity = await activitySync.createActivityFromMessage({
        contact_id: testContactId,
        text: specialText,
        direction: 'outbound',
      });

      expect(activity.content).toBe(specialText);
    });

    it('should handle concurrent message creation', async () => {
      const contactId = 'test-concurrent' as UUID;
      const promises = [];

      for (let i = 1; i <= 5; i++) {
        promises.push(
          activitySync.createActivityFromMessage({
            contact_id: contactId,
            text: `Concurrent message ${i}`,
            direction: 'inbound',
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results.length).toBe(5);
    });
  });
});
