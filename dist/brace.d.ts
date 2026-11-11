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
export declare function expandBraces(pattern: string): string[];
