import { assertEquals, assertRejects, path } from "../../deps.ts";
import {
  DefaultSettings,
  readFromDisk,
  Settings,
  SettingsFilename,
} from "../../src/data/settings.ts";
import { getCpuCores } from "../../src/shared/util.ts";

function withTemp(
  test: (tmpDir: string) => Promise<void>,
): () => Promise<void> {
  return async () => {
    const tmpDir = await Deno.makeTempDir();
    try {
      await test(tmpDir);
    } finally {
      await Deno.remove(tmpDir, { recursive: true });
    }
  };
}

Deno.test(
  `readFromDisk should throw`,
  withTemp(async (tmpDir) => {
    const tests: {
      data: string | Partial<Record<keyof Settings, unknown>>;
      message: string;
    }[] = [
      {
        data: "",
        message:
          `Error reading ${SettingsFilename}: SyntaxError: Unexpected end of JSON input`,
      },
      {
        data: { importWorkerCount: "0" },
        message:
          `Error reading ${SettingsFilename}: Error: importWorkerCount must be between 1 and ${getCpuCores()}`,
      },
      {
        data: { importWorkerCount: -1 },
        message:
          `Error reading ${SettingsFilename}: Error: importWorkerCount must be between 1 and ${getCpuCores()}`,
      },
      {
        data: { importWorkerCount: getCpuCores() + 1 },
        message:
          `Error reading ${SettingsFilename}: Error: importWorkerCount must be between 1 and ${getCpuCores()}`,
      },
      {
        data: { userAgent: 42 },
        message:
          `Error reading ${SettingsFilename}: Error: userAgent must be of type string`,
      },
      {
        data: { addHistoryEntryWhenRating: "false" },
        message:
          `Error reading ${SettingsFilename}: Error: addHistoryEntryWhenRating must be of type boolean`,
      },
      {
        // deno-lint-ignore no-explicit-any
        data: { lorem: false } as unknown as any,
        message:
          `Error reading ${SettingsFilename}: Error: Unknown property lorem`,
      },
    ];
    for await (const { data, message } of tests) {
      await Deno.writeTextFile(
        path.join(tmpDir, SettingsFilename),
        typeof data === "string" ? data : JSON.stringify(data),
      );
      await assertRejects(
        async () => {
          await readFromDisk(tmpDir);
        },
        Error,
        message,
      );
    }
  }),
);

Deno.test(
  `readFromDisk should return default settings if settings unavailable`,
  withTemp(async (tmpDir) => {
    assertEquals(await readFromDisk(tmpDir), DefaultSettings);
  }),
);

Deno.test(
  `readFromDisk should merge default with provided settings`,
  withTemp(async (tmpDir) => {
    const data: Partial<Settings> = {
      importWorkerCount: 1,
      minifyHtml: !DefaultSettings.minifyHtml,
      pageSize: DefaultSettings.pageSize + 1,
    };
    await Deno.writeTextFile(
      path.join(tmpDir, SettingsFilename),
      JSON.stringify(data),
    );
    const actual = await readFromDisk(tmpDir);
    assertEquals(actual.importWorkerCount, data.importWorkerCount);
    assertEquals(actual.minifyHtml, data.minifyHtml);
    assertEquals(actual.pageSize, data.pageSize);
    assertEquals(actual.userAgent, DefaultSettings.userAgent);
    assertEquals(
      actual.addHistoryEntryWhenRating,
      DefaultSettings.addHistoryEntryWhenRating,
    );
  }),
);
