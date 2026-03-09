import { apiRequest } from '../config.js';

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export const knowledgeTools = [
  {
    name: 'search_knowledge',
    description:
      'Search the LuminaRaptor28 RAG knowledge base for solutions, patterns, and agent learnings.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Natural-language search query',
        },
        domain: {
          type: 'string',
          description: 'Filter by domain (e.g. engineering, business, security, operations)',
        },
        agent_id: {
          type: 'string',
          description: 'Filter by the agent that contributed the knowledge',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter by one or more tags',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'add_knowledge',
    description:
      'Add a new document or problem-solution pair to the LuminaRaptor28 knowledge base.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agent_id: {
          type: 'string',
          description: 'ID of the agent contributing this knowledge',
        },
        domain: {
          type: 'string',
          description: 'Domain (e.g. engineering, business, security, operations)',
        },
        problem_summary: {
          type: 'string',
          description: 'Brief description of the problem',
        },
        solution_summary: {
          type: 'string',
          description: 'Brief description of the solution',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Tags for categorisation and retrieval',
        },
        confidence: {
          type: 'number',
          description: 'Confidence score between 0.0 and 1.0 (default: 0.8)',
        },
      },
      required: ['agent_id', 'domain', 'problem_summary', 'solution_summary', 'tags'],
    },
  },
];

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function handleKnowledgeTool(
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  switch (name) {
    case 'search_knowledge': {
      const body: Record<string, unknown> = { query: args.query };
      if (args.domain) body.domain = args.domain;
      if (args.agent_id) body.agent_id = args.agent_id;
      if (args.tags) body.tags = args.tags;
      if (args.limit) body.limit = args.limit;

      return apiRequest('/api/v1/knowledge/search', {
        method: 'POST',
        body,
      });
    }

    case 'add_knowledge':
      return apiRequest('/api/v1/knowledge', {
        method: 'POST',
        body: {
          agent_id: args.agent_id,
          domain: args.domain,
          problem_summary: args.problem_summary,
          solution_summary: args.solution_summary,
          tags: args.tags,
          confidence: args.confidence ?? 0.8,
        },
      });

    default:
      throw new Error(`Unknown knowledge tool: ${name}`);
  }
}
