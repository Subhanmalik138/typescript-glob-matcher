#!/usr/bin/env node
/**
 * glob-matcher CLI — print the paths that match a glob pattern.
 *
 *   glob-matcher "src/**\/*.ts" src/a.ts src/b.js lib/c.ts
 *   find . -type f | glob-matcher "**\/*.{ts,js}"
 *   glob-matcher --dot "**\/*" .hidden visible
 *   glob-matcher --expand "src/{a,b}.ts"
 *
 * Exit code 0 when at least one path matches, 1 when none do.
 */
export {};
