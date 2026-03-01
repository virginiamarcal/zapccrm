-- Story 1.5: Add super admin support and impersonation tracking

-- Add is_super_admin column to users table
ALTER TABLE public.users
ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;

-- Create index for super admin lookup
CREATE INDEX idx_users_is_super_admin ON public.users(is_super_admin)
WHERE is_super_admin = TRUE;

-- Create impersonation_sessions table
CREATE TABLE IF NOT EXISTS public.impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  super_admin_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  impersonated_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_impersonation_sessions_super_admin ON public.impersonation_sessions(super_admin_id);
CREATE INDEX idx_impersonation_sessions_organization ON public.impersonation_sessions(organization_id);
CREATE INDEX idx_impersonation_sessions_user ON public.impersonation_sessions(impersonated_user_id);
CREATE INDEX idx_impersonation_sessions_active ON public.impersonation_sessions(super_admin_id)
WHERE ended_at IS NULL;

-- Enable RLS on impersonation_sessions (only super admins can view)
ALTER TABLE public.impersonation_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Only super admins can view impersonation sessions"
  ON public.impersonation_sessions FOR SELECT
  USING (
    (SELECT is_super_admin FROM public.users WHERE id = auth.uid()) = TRUE
  );

CREATE POLICY "Only super admins can create impersonation sessions"
  ON public.impersonation_sessions FOR INSERT
  WITH CHECK (
    super_admin_id = auth.uid() AND
    (SELECT is_super_admin FROM public.users WHERE id = auth.uid()) = TRUE
  );

-- Update organization RLS to allow super admins to view all
DROP POLICY IF EXISTS "Members can view their organizations" ON public.organizations;

CREATE POLICY "Members can view their organizations or super admins can view all"
  ON public.organizations FOR SELECT
  USING (
    public.is_org_member(id) OR
    (SELECT is_super_admin FROM public.users WHERE id = auth.uid()) = TRUE
  );

-- Comments
COMMENT ON COLUMN public.users.is_super_admin IS 'Can access /admin routes and impersonate users';
COMMENT ON TABLE public.impersonation_sessions IS 'Track super admin impersonation sessions for audit purposes';
COMMENT ON COLUMN public.impersonation_sessions.reason IS 'Why the impersonation was started (for audit log)';
