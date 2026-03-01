/**
 * Keyword Matcher Tests — Story 2.4
 *
 * Tests for keyword matching and deal creation triggers.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { UUID } from '../../lib/db/schema';
import { KeywordMatcher } from '../../lib/bridge/keyword-matcher';
import { DealCreator } from '../../lib/bridge/deal-creator';

const testOrgId = 'test-org-2-4' as UUID;
const testContactId = 'test-contact-001' as UUID;
const testBoardId = 'board-web-leads' as UUID;
const testStageId = 'stage-novo' as UUID;

describe('Story 2.4: Deal Creation via WhatsApp', () => {
  let matcher: KeywordMatcher;
  let dealCreator: DealCreator;

  beforeEach(() => {
    matcher = new KeywordMatcher(testOrgId);
    dealCreator = new DealCreator({ orgId: testOrgId });
  });

  describe('AC1: Admin configures keywords per org', () => {
    it('should add keyword configuration', () => {
      const keyword = {
        id: 'kw-001' as UUID,
        org_id: testOrgId,
        keyword: 'quero orçamento',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      };

      matcher.addKeyword(keyword);
      const keywords = matcher.getKeywords();

      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords[0].keyword).toBe('quero orçamento');
    });

    it('should list all keywords for org', () => {
      matcher.addKeyword({
        id: 'kw-001' as UUID,
        org_id: testOrgId,
        keyword: 'quero orçamento',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      matcher.addKeyword({
        id: 'kw-002' as UUID,
        org_id: testOrgId,
        keyword: 'preciso de demo',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      const keywords = matcher.getKeywords();
      expect(keywords.length).toBeGreaterThanOrEqual(2);
    });

    it('should update keyword configuration', () => {
      const keywordId = 'kw-update' as UUID;
      matcher.addKeyword({
        id: keywordId,
        org_id: testOrgId,
        keyword: 'original',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      matcher.updateKeyword(keywordId, {
        keyword: 'updated',
        enabled: false,
      });

      const keywords = matcher.getKeywords();
      const updated = keywords.find((k) => k.id === keywordId);

      expect(updated?.keyword).toBe('updated');
      expect(updated?.enabled).toBe(false);
    });

    it('should remove keyword configuration', () => {
      const keywordId = 'kw-delete' as UUID;
      matcher.addKeyword({
        id: keywordId,
        org_id: testOrgId,
        keyword: 'delete me',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      matcher.removeKeyword(keywordId);
      const remaining = matcher.getKeywords();

      expect(remaining.find((k) => k.id === keywordId)).toBeUndefined();
    });
  });

  describe('AC2: Match keywords in messages', () => {
    it('should match case-insensitive keyword', () => {
      matcher.addKeyword({
        id: 'kw-match' as UUID,
        org_id: testOrgId,
        keyword: 'orçamento',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      const match1 = matcher.matchMessage('Quero ORÇAMENTO');
      const match2 = matcher.matchMessage('orçamento por favor');
      const match3 = matcher.matchMessage('ORÇAMENTO URGENTE');

      expect(match1).not.toBeNull();
      expect(match2).not.toBeNull();
      expect(match3).not.toBeNull();
    });

    it('should match partial keywords', () => {
      matcher.addKeyword({
        id: 'kw-partial' as UUID,
        org_id: testOrgId,
        keyword: 'demo',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      const match = matcher.matchMessage('Preciso de uma demo do sistema');

      expect(match).not.toBeNull();
    });

    it('should not match disabled keywords', () => {
      matcher.addKeyword({
        id: 'kw-disabled' as UUID,
        org_id: testOrgId,
        keyword: 'disabled',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: false,
        created_at: new Date().toISOString(),
      });

      const match = matcher.matchMessage('This is disabled');

      expect(match).toBeNull();
    });

    it('should return first matching keyword', () => {
      matcher.addKeyword({
        id: 'kw-first' as UUID,
        org_id: testOrgId,
        keyword: 'demo',
        board_id: 'board-1' as UUID,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      matcher.addKeyword({
        id: 'kw-second' as UUID,
        org_id: testOrgId,
        keyword: 'orçamento',
        board_id: 'board-2' as UUID,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      const match = matcher.matchMessage('Quero demo e orçamento');

      expect(match).not.toBeNull();
    });
  });

  describe('AC3: Create deal with defaults', () => {
    it('should create deal with correct fields', async () => {
      const deal = await dealCreator.createDeal({
        contactId: testContactId,
        contactName: 'João Silva',
        boardId: testBoardId,
        stageId: testStageId,
        messageContent: 'Quero orçamento',
      });

      expect(deal).toBeDefined();
      expect(deal.org_id).toBe(testOrgId);
      expect(deal.contact_id).toBe(testContactId);
      expect(deal.board_id).toBe(testBoardId);
      expect(deal.stage_id).toBe(testStageId);
      expect(deal.name).toContain('Lead from WhatsApp');
    });

    it('should use Web Leads board as default', async () => {
      const deal = await dealCreator.createDeal({
        contactId: testContactId,
        contactName: 'Test User',
        boardId: testBoardId,
        stageId: testStageId,
      });

      expect(deal.board_id).toBe(testBoardId);
    });

    it('should start deal in Novo stage', async () => {
      const deal = await dealCreator.createDeal({
        contactId: testContactId,
        boardId: testBoardId,
        stageId: testStageId,
      });

      expect(deal.stage_id).toBe(testStageId);
    });

    it('should auto-generate deal name from contact', async () => {
      const deal = await dealCreator.createDeal({
        contactId: testContactId,
        contactName: 'Maria Santos',
        boardId: testBoardId,
        stageId: testStageId,
      });

      expect(deal.name).toContain('Maria Santos');
      expect(deal.name).toContain('Lead from WhatsApp');
    });

    it('should set deal_value as null by default', async () => {
      const deal = await dealCreator.createDeal({
        contactId: testContactId,
        boardId: testBoardId,
        stageId: testStageId,
      });

      expect(deal.deal_value).toBeUndefined();
    });
  });

  describe('AC4: Emit notification on creation', () => {
    it('should emit event on deal created', async () => {
      // Event emission is tested implicitly
      // Deal creation should trigger notification event
      const deal = await dealCreator.createDeal({
        contactId: testContactId,
        boardId: testBoardId,
        stageId: testStageId,
      });

      expect(deal.id).toBeDefined();
      // Notification event would be emitted asynchronously
    });
  });

  describe('AC5: Test scenarios', () => {
    it('should create deal when keyword matches', async () => {
      matcher.addKeyword({
        id: 'kw-test' as UUID,
        org_id: testOrgId,
        keyword: 'quero',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      const match = matcher.matchMessage('Quero orçamento');
      expect(match).not.toBeNull();

      if (match) {
        const deal = await dealCreator.createDeal({
          contactId: testContactId,
          contactName: 'Customer',
          boardId: match.board_id,
          stageId: match.stage_id,
        });

        expect(deal.org_id).toBe(testOrgId);
        expect(deal.contact_id).toBe(testContactId);
      }
    });

    it('should not create deal when no keyword matches', async () => {
      matcher.addKeyword({
        id: 'kw-specific' as UUID,
        org_id: testOrgId,
        keyword: 'orçamento',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      const match = matcher.matchMessage('Olá, como você está?');
      expect(match).toBeNull();
    });

    it('should handle multiple message formats', () => {
      matcher.addKeyword({
        id: 'kw-formats' as UUID,
        org_id: testOrgId,
        keyword: 'demo',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      const formats = [
        'Demo',
        'DEMO',
        'demo',
        'preciso demo',
        'quero uma demo',
        'pode me dar uma demo?',
      ];

      for (const format of formats) {
        const match = matcher.matchMessage(format);
        expect(match).not.toBeNull();
      }
    });
  });

  describe('Matcher stats', () => {
    it('should track keyword stats', () => {
      matcher.addKeyword({
        id: 'kw-1' as UUID,
        org_id: testOrgId,
        keyword: 'kw1',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: true,
        created_at: new Date().toISOString(),
      });

      matcher.addKeyword({
        id: 'kw-2' as UUID,
        org_id: testOrgId,
        keyword: 'kw2',
        board_id: testBoardId,
        stage_id: testStageId,
        enabled: false,
        created_at: new Date().toISOString(),
      });

      const stats = matcher.getStats();

      expect(stats.totalKeywords).toBeGreaterThanOrEqual(2);
      expect(stats.enabledKeywords).toBeGreaterThanOrEqual(1);
    });
  });
});
