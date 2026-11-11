#!/usr/bin/env node
"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("node:readline"));
const brace_1 = require("./brace");
const matcher_1 = require("./matcher");
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
async function main() {
    const args = process.argv.slice(2);
    let dot = false;
    let ignoreCase = false;
    let expandOnly = false;
    const positional = [];
    for (const arg of args) {
        if (arg === "--dot")
            dot = true;
        else if (arg === "-i" || arg === "--ignore-case")
            ignoreCase = true;
        else if (arg === "--expand")
            expandOnly = true;
        else if (arg === "-h" || arg === "--help") {
            console.log(USAGE);
            return 0;
        }
        else if (arg === "--version") {
            console.log(VERSION);
            return 0;
        }
        else if (arg.startsWith("-") && arg !== "-") {
            console.error(`glob-matcher: unknown option ${arg}\n${USAGE}`);
            return 2;
        }
        else {
            positional.push(arg);
        }
    }
    const [pattern, ...paths] = positional;
    if (pattern === undefined) {
        console.error(USAGE);
        return 2;
    }
    if (expandOnly) {
        for (const expanded of (0, brace_1.expandBraces)(pattern))
            console.log(expanded);
        return 0;
    }
    const glob = (0, matcher_1.compile)(pattern, { dot, caseSensitive: !ignoreCase });
    const candidates = paths.length > 0 ? paths : await readStdinLines();
    const matches = candidates.filter((p) => glob.test(p));
    for (const m of matches)
        console.log(m);
    return matches.length > 0 ? 0 : 1;
}
function readStdinLines() {
    return new Promise((resolve) => {
        const lines = [];
        const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
        rl.on("line", (line) => {
            if (line.length > 0)
                lines.push(line);
        });
        rl.on("close", () => resolve(lines));
    });
}
main().then((code) => {
    process.exitCode = code;
});
