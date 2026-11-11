/**
 * typescript-glob-matcher — dependency-free glob pattern matching.
 *
 *   import { isMatch, match, matchAny, filter, compile } from "typescript-glob-matcher";
 *
 *   isMatch("src/**\/*.ts", "src/util/helpers.ts");          // true
 *   isMatch("*.ts", "src/a.ts");                            // false — '*' never crosses '/'
 *   match("**\/*.{ts,js}", files);                          // brace expansion included
 *   matchAny(["**\/*.ts", "!**\/*.test.ts"], "src/a.test.ts"); // false — last match wins
 */

export { expandBraces } from "./brace";
export {
  compile,
  filter,
  isMatch,
  match,
  matchAny,
  type CompiledGlob,
  type GlobOptions,
} from "./matcher";
export { parsePattern, type ParsedPattern, type Segment, type Unit } from "./parser";
