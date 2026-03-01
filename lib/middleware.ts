/**
 * Tenant Detection Middleware — Story 1.4
 *
 * Auto-detect organization from Header, Cookie, or Query Param.
 * Validates membership and sets context for downstream code.
 */

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { UUID } from '@/lib/db/schema';

export interface TenantContext {
  organizationId: UUID;
  userId: UUID;
  role: 'admin' | 'member' | 'viewer';
  isSuperAdmin?: boolean;
}

interface TenantDetectionResult {
  organizationId?: UUID;
  source: 'header' | 'cookie' | 'query' | 'none';
  isValid: boolean;
  error?: string;
}

/**
 * AC1: Detect org_id from 3 sources (priority: Header > Cookie > Query)
 */
export function detectTenantId(request: NextRequest): TenantDetectionResult {
  // 1. Check X-Organization-ID header (API calls)
  const headerId = request.headers.get('X-Organization-ID');
  if (headerId) {
    return {
      organizationId: headerId as UUID,
      source: 'header',
      isValid: true,
    };
  }

  // 2. Check org_id cookie (web requests)
  const cookieValue = request.cookies.get('org_id')?.value;
  if (cookieValue) {
    return {
      organizationId: cookieValue as UUID,
      source: 'cookie',
      isValid: true,
    };
  }

  // 3. Check query parameter ?org={slug}
  const url = new URL(request.url);
  const queryOrg = url.searchParams.get('org');
  if (queryOrg) {
    return {
      organizationId: queryOrg as UUID,
      source: 'query',
      isValid: true,
    };
  }

  return {
    source: 'none',
    isValid: false,
    error: 'No organization identifier provided',
  };
}

/**
 * AC2: Validate that user is member of organization
 */
export async function validateOrgMembership(
  userId: UUID,
  organizationId: UUID
): Promise<{
  isValid: boolean;
  role?: 'admin' | 'member' | 'viewer';
  error?: string;
}> {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { data: member } = await supabase
      .from('org_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (!member) {
      return {
        isValid: false,
        error: 'User is not a member of this organization',
      };
    }

    return {
      isValid: true,
      role: member.role,
    };
  } catch (err) {
    return {
      isValid: false,
      error: 'Failed to validate membership',
    };
  }
}

/**
 * AC3: Redirect or return error for invalid org_id
 */
export function createTenantResponse(
  isApi: boolean,
  organizationId?: UUID
): { status: number; error: string } | null {
  if (!organizationId) {
    if (isApi) {
      // AC4: API calls without org header return 400
      return {
        status: 400,
        error: 'Missing required X-Organization-ID header',
      };
    } else {
      // Web requests redirect to org selection
      return {
        status: 307,
        error: '/select-organization',
      };
    }
  }

  return null;
}

/**
 * Cache layer for tenant lookups (Redis-like, in-memory for now)
 */
interface CacheEntry {
  value: any;
  expiredAt: number;
}

const tenantCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export function getCachedMembership(cacheKey: string): any | null {
  const entry = tenantCache.get(cacheKey);
  if (entry && entry.expiredAt > Date.now()) {
    return entry.value;
  }
  tenantCache.delete(cacheKey);
  return null;
}

export function setCachedMembership(cacheKey: string, value: any): void {
  tenantCache.set(cacheKey, {
    value,
    expiredAt: Date.now() + CACHE_TTL_MS,
  });
}

/**
 * Clear expired cache entries periodically
 */
export function cleanupExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of tenantCache.entries()) {
    if (entry.expiredAt <= now) {
      tenantCache.delete(key);
    }
  }
}

// Cleanup cache every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupExpiredCache, 5 * 60 * 1000);
}

/**
 * Full middleware logic
 */
export async function detectAndValidateTenant(
  request: NextRequest,
  userId: UUID
): Promise<TenantContext | null> {
  // Detect org_id
  const detection = detectTenantId(request);

  if (!detection.isValid || !detection.organizationId) {
    return null;
  }

  // Try cache first
  const cacheKey = `${userId}:${detection.organizationId}`;
  const cached = getCachedMembership(cacheKey);
  if (cached) {
    return cached;
  }

  // Validate membership
  const validation = await validateOrgMembership(userId, detection.organizationId);

  if (!validation.isValid) {
    // AC5: User accessing different org returns 403
    return null;
  }

  // Build context
  const context: TenantContext = {
    organizationId: detection.organizationId,
    userId,
    role: validation.role || 'member',
  };

  // Cache the result
  setCachedMembership(cacheKey, context);

  return context;
}
