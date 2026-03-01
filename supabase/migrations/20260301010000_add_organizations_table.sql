-- Story 1.1 AC1: Create organizations table for multi-tenant support

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  logo_url TEXT,
  description TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX idx_organizations_slug ON public.organizations(slug);

-- RLS Policies
CREATE POLICY "Users can view organizations they own"
  ON public.organizations FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create organizations"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their organizations"
  ON public.organizations FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Trigger for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Comment for documentation
COMMENT ON TABLE public.organizations IS 'Multi-tenant organization table. Each organization is owned by a user and contains isolated data.';
COMMENT ON COLUMN public.organizations.id IS 'Unique organization identifier';
COMMENT ON COLUMN public.organizations.slug IS 'URL-friendly organization name (unique)';
COMMENT ON COLUMN public.organizations.owner_id IS 'References auth user who owns this organization';
