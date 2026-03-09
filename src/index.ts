#!/usr/bin/env node

/**
 * LuminaRaptor28 MCP Server
 *
 * Exposes AI agent orchestration, multi-agent pipelines, RAG knowledge
 * retrieval, and workflow automation as Model Context Protocol tools.
 *
 * https://github.com/lumina28/luminaraptor28-mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createServer } from 'http';

import { orchestrationTools, handleOrchestrationTool } from './tools/orchestration.js';
import { agentTools, handleAgentTool } from './tools/agents.js';
import { knowledgeTools, handleKnowledgeTool } from './tools/knowledge.js';
import { workflowTools, handleWorkflowTool } from './tools/workflows.js';

// ---------------------------------------------------------------------------
// Aggregate tools & build handler lookup
// ---------------------------------------------------------------------------

const allTools = [
  ...orchestrationTools,
  ...agentTools,
  ...knowledgeTools,
  ...workflowTools,
];

type ToolHandler = (name: string, args: Record<string, unknown>) => Promise<unknown>;

const toolHandlers: Record<string, ToolHandler> = {};
for (const tool of orchestrationTools) toolHandlers[tool.name] = handleOrchestrationTool;
for (const tool of agentTools) toolHandlers[tool.name] = handleAgentTool;
for (const tool of knowledgeTools) toolHandlers[tool.name] = handleKnowledgeTool;
for (const tool of workflowTools) toolHandlers[tool.name] = handleWorkflowTool;

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

function createMcpServer(): Server {
  const srv = new Server(
    { name: 'luminaraptor28-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } },
  );

  srv.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools,
  }));

  srv.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const handler = toolHandlers[name];

    if (!handler) {
      return {
        content: [{ type: 'text' as const, text: `Unknown tool: ${name}` }],
        isError: true,
      };
    }

    try {
      const result = await handler(name, (args || {}) as Record<string, unknown>);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        content: [{ type: 'text' as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  });

  return srv;
}

// ---------------------------------------------------------------------------
// Connect via stdio or Streamable HTTP transport
// ---------------------------------------------------------------------------

const PORT = process.env.PORT;

if (PORT) {
  // Streamable HTTP mode for cloud hosting (MCPize, etc.)
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: () => crypto.randomUUID() });
  const server = createMcpServer();
  await server.connect(transport);

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);

    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', server: 'luminaraptor28-mcp', version: '1.0.0' }));
      return;
    }

    if (url.pathname === '/mcp') {
      await transport.handleRequest(req, res);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.error(`LuminaRaptor28 MCP Server listening on port ${PORT} (Streamable HTTP at /mcp)`);
  });
} else {
  // Stdio mode for local use (Claude Desktop, Cline, etc.)
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
