/**
 * Brace expansion: turns one pattern containing `{...}` groups into the
 * list of patterns it stands for.
 *
 *   "src/{a,b}.ts"        -> ["src/a.ts", "src/b.ts"]
 *   "{src,lib}/{a,b}.ts"  -> ["src/a.ts", "src/b.ts", "lib/a.ts", "lib/b.ts"]
 *   "file{1..3}.txt"      -> ["file1.txt", "file2.txt", "file3.txt"]
 *   "file{01..03}.txt"    -> ["file01.txt", "file02.txt", "file03.txt"]
 *   "{a..c}"              -> ["a", "b", "c"]
 *   "a{b,c{d,e}}f"         -> ["abf", "acdf", "acef"]  (nested groups work)
 *
 * A `{` with no matching `}`, no top-level comma and no `..` range is left
 * alone and treated as a literal by the parser. `\{`, `\}` and `\,` are
 * escapes and never act as syntax.
 */

/** Expand every brace group in `pattern`, left to right. */
export function expandBraces(pattern: string): string[] {
  const group = findFirstExpandableGroup(pattern);
  if (group === null) return [pattern];

  const out: string[] = [];
  for (const alt of group.alternatives) {
    const combined = pattern.slice(0, group.start) + alt + pattern.slice(group.end + 1);
    out.push(...expandBraces(combined));
  }
  return out;
}

interface BraceGroup {
  start: number;
  end: number; // index of the matching '}'
  alternatives: string[];
}

/** Find the first `{...}` group that actually expands, or null. */
function findFirstExpandableGroup(pattern: string): BraceGroup | null {
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === "\\") {
      i += 2; // skip escaped char
      continue;
    }
    if (ch !== "{") {
      i += 1;
      continue;
    }
    const end = findMatchingClose(pattern, i);
    if (end === -1) return null; // unbalanced '{' — the whole pattern stays literal.
    const body = pattern.slice(i + 1, end);
    const alternatives = expandBody(body);
    if (alternatives !== null) {
      return { start: i, end, alternatives };
    }
    // Not expandable (no comma, no range): treat as literal, keep scanning.
    i += 1;
  }
  return null;
}

/** Index of the `}` matching the `{` at `open`, respecting nesting and escapes. -1 if unbalanced. */
function findMatchingClose(pattern: string, open: number): number {
  let depth = 0;
  for (let i = open; i < pattern.length; i++) {
    const ch = pattern[i];
    if (ch === "\\") {
      i += 1;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Alternatives for one brace body, or null when the body is not a group:
 * no top-level comma and not a `x..y` range.
 */
function expandBody(body: string): string[] | null {
  const parts = splitTopLevel(body);
  if (parts !== null) return parts;
  return expandRange(body);
}

/** Split on commas that sit at nesting depth 0 (escapes respected). Null if there is no such comma. */
function splitTopLevel(body: string): string[] | null {
  const parts: string[] = [];
  let depth = 0;
  let current = "";
  let sawComma = false;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "\\" && i + 1 < body.length) {
      current += ch + body[i + 1];
      i += 1;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") depth -= 1;
    if (ch === "," && depth === 0) {
      parts.push(current);
      current = "";
      sawComma = true;
      continue;
    }
    current += ch;
  }
  if (!sawComma) return null;
  parts.push(current);
  return parts;
}

/**
 * Numeric (`{1..5}`, `{01..03}`, `{-2..2}`, `{1..10..2}`) and
 * alphabetic (`{a..e}`) ranges. Returns null when the body is not a range.
 */
function expandRange(body: string): string[] | null {
  const numeric = /^(-?\d+)\.\.(-?\d+)(?:\.\.(-?\d+))?$/.exec(body);
  if (numeric) {
    const from = parseInt(numeric[1], 10);
    const to = parseInt(numeric[2], 10);
    const step = numeric[3] !== undefined ? Math.abs(parseInt(numeric[3], 10)) || 1 : 1;
    const pad = Math.max(numeric[1].replace(/^-/, "").length, numeric[2].replace(/^-/, "").length);
    const padded = /^-?0\d/.test(numeric[1]) || /^-?0\d/.test(numeric[2]);
    const out: string[] = [];
    const dir = from <= to ? 1 : -1;
    for (let n = from; dir > 0 ? n <= to : n >= to; n += dir * step) {
      const text = String(Math.abs(n));
      const sign = n < 0 ? "-" : "";
      out.push(sign + (padded ? text.padStart(pad, "0") : text));
    }
    return out;
  }

  const alpha = /^([A-Za-z])\.\.([A-Za-z])(?:\.\.(-?\d+))?$/.exec(body);
  if (alpha) {
    const from = alpha[1].charCodeAt(0);
    const to = alpha[2].charCodeAt(0);
    const step = alpha[3] !== undefined ? Math.abs(parseInt(alpha[3], 10)) || 1 : 1;
    const out: string[] = [];
    const dir = from <= to ? 1 : -1;
    for (let c = from; dir > 0 ? c <= to : c >= to; c += dir * step) {
      out.push(String.fromCharCode(c));
    }
    return out;
  }

  return null;
}
