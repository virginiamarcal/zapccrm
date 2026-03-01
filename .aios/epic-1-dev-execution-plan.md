# Epic 1 Stories 1.2-1.5 — Development Execution Plan

**Execution Mode:** YOLO (Fully Autonomous)
**Orchestrated by:** Morgan (PM)
**Date:** 2026-03-01

## Execution Sequence

### Phase 1: Parallel Implementation (Stories 1.2 & 1.3)

#### Story 1.2: RLS Policies Complete
- **Status:** Ready → InProgress
- **Complexity:** 10 pts
- **AC Count:** 6
- **Key Files:**
  - Create: `supabase/migrations/{timestamp}_enable_rls_all_tables.sql`
  - Create: `supabase/policies/select_by_org.sql`
  - Create: `supabase/policies/write_by_org_role.sql`
  - Create: `supabase/functions/audit_log.sql`
  - Create: `tests/rls/isolation.test.ts`
  - Modify: `lib/db/schema.ts`

#### Story 1.3: Multi-Org Auth e Invite System
- **Status:** Ready → InProgress
- **Complexity:** 8 pts
- **AC Count:** 6
- **Key Files:**
  - Create: `app/api/auth/invite/route.ts`
  - Create: `app/join/page.tsx`
  - Create: `app/settings/team/page.tsx`
  - Create: `lib/auth/invite-service.ts`
  - Create: `lib/emails/invite-email.ts`
  - Create: `tests/auth/invite.test.ts`
  - Modify: `app/api/auth/callback/route.ts`
  - Modify: `lib/db/schema.ts`

### Phase 2: Sequential Implementation (Story 1.4 — after 1.3)

#### Story 1.4: Tenant Detection Middleware
- **Blocked by:** 1.1 (COMPLETE), 1.3 (awaiting completion)
- **Status:** Ready → InProgress
- **Complexity:** 6 pts
- **AC Count:** 5
- **Key Files:**
  - Create: `lib/middleware.ts`
  - Create: `middleware.ts`
  - Create: `tests/middleware/tenant-detection.test.ts`
  - Modify: `lib/auth/session.ts`

### Phase 3: Sequential Implementation (Story 1.5 — after 1.4)

#### Story 1.5: Super Admin Dashboard
- **Blocked by:** 1.1 (COMPLETE), 1.3 (awaiting), 1.4 (awaiting)
- **Status:** Ready → InProgress
- **Complexity:** 8 pts
- **AC Count:** 5
- **Key Files:**
  - Create: `app/admin/dashboard/page.tsx`
  - Create: `app/api/admin/metrics/route.ts`
  - Create: `app/api/admin/impersonate/route.ts`
  - Create: `components/admin/org-list.tsx`
  - Create: `components/admin/metrics-card.tsx`
  - Create: `lib/admin/impersonation-service.ts`
  - Create: `tests/admin/dashboard.test.ts`
  - Modify: `lib/db/schema.ts`
  - Modify: `lib/middleware.ts`

## Quality Gates

**CodeRabbit:** Self-healing mode (max 2 iterations per story, severity CRITICAL/HIGH)
**Tests:** Run before marking story complete
**Linting:** `npm run lint` pass
**Type Check:** `npm run typecheck` pass
**Build:** `npm run build` pass (if applicable)

## Post-Implementation

1. Update story files with completed checkboxes
2. Run full QA gate for each story (@qa)
3. Commit changes to git (handled by @devops)
4. Report final status with commits and story URLs

## Decision Log

- **Parallelization:** Stories 1.2 & 1.3 run simultaneously (no inter-dependency)
- **Sequential Fallback:** If parallel fails, revert to sequential (1.2→1.3→1.4→1.5)
- **CodeRabbit:** Enabled with auto-fix for CRITICAL/HIGH
- **YOLO Mode:** No confirmations, full autonomy

---

*Plan created by Morgan (PM) at 2026-03-01T00:00:00Z*
