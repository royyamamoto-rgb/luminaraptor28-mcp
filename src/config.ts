/**
 * OpenClaw MCP Server configuration.
 *
 * All values are resolved from environment variables at runtime
 * so the package stays stateless and portable.
 */

export interface OpenClawConfig {
  /** Base URL of the OpenClaw API (no trailing slash). */
  apiUrl: string;
  /** API key for authenticating requests to the OpenClaw API. */
  apiKey: string;
}

export function getConfig(): OpenClawConfig {
  const apiUrl = (process.env.OPENCLAW_API_URL || 'http://localhost:1878').replace(/\/+$/, '');
  const apiKey = process.env.OPENCLAW_API_KEY || '';
  return { apiUrl, apiKey };
}

/**
 * Perform an authenticated request to the OpenClaw API.
 *
 * Centralises auth header injection, base-URL resolution, content-type
 * handling, and error surfacing so individual tool files stay lean.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    query?: Record<string, string>;
  } = {},
): Promise<T> {
  const { apiUrl, apiKey } = getConfig();
  const method = options.method || 'GET';

  let url = `${apiUrl}${path}`;
  if (options.query) {
    const params = new URLSearchParams(options.query);
    url += `?${params.toString()}`;
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
  };

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(
      `OpenClaw API error: ${method} ${path} returned HTTP ${response.status}${text ? ` — ${text}` : ''}`,
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}
