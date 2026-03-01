# Story 1.2 Implementation Context — @dev

**Story:** 1.2 - RLS Policies Complete
**Status:** Ready → InProgress
**Mode:** YOLO (fully autonomous)
**Complexity:** 10 pts

## Quick Summary

Implement Row Level Security (RLS) policies across 38 Supabase tables to enforce organization isolation. Each policy must check:
- SELECT: User is member of org (`auth.uid() in (select user_id from org_members where org_id = organization_id)`)
- INSERT/UPDATE/DELETE: User has admin/owner role in org
- TRUNCATE/DELETE: Blocked for all except service_role

## Acceptance Criteria (6 total)

- [x] AC1: RLS enabled on 38 tables
- [x] AC2: SELECT policy with org membership check
- [x] AC3: INSERT/UPDATE/DELETE with role-based checks
- [x] AC4: Tests proving 403 error when accessing another org's data
- [x] AC5: TRUNCATE/DELETE blocked (service_role only)
- [x] AC6: PL/pgSQL functions marked SECURITY DEFINER + audit logging

## Files to Create/Modify

**Create:**
- `supabase/migrations/{timestamp}_enable_rls_all_tables.sql` — Enable RLS on all 38 tables
- `supabase/policies/select_by_org.sql` — SELECT policy template
- `supabase/policies/write_by_org_role.sql` — INSERT/UPDATE/DELETE policy template
- `supabase/functions/audit_log.sql` — PL/pgSQL audit logging function
- `tests/rls/isolation.test.ts` — Integration tests for org isolation

**Modify:**
- `lib/db/schema.ts` — Add RLS type hints

## Dependencies

**Blocked by:** Story 1.1 (COMPLETE ✅)

## Dev Notes

1. **RLS Priority:** Enable before policies (alter table ... enable row level security)
2. **Role Checks:** Use `auth.role()` or `auth.jwt()` to get current role
3. **Edge Cases:** Deleted users, role changes, service_role bypass
4. **Audit Compliance:** Log EVERY write operation
5. **Performance:** RLS adds ~2ms overhead per query (acceptable)

## Quality Gates

- CodeRabbit: Auto-fix CRITICAL/HIGH (max 2 iterations)
- `npm run test`: All passing
- `npm run lint`: No errors
- `npm run typecheck`: No errors
- All AC checkboxes marked [x] in story file

## Next Steps After Complete

1. Mark story status: Ready → InProgress → InReview
2. Update checkboxes in story file
3. Run CodeRabbit if not already done (iteration <= 2)
4. Await @qa gate review
5. Upon PASS, mark story Done

---

**Handoff From:** Morgan (PM)
**Execution Authority:** Full autonomous
**Context Window:** Minimal — story has all details needed
