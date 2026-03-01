# MCP Docker Toolkit — Wave 2 ZapCRM

## What is MCP?

Model Context Protocol (MCP) extends Claude with specialized tools:
- **EXA** — Web search and research
- **Context7** — Library documentation lookup
- **Apify** — Web scraping and data extraction

## Prerequisites

- Docker Desktop installed
- Docker MCP Toolkit (`npm install -g docker-mcp-toolkit`)
- API keys (optional, see below)

## 1. Initialize Docker MCP Toolkit

```bash
# Install globally
npm install -g docker-mcp-toolkit

# Initialize configuration
docker mcp init

# Start Docker MCP service
docker mcp start
```

## 2. Available MCPs

### EXA — Web Search
```bash
# Search the web
docker mcp call exa web_search "your query"

# Requires: EXA API key (set in ~/.docker/mcp/config.yaml)
```

### Context7 — Library Docs
```bash
# Look up library documentation
docker mcp call context7 get_library_docs "/org/project" "your query"

# Free for public libraries
```

### Apify — Web Scraping
```bash
# Search for web scraping tools
docker mcp call apify search_actors "search query"

# Requires: Apify API token
```

## 3. Configuration

### EXA Setup (Optional)

```bash
# Get API key: https://exa.ai
docker mcp secret set EXA_API_KEY "<your-api-key>"
```

### Apify Setup (Optional)

```bash
# Get API token: https://apify.com
docker mcp secret set APIFY_API_TOKEN "<your-api-token>"
```

### Context7 Setup (No key needed)

Works out-of-the-box for public libraries.

## 4. Usage in Claude Code

When activated, MCPs provide:
- Web search for research
- API documentation lookup
- Web scraping automation
- Data collection workflows

## 5. Monitoring

```bash
# List active MCPs
docker mcp list

# View MCP logs
docker mcp logs <mcp-name>

# Health check
docker mcp health
```

## Environment Variables

Add to `.env` if using custom MCP servers:
```
MCP_DOCKER_HOST=localhost
MCP_DOCKER_PORT=5000
```

## Troubleshooting

- `Docker not found` → Install Docker Desktop
- `MCP not connecting` → Check `docker mcp health`
- `Authentication failed` → Verify secrets with `docker mcp secret list`

[MCP Documentation](https://modelcontextprotocol.io/)
