import { apiRequest } from '../config.js';

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const workflowTools = [
  {
    name: 'trigger_workflow',
    description:
      'Trigger an n8n workflow by ID, optionally passing input data. Returns the execution result.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        workflow_id: {
          type: 'string',
          description: 'The n8n workflow ID to trigger',
        },
        data: {
          type: 'object',
          description: 'Optional input data to pass to the workflow',
        },
      },
      required: ['workflow_id'],
    },
  },
  {
    name: 'list_workflows',
    description:
      'List available n8n workflows with their active/inactive status and recent execution stats.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        active_only: {
          type: 'boolean',
          description: 'If true, only return active workflows. Default: false',
        },
      },
    },
  },
];

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleWorkflowTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case 'trigger_workflow':
      return apiRequest('/api/v1/workflows/trigger', {
        method: 'POST',
        body: {
          workflow_id: args.workflow_id,
          data: args.data || {},
        },
      });

    case 'list_workflows': {
      const query: Record<string, string> = {};
      if (args.active_only) {
        query.active_only = 'true';
      }
      return apiRequest('/api/v1/workflows', { query });
    }

    default:
      throw new Error(`Unknown workflow tool: ${name}`);
  }
}
