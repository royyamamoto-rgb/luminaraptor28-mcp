# @luminaraptor28/mcp-server

AI agent orchestration for the [Model Context Protocol](https://modelcontextprotocol.io).
Built by [Lumina28](https://lumina28.com).

LuminaRaptor28 is an AI agent orchestration platform that lets you register agents,
compose multi-agent pipelines, query a RAG knowledge base, and trigger n8n
workflow automations — all through a single MCP server that any compatible
client (Claude Desktop, Cline, Cursor, etc.) can connect to.

---

## Installation

### npx (zero-install)

```bash
npx @luminaraptor28/mcp-server
```

### Global install

```bash
npm install -g @luminaraptor28/mcp-server
luminaraptor28-mcp
```

### From source

```bash
git clone https://github.com/lumina28/luminaraptor28-mcp.git
cd luminaraptor28-mcp
npm install
npm run build
npm start
```

---

## Configuration

The server connects to a LuminaRaptor28 API instance. Configure it with environment
variables:

| Variable | Default | Description |
|---|---|---|
| `LUMINARAPTOR28_API_URL` | `http://localhost:1878` | Base URL of the LuminaRaptor28 API |
| `LUMINARAPTOR28_API_KEY` | *(empty)* | API key for authentication |

### Claude Desktop

Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "luminaraptor28": {
      "command": "npx",
      "args": ["-y", "@luminaraptor28/mcp-server"],
      "env": {
        "LUMINARAPTOR28_API_URL": "http://localhost:1878",
        "LUMINARAPTOR28_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cline / Roo Code

Add to your MCP settings:

```json
{
  "mcpServers": {
    "luminaraptor28": {
      "command": "npx",
      "args": ["-y", "@luminaraptor28/mcp-server"],
      "env": {
        "LUMINARAPTOR28_API_URL": "http://localhost:1878",
        "LUMINARAPTOR28_API_KEY": "your-api-key"
      }
    }
  }
}
```

---

## Available Tools

### Agent Management

| Tool | Description |
|---|---|
| `list_agents` | List available AI agents with capabilities and categories |
| `dispatch_agent` | Send a task to a specific agent for execution |
| `get_agent_status` | Check trust score, performance stats, and execution history |

### Orchestration

| Tool | Description |
|---|---|
| `run_pipeline` | Execute a multi-agent pipeline by ID with step-by-step output chaining |
| `fan_out` | Dispatch a task to multiple agents in parallel with configurable aggregation |
| `create_pipeline` | Define a new reusable multi-agent pipeline |

### Knowledge Base (RAG)

| Tool | Description |
|---|---|
| `search_knowledge` | Search the knowledge base for solutions, patterns, and learnings |
| `add_knowledge` | Add a problem-solution pair to the knowledge base |

### Workflow Automation

| Tool | Description |
|---|---|
| `trigger_workflow` | Trigger an n8n workflow by ID with optional input data |
| `list_workflows` | List available n8n workflows with status and execution stats |

---

## Usage Examples

### Run a multi-agent pipeline

```
Use run_pipeline with pipeline_id "security-audit" and task
"Audit the authentication module for vulnerabilities"
```

### Fan out to multiple agents

```
Use fan_out with agent_ids ["code-reviewer", "security-analyst", "performance-auditor"],
task "Review this pull request for issues", and aggregation "merge"
```

### Search knowledge base

```
Use search_knowledge with query "database connection pooling best practices"
and domain "engineering"
```

### Trigger a workflow

```
Use trigger_workflow with workflow_id "deploy-staging"
and data { "branch": "main", "environment": "staging" }
```

---

## API Compatibility

This MCP server is a thin client that delegates to the LuminaRaptor28 REST API. It
requires a running LuminaRaptor28 instance. The default API endpoint is
`http://localhost:1878`. See the
[LuminaRaptor28 documentation](https://github.com/lumina28/luminaraptor28) for setup
instructions.

### Endpoints Used

| Tool | Method | Path |
|---|---|---|
| `list_agents` | GET | `/api/v1/agents` |
| `dispatch_agent` | POST | `/api/v1/agents/dispatch` |
| `get_agent_status` | GET | `/api/v1/agents/:id/status` |
| `run_pipeline` | POST | `/api/v1/pipelines/run` |
| `fan_out` | POST | `/api/v1/orchestration/fan-out` |
| `create_pipeline` | POST | `/api/v1/pipelines` |
| `search_knowledge` | POST | `/api/v1/knowledge/search` |
| `add_knowledge` | POST | `/api/v1/knowledge` |
| `trigger_workflow` | POST | `/api/v1/workflows/trigger` |
| `list_workflows` | GET | `/api/v1/workflows` |

---

## Development

```bash
npm install
npm run dev       # Watch mode (recompiles on change)
npm run build     # One-shot compilation
npm start         # Run the compiled server
```

---

## License

MIT -- see [LICENSE](./LICENSE).
