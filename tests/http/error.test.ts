import { assertEquals, assertThrows } from "../../deps.ts";
import { handleNotFound, handleServerError, NotFoundError } from "../../src/http/middleware/error.ts";
import { disableLogging } from "../_internal/disable_logging.ts";
import { MockContextBuilder } from "../_internal/mock_context.ts";

Deno.test("error", async (t) => {
  await t.step("handleServerError handles errors correctly", async () => {
    await disableLogging();
    const mockContextBuilder = new MockContextBuilder();

    const next = () => {
      throw new Error("NEXT");
    };
    await handleServerError(mockContextBuilder.ctx, next);
    assertEquals(mockContextBuilder.ctx.response.status, 500);
    // assertEquals(mockContextBuilder.renderCalls, [[ServerErrorTemplate, null]]);
  });

  await t.step("handleServerError does not handle if no error was thrown", async () => {
    await disableLogging();
    const mockContextBuilder = new MockContextBuilder();

    const origStatusCode = mockContextBuilder.ctx.response.status;
    const next = async () => {
    };
    await handleServerError(mockContextBuilder.ctx, next);
    assertEquals(mockContextBuilder.ctx.response.status, origStatusCode);
    // assertEquals(mockContextBuilder.renderCalls, []);
  });

  await t.step("handleNotFound handles not-found correctly", async () => {
    await disableLogging();
    //const mockContextBuilder = new MockContextBuilder();

    assertThrows(() => handleNotFound(), NotFoundError);
    // assertEquals(mockContextBuilder.ctx.response.status, 404);
    // assertEquals(mockContextBuilder.renderCalls, [[NotFoundTemplate, null]]);
  });
});
