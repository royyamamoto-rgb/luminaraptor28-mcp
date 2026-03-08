#!/usr/bin/env node

/**
 * OpenClaw MCP Server
 *
 * Exposes AI agent orchestration, multi-agent pipelines, RAG knowledge
 * retrieval, and workflow automation as Model Context Protocol tools.
 *
 * https://github.com/lumina28/openclaw-mcp
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
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

const server = new Server(
  { name: 'openclaw-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
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

// ---------------------------------------------------------------------------
// Connect via stdio or SSE transport (MCPize uses SSE via PORT env)
// ---------------------------------------------------------------------------

const PORT = process.env.PORT;

if (PORT) {
  // SSE mode for cloud hosting (MCPize, etc.)
  const transports = new Map<string, SSEServerTransport>();

  const httpServer = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://localhost:${PORT}`);

    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', server: 'openclaw-mcp', version: '1.0.0' }));
      return;
    }

    if (url.pathname === '/sse' && req.method === 'GET') {
      const transport = new SSEServerTransport('/messages', res);
      transports.set(transport.sessionId, transport);
      transport.onclose = () => transports.delete(transport.sessionId);
      await server.connect(transport);
      return;
    }

    if (url.pathname === '/messages' && req.method === 'POST') {
      const sessionId = url.searchParams.get('sessionId');
      const transport = sessionId ? transports.get(sessionId) : undefined;
      if (!transport) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid or missing sessionId' }));
        return;
      }
      await transport.handlePostMessage(req, res);
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  httpServer.listen(Number(PORT), '0.0.0.0', () => {
    console.error(`OpenClaw MCP Server listening on port ${PORT} (SSE mode)`);
  });
} else {
  // Stdio mode for local use (Claude Desktop, Cline, etc.)
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
