/**
 * Starts the development environment: rebuilds the assets and the icons on changes and restarts the server (in debug mode) on changes.
 * Additional arguments are passed to the server, e.g. `bun run dev --port=9000`.
 */
const processes: Bun.Subprocess[] = [
    ["bun", "dev/build.ts", "assets", "--watch"],
    ["bun", "--watch", "dev/build-icons.ts"],
    ["bun", "--watch", "src/main.ts", "--debug", ...process.argv.slice(2)],
].map((cmd) => Bun.spawn(cmd, { stdio: ["inherit", "inherit", "inherit"] }));

function stopAll() {
    for (const p of processes) {
        p.kill();
    }
}

process.on("SIGINT", stopAll);
process.on("SIGTERM", stopAll);

// if any of the processes exits, stop the others as well
await Promise.race(processes.map((p) => p.exited));
stopAll();
await Promise.all(processes.map((p) => p.exited));
