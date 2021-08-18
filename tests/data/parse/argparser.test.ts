import { assertEquals, assertThrows } from "../../../deps.ts";
import { Argparser } from "../../../src/data/parse/argparser.ts";

Deno.test(`Argparser.parse should throw if unknown arguments are provided`, () => {
  assertThrows(
    () => new Argparser([]).parse(["--a", "--b"]),
    undefined,
    "",
    `Unknown argument: "--a"`,
  );
  assertThrows(
    () =>
      new Argparser([{ name: "a", type: "string" }]).parse(["--a=bla", "--b"]),
    undefined,
    `Unknown argument: "--b"`,
  );
});

Deno.test(`Argparser.parse should throw if an argument does take a value but none is given`, () => {
  assertThrows(
    () => new Argparser([{ name: "a", type: "string" }]).parse(["--a"]),
    undefined,
    `Argument "a" must have a value`,
  );
});

Deno.test(`Argparser.parse should throw if an argument is not provided in the correct syntax`, () => {
  const args = [
    "-a",
    "-- a",
    "a",
    "--a foo",
    "--ö",
    "--(foo)",
    "--[",
    "--!",
    "--:",
  ];
  for (const arg of args) {
    assertThrows(
      () => new Argparser([{ name: "a", type: "string" }]).parse([arg]),
      undefined,
      `Illegal argument syntax: "${arg}"`,
    );
  }
});

Deno.test(`Argparser.parse should return correct options`, () => {
  assertEquals(new Argparser([{ name: "a", type: "boolean" }]).parse(["--a"]), {
    a: true,
  });
  assertEquals(
    new Argparser([{ name: "a", type: "boolean", default: false }]).parse([]),
    { a: false },
  );
  assertEquals(
    new Argparser([{ name: "a", type: "string" }]).parse(["--a=foo"]),
    { a: "foo" },
  );
  assertEquals(
    new Argparser([{ name: "foo", type: "number" }]).parse(["--foo=42"]),
    { foo: 42 },
  );
  assertEquals(
    new Argparser([{ name: "foo", type: "number" }, {
      name: "bar",
      type: "boolean",
    }]).parse(["--foo=42"]),
    { foo: 42, bar: false },
  );
  assertEquals(
    new Argparser([{ name: "foo", type: "number" }, {
      name: "bar",
      type: "boolean",
    }]).parse(["--bar", "--foo=42"]),
    { foo: 42, bar: true },
  );
});

Deno.test(`Argparser.parse should support booleans both with or without value`, () => {
  assertEquals(
    new Argparser([{ name: "foo", type: "boolean" }]).parse(["--foo=false"]),
    { foo: false },
  );
  assertEquals(
    new Argparser([{ name: "foo", type: "boolean" }]).parse(["--foo=true"]),
    { foo: true },
  );
  assertEquals(
    new Argparser([{ name: "foo", type: "boolean" }]).parse(["--foo"]),
    { foo: true },
  );
});

Deno.test(`Argparser.help`, () => {
  assertEquals(
    new Argparser([
      {
        name: "awesome",
        type: "string",
        description: "My awesome description",
        default: "Awesome",
      },
      {
        name: "foo",
        type: "number",
        default: 42,
      },
    ])
      .help(),
    `  Usage: COMMAND

  Options:
    --awesome=[string] - My awesome description (Default: "Awesome")
    --foo=[number]                              (Default: 42)       `,
  );
});
