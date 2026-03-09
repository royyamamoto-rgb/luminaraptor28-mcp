/**
 * Input validation and sanitization utilities for LuminaRaptor28 MCP Server.
 *
 * Every tool handler MUST validate its inputs through these helpers
 * before forwarding data to the backend API.
 */

export function validateString(value: unknown, name: string, maxLen = 1000): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string`);
  }
  if (value.length > maxLen) {
    throw new Error(`${name} exceeds maximum length of ${maxLen}`);
  }
  return value.trim();
}

export function validateStringOptional(value: unknown, name: string, maxLen = 1000): string | undefined {
  if (value === undefined || value === null) return undefined;
  return validateString(value, name, maxLen);
}

export function validateNumber(value: unknown, name: string, min: number, max: number): number {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    throw new Error(`${name} must be a number between ${min} and ${max}`);
  }
  return num;
}

export function validateArray(value: unknown, name: string, maxLen = 20): unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${name} must be a non-empty array`);
  }
  if (value.length > maxLen) {
    throw new Error(`${name} exceeds maximum length of ${maxLen}`);
  }
  return value;
}

export function validateId(value: unknown, name: string): string {
  const str = validateString(value, name, 200);
  if (!/^[a-zA-Z0-9_-]+$/.test(str)) {
    throw new Error(`${name} contains invalid characters (only alphanumeric, hyphens, underscores allowed)`);
  }
  return str;
}

export function sanitizeText(text: string): string {
  // Strip common prompt injection patterns (defense in depth — not a sole defense)
  return text
    .replace(/\bignore\s+(all\s+)?previous\s+instructions?\b/gi, '[FILTERED]')
    .replace(/\bsystem\s*prompt\b/gi, '[FILTERED]')
    .replace(/\b(reveal|show|output|print)\s+(your|the)\s+(system|initial)\s+(prompt|instructions?)\b/gi, '[FILTERED]');
}

const MAX_CONTEXT_KEYS = 20;
const MAX_CONTEXT_SIZE_BYTES = 10_240; // 10 KB

export function validateContext(value: unknown, name: string): Record<string, unknown> {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be a plain object`);
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj);
  if (keys.length > MAX_CONTEXT_KEYS) {
    throw new Error(`${name} exceeds maximum of ${MAX_CONTEXT_KEYS} keys`);
  }
  const serialized = JSON.stringify(obj);
  if (serialized.length > MAX_CONTEXT_SIZE_BYTES) {
    throw new Error(`${name} exceeds maximum size of ${MAX_CONTEXT_SIZE_BYTES} bytes`);
  }
  // Sanitize string values within context
  for (const key of keys) {
    if (typeof obj[key] === 'string') {
      obj[key] = sanitizeText(obj[key] as string);
    }
  }
  return obj;
}

const VALID_AGGREGATIONS = new Set(['merge', 'best', 'all']);

export function validateEnum(value: unknown, name: string, allowed: Set<string>, fallback: string): string {
  if (value === undefined || value === null) return fallback;
  const str = String(value);
  if (!allowed.has(str)) {
    throw new Error(`${name} must be one of: ${[...allowed].join(', ')}`);
  }
  return str;
}

export { VALID_AGGREGATIONS };
