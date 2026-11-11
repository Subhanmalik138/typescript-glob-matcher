# typescript-glob-matcher

A fast, dependency-free glob pattern matcher for TypeScript, with a CLI.

```ts
import { isMatch, match, matchAny } from "typescript-glob-matcher";

isMatch("src/**/*.ts", "src/util/helpers.ts"); // true
isMatch("*.ts", "src/a.ts");                   // false — '*' never crosses '/'
match("**/*.{ts,js}", files);                  // brace expansion included

// gitignore-style lists: the last matching pattern wins
matchAny(["**/*.ts", "!**/*.test.ts"], "src/a.test.ts"); // false
```

## Problem

Every build tool, file watcher, and linter needs to answer "does this path match
that pattern?" — and the usual answers are either a regex hack that gets `**`
wrong, or a heavy dependency that pulls in a dozen transitive packages. This
library is the small, correct core: one pattern language, no dependencies, and
semantics that match what developers expect from shells and `.gitignore`.

## Pattern syntax

| Syntax | Meaning |
| ------ | ------- |
| `*` | Any run of characters except `/` |
| `**` | As a whole segment: zero or more path segments |
| `?` | Exactly one character except `/` |
| `[abc]`, `[a-z]` | Character class / range |
| `[!a-z]`, `[^a-z]` | Negated class |
| `{a,b}`, `{1..5}`, `{a..e}` | Brace alternation and ranges (nestable) |
| `\*`, `\?`, `\[`, `\{` | Escaped literals |
| `!pattern` | Negated pattern (used by `matchAny` / `filter`) |

Notes:

- `**` is only special as a complete segment: `a**` behaves like `a*`.
- Paths are normalised before matching: `./src/a.ts`, `src//a.ts` and `src/a.ts`
  are the same path.
- Dotfiles follow shell rules: a wildcard at the start of a segment never
  matches a leading `.` unless `dot: true`, or the pattern names the dot
  literally (`.*` matches `.hidden`).
- An unterminated `[` or `{` is treated as a literal character, never an error.

## API

```ts
isMatch(pattern, path, options?)          // boolean
match(pattern, paths, options?)           // string[] — matches, in input order
matchAny(patterns, path, options?)        // boolean — last matching pattern wins
filter(patterns, paths, options?)         // string[] — gitignore-style selection
compile(pattern, options?)                // CompiledGlob — parse once, test many paths
expandBraces(pattern)                     // string[] — the expanded patterns

interface GlobOptions {
  dot?: boolean;           // match leading-dot segments (default false)
  caseSensitive?: boolean; // default true
}
```

`compile()` is the hot path for repeated use: it parses the pattern once and
`test(path)` reuses the compiled form.

## CLI

```sh
npm install -g typescript-glob-matcher
glob-matcher "src/**/*.ts" src/a.ts src/b.js lib/c.ts
find . -type f | glob-matcher "**/*.{ts,js}"
glob-matcher --dot "**/*" .hidden visible
glob-matcher --expand "src/{a,b}.ts"   # prints the expanded patterns
```

Exit code is `0` when at least one path matches, `1` when none do, `2` on a
usage error. With no paths on the command line, paths are read from stdin,
one per line.

## Design decisions

1. **No regular expressions.** A segment is matched by the classic
   two-pointer wildcard algorithm (star backtracking, O(n) space), and `**`
   is resolved by memoized recursion over the segment lists. This keeps
   matching predictable — no regex catastrophic backtracking on hostile
   patterns — and the whole engine is easy to audit in ~200 lines.
2. **Braces expand before parsing.** `{a,b}` and `{1..5}` produce plain
   patterns, so the matcher itself never needs alternation logic; one
   expansion step serves both the API and the CLI (`--expand`).
3. **Case folding at parse time.** When `caseSensitive: false`, literals and
   class members are lower-cased once during parsing and each input character
   is folded once during matching, instead of re-lowering the pattern on
   every test.
4. **Last-match-wins negation.** `matchAny` / `filter` apply patterns in
   order, so `["**/*.ts", "!**/*.test.ts"]` reads exactly like a `.gitignore`
   file instead of needing a separate exclude list.

## Run it

```sh
npm install
npm test        # builds, then runs the jest suite
npm run build   # tsc -> dist/
npm start       # demo: match src/**/*.ts against the sample paths
```

## Tech stack

- TypeScript (strict mode), compiled with `tsc` to CommonJS
- Jest + ts-jest for tests, Node's built-in `readline` for the CLI's stdin mode
- Zero runtime dependencies
