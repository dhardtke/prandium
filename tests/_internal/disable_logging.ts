import { log } from "../../deps.ts";

export async function disableLogging() {
  await log.setup({
    loggers: {
      default: {
        handlers: [],
      },
    },
  });
}
