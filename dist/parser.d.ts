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
export type Unit = {
    type: "literal";
    value: string;
} | {
    type: "star";
} | {
    type: "question";
} | {
    type: "class";
    negated: boolean;
    ranges: Array<readonly [string, string]>;
    singles: string[];
};
export type Segment = {
    type: "globstar";
} | {
    type: "segment";
    units: Unit[];
};
export interface ParsedPattern {
    /** Original pattern text, before brace expansion. */
    original: string;
    segments: Segment[];
}
export declare function parsePattern(pattern: string, foldCase: boolean): ParsedPattern;
