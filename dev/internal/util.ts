import path from "node:path";

export interface ProcessLike {
    run(): Promise<void>;

    close?(): void;
}

export function call(cwd?: string, ...cmd: (string | undefined)[]): ProcessLike {
    let p: Bun.Subprocess | undefined;
    return {
        close() {
            p?.kill();
        },
        run() {
            p = spawn(cwd, ...cmd);
            return Promise.resolve();
        },
    };
}

export function callAndWait(cwd?: string, ...cmd: (string | undefined)[]): ProcessLike {
    let p: Bun.Subprocess | undefined;
    return {
        close() {
            p?.kill();
        },
        async run() {
            p = spawn(cwd, ...cmd);
            const exitCode = await p.exited;
            if (exitCode !== 0) {
                throw new Error(`${cmd.filter(Boolean).join(" ")} exited with code ${exitCode}`);
            }
        },
    };
}

function spawn(cwd?: string, ...cmd: (string | undefined)[]): Bun.Subprocess {
    const actualCmd = cmd.filter((c) => Boolean(c)) as string[];
    try {
        return Bun.spawn(actualCmd, {
            ...(cwd ? { cwd: path.resolve(process.cwd(), cwd) } : {}),
            stdio: ["inherit", "inherit", "inherit"],
        });
    } catch (e) {
        console.error(`Could not execute ${actualCmd.join(" ")}`);
        throw e;
    }
}

export function isWindows() {
    return process.platform === "win32";
}
