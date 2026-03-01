-- Story 1.3: Create org_invites table for managing team invitations

CREATE TABLE IF NOT EXISTS public.org_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(organization_id, email, status)
);

-- Create indexes for performance
CREATE INDEX idx_org_invites_organization ON public.org_invites(organization_id);
CREATE INDEX idx_org_invites_email ON public.org_invites(email);
CREATE INDEX idx_org_invites_status ON public.org_invites(status);
CREATE INDEX idx_org_invites_expires_at ON public.org_invites(expires_at);

-- Enable RLS
ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can view pending invites for their org
CREATE POLICY "Admins can view organization invites"
  ON public.org_invites FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can create invites
CREATE POLICY "Admins can create invites"
  ON public.org_invites FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only admins can revoke invites
CREATE POLICY "Admins can revoke invites"
  ON public.org_invites FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE public.org_invites IS 'Pending and completed team invitations';
COMMENT ON COLUMN public.org_invites.email IS 'Email address being invited';
COMMENT ON COLUMN public.org_invites.role IS 'Role to be assigned upon acceptance';
COMMENT ON COLUMN public.org_invites.status IS 'Current status: pending, accepted, expired, or revoked';
COMMENT ON COLUMN public.org_invites.expires_at IS 'When the invitation expires (7 days from creation)';
