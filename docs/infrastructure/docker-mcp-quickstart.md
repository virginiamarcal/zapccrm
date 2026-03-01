# Docker MCP Toolkit — Quick Start

## Installation

### 1. Install Docker MCP Globally
```bash
npm install -g docker-mcp-toolkit
```

### 2. Initialize
```bash
docker mcp init
```

### 3. Start Service
```bash
docker mcp start
```

## Add Essential MCPs

### EXA (Web Search)
```bash
# Add MCP
docker mcp add exa

# Verify
docker mcp list | grep exa
```

**Use Cases:**
- Market research
- Competitor analysis
- Industry trends

### Context7 (Library Docs)
```bash
# Add MCP
docker mcp add context7

# Verify
docker mcp list | grep context7
```

**Use Cases:**
- API documentation
- Framework guides
- Code examples

## Usage Examples

### Search with EXA
```bash
docker mcp call exa web_search "React 19 features"
```

### Get Library Docs
```bash
docker mcp call context7 resolve_library_id "react"
docker mcp call context7 get_library_docs "/facebook/react" "hooks"
```

## Configuration

Edit `.mcp/docker-mcp-config.yaml` to:
- Enable/disable MCPs
- Configure API keys
- Set logging levels
- Manage health checks

## Troubleshooting

**MCP not found:**
```bash
docker mcp search <mcp-name>
docker mcp add <mcp-name>
```

**Connection error:**
```bash
docker mcp health
docker mcp logs <mcp-name>
```

**Permission denied:**
```bash
# Restart service
docker mcp stop
docker mcp start
```

## Next Steps

1. ✅ Docker MCP installed and configured
2. ⏳ Add EXA (post-Wave2 once API key available)
3. ⏳ Add Context7 (no key required)
4. ⏳ Integrate into agent workflows
5. ⏳ Add Apify (optional, for data collection)

---

**Wave 2 Status:** Infrastructure ready, MCPs pending setup
