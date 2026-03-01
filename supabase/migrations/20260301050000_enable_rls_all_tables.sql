-- Story 1.2 AC1-AC6: Enable Row Level Security on all tables with comprehensive isolation

-- Helper function to check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_org_member(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has admin role in organization
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.org_members
    WHERE organization_id = org_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's organizations
CREATE OR REPLACE FUNCTION public.get_user_organizations()
RETURNS SETOF UUID AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT organization_id FROM public.org_members
  WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS Policies for organizations (update existing)
-- ============================================================================

-- Drop existing organization policies if they exist
DROP POLICY IF EXISTS "Users can view organizations they own" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Owners can update their organizations" ON public.organizations;

-- New organization policies with membership check
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (
    public.is_org_member(id)
  );

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (public.is_org_admin(id))
  WITH CHECK (public.is_org_admin(id));

CREATE POLICY "Organization deletion by admin"
  ON public.organizations FOR DELETE
  USING (public.is_org_admin(id));

-- ============================================================================
-- RLS Policies for users (update existing)
-- ============================================================================

DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can read organization members"
  ON public.users FOR SELECT
  USING (
    id IN (
      SELECT user_id FROM public.org_members
      WHERE organization_id IN (
        SELECT organization_id FROM public.org_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RLS Policies for workspaces
-- ============================================================================

-- Drop existing workspace policies
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Users can read own workspaces" ON public.workspaces;

-- New workspace policies with organization isolation
CREATE POLICY "Members can view workspace in their organization"
  ON public.workspaces FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can create workspaces in their organization"
  ON public.workspaces FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Members can update workspaces in their organization"
  ON public.workspaces FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can delete workspaces in their organization"
  ON public.workspaces FOR DELETE
  USING (
    public.is_org_admin(organization_id)
  );

-- ============================================================================
-- Audit Logging Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  changes JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_organization ON public.audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name);

-- Enable RLS on audit logs (only users in org can view, admins can view all)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view audit logs for their organization"
  ON public.audit_logs FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid()
    )
  );

-- Trigger function for audit logging
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
BEGIN
  -- Determine organization_id from the table
  CASE TG_TABLE_NAME
    WHEN 'workspaces' THEN org_id := NEW.organization_id;
    WHEN 'org_members' THEN org_id := NEW.organization_id;
    WHEN 'users' THEN org_id := NEW.organization_id;
    ELSE org_id := NULL;
  END CASE;

  -- Only log if we have an organization_id
  IF org_id IS NOT NULL THEN
    INSERT INTO public.audit_logs (
      organization_id,
      user_id,
      action,
      table_name,
      record_id,
      changes
    ) VALUES (
      org_id,
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for critical tables
CREATE TRIGGER audit_org_members_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.org_members
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

CREATE TRIGGER audit_workspaces_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ============================================================================
-- Security Notes
-- ============================================================================
--
-- 1. All RLS policies use organization_id as the primary isolation boundary
-- 2. Membership check via org_members table ensures users can only access their orgs
-- 3. SECURITY DEFINER functions run with elevated privileges for performance
-- 4. Audit logging captures all changes for compliance
-- 5. Service role can bypass all RLS policies for administrative operations
--
