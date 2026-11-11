"use strict";
/**
 * Pattern parser: turns one brace-expanded pattern string into segments.
 *
 * A pattern is split on `/` into segments. A segment is either:
 *   - `**` (globstar): matches zero or more whole path segments, or
 *   - a list of per-character units matched against one path segment:
 *       literal char | `*` (any run except `/`) | `?` (one char except `/`)
 *       | character class `[...]` (ranges, `!`/`^` negation, escapes)
 *
 * `**` is only special as a complete segment; `a**` behaves like `a*`.
 * An unterminated `[` is treated as a literal `[`. `\` escapes the next
 * character. When `foldCase` is set, literals and class members are stored
 * lower-cased so matching can compare case-insensitively.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePattern = parsePattern;
function parsePattern(pattern, foldCase) {
    const segments = pattern
        .split("/")
        .filter((seg) => seg !== "" && seg !== ".")
        .map((seg) => parseSegment(seg, foldCase));
    return { original: pattern, segments };
}
function parseSegment(segment, foldCase) {
    if (segment === "**")
        return { type: "globstar" };
    const units = [];
    let i = 0;
    while (i < segment.length) {
        const ch = segment[i];
        if (ch === "\\" && i + 1 < segment.length) {
            units.push({ type: "literal", value: fold(segment[i + 1], foldCase) });
            i += 2;
            continue;
        }
        if (ch === "*") {
            // Collapse a run of stars into one; '**' inside a segment is just '*'.
            while (segment[i] === "*")
                i += 1;
            units.push({ type: "star" });
            continue;
        }
        if (ch === "?") {
            units.push({ type: "question" });
            i += 1;
            continue;
        }
        if (ch === "[") {
            const parsed = parseClass(segment, i, foldCase);
            if (parsed !== null) {
                units.push(parsed.unit);
                i = parsed.nextIndex;
                continue;
            }
            // Unterminated '[' — literal.
        }
        units.push({ type: "literal", value: fold(ch, foldCase) });
        i += 1;
    }
    return { type: "segment", units };
}
function fold(ch, foldCase) {
    return foldCase ? ch.toLowerCase() : ch;
}
/**
 * Parse a `[...]` class starting at `segment[start] === '['`.
 * Returns the class unit and the index just past the closing `]`, or null
 * when the class is unterminated.
 */
function parseClass(segment, start, foldCase) {
    let i = start + 1;
    let negated = false;
    if (segment[i] === "!" || segment[i] === "^") {
        negated = true;
        i += 1;
    }
    const ranges = [];
    const singles = [];
    // A ']' right after '[' (or '[!') is a literal member, not the close.
    let first = true;
    while (i < segment.length) {
        const ch = segment[i];
        if (ch === "]" && !first) {
            return { unit: { type: "class", negated, ranges, singles }, nextIndex: i + 1 };
        }
        first = false;
        const value = readClassChar(segment, i);
        if (value === null)
            return null; // trailing '\' — treat whole class as unterminated
        i = value.nextIndex;
        // Range: '<lo>-<hi>' — but a '-' at the end is a literal.
        if (segment[i] === "-" && i + 1 < segment.length && segment[i + 1] !== "]") {
            const hi = readClassChar(segment, i + 1);
            if (hi === null)
                return null;
            ranges.push([fold(value.char, foldCase), fold(hi.char, foldCase)]);
            i = hi.nextIndex;
        }
        else {
            singles.push(fold(value.char, foldCase));
        }
    }
    return null; // no closing ']'
}
/** Read one class member, honouring `\` escapes. Null on a trailing backslash. */
function readClassChar(segment, i) {
    if (segment[i] === "\\") {
        if (i + 1 >= segment.length)
            return null;
        return { char: segment[i + 1], nextIndex: i + 2 };
    }
    return { char: segment[i], nextIndex: i + 1 };
}
