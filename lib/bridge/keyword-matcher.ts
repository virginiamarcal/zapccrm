/**
 * Keyword Matcher — Story 2.4
 *
 * Performs case-insensitive, partial keyword matching.
 * Used to detect deal-triggering messages from WhatsApp.
 */

import type { UUID } from '../db/schema';
import { bridgeLogger } from './logger';

interface Keyword {
  id: UUID;
  org_id: UUID;
  keyword: string;
  board_id: UUID;
  stage_id: UUID;
  enabled: boolean;
  created_at: string;
}

export interface KeywordConfig {
  keywords: Keyword[];
  cacheTTL?: number; // Time to live in milliseconds (default 5 minutes)
}

export class KeywordMatcher {
  private orgId: UUID;
  private keywords: Keyword[] = [];
  private cache: Map<UUID, Keyword[]> = new Map();
  private cacheExpiry: Map<UUID, number> = new Map();
  private cacheTTL: number;

  constructor(orgId: UUID, config?: Partial<KeywordConfig>) {
    this.orgId = orgId;
    this.cacheTTL = config?.cacheTTL || 5 * 60 * 1000; // 5 minutes default
    this.keywords = config?.keywords || [];
  }

  /**
   * Match message text against keywords
   */
  matchMessage(text: string): Keyword | null {
    try {
      bridgeLogger.logSyncStart(
        'KeywordMatcher',
        this.orgId,
        'match_message'
      );

      const normalizedText = text.toLowerCase().trim();
      const enabledKeywords = this.keywords.filter((k) => k.enabled);

      for (const keyword of enabledKeywords) {
        // Case-insensitive, partial match using ILIKE pattern
        const pattern = keyword.keyword.toLowerCase();
        if (normalizedText.includes(pattern)) {
          bridgeLogger.logSyncSuccess(
            'KeywordMatcher',
            this.orgId,
            'keyword_matched',
            {
              keyword: keyword.keyword,
              pattern: pattern,
              boardId: keyword.board_id,
              stageId: keyword.stage_id,
            }
          );

          return keyword;
        }
      }

      bridgeLogger.logSyncSuccess(
        'KeywordMatcher',
        this.orgId,
        'no_keyword_match',
        { messageLength: normalizedText.length }
      );

      return null;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'KeywordMatcher',
        this.orgId,
        'match_message',
        error as Error,
        { textLength: text.length }
      );
      throw error;
    }
  }

  /**
   * Add keyword configuration
   */
  addKeyword(keyword: Keyword): void {
    this.keywords.push(keyword);
    this.invalidateCache();

    bridgeLogger.logSyncSuccess(
      'KeywordMatcher',
      this.orgId,
      'keyword_added',
      { keyword: keyword.keyword }
    );
  }

  /**
   * Update keyword configuration
   */
  updateKeyword(id: UUID, updates: Partial<Keyword>): void {
    const index = this.keywords.findIndex((k) => k.id === id);
    if (index !== -1) {
      this.keywords[index] = { ...this.keywords[index], ...updates };
      this.invalidateCache();

      bridgeLogger.logSyncSuccess(
        'KeywordMatcher',
        this.orgId,
        'keyword_updated',
        { keywordId: id }
      );
    }
  }

  /**
   * Remove keyword
   */
  removeKeyword(id: UUID): void {
    this.keywords = this.keywords.filter((k) => k.id !== id);
    this.invalidateCache();

    bridgeLogger.logSyncSuccess(
      'KeywordMatcher',
      this.orgId,
      'keyword_removed',
      { keywordId: id }
    );
  }

  /**
   * Get all keywords
   */
  getKeywords(): Keyword[] {
    return this.keywords;
  }

  /**
   * Get enabled keywords only
   */
  getEnabledKeywords(): Keyword[] {
    return this.keywords.filter((k) => k.enabled);
  }

  /**
   * Get keywords by board
   */
  getKeywordsByBoard(boardId: UUID): Keyword[] {
    return this.keywords.filter((k) => k.board_id === boardId && k.enabled);
  }

  /**
   * Check if message matches any keyword
   */
  isMatchingMessage(text: string): boolean {
    return this.matchMessage(text) !== null;
  }

  /**
   * Get match count stats
   */
  getStats(): {
    totalKeywords: number;
    enabledKeywords: number;
    boards: Set<UUID>;
  } {
    return {
      totalKeywords: this.keywords.length,
      enabledKeywords: this.keywords.filter((k) => k.enabled).length,
      boards: new Set(this.keywords.map((k) => k.board_id)),
    };
  }

  /**
   * Invalidate cache
   */
  private invalidateCache(): void {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Clear all keywords
   */
  clearKeywords(): void {
    this.keywords = [];
    this.invalidateCache();

    bridgeLogger.logSyncSuccess(
      'KeywordMatcher',
      this.orgId,
      'all_keywords_cleared'
    );
  }
}
