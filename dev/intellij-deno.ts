// This script is a workaround to allow using IntelliJ Run Configurations to execute "deno task" commands.
// It is required because IntelliJ does not allow the "File" argument to be empty.
const p = new Deno.Command(Deno.execPath(), {
    args: Deno.args,
});
await p.spawn().status;
