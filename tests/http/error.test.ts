import { beforeAll, describe, expect, test } from "bun:test";
import { errorHandler, notFound } from "../../src/http/middleware/error.ts";
import { toAppRequest } from "../../src/http/server/request.ts";
import { NotFoundError } from "../../src/shared/errors.ts";
import { disableLogging } from "../_internal/disable-logging.ts";

describe("error", () => {
    const req = toAppRequest(new Request("http://localhost/"));

    beforeAll(() => {
        disableLogging();
    });

    test("errorHandler renders the 500 page if an error is thrown", async () => {
        const response = await errorHandler(req, () => {
            throw new Error("NEXT");
        });

        expect(response.status).toEqual(500);
        expect(response.headers.get("Content-Type")).toEqual("text/html; charset=utf-8");
        expect(await response.text()).toContain("<!DOCTYPE html>");
    });

    test("errorHandler renders the 404 page if a NotFoundError is thrown", async () => {
        const response = await errorHandler(req, () => {
            throw new NotFoundError();
        });

        expect(response.status).toEqual(404);
        expect(await response.text()).toContain("<!DOCTYPE html>");
    });

    test("errorHandler does not handle if no error was thrown", async () => {
        const original = new Response("ok", { status: 201 });

        const response = await errorHandler(req, () => Promise.resolve(original));

        expect(response).toBe(original);
    });

    test("notFound throws a NotFoundError", () => {
        expect(() => notFound(req)).toThrow(NotFoundError);
    });
});
