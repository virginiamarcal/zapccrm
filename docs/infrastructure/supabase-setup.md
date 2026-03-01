# Supabase Setup — Wave 2 ZapCRM

## Prerequisites

- Node.js 18+
- Supabase CLI installed (`npm install -g supabase`)
- Supabase account (https://supabase.com)

## 1. Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Create new project
3. Copy Project URL and anon key
4. Update `.env` with:
   ```
   SUPABASE_URL=<your-project-url>
   SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_KEY=<your-service-key>
   ```

## 2. Initialize Local Development

```bash
# Link to your Supabase project
supabase link --project-ref <project-id>

# Start local Supabase
supabase start

# Run migrations
supabase db push
```

## 3. Schema Overview

- `users` — Extended auth.users with profiles
- `workspaces` — User workspaces/organizations
- RLS policies enforce user isolation
- Triggers maintain `updated_at` timestamps

## 4. Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own data:
- Users see only their own profile
- Users see only their own workspaces

## 5. Deployment

```bash
# Deploy to production
supabase db push --linked

# Verify migrations
supabase migration list
```

## Environment Variables

Update GitHub secrets with real Supabase credentials:
- `SUPABASE_URL` — Project URL
- `SUPABASE_ANON_KEY` — Public anon key (safe for client)
- `SUPABASE_SERVICE_KEY` — Admin key (keep secret)
