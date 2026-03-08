import { apiRequest } from '../config.js';

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const agentTools = [
  {
    name: 'list_agents',
    description:
      'List available AI agents registered with OpenClaw, including their capabilities and categories.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        category: {
          type: 'string',
          description:
            'Filter agents by category (e.g. business, developer, platform). Omit or pass "all" for no filter.',
        },
      },
    },
  },
  {
    name: 'dispatch_agent',
    description:
      'Send a task to a specific OpenClaw agent for execution. Returns the agent response and optional quality-gate score.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agent_id: {
          type: 'string',
          description: 'Agent ID to dispatch the task to',
        },
        task: {
          type: 'string',
          description: 'The task description to send to the agent',
        },
        context: {
          type: 'object',
          description: 'Optional key-value context for the agent',
        },
        action: {
          type: 'string',
          description: 'Optional action hint (e.g. analyze, deploy, review)',
        },
      },
      required: ['agent_id', 'task'],
    },
  },
  {
    name: 'get_agent_status',
    description:
      'Check the execution status, trust score, and performance statistics for a specific agent.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agent_id: {
          type: 'string',
          description: 'Agent ID to look up',
        },
      },
      required: ['agent_id'],
    },
  },
];

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleAgentTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case 'list_agents': {
      const query: Record<string, string> = {};
      if (args.category && args.category !== 'all') {
        query.category = args.category as string;
      }
      return apiRequest('/api/v1/agents', { query });
    }

    case 'dispatch_agent':
      return apiRequest('/api/v1/agents/dispatch', {
        method: 'POST',
        body: {
          agent_id: args.agent_id,
          task: args.task,
          context: args.context || {},
          action: args.action || 'execute',
        },
      });

    case 'get_agent_status':
      return apiRequest(`/api/v1/agents/${encodeURIComponent(args.agent_id as string)}/status`);

    default:
      throw new Error(`Unknown agent tool: ${name}`);
  }
}
