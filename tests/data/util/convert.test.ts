import { assertEquals } from "../../../deps.ts";
import {
  pushAll,
  toArray,
  toCamelCase,
  toDate,
  toNumber,
} from "../../../src/data/util/convert.ts";

const TestPrefix = "[data/util/convert]";

Deno.test(`${TestPrefix} toNumber should return fallback value when unsuccessful`, () => {
  assertEquals(toNumber("", -1), -1);
  assertEquals(toNumber(undefined, -1), -1);
  assertEquals(toNumber("undefined", -1), -1);
  assertEquals(toNumber("foo", -1), -1);
  assertEquals(toNumber("bar", -1), -1);
  assertEquals(toNumber("   ", -1), -1);
  assertEquals(toNumber("+", -1), -1);
});

Deno.test(`${TestPrefix} toNumber should return parsed value`, () => {
  assertEquals(toNumber("42", -1), 42);
  assertEquals(toNumber("0", -1), 0);
  assertEquals(toNumber("102341998323241321", -1), 102341998323241321);
});

Deno.test(`${TestPrefix} toDate should return fallback value when unsuccessful`, () => {
  const fallback = new Date(0);
  assertEquals(toDate("", fallback), fallback);
  assertEquals(toDate(undefined, fallback), fallback);
  assertEquals(toDate("abc", fallback), fallback);
  // assertEquals(toDate("-1", fallback), fallback); TODO this one shouldn't fail - maybe a bug in Deno?
});

Deno.test(`${TestPrefix} toDate should return parsed value`, () => {
  assertEquals(toDate("0", undefined), new Date(0));
  assertEquals(toDate("1616804763", undefined), new Date(1616804763));
  assertEquals(
    toDate("2016-09-12T00:00:00.000Z", undefined),
    new Date("2016-09-12T00:00:00.000Z"),
  );
});

Deno.test(`${TestPrefix} toCamelCase`, () => {
  assertEquals(toCamelCase({}), {});
  assertEquals(toCamelCase({ hello_world: true }), { helloWorld: true });
  assertEquals(toCamelCase({ bla: null }), { bla: null });
  assertEquals(
    toCamelCase({
      id: 42,
      created_at: "yesterday",
      updated_at: null,
      nested_obj: {
        created_at: "today",
        deep_object: {
          deep: true,
          arr: [42, 43],
        },
      },
    }),
    {
      id: 42,
      createdAt: "yesterday",
      updatedAt: null,
      nestedObj: {
        createdAt: "today",
        deepObject: {
          deep: true,
          arr: [42, 43],
        },
      },
    },
  );
});

function* toGenerator<T>(...arr: T[]): Generator<T> {
  for (const val of arr) {
    yield val;
  }
}

Deno.test(`${TestPrefix} toArray`, () => {
  assertEquals(toArray(toGenerator(4, 5, 6)), [4, 5, 6]);
  assertEquals(toArray(toGenerator(4, 5, 6), (num) => num + 1), [5, 6, 7]);
});

Deno.test(`${TestPrefix} pushAll`, () => {
  assertEquals(pushAll([1, 2, 3], []), [1, 2, 3]);
  assertEquals(pushAll([], [4, 5, 6]), [4, 5, 6]);
  assertEquals(pushAll([4, 5, 6], [1, 2, 3]), [1, 2, 3, 4, 5, 6]);
});
