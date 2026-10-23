import { expect, test } from "bun:test";
import { downloadThumbnail } from "../../../src/data/util/thumbnails.ts";
import { withTemp } from "../../_internal/with-temp.function.ts";

test(
    `downloadThumbnail uses UTF8 filenames`,
    withTemp(async (tmpDir) => {
        const mockedFetchFn = (_input: RequestInfo, _userAgent: string, _init?: RequestInit): Promise<Response> =>
            Promise.resolve({ arrayBuffer: () => new ArrayBuffer(0) } as unknown as Response);

        const expectedFilename = "Gemüsereis.jpg";
        const actualFilename = await downloadThumbnail(tmpDir, "", `https://example.org/${expectedFilename}`, mockedFetchFn);
        expect(actualFilename).toEqual(expectedFilename);
    }),
);
