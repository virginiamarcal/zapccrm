-- Story 1.1 AC2: Add organization_id column to all existing tables for multi-tenant isolation

-- Create a default super-admin organization UUID constant
-- This will be replaced with actual org ID during data migration
DO $$
DECLARE
  super_admin_org_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
  -- This is a placeholder; actual migration should use real org UUID
  -- See rollback-multi-tenant.md for migration strategy
END $$;

-- Add organization_id to users table
ALTER TABLE public.users 
  ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_users_organization ON public.users(organization_id);

-- Add organization_id to workspaces table
ALTER TABLE public.workspaces 
  ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_workspaces_organization ON public.workspaces(organization_id);

-- Future: Apply this pattern to additional tables
-- Template for new tables:
/*
ALTER TABLE public.<table_name>
  ADD COLUMN organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_<table_name>_organization ON public.<table_name>(organization_id);
*/

-- Update RLS policies to include organization_id filtering
-- (See Story 1.2 for complete RLS implementation)

COMMENT ON COLUMN public.users.organization_id IS 'Organization this user belongs to';
COMMENT ON COLUMN public.workspaces.organization_id IS 'Organization this workspace belongs to';
