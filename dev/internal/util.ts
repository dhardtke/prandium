import { path } from "../../deps.ts";

export interface ProcessLike {
    run(): Promise<void>;

    close?(): void;
}

export function call(
    cwd?: string,
    ...cmd: (string | undefined)[]
): ProcessLike {
    let p: Deno.ChildProcess;
    return {
        close() {
            p && p.kill();
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
    let p: Deno.ChildProcess;
    return {
        close() {
            p && p.kill();
        },
        async run() {
            p = process(cwd, ...cmd)();
            await p.status;
        },
    };
}

function process(
    cwd?: string,
    ...cmd: (string | undefined)[]
): () => Deno.ChildProcess {
    return () => {
        const actualCmd = cmd.filter((c) => Boolean(c)) as string[];
        try {
            return new Deno.Command(actualCmd[0], {
                ...cwd ? { cwd: path.resolve(Deno.cwd(), cwd) } : {},
                args: actualCmd.slice(1),
            }).spawn();
        } catch (e) {
            console.error(`Could not execute ${actualCmd.join(" ")}`);
            throw e;
        }
    };
}

export function isWindows() {
    return Deno.build.os === "windows";
}
