// This script is a workaround to allow using IntelliJ Run Configurations to execute "deno task" commands.
// It is required because IntelliJ does not allow the "File" argument to be empty.
const p = Deno.run({
  cmd: ["deno", ...Deno.args],
});
await p.status();
