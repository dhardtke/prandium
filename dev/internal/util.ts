import { path } from "../../deps.ts";

export function process(
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

export async function map<In, Out>(
  promise: Promise<In>,
  mapper: (input: In) => Out,
): Promise<Out> {
  return mapper(await promise);
}

export function processAsync(
  cwd: string,
  ...cmd: string[]
): () => Promise<unknown> {
  return () => process(cwd, ...cmd)().status();
}
