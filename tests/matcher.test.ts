import { compile, filter, isMatch, match, matchAny } from "../src/matcher";

describe("literals and *", () => {
  it("matches exact paths", () => {
    expect(isMatch("src/a.ts", "src/a.ts")).toBe(true);
    expect(isMatch("src/a.ts", "src/b.ts")).toBe(false);
  });

  it("matches * within a single segment only", () => {
    expect(isMatch("*.ts", "a.ts")).toBe(true);
    expect(isMatch("*.ts", "src/a.ts")).toBe(false);
    expect(isMatch("src/*.ts", "src/a.ts")).toBe(true);
    expect(isMatch("src/*.ts", "src/deep/a.ts")).toBe(false);
  });

  it("matches * across the middle of a segment, with backtracking", () => {
    expect(isMatch("a*b", "aXXb")).toBe(true);
    expect(isMatch("a*b", "ab")).toBe(true);
    expect(isMatch("a*b", "aXXc")).toBe(false);
    expect(isMatch("*a*a", "banana")).toBe(true);
    expect(isMatch("*.min.js", "app.min.js")).toBe(true);
  });

  it("matches ? as exactly one non-separator character", () => {
    expect(isMatch("a?c", "abc")).toBe(true);
    expect(isMatch("a?c", "ac")).toBe(false);
    expect(isMatch("a?c", "abbc")).toBe(false);
    expect(isMatch("?.ts", "a.ts")).toBe(true);
  });

  it("matches empty segments and leading ./ the same way", () => {
    expect(isMatch("src/a.ts", "./src/a.ts")).toBe(true);
    expect(isMatch("src/a.ts", "src//a.ts")).toBe(true);
  });
});

describe("** globstar", () => {
  it("matches zero or more directories", () => {
    expect(isMatch("src/**/*.ts", "src/a.ts")).toBe(true);
    expect(isMatch("src/**/*.ts", "src/deep/nested/a.ts")).toBe(true);
    expect(isMatch("src/**/*.ts", "src/a.js")).toBe(false);
  });

  it("matches everything when alone", () => {
    expect(isMatch("**", "a/b/c.ts")).toBe(true);
    expect(isMatch("**", "a.ts")).toBe(true);
  });

  it("matches a trailing **", () => {
    expect(isMatch("src/**", "src/a/b/c")).toBe(true);
    expect(isMatch("src/**", "src")).toBe(true);
  });

  it("matches a leading **", () => {
    expect(isMatch("**/*.test.ts", "a.test.ts")).toBe(true);
    expect(isMatch("**/*.test.ts", "deep/a.test.ts")).toBe(true);
  });

  it("matches ** in the middle", () => {
    expect(isMatch("a/**/b", "a/b")).toBe(true);
    expect(isMatch("a/**/b", "a/x/y/b")).toBe(true);
    expect(isMatch("a/**/b", "a/x/y/c")).toBe(false);
  });

  it("does not let ** swallow dot-directories by default", () => {
    expect(isMatch("src/**", "src/.hidden/a")).toBe(false);
    expect(isMatch("src/**", "src/.hidden/a", { dot: true })).toBe(true);
  });

  it("treats ** inside a segment as a plain *", () => {
    expect(isMatch("a**", "abc")).toBe(true);
    expect(isMatch("a**", "a/b")).toBe(false);
  });
});

describe("character classes", () => {
  it("matches listed characters", () => {
    expect(isMatch("file[123].txt", "file2.txt")).toBe(true);
    expect(isMatch("file[123].txt", "file4.txt")).toBe(false);
  });

  it("matches ranges", () => {
    expect(isMatch("[a-z].ts", "q.ts")).toBe(true);
    expect(isMatch("[a-z].ts", "5.ts")).toBe(false);
    expect(isMatch("[0-9][0-9].log", "42.log")).toBe(true);
  });

  it("negates with ! and ^", () => {
    expect(isMatch("[!0-9].ts", "a.ts")).toBe(true);
    expect(isMatch("[!0-9].ts", "5.ts")).toBe(false);
    expect(isMatch("[^a-z].ts", "5.ts")).toBe(true);
  });

  it("treats ] first as a literal member", () => {
    expect(isMatch("[]a].ts", "].ts")).toBe(true);
    expect(isMatch("[]a].ts", "a.ts")).toBe(true);
    expect(isMatch("[]a].ts", "b.ts")).toBe(false);
  });

  it("supports escapes and a literal hyphen at the end", () => {
    expect(isMatch("[\\-a].ts", "-.ts")).toBe(true);
    expect(isMatch("[a-].ts", "-.ts")).toBe(true);
    expect(isMatch("[a-].ts", "a.ts")).toBe(true);
  });

  it("treats an unterminated [ as a literal", () => {
    expect(isMatch("a[.ts", "a[.ts")).toBe(true);
  });
});

describe("braces in patterns", () => {
  it("expands alternations before matching", () => {
    expect(isMatch("**/*.{ts,js}", "src/a.js")).toBe(true);
    expect(isMatch("**/*.{ts,js}", "src/a.css")).toBe(false);
  });

  it("expands numeric ranges", () => {
    expect(isMatch("v{1..3}.txt", "v2.txt")).toBe(true);
    expect(isMatch("v{1..3}.txt", "v4.txt")).toBe(false);
  });
});

describe("escapes", () => {
  it("treats escaped wildcards as literals", () => {
    expect(isMatch("a\\*b", "a*b")).toBe(true);
    expect(isMatch("a\\*b", "aXXb")).toBe(false);
    expect(isMatch("a\\?b", "a?b")).toBe(true);
  });

  it("treats an escaped leading ! as a literal, not negation", () => {
    const glob = compile("\\!important.txt");
    expect(glob.negated).toBe(false);
    expect(glob.test("!important.txt")).toBe(true);
  });
});

describe("dotfiles", () => {
  it("does not match dotfiles with a leading wildcard by default", () => {
    expect(isMatch("*", ".hidden")).toBe(false);
    expect(isMatch("**/*", ".hidden")).toBe(false);
    expect(isMatch("src/*", "src/.env")).toBe(false);
  });

  it("matches dotfiles when dot: true", () => {
    expect(isMatch("*", ".hidden", { dot: true })).toBe(true);
    expect(isMatch("src/*", "src/.env", { dot: true })).toBe(true);
  });

  it("matches dotfiles when the pattern names the dot literally", () => {
    expect(isMatch(".*", ".hidden")).toBe(true);
    expect(isMatch(".env", ".env")).toBe(true);
    expect(isMatch("src/.*", "src/.env")).toBe(true);
  });
});

describe("case sensitivity", () => {
  it("is case-sensitive by default", () => {
    expect(isMatch("*.TS", "a.ts")).toBe(false);
    expect(isMatch("Src/*.ts", "src/a.ts")).toBe(false);
  });

  it("folds case with caseSensitive: false, including classes", () => {
    expect(isMatch("*.TS", "a.ts", { caseSensitive: false })).toBe(true);
    expect(isMatch("[A-Z].ts", "q.ts", { caseSensitive: false })).toBe(true);
    expect(isMatch("SRC/*.TS", "src/a.ts", { caseSensitive: false })).toBe(true);
  });
});

describe("negation and pattern lists", () => {
  it("marks a leading ! pattern as negated", () => {
    const glob = compile("!*.test.ts");
    expect(glob.negated).toBe(true);
    expect(glob.test("a.test.ts")).toBe(true);
  });

  it("applies last-match-wins in matchAny", () => {
    expect(matchAny(["**/*.ts", "!**/*.test.ts"], "src/a.ts")).toBe(true);
    expect(matchAny(["**/*.ts", "!**/*.test.ts"], "src/a.test.ts")).toBe(false);
    expect(matchAny(["!**/*.test.ts", "**/*.ts"], "src/a.test.ts")).toBe(true);
    expect(matchAny(["**/*.ts"], "src/a.css")).toBe(false);
  });

  it("filters a list with negation", () => {
    const files = ["src/a.ts", "src/a.test.ts", "src/b.js", "lib/c.ts"];
    expect(filter(["**/*.ts", "!**/*.test.ts"], files)).toEqual(["src/a.ts", "lib/c.ts"]);
  });

  it("returns matches in input order with match()", () => {
    expect(match("**/*.ts", ["b.ts", "a.js", "a.ts"])).toEqual(["b.ts", "a.ts"]);
  });
});

describe("compile reuse", () => {
  it("compiles once and tests many paths", () => {
    const glob = compile("src/**/*.ts");
    expect(glob.test("src/a.ts")).toBe(true);
    expect(glob.test("src/deep/b.ts")).toBe(true);
    expect(glob.test("lib/c.ts")).toBe(false);
  });
});
