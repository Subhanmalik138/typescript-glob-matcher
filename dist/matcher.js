"use strict";
/**
 * Matching engine. No regular expressions anywhere: a segment is matched by
 * the classic two-pointer wildcard algorithm (star backtracking), and `**`
 * segments are resolved by memoized recursion over the segment lists.
 *
 * Path handling: paths are split on `/`; empty segments and lone `.`
 * segments are dropped, so `./src/a.ts`, `src//a.ts` and `src/a.ts` all
 * match the same patterns. A leading `/` is ignored the same way.
 *
 * Dotfile rule (like shells): a wildcard at the start of a segment never
 * matches a leading `.` unless `dot: true` or the pattern segment itself
 * starts with a literal `.`.
 *
 * Negation follows gitignore semantics in `matchAny` / `filter`: patterns
 * are applied in order and the last pattern that matches a path wins, so
 * `["**\/*.ts", "!**\/*.test.ts"]` keeps every `.ts` file except tests.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.compile = compile;
exports.isMatch = isMatch;
exports.match = match;
exports.matchAny = matchAny;
exports.filter = filter;
const brace_1 = require("./brace");
const parser_1 = require("./parser");
const DEFAULT_OPTIONS = { dot: false, caseSensitive: true };
function resolveOptions(options = {}) {
    return { ...DEFAULT_OPTIONS, ...options };
}
/**
 * Compile a pattern once and test many paths against it. A leading
 * unescaped `!` marks the pattern as negated (see `matchAny`).
 */
function compile(pattern, options = {}) {
    const opts = resolveOptions(options);
    let negated = false;
    let body = pattern;
    if (body.startsWith("!")) {
        negated = true;
        body = body.slice(1);
    }
    const foldCase = !opts.caseSensitive;
    const variants = (0, brace_1.expandBraces)(body).map((expanded) => (0, parser_1.parsePattern)(expanded, foldCase));
    return {
        pattern,
        negated,
        variants,
        test(path) {
            const pathSegments = splitPath(path);
            return variants.some((variant) => matchSegments(variant.segments, pathSegments, opts));
        },
    };
}
/** True when `path` matches `pattern`. */
function isMatch(pattern, path, options = {}) {
    return compile(pattern, options).test(path);
}
/** All `paths` that match `pattern`, in input order. */
function match(pattern, paths, options = {}) {
    const glob = compile(pattern, options);
    return paths.filter((p) => glob.test(p));
}
/**
 * True when `path` is selected by the ordered pattern list: the last
 * pattern that matches wins, so a negated pattern un-selects a path.
 * False when no pattern matches at all.
 */
function matchAny(patterns, path, options = {}) {
    const opts = resolveOptions(options);
    const compiled = patterns.map((p) => compile(p, opts));
    let selected = false;
    for (const glob of compiled) {
        if (glob.test(path))
            selected = !glob.negated;
    }
    return selected;
}
/** All `paths` selected by the ordered pattern list (see `matchAny`). */
function filter(patterns, paths, options = {}) {
    return paths.filter((p) => matchAny(patterns, p, options));
}
// ---------------------------------------------------------------------------
// Segment-list matching
// ---------------------------------------------------------------------------
function splitPath(path) {
    return path.split("/").filter((seg) => seg !== "" && seg !== ".");
}
function matchSegments(patternSegments, pathSegments, opts) {
    const memo = new Map();
    const rec = (pi, si) => {
        const key = `${pi},${si}`;
        const cached = memo.get(key);
        if (cached !== undefined)
            return cached;
        let result;
        if (pi === patternSegments.length) {
            result = si === pathSegments.length;
        }
        else {
            const seg = patternSegments[pi];
            if (seg.type === "globstar") {
                // `**` matches zero segments, or one more segment and stays in place.
                result =
                    rec(pi + 1, si) ||
                        (si < pathSegments.length && globstarMayConsume(pathSegments[si], opts) && rec(pi, si + 1));
            }
            else if (si < pathSegments.length) {
                result = matchSegment(seg.units, pathSegments[si], opts) && rec(pi + 1, si + 1);
            }
            else {
                result = false;
            }
        }
        memo.set(key, result);
        return result;
    };
    return rec(0, 0);
}
/** A `**` may not swallow a dot-segment unless `dot: true` (`.` and `..` are fine). */
function globstarMayConsume(segment, opts) {
    return opts.dot || segment === "." || segment === ".." || !segment.startsWith(".");
}
// ---------------------------------------------------------------------------
// Single-segment matching (classic star-backtracking, O(n) space)
// ---------------------------------------------------------------------------
function matchSegment(units, text, opts) {
    if (!opts.dot && text.startsWith(".") && !segmentStartsWithLiteralDot(units)) {
        return false;
    }
    const fold = !opts.caseSensitive;
    const haystack = fold ? text.toLowerCase() : text;
    let p = 0; // unit index
    let s = 0; // char index into haystack
    let star = -1; // unit index of the last '*' seen
    let starMatch = 0; // haystack index where that '*' started matching
    while (s < haystack.length) {
        const unit = p < units.length ? units[p] : undefined;
        if (unit !== undefined && unit.type === "star") {
            star = p;
            starMatch = s;
            p += 1;
        }
        else if (unit !== undefined && unitMatches(unit, haystack[s])) {
            p += 1;
            s += 1;
        }
        else if (star !== -1) {
            // Backtrack: let the last '*' swallow one more character.
            p = star + 1;
            starMatch += 1;
            s = starMatch;
        }
        else {
            return false;
        }
    }
    while (p < units.length && units[p].type === "star")
        p += 1;
    return p === units.length;
}
function segmentStartsWithLiteralDot(units) {
    return units.length > 0 && units[0].type === "literal" && units[0].value === ".";
}
function unitMatches(unit, ch) {
    switch (unit.type) {
        case "literal":
            return unit.value === ch;
        case "question":
            return true; // ch is never '/' here: segments are split on '/' first
        case "class":
            return testClass(unit, ch);
    }
}
function testClass(unit, ch) {
    let hit = unit.singles.includes(ch) ||
        unit.ranges.some(([lo, hi]) => ch >= lo && ch <= hi);
    return unit.negated ? !hit : hit;
}
