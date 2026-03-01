-- Story 1.1 AC5: Migrate existing data to multi-tenant structure

-- Step 1: Create default super-admin organization
INSERT INTO public.organizations (id, name, slug, owner_id, description)
SELECT 
  '00000000-0000-0000-0000-000000000000'::UUID,
  'System Super-Admin',
  'super-admin',
  id,
  'Default organization for system data migration'
FROM public.users
WHERE role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Step 2: Assign all users to super-admin org if not already assigned
UPDATE public.users
SET organization_id = '00000000-0000-0000-0000-000000000000'::UUID
WHERE organization_id IS NULL;

-- Step 3: Assign all workspaces to the owner's organization
UPDATE public.workspaces
SET organization_id = (
  SELECT organization_id 
  FROM public.users 
  WHERE users.id = workspaces.owner_id
)
WHERE organization_id IS NULL;

-- Step 4: Verify migration integrity
-- This would be run as a check, not as part of the migration itself
-- SELECT 
--   'users_with_org' AS check_name,
--   COUNT(*) AS count,
--   COUNT(CASE WHEN organization_id IS NULL THEN 1 END) AS null_count
-- FROM public.users;

-- Step 5: Add NOT NULL constraint after data migration
ALTER TABLE public.users
ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE public.workspaces
ALTER COLUMN organization_id SET NOT NULL;

-- Verification comments (for testing)
COMMENT ON COLUMN public.users.organization_id IS 'NOW REQUIRED: Organization this user belongs to';
COMMENT ON COLUMN public.workspaces.organization_id IS 'NOW REQUIRED: Organization this workspace belongs to';
