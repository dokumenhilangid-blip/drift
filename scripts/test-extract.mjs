// Inline smoke test for json-extract logic. Avoids TS imports.
// Mirrors lib/json-extract.ts exactly. Run: node scripts/test-extract.mjs

function findBalancedRange(raw, open, close) {
  let start = -1, depth = 0, inString = false, stringChar = '', escaped = false;
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

function cleanCommonIssues(s) {
  return s
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,(\s*[}\]])/g, '$1');
}

function tryDirect(raw) {
  try { return { data: JSON.parse(raw), method: 'direct' }; } catch { return null; }
}
function tryFenced(raw) {
  const match = raw.match(/```(?:json|JSON)?\s*([\s\S]*?)```/);
  if (!match) return null;
  const inner = match[1].trim();
  try { return { data: JSON.parse(inner), method: 'fenced' }; }
  catch {
    try { return { data: JSON.parse(cleanCommonIssues(inner)), method: 'fenced' }; }
    catch { return null; }
  }
}
function tryFirstObject(raw) {
  const r = findBalancedRange(raw, '{', '}');
  if (!r) return null;
  try { return { data: JSON.parse(raw.slice(r.start, r.end + 1)), method: 'first-object' }; } catch { return null; }
}
function tryFirstObjectCleaned(raw) {
  const r = findBalancedRange(raw, '{', '}');
  if (!r) return null;
  try { return { data: JSON.parse(cleanCommonIssues(raw.slice(r.start, r.end + 1))), method: 'first-object-cleaned' }; } catch { return null; }
}
function tryFirstArray(raw) {
  const r = findBalancedRange(raw, '[', ']');
  if (!r) return null;
  try { return { data: JSON.parse(raw.slice(r.start, r.end + 1)), method: 'first-array' }; } catch { return null; }
}
function tryFirstArrayCleaned(raw) {
  const r = findBalancedRange(raw, '[', ']');
  if (!r) return null;
  try { return { data: JSON.parse(cleanCommonIssues(raw.slice(r.start, r.end + 1))), method: 'first-array-cleaned' }; } catch { return null; }
}

function extractJSON(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const stripped = raw.replace(/^\uFEFF/, '').trim();
  for (const fn of [tryDirect, tryFenced, tryFirstObject, tryFirstObjectCleaned, tryFirstArray, tryFirstArrayCleaned]) {
    const r = fn(stripped);
    if (r) return r;
  }
  return null;
}

const cases = [
  { name: 'direct',                    input: '{"frame_id":"f1","one_line_mirror":"hi"}',                  expect: 'direct' },
  { name: 'fenced json',               input: '```json\n{"frame_id":"f1","one_line_mirror":"hi"}\n```',    expect: 'fenced' },
  { name: 'fenced no lang',            input: '```\n{"frame_id":"f1"}\n```',                              expect: 'fenced' },
  { name: 'preamble + object',         input: 'Here is the analysis:\n{"frame_id":"f1","x":1}',           expect: 'first-object' },
  { name: 'preamble + object + suffix',input: 'Sure! {"a":1} that\'s it.',                                expect: 'first-object' },
  { name: 'trailing comma',            input: '{"a":1,"b":2,}',                                            expect: 'first-object-cleaned' },
  { name: 'smart quotes',              input: '{\u201Cfoo\u201D: \u201Cbar\u201D}',                       expect: 'first-object-cleaned' },
  { name: 'BOM + JSON',                input: '\uFEFF{"x":1}',                                            expect: 'direct' },
  { name: 'nested string with braces', input: '{"a":"{nested}","b":2}',                                   expect: 'direct' },
  { name: 'totally broken',            input: 'not json at all',                                          expect: null },
  { name: 'gemini real-world',         input: '```json\n{\n  "frame_id": "f1",\n  "app_detected": "TikTok",\n  "one_line_mirror": "Lo buka TikTok jam 23:47, batre 12%."\n}\n```',  expect: 'fenced' },
];

let pass = 0, fail = 0;
for (const c of cases) {
  const r = extractJSON(c.input);
  const got = r ? r.method : null;
  const ok = got === c.expect;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name.padEnd(32)}  got=${got || 'null'}  want=${c.expect || 'null'}`);
  if (ok) pass++; else fail++;
}
console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail === 0 ? 0 : 1);
