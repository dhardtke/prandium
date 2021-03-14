import { path } from "./deps.ts";

export function process(cwd?: string, ...cmd: string[]): () => Deno.Process {
  return () =>
    Deno.run({
      ...cwd ? { cwd: path.resolve(Deno.cwd(), cwd) } : {},
      cmd,
    });
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
