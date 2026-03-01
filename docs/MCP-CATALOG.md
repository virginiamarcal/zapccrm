# MCP Catalog — Available Tools for Wave 2

## 🎯 Recommended MCPs for ZapCRM

### 1. EXA — Web Search & Research
**Status:** Highly Recommended  
**Use Cases:**
- Market research for feature validation
- Competitor analysis
- Documentation discovery
- Industry trends

**Installation:**
```bash
docker mcp add exa
docker mcp secret set EXA_API_KEY "<your-key>"  # Optional, has free tier
```

**Tools:**
- `web_search` — Search the web
- `get_news` — Latest news search
- `find_similar` — Find similar websites

---

### 2. Context7 — Library Documentation
**Status:** Essential for Development  
**Use Cases:**
- API documentation lookup
- Framework guides
- Library version info
- Code examples

**Installation:**
```bash
docker mcp add context7
# No API key required for public libraries
```

**Tools:**
- `resolve_library_id` — Find library documentation
- `get_library_docs` — Get docs for specific topic
- `search_examples` — Find code snippets

---

### 3. Apify — Web Scraping & Automation
**Status:** Optional (for data collection)  
**Use Cases:**
- Web scraping (legal sources only)
- Social media data extraction
- E-commerce price monitoring
- Automated data collection

**Installation:**
```bash
docker mcp add apify
docker mcp secret set APIFY_API_TOKEN "<your-token>"
```

**Tools:**
- `search_actors` — Find scraping tools
- `call_actor` — Run a scraper
- `get_actor_results` — Fetch results

---

### 4. Playwright — Browser Automation
**Status:** Built-in (Claude Code)  
**Use Cases:**
- Screenshot capture
- Web interaction testing
- Form filling
- Page navigation

**Tools:**
- `screenshot` — Take page screenshot
- `navigate` — Go to URL
- `click` — Click elements
- `fill_text` — Fill form fields

---

## 🚀 Setup Priority

**Phase 1 (Essential):**
1. Context7 (documentation lookup)
2. EXA (research & market analysis)

**Phase 2 (Nice-to-have):**
3. Apify (data collection)
4. Playwright (browser testing)

---

## Usage in Development

### Activate MCP in Claude Code
```bash
# MCPs are auto-available when enabled
# Use them directly in agent workflows
```

### Example: @analyst using EXA for research
```
@analyst: *research "React 19 adoption trends"
→ Uses EXA to search latest data
```

### Example: @architect using Context7
```
@architect: Looking up Supabase RLS documentation
→ Uses Context7 to get latest API docs
```

---

## Configuration

### Installation Method: Docker MCP Toolkit

```bash
# Install globally
npm install -g docker-mcp-toolkit

# List available MCPs
docker mcp search

# Add MCP
docker mcp add <mcp-name>

# View configuration
docker mcp config show

# Test connection
docker mcp health
```

---

## Status in Wave 2

- [x] Identified essential MCPs (EXA, Context7)
- [x] Documented setup instructions
- [ ] Deploy EXA + Context7 to Docker MCP
- [ ] Configure API keys (post-Wave2)
- [ ] Integrate into agent workflows

---

**Last Updated:** 2026-03-01 by @devops (Gage)
