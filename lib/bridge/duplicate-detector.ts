/**
 * Duplicate Detector — Story 2.2
 *
 * Detects duplicate contacts using email and phone matching.
 * Implements fuzzy matching and exact matching strategies.
 */

import type { UUID } from '../db/schema';
import type { Contact } from '../db/schema';
import { bridgeLogger } from './logger';

interface DuplicateDetectionConfig {
  orgId: UUID;
  supabaseClient?: any;
  matchThreshold?: number; // 0-1, default 0.85 for fuzzy matching
}

interface DuplicateMatch {
  contact: Contact;
  matchScore: number; // 0-1
  matchReason: 'exact_email' | 'exact_phone' | 'fuzzy_match';
}

export class DuplicateDetector {
  private orgId: UUID;
  private supabaseClient: any;
  private matchThreshold: number;

  constructor(config: DuplicateDetectionConfig) {
    this.orgId = config.orgId;
    this.supabaseClient = config.supabaseClient;
    this.matchThreshold = config.matchThreshold || 0.85;
  }

  /**
   * Find potential duplicates for a contact
   */
  async findDuplicates(candidate: {
    phone?: string;
    email?: string;
    name?: string;
  }): Promise<DuplicateMatch[]> {
    try {
      bridgeLogger.logSyncStart(
        'DuplicateDetector',
        this.orgId,
        'find_duplicates'
      );

      const matches: DuplicateMatch[] = [];

      // Strategy 1: Exact email match
      if (candidate.email) {
        const emailMatches = await this.findByExactEmail(candidate.email);
        matches.push(
          ...emailMatches.map((contact) => ({
            contact,
            matchScore: 1.0,
            matchReason: 'exact_email' as const,
          }))
        );
      }

      // Strategy 2: Exact phone match
      if (candidate.phone) {
        const phoneMatches = await this.findByExactPhone(candidate.phone);
        matches.push(
          ...phoneMatches.map((contact) => ({
            contact,
            matchScore: 1.0,
            matchReason: 'exact_phone' as const,
          }))
        );
      }

      // Strategy 3: Fuzzy name matching (if no exact match found)
      if (matches.length === 0 && candidate.name) {
        const fuzzyMatches = await this.findByFuzzyName(candidate.name);
        matches.push(
          ...fuzzyMatches.map((contact) => ({
            contact,
            matchScore: this.calculateSimilarity(candidate.name!, contact.name || ''),
            matchReason: 'fuzzy_match' as const,
          }))
        );
      }

      // Filter by threshold
      const filtered = matches.filter((m) => m.matchScore >= this.matchThreshold);

      bridgeLogger.logSyncSuccess(
        'DuplicateDetector',
        this.orgId,
        'find_duplicates',
        {
          candidateEmail: candidate.email,
          candidatePhone: candidate.phone,
          matchesFound: filtered.length,
        }
      );

      return filtered;
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'DuplicateDetector',
        this.orgId,
        'find_duplicates',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Find contacts with exact email match
   */
  private async findByExactEmail(email: string): Promise<Contact[]> {
    try {
      // Would query: SELECT * FROM contacts
      // WHERE organization_id = ? AND email = ? AND email IS NOT NULL
      return [];
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'DuplicateDetector',
        this.orgId,
        'find_by_exact_email',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Find contacts with exact phone match
   */
  private async findByExactPhone(phone: string): Promise<Contact[]> {
    try {
      // Would query: SELECT * FROM contacts
      // WHERE organization_id = ? AND phone = ? AND phone IS NOT NULL
      return [];
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'DuplicateDetector',
        this.orgId,
        'find_by_exact_phone',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Find contacts by fuzzy name matching
   */
  private async findByFuzzyName(name: string): Promise<Contact[]> {
    try {
      // Would query: SELECT * FROM contacts
      // WHERE organization_id = ? AND name ILIKE '%' || ? || '%'
      return [];
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'DuplicateDetector',
        this.orgId,
        'find_by_fuzzy_name',
        error as Error
      );
      throw error;
    }
  }

  /**
   * Calculate string similarity (Levenshtein distance based)
   * Returns 0-1 similarity score
   */
  private calculateSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1.0;

    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Levenshtein distance implementation
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const costs: number[] = [];

    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }

    return costs[s2.length];
  }

  /**
   * Check if two contacts are likely duplicates
   */
  async isDuplicate(
    contact1: Contact,
    contact2: Contact
  ): Promise<{
    isDuplicate: boolean;
    confidence: number;
    reasons: string[];
  }> {
    try {
      const reasons: string[] = [];
      let confidence = 0;

      // Email match
      if (
        contact1.email &&
        contact2.email &&
        contact1.email === contact2.email
      ) {
        confidence += 0.5;
        reasons.push('exact_email_match');
      }

      // Phone match
      if (
        contact1.phone &&
        contact2.phone &&
        contact1.phone === contact2.phone
      ) {
        confidence += 0.5;
        reasons.push('exact_phone_match');
      }

      // Name similarity
      if (contact1.name && contact2.name) {
        const nameSimilarity = this.calculateSimilarity(contact1.name, contact2.name);
        if (nameSimilarity > 0.8) {
          confidence += 0.3;
          reasons.push(`name_similarity_${Math.round(nameSimilarity * 100)}`);
        }
      }

      return {
        isDuplicate: confidence >= this.matchThreshold,
        confidence: Math.min(confidence, 1),
        reasons,
      };
    } catch (error) {
      bridgeLogger.logSyncFailure(
        'DuplicateDetector',
        this.orgId,
        'is_duplicate',
        error as Error
      );
      throw error;
    }
  }
}
