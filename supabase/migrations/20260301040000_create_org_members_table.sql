-- Story 1.2 & 1.3: Create org_members table for team management with roles

CREATE TABLE IF NOT EXISTS public.org_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(organization_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_org_members_organization ON public.org_members(organization_id);
CREATE INDEX idx_org_members_user ON public.org_members(user_id);
CREATE INDEX idx_org_members_role ON public.org_members(role);

-- Enable RLS
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for org_members
-- Members can view their own organization's members
CREATE POLICY "Members can view their organization members"
  ON public.org_members FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- Only org admins can invite new members
CREATE POLICY "Only admins can invite members"
  ON public.org_members FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Only org admins can update roles
CREATE POLICY "Only admins can update member roles"
  ON public.org_members FOR UPDATE
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

-- Only org admins can remove members
CREATE POLICY "Only admins can remove members"
  ON public.org_members FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.org_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_org_members_updated_at BEFORE UPDATE ON public.org_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comments
COMMENT ON TABLE public.org_members IS 'Organization membership with role-based access control';
COMMENT ON COLUMN public.org_members.organization_id IS 'Organization this member belongs to';
COMMENT ON COLUMN public.org_members.user_id IS 'User who is a member of the organization';
COMMENT ON COLUMN public.org_members.role IS 'Role in organization: admin (full access), member (read/write), viewer (read-only)';
COMMENT ON COLUMN public.org_members.invited_by IS 'User who invited this member';
COMMENT ON COLUMN public.org_members.joined_at IS 'When the user actually joined (accepted invite)';
