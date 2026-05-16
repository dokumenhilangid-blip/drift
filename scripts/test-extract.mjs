// Smoke test for json-extract logic (inline mirror of TS implementation).
// Run: node scripts/test-extract.mjs

function findBalancedRange(raw, open, close) {
  let start = -1, depth = 0, inString = false, stringChar = '', escaped = false;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (inString) { if (ch === stringChar) inString = false; continue; }
    if (ch === '"' || ch === "'") { inString = true; stringChar = ch; continue; }
    if (ch === open) { if (start === -1) start = i; depth++; }
    else if (ch === close) { depth--; if (depth === 0 && start !== -1) return { start, end: i }; }
  }
  return null;
}
function cleanCommonIssues(s) {
  return s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'").replace(/,(\s*[}\]])/g, '$1');
}
function repairJSON(raw) {
  if (!raw) return null;
  let text = cleanCommonIssues(raw.trim());
  if (!text.startsWith('{') && !text.startsWith('[')) return null;
  try { JSON.parse(text); return text; } catch {}

  const stack = [];
  let inString = false, escaped = false;
  const valueEndPositions = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (inString) { if (ch === '"') { inString = false; valueEndPositions.push(i + 1); } continue; }
    if (ch === '"') { inString = true; continue; }
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') { stack.pop(); valueEndPositions.push(i + 1); }
    else if (ch === ',' || ch === ':') { valueEndPositions.push(i); }
  }

  for (let attempt = valueEndPositions.length - 1; attempt >= 0; attempt--) {
    const pos = valueEndPositions[attempt];
    let candidate = text.slice(0, pos).replace(/,\s*$/, '');
    const s = [];
    let inS = false, esc = false;
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
    let repaired = candidate;
    while (s.length > 0) repaired += s.pop();
    try { JSON.parse(repaired); return repaired; } catch { continue; }
  }
  return null;
}
function tryDirect(raw) { try { return { data: JSON.parse(raw), method: 'direct' }; } catch { return null; } }
function tryFenced(raw) {
  const m = raw.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (!m) return null;
  const inner = m[1].trim();
  try { return { data: JSON.parse(inner), method: 'fenced' }; } catch {
    try { return { data: JSON.parse(cleanCommonIssues(inner)), method: 'fenced' }; } catch {
      const r = repairJSON(inner);
      if (r) try { return { data: JSON.parse(r), method: 'repaired' }; } catch {}
      return null;
    }
  }
}
function tryFirstObject(raw) { const r = findBalancedRange(raw, '{', '}'); if (!r) return null; try { return { data: JSON.parse(raw.slice(r.start, r.end+1)), method: 'first-object' }; } catch { return null; } }
function tryFirstObjectCleaned(raw) { const r = findBalancedRange(raw, '{', '}'); if (!r) return null; try { return { data: JSON.parse(cleanCommonIssues(raw.slice(r.start, r.end+1))), method: 'first-object-cleaned' }; } catch { return null; } }
function tryFirstArray(raw) { const r = findBalancedRange(raw, '[', ']'); if (!r) return null; try { return { data: JSON.parse(raw.slice(r.start, r.end+1)), method: 'first-array' }; } catch { return null; } }
function tryFirstArrayCleaned(raw) { const r = findBalancedRange(raw, '[', ']'); if (!r) return null; try { return { data: JSON.parse(cleanCommonIssues(raw.slice(r.start, r.end+1))), method: 'first-array-cleaned' }; } catch { return null; } }
function tryRepairTruncated(raw) { const r = repairJSON(raw); if (!r) return null; try { return { data: JSON.parse(r), method: 'repaired' }; } catch { return null; } }
function extractJSON(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const stripped = raw.replace(/^\uFEFF/, '').trim();
  for (const fn of [tryDirect, tryFenced, tryFirstObject, tryFirstObjectCleaned, tryFirstArray, tryFirstArrayCleaned, tryRepairTruncated]) {
    const r = fn(stripped); if (r) return r;
  }
  return null;
}

const cases = [
  { name: 'direct',                     input: '{"frame_id":"f1","one_line_mirror":"hi"}',               expect: 'direct' },
  { name: 'fenced json',                input: '```json\n{"frame_id":"f1"}\n```',                        expect: 'fenced' },
  { name: 'fenced no lang',             input: '```\n{"frame_id":"f1"}\n```',                            expect: 'fenced' },
  { name: 'preamble + object',          input: 'Analysis:\n{"frame_id":"f1","x":1}',                    expect: 'first-object' },
  { name: 'trailing comma',             input: '{"a":1,"b":2,}',                                         expect: 'first-object-cleaned' },
  { name: 'smart quotes',               input: '{\u201Cfoo\u201D: \u201Cbar\u201D}',                    expect: 'first-object-cleaned' },
  { name: 'BOM + JSON',                 input: '\uFEFF{"x":1}',                                         expect: 'direct' },
  { name: 'nested brace string',        input: '{"a":"{nested}","b":2}',                                expect: 'direct' },
  { name: 'totally broken',             input: 'not json at all',                                       expect: null },
  { name: 'gemini real fenced',         input: '```json\n{"frame_id":"f1","app_detected":"TikTok","one_line_mirror":"Lo buka jam 23:47."}\n```', expect: 'fenced' },
  // TRUNCATION CASES — the core bug this patch fixes
  { name: 'truncated mid-value',        input: '{"frame_id":"f1","app_detected":"Tik',                  expect: 'repaired' },
  { name: 'truncated mid-array',        input: '{"frame_id":"f1","observable_artifacts":["item1","item2', expect: 'repaired' },
  { name: 'truncated after complete kv',input: '{"frame_id":"f1","app_detected":"TikTok",',             expect: 'repaired' },
  { name: 'truncated nested',           input: '{"a":{"b":1,"c":2',                                     expect: 'repaired' },
  { name: 'production truncation',      input: '{"frame_id":"f1","timestamp_visible":"not_visible","app_detected":', expect: 'repaired' },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const r = extractJSON(c.input);
  const got = r ? r.method : null;
  const ok = got === c.expect;
  const dataStr = r ? JSON.stringify(r.data).slice(0, 60) : 'null';
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(32)} got=${(got||'null').padEnd(22)} data=${dataStr}`);
  if (!ok && r) console.log(`       parsed: ${JSON.stringify(r.data)}`);
  if (ok) pass++; else fail++;
}
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail === 0 ? 0 : 1);
