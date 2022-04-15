import { path } from "../../deps.ts";

export interface ProcessLike {
  run(): Promise<void>;

  close?(): void;
}

export function call(
  cwd?: string,
  ...cmd: (string | undefined)[]
): ProcessLike {
  let p: Deno.Process;
  return {
    close() {
      p && p.close();
    },
    // deno-lint-ignore require-await
    async run() {
      p = process(cwd, ...cmd)();
    },
  };
}

export function callAndWait(
  cwd?: string,
  ...cmd: (string | undefined)[]
): ProcessLike {
  let p: Deno.Process;
  return {
    close() {
      p && p.close();
    },
    async run() {
      p = process(cwd, ...cmd)();
      await p.status();
    },
  };
}

function process(
  cwd?: string,
  ...cmd: (string | undefined)[]
): () => Deno.Process {
  return () => {
    const actualCmd = cmd.filter((c) => Boolean(c)) as string[];
    try {
      return Deno.run({
        ...cwd ? { cwd: path.resolve(Deno.cwd(), cwd) } : {},
        cmd: actualCmd,
      });
    } catch (e) {
      console.error(`Could not execute ${actualCmd.join(" ")}`);
      throw e;
    }
  };
}

export function isWindows() {
  return Deno.build.os === "windows";
}
