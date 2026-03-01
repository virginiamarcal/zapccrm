# Story 1.3 Implementation Context — @dev

**Story:** 1.3 - Multi-Org Auth e Invite System
**Status:** Ready → InProgress
**Mode:** YOLO (fully autonomous)
**Complexity:** 8 pts

## Quick Summary

Implement team invite flow: owners can invite members via email with role assignment (admin/member/viewer). Accept invite creates org_member record. Support multi-org selection UI.

## Acceptance Criteria (6 total)

- [x] AC1: POST /api/auth/invite creates JWT token with 7-day expiration
- [x] AC2: Email sent with link `/join?token={token}`
- [x] AC3: GET /join page validates token, creates user + org_member with role
- [x] AC4: Uses Supabase Auth (not manual DB insert)
- [x] AC5: Logged-in user sees org dropdown if member of multiple orgs
- [x] AC6: /settings/team page shows members, roles, remove option

## Files to Create/Modify

**Create:**
- `app/api/auth/invite/route.ts` — Invite endpoint (POST)
- `app/join/page.tsx` — Accept invite form
- `app/settings/team/page.tsx` — Team management UI
- `lib/auth/invite-service.ts` — Token generation, validation, org_member creation
- `lib/emails/invite-email.ts` — Email template (plain text + HTML)
- `tests/auth/invite.test.ts` — Invite flow tests

**Modify:**
- `app/api/auth/callback/route.ts` — Handle Supabase Auth callback for join flow
- `lib/db/schema.ts` — Ensure org_members table exists with role enum

## Dependencies

**Blocked by:** Story 1.1 (COMPLETE ✅)

## Dev Notes

1. **JWT Token:** Include invite_id, org_id, email. Sign with secret from .env
2. **Email Template:** Plain text + HTML versions. Use brand colors
3. **Role Default:** Defaults to 'member' if not specified
4. **Duplicate Prevention:** Check if email already invited (revoke if > 7 days old)
5. **Supabase Auth:** Use auth.signUp() or auth.signInWithPassword() for new users
6. **Org Dropdown:** Show on main page if user.organizations.length > 1

## Quality Gates

- CodeRabbit: Auto-fix CRITICAL/HIGH (max 2 iterations)
- `npm run test`: All passing
- `npm run lint`: No errors
- `npm run typecheck`: No errors
- All AC checkboxes marked [x] in story file
- Email templates reviewed (brand compliance)

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
