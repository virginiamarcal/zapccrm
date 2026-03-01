# Wave 2 Infrastructure Setup — Checklist

## ✅ Completed

- [x] Git repository initialized
- [x] GitHub Actions CI/CD pipeline
- [x] Branch protection rules
- [x] GitHub secrets (placeholders)
- [x] Supabase configuration and migrations
- [x] Stripe documentation and setup guide
- [x] MCP Docker Toolkit configuration

## 📋 Next Steps

### Phase 1: Supabase Setup (Immediate)

1. **Create Supabase Project**
   ```bash
   # Go to https://supabase.com/dashboard
   # Create new project
   # Copy credentials
   ```

2. **Update Environment**
   ```bash
   cp .env.example .env
   # Fill in real Supabase credentials
   ```

3. **Deploy Schema**
   ```bash
   supabase link --project-ref <project-id>
   supabase db push
   ```

4. **Update GitHub Secrets**
   ```bash
   gh secret set SUPABASE_URL --body "your-url"
   gh secret set SUPABASE_ANON_KEY --body "your-key"
   gh secret set SUPABASE_SERVICE_KEY --body "your-key"
   ```

### Phase 2: Stripe Setup (If needed for Wave 2)

1. **Get API Keys**
   - Go to https://dashboard.stripe.com
   - Get test keys (development)

2. **Update .env**
   ```
   STRIPE_PUBLIC_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   ```

3. **Setup Webhooks**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   # Copy webhook secret to .env
   ```

4. **Update GitHub Secrets**
   ```bash
   gh secret set STRIPE_PUBLIC_KEY --body "pk_test_..."
   gh secret set STRIPE_SECRET_KEY --body "sk_test_..."
   gh secret set STRIPE_WEBHOOK_SECRET --body "whsec_..."
   ```

### Phase 3: MCP Docker Toolkit (Optional)

1. **Install**
   ```bash
   npm install -g docker-mcp-toolkit
   docker mcp init
   ```

2. **Start Service**
   ```bash
   docker mcp start
   ```

3. **(Optional) Add API Keys**
   ```bash
   docker mcp secret set EXA_API_KEY "<key>"
   docker mcp secret set APIFY_API_TOKEN "<token>"
   ```

## 🚀 Development Workflow

### Local Development
```bash
# Start Supabase locally
supabase start

# Start app
npm run dev

# Tests
npm test

# Push changes
git push origin <branch>
```

### Deployment
```bash
# Create PR
gh pr create

# Merge (triggers CI/CD)
gh pr merge

# Automatic deployment via GitHub Actions
```

## 🔗 Related Documentation

- [Supabase Setup](./infrastructure/supabase-setup.md)
- [Stripe Setup](./infrastructure/stripe-setup.md)
- [MCP Setup](./infrastructure/mcp-setup.md)
- [AIOS Development Guide](../CLAUDE.md)

## 📞 Support

For issues:
1. Check GitHub Actions logs
2. Review .env configuration
3. Verify credentials in GitHub secrets
4. Check service health: `docker mcp health`

---

**Wave 2 Infrastructure Status:** ✅ Ready for development

Created: 2026-03-01 by @devops (Gage)
