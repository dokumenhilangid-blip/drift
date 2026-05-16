/**
 * Hardened JSON extraction from LLM text output.
 *
 * Gemini sometimes wraps JSON in markdown fences, prepends prose, includes
 * trailing commas, smart quotes, BOM, or other artifacts. This module tries
 * multiple strategies in order and returns the first one that parses.
 */

export interface ExtractResult {
  data: unknown;
  method: ExtractMethod;
}

export type ExtractMethod =
  | 'direct'
  | 'fenced'
  | 'first-object'
  | 'first-object-cleaned'
  | 'first-array'
  | 'first-array-cleaned';

const STRATEGIES: Array<(raw: string) => ExtractResult | null> = [
  tryDirect,
  tryFenced,
  tryFirstObject,
  tryFirstObjectCleaned,
  tryFirstArray,
  tryFirstArrayCleaned,
];

export function extractJSON(raw: string): ExtractResult | null {
  if (!raw || typeof raw !== 'string') return null;
  const stripped = raw.replace(/^\uFEFF/, '').trim();
  for (const strategy of STRATEGIES) {
    const result = strategy(stripped);
    if (result) return result;
  }
  return null;
}

function tryDirect(raw: string): ExtractResult | null {
  try {
    return { data: JSON.parse(raw), method: 'direct' };
  } catch {
    return null;
  }
}

function tryFenced(raw: string): ExtractResult | null {
  // ```json ... ``` or ``` ... ```
  const match = raw.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (!match) return null;
  const inner = match[1].trim();
  try {
    return { data: JSON.parse(inner), method: 'fenced' };
  } catch {
    try {
      return { data: JSON.parse(cleanCommonIssues(inner)), method: 'fenced' };
    } catch {
      return null;
    }
  }
}

function tryFirstObject(raw: string): ExtractResult | null {
  const range = findBalancedRange(raw, '{', '}');
  if (!range) return null;
  const slice = raw.slice(range.start, range.end + 1);
  try {
    return { data: JSON.parse(slice), method: 'first-object' };
  } catch {
    return null;
  }
}

function tryFirstObjectCleaned(raw: string): ExtractResult | null {
  const range = findBalancedRange(raw, '{', '}');
  if (!range) return null;
  const slice = cleanCommonIssues(raw.slice(range.start, range.end + 1));
  try {
    return { data: JSON.parse(slice), method: 'first-object-cleaned' };
  } catch {
    return null;
  }
}

function tryFirstArray(raw: string): ExtractResult | null {
  const range = findBalancedRange(raw, '[', ']');
  if (!range) return null;
  const slice = raw.slice(range.start, range.end + 1);
  try {
    return { data: JSON.parse(slice), method: 'first-array' };
  } catch {
    return null;
  }
}

function tryFirstArrayCleaned(raw: string): ExtractResult | null {
  const range = findBalancedRange(raw, '[', ']');
  if (!range) return null;
  const slice = cleanCommonIssues(raw.slice(range.start, range.end + 1));
  try {
    return { data: JSON.parse(slice), method: 'first-array-cleaned' };
  } catch {
    return null;
  }
}

/**
 * Walk character-by-character to find the first balanced {...} or [...] range,
 * respecting string boundaries and escapes. Returns indices of the outermost
 * matching pair, or null if no balanced range exists.
 */
function findBalancedRange(
  raw: string,
  open: string,
  close: string
): { start: number; end: number } | null {
  let start = -1;
  let depth = 0;
  let inString = false;
  let stringChar = '';
  let escaped = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (inString) {
      if (ch === stringChar) inString = false;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inString = true;
      stringChar = ch;
      continue;
    }

    if (ch === open) {
      if (start === -1) start = i;
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0 && start !== -1) {
        return { start, end: i };
      }
    }
  }
  return null;
}

/**
 * Common LLM JSON quirks: trailing commas, smart quotes.
 */
function cleanCommonIssues(s: string): string {
  return s
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,(\s*[}\]])/g, '$1');
}
