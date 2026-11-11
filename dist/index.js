"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePattern = exports.matchAny = exports.match = exports.isMatch = exports.filter = exports.compile = exports.expandBraces = void 0;
var brace_1 = require("./brace");
Object.defineProperty(exports, "expandBraces", { enumerable: true, get: function () { return brace_1.expandBraces; } });
var matcher_1 = require("./matcher");
Object.defineProperty(exports, "compile", { enumerable: true, get: function () { return matcher_1.compile; } });
Object.defineProperty(exports, "filter", { enumerable: true, get: function () { return matcher_1.filter; } });
Object.defineProperty(exports, "isMatch", { enumerable: true, get: function () { return matcher_1.isMatch; } });
Object.defineProperty(exports, "match", { enumerable: true, get: function () { return matcher_1.match; } });
Object.defineProperty(exports, "matchAny", { enumerable: true, get: function () { return matcher_1.matchAny; } });
var parser_1 = require("./parser");
Object.defineProperty(exports, "parsePattern", { enumerable: true, get: function () { return parser_1.parsePattern; } });
