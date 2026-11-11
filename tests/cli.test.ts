import { execFile } from "node:child_process";
import * as path from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const cli = path.join(__dirname, "..", "dist", "cli.js");

interface RunResult {
  code: number;
  stdout: string;
  stderr: string;
}

async function runCli(args: string[], stdin = ""): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = execFile("node", [cli, ...args], (error, stdout, stderr) => {
      resolve({ code: error ? (error as { code?: number }).code ?? 1 : 0, stdout, stderr });
    });
    child.stdin?.end(stdin);
  });
}

describe("CLI", () => {
  it("prints matching paths and exits 0", async () => {
    const r = await runCli(["src/**/*.ts", "src/a.ts", "src/b.js", "src/deep/c.ts"]);
    expect(r.code).toBe(0);
    expect(r.stdout).toBe("src/a.ts\nsrc/deep/c.ts\n");
  });

  it("exits 1 when nothing matches", async () => {
    const r = await runCli(["*.ts", "a.js"]);
    expect(r.code).toBe(1);
    expect(r.stdout).toBe("");
  });

  it("reads paths from stdin when none are given", async () => {
    const r = await runCli(["**/*.ts"], "src/a.ts\nsrc/b.js\nlib/c.ts\n");
    expect(r.code).toBe(0);
    expect(r.stdout).toBe("src/a.ts\nlib/c.ts\n");
  });

  it("honours --dot", async () => {
    const without = await runCli(["*", ".hidden"]);
    expect(without.code).toBe(1);
    const withDot = await runCli(["--dot", "*", ".hidden"]);
    expect(withDot.code).toBe(0);
    expect(withDot.stdout).toBe(".hidden\n");
  });

  it("honours --ignore-case", async () => {
    const r = await runCli(["--ignore-case", "*.TS", "a.ts"]);
    expect(r.code).toBe(0);
  });

  it("expands braces with --expand", async () => {
    const r = await runCli(["--expand", "src/{a,b}.ts"]);
    expect(r.code).toBe(0);
    expect(r.stdout).toBe("src/a.ts\nsrc/b.ts\n");
  });

  it("exits 2 with no pattern", async () => {
    const r = await runCli([]);
    expect(r.code).toBe(2);
    expect(r.stderr).toContain("Usage:");
  });

  it("exits 2 on an unknown option", async () => {
    const r = await runCli(["--nope", "*.ts"]);
    expect(r.code).toBe(2);
  });
});
