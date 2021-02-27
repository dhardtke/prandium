const watcher = Deno.watchFs("../assets");

for await (const event of watcher) {
    console.log(">>>> event", event);
    // Example event: { kind: "create", paths: [ "/home/alice/deno/foo.txt" ] }
}
