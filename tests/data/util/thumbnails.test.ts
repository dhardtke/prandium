import { assertEquals } from "../../../deps.ts";
import { downloadThumbnail } from "../../../src/data/util/thumbnails.ts";
import { withTemp } from "../../_internal/with-temp.function.ts";

Deno.test(`downloadThumbnail should use UTF8 filenames`, async () => {
  const mockedFetchFn = () =>
    Promise.resolve(
      { arrayBuffer: () => new ArrayBuffer(0) },
    );

  withTemp(async (tmpDir) => {
    const expectedFilename = "Gemüsereis.jpg";
    const actualFilename = await downloadThumbnail(
      tmpDir,
      "",
      `https://example.org/${expectedFilename}`,
      mockedFetchFn,
    );
    assertEquals(actualFilename, expectedFilename);
  });
});
