/**
 * Hardened JSON extraction from LLM text output.
 *
 * Handles: markdown fences, prose preamble, trailing commas, smart quotes,
 * BOM, and TRUNCATED JSON (auto-repair by closing open braces/brackets).
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
  | 'first-array-cleaned'
  | 'repaired';

const STRATEGIES: Array<(raw: string) => ExtractResult | null> = [
  tryDirect,
  tryFenced,
  tryFirstObject,
  tryFirstObjectCleaned,
  tryFirstArray,
  tryFirstArrayCleaned,
  tryRepairTruncated,
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

/**
 * Detect if the raw text looks like truncated JSON (starts with { or [ but
 * doesn't have a balanced closing).
 */
export function isTruncatedJSON(raw: string): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return false;
  // Count unescaped braces/brackets outside strings
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (inString) { if (ch === '"') inString = false; continue; }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{' || ch === '[') depth++;
    if (ch === '}' || ch === ']') depth--;
  }
  return depth > 0;
}

function tryDirect(raw: string): ExtractResult | null {
  try {
    return { data: JSON.parse(raw), method: 'direct' };
  } catch {
    return null;
  }
}

function tryFenced(raw: string): ExtractResult | null {
  const match = raw.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (!match) return null;
  const inner = match[1].trim();
  try {
    return { data: JSON.parse(inner), method: 'fenced' };
  } catch {
    try {
      return { data: JSON.parse(cleanCommonIssues(inner)), method: 'fenced' };
    } catch {
      // Try repair on fenced content too
      const repaired = repairJSON(inner);
      if (repaired) {
        try {
          return { data: JSON.parse(repaired), method: 'repaired' };
        } catch { /* fall through */ }
      }
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
 * Last resort: attempt to repair truncated JSON by closing open structures.
 */
function tryRepairTruncated(raw: string): ExtractResult | null {
  const repaired = repairJSON(raw);
  if (!repaired) return null;
  try {
    return { data: JSON.parse(repaired), method: 'repaired' };
  } catch {
    return null;
  }
}

/**
 * Auto-repair truncated JSON:
 * 1. Find the last position where a complete key:value exists
 * 2. Strip incomplete trailing content
 * 3. Close all open braces/brackets/strings
 */
export function repairJSON(raw: string): string | null {
  if (!raw) return null;
  let text = cleanCommonIssues(raw.trim());

  // Must start with { or [
  if (!text.startsWith('{') && !text.startsWith('[')) return null;

  // If it already parses, no repair needed
  try { JSON.parse(text); return text; } catch { /* proceed */ }

  // Strategy: progressively trim from the end until we find something parseable
  // after closing remaining brackets. This is brute but reliable for LLM output.

  // First, figure out the bracket stack assuming all complete strings are closed.
  // We'll try multiple truncation points.

  // Approach: find last complete JSON value boundary, then close remaining structure.
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  // Positions after a complete value (after closing quote, number end, true/false/null, } or ])
  const valueEndPositions: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (inString) {
      if (ch === '"') {
        inString = false;
        valueEndPositions.push(i + 1);
      }
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') {
      stack.pop();
      valueEndPositions.push(i + 1);
    } else if (ch === ',' || ch === ':') {
      // Position after separator — indicates the previous token was complete.
      valueEndPositions.push(i);
    }
  }

  // Try from the last value-end position backwards
  for (let attempt = valueEndPositions.length - 1; attempt >= 0; attempt--) {
    const pos = valueEndPositions[attempt];
    let candidate = text.slice(0, pos);

    // Remove trailing comma
    candidate = candidate.replace(/,\s*$/, '');

    // Recompute stack for this candidate
    const s: string[] = [];
    let inS = false;
    let esc = false;
    for (let i = 0; i < candidate.length; i++) {
      const c = candidate[i];
      if (esc) { esc = false; continue; }
      if (c === '\\' && inS) { esc = true; continue; }
      if (inS) { if (c === '"') inS = false; continue; }
      if (c === '"') { inS = true; continue; }
      if (c === '{') s.push('}');
      else if (c === '[') s.push(']');
      else if (c === '}' || c === ']') s.pop();
    }

    // Close remaining
    let repaired = candidate;
    while (s.length > 0) repaired += s.pop();

    try {
      JSON.parse(repaired);
      return repaired;
    } catch {
      continue;
    }
  }

  return null;
}

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
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (inString) { if (ch === stringChar) inString = false; continue; }
    if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
    if (ch === open) { if (start === -1) start = i; depth++; }
    else if (ch === close) {
      depth--;
      if (depth === 0 && start !== -1) return { start, end: i };
    }
  }
  return null;
}

function cleanCommonIssues(s: string): string {
  return s
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,(\s*[}\]])/g, '$1');
}
