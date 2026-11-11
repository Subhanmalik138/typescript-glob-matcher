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

import * as readline from "node:readline";
import { expandBraces } from "./brace";
import { compile } from "./matcher";

const VERSION = "1.0.0";

const USAGE = `Usage: glob-matcher [options] <pattern> [path ...]

Print the paths that match <pattern>, one per line.
With no paths on the command line, paths are read from stdin, one per line.

Options:
  --dot             allow wildcards to match leading-dot files
  -i, --ignore-case match case-insensitively
  --expand          print the brace-expanded patterns and exit
  -h, --help        show this help
  --version         show the version

Pattern syntax: * (within a segment), ** (across segments), ?,
[abc] / [a-z] / [!a-z] character classes, {a,b} and {1..5} braces,
\\ escapes, and a leading ! negates the pattern (see matchAny).`;

async function main(): Promise<number> {
  const args = process.argv.slice(2);
  let dot = false;
  let ignoreCase = false;
  let expandOnly = false;
  const positional: string[] = [];

  for (const arg of args) {
    if (arg === "--dot") dot = true;
    else if (arg === "-i" || arg === "--ignore-case") ignoreCase = true;
    else if (arg === "--expand") expandOnly = true;
    else if (arg === "-h" || arg === "--help") {
      console.log(USAGE);
      return 0;
    } else if (arg === "--version") {
      console.log(VERSION);
      return 0;
    } else if (arg.startsWith("-") && arg !== "-") {
      console.error(`glob-matcher: unknown option ${arg}\n${USAGE}`);
      return 2;
    } else {
      positional.push(arg);
    }
  }

  const [pattern, ...paths] = positional;
  if (pattern === undefined) {
    console.error(USAGE);
    return 2;
  }

  if (expandOnly) {
    for (const expanded of expandBraces(pattern)) console.log(expanded);
    return 0;
  }

  const glob = compile(pattern, { dot, caseSensitive: !ignoreCase });
  const candidates = paths.length > 0 ? paths : await readStdinLines();
  const matches = candidates.filter((p) => glob.test(p));
  for (const m of matches) console.log(m);
  return matches.length > 0 ? 0 : 1;
}

function readStdinLines(): Promise<string[]> {
  return new Promise((resolve) => {
    const lines: string[] = [];
    const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
    rl.on("line", (line) => {
      if (line.length > 0) lines.push(line);
    });
    rl.on("close", () => resolve(lines));
  });
}

main().then((code) => {
  process.exitCode = code;
});
