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
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

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
// Connect via stdio transport
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);
