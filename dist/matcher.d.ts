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
import { type ParsedPattern } from "./parser";
export interface GlobOptions {
    /** Allow wildcards to match leading-dot segments (default false). */
    dot?: boolean;
    /** Match case-sensitively (default true). */
    caseSensitive?: boolean;
}
export interface CompiledGlob {
    /** The pattern as given to `compile`, before brace expansion. */
    pattern: string;
    /** True when the pattern started with an unescaped `!`. */
    negated: boolean;
    /** Every brace-expanded variant, parsed and ready to test. */
    variants: ParsedPattern[];
    test(path: string): boolean;
}
/**
 * Compile a pattern once and test many paths against it. A leading
 * unescaped `!` marks the pattern as negated (see `matchAny`).
 */
export declare function compile(pattern: string, options?: GlobOptions): CompiledGlob;
/** True when `path` matches `pattern`. */
export declare function isMatch(pattern: string, path: string, options?: GlobOptions): boolean;
/** All `paths` that match `pattern`, in input order. */
export declare function match(pattern: string, paths: string[], options?: GlobOptions): string[];
/**
 * True when `path` is selected by the ordered pattern list: the last
 * pattern that matches wins, so a negated pattern un-selects a path.
 * False when no pattern matches at all.
 */
export declare function matchAny(patterns: string[], path: string, options?: GlobOptions): boolean;
/** All `paths` selected by the ordered pattern list (see `matchAny`). */
export declare function filter(patterns: string[], paths: string[], options?: GlobOptions): string[];
