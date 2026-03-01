# Rollback Plan — Multi-Tenant Schema Migration (Story 1.1)

## Overview

This document describes the procedure to rollback the multi-tenant schema changes if the migration fails or causes critical issues.

## Migration Summary

**Migrations applied:**
1. `20260301010000_add_organizations_table.sql` — Creates `organizations` table
2. `20260301020000_add_organization_id_to_tables.sql` — Adds `organization_id` to users, workspaces

## Rollback Procedure

### Step 1: Identify Rollback Timing

- **Immediate rollback:** If migration fails during application
- **Delayed rollback:** If issues discovered within 24h of deployment

### Step 2: Execute Rollback

```bash
# Connect to Supabase
supabase db reset  # Local environment

# Or for production (requires backup confirmation)
supabase db push --linked --force-reset  # WARNING: Destructive
```

### Step 3: Reverse Migrations Manually (Safest)

```sql
-- Reverse Migration 2: Remove organization_id columns
ALTER TABLE public.users DROP COLUMN IF EXISTS organization_id;
ALTER TABLE public.workspaces DROP COLUMN IF EXISTS organization_id;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_organization;
DROP INDEX IF EXISTS idx_workspaces_organization;

-- Reverse Migration 1: Drop organizations table
DROP TABLE IF EXISTS public.organizations CASCADE;
```

### Step 4: Verify Rollback

```bash
# Check schema
supabase db pull

# Verify table structure
supabase status

# Run tests
npm test
```

## Data Recovery

**If data loss occurs:**

1. **Backup location:** Supabase automatic daily backups
2. **Restore from backup:** Use Supabase dashboard (Database > Backups)
3. **Point-in-time recovery:** Available within 7 days

## Rollback Success Criteria

- ✅ `organizations` table removed
- ✅ `organization_id` columns removed from all tables
- ✅ All RLS policies reverted
- ✅ Application tests pass
- ✅ Zero orphaned records

---

**Document Status:** Draft  
**Last Updated:** 2026-03-01
