import { expandBraces } from "../src/brace";

describe("expandBraces", () => {
  it("returns the pattern unchanged when there are no braces", () => {
    expect(expandBraces("src/*.ts")).toEqual(["src/*.ts"]);
  });

  it("expands a single alternation", () => {
    expect(expandBraces("src/{a,b}.ts")).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("expands multiple groups as a cartesian product", () => {
    expect(expandBraces("{src,lib}/{a,b}.ts")).toEqual([
      "src/a.ts",
      "src/b.ts",
      "lib/a.ts",
      "lib/b.ts",
    ]);
  });

  it("expands nested groups", () => {
    expect(expandBraces("a{b,c{d,e}}f")).toEqual(["abf", "acdf", "acef"]);
  });

  it("does not split on commas inside nested groups", () => {
    expect(expandBraces("{a,{b,c}}")).toEqual(["a", "b", "c"]);
  });

  it("expands numeric ranges", () => {
    expect(expandBraces("file{1..3}.txt")).toEqual(["file1.txt", "file2.txt", "file3.txt"]);
  });

  it("expands descending numeric ranges", () => {
    expect(expandBraces("{3..1}")).toEqual(["3", "2", "1"]);
  });

  it("expands numeric ranges with a step", () => {
    expect(expandBraces("{0..6..2}")).toEqual(["0", "2", "4", "6"]);
  });

  it("preserves zero padding in numeric ranges", () => {
    expect(expandBraces("file{01..03}.txt")).toEqual(["file01.txt", "file02.txt", "file03.txt"]);
  });

  it("expands alphabetic ranges", () => {
    expect(expandBraces("{a..c}")).toEqual(["a", "b", "c"]);
  });

  it("leaves unbalanced braces literal", () => {
    expect(expandBraces("src/{a.ts")).toEqual(["src/{a.ts"]);
  });

  it("leaves a brace group without a comma or range literal", () => {
    expect(expandBraces("{abc}.ts")).toEqual(["{abc}.ts"]);
  });

  it("does not treat escaped braces as groups", () => {
    expect(expandBraces("a\\{b,c\\}")).toEqual(["a\\{b,c\\}"]);
  });

  it("supports empty alternatives", () => {
    expect(expandBraces("file{,.min}.js")).toEqual(["file.js", "file.min.js"]);
  });
});
