import { assertEquals, assertThrows } from "../../deps.ts";
import { handleNotFound, handleServerError, NotFoundError } from "../../src/http/middleware/error.ts";
import { disableLogging } from "../_internal/disable_logging.ts";
import { MockContextBuilder } from "../_internal/mock_context.ts";

// Deno.test(`Parse duration datetime successful`, async () => {
// TODO allow re-use of app in multiple tests
//   const app = new Oak.Application();
//   app.use(handleServerError);
//
//   const router = new Oak.Router();
//   router.get("/", () => {
//     throw new Error("Fail");
//   });
//   app.use(router.routes(), router.allowedMethods());
//
//   app.use(handleNotFound);
//
//   const controller = new AbortController();
//   const { signal } = controller;
//
//   app.addEventListener("listen", async ({ hostname, port, secure }) => {
//     const response = await fetch("http://localhost:8000");
//     await response.text();
//     //console.log(response);
//     assertEquals(true, true);
//     controller.abort();
//   });
//   const listenPromise = app.listen({ port: 8000, signal });
//
//   await listenPromise;
// });

Deno.test(`handleServerError handles errors correctly`, async () => {
  await disableLogging();
  const mockContextBuilder = new MockContextBuilder();

  const next = () => {
    throw new Error("NEXT");
  };
  await handleServerError(mockContextBuilder.ctx, next);
  assertEquals(mockContextBuilder.ctx.response.status, 500);
  //assertEquals(mockContextBuilder.renderCalls, [[ServerErrorTemplate, null]]);
});

Deno.test(`handleServerError does not handle if no error was thrown`, async () => {
  await disableLogging();
  const mockContextBuilder = new MockContextBuilder();

  const origStatusCode = mockContextBuilder.ctx.response.status;
  const next = async () => {
  };
  await handleServerError(mockContextBuilder.ctx, next);
  assertEquals(mockContextBuilder.ctx.response.status, origStatusCode);
  //assertEquals(mockContextBuilder.renderCalls, []);
});

Deno.test(`handleNotFound handles not-found correctly`, async () => {
  await disableLogging();
  //const mockContextBuilder = new MockContextBuilder();

  assertThrows(() => handleNotFound(), NotFoundError);
  // assertEquals(mockContextBuilder.ctx.response.status, 404);
  //assertEquals(mockContextBuilder.renderCalls, [[NotFoundTemplate, null]]);
});
