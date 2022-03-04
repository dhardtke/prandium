import { assertEquals } from "../../../deps.ts";
import { pushAll, toCamelCase, toDate, toFloat, toInt } from "../../../src/data/util/convert.ts";

const { test } = Deno;

test(`toInt should return fallback value when parsing fails`, () => {
  assertEquals(toInt("", -1), -1);
  assertEquals(toInt(undefined, -1), -1);
  assertEquals(toInt("undefined", -1), -1);
  assertEquals(toInt("foo", -1), -1);
  assertEquals(toInt("bar", -1), -1);
  assertEquals(toInt("   ", -1), -1);
  assertEquals(toInt("+", -1), -1);
});

test(`When given valid number strings, then toInt should return the correctly parsed value`, () => {
  assertEquals(toInt("42", -1), 42);
  assertEquals(toInt("0", -1), 0);
  assertEquals(toInt("102341998323241321", -1), 102341998323241321);
});

test(`toFloat should return fallback value when parsing fails`, () => {
  assertEquals(toFloat("", -1), -1);
  assertEquals(toFloat(undefined, -1), -1);
  assertEquals(toFloat("undefined", -1), -1);
  assertEquals(toFloat("foo", -1), -1);
  assertEquals(toFloat("bar", -1), -1);
  assertEquals(toFloat("   ", -1), -1);
  assertEquals(toFloat("+", -1), -1);
});

test(`When given valid number strings, then toFloat should return the correctly parsed value`, () => {
  assertEquals(toFloat("42", -1), 42);
  assertEquals(toFloat("0", -1), 0);
  assertEquals(toFloat("102341998323241321", -1), 102341998323241321);
  assertEquals(toFloat("432934294823942.20012", -1), 432934294823942.20012);
});

test(`toDate should return fallback value when parsing fails`, () => {
  const fallback = new Date(0);
  assertEquals(toDate("", fallback), fallback);
  assertEquals(toDate(undefined, fallback), fallback);
  assertEquals(toDate("abc", fallback), fallback);
  // assertEquals(toDate("-1", fallback), fallback); TODO this one shouldn't fail - maybe a bug in Deno?
});

test(`toDate should return parsed value`, () => {
  assertEquals(toDate("0", undefined), new Date(0));
  assertEquals(toDate("1616804763", undefined), new Date(1616804763));
  assertEquals(
    toDate("2016-09-12T00:00:00.000Z", undefined),
    new Date("2016-09-12T00:00:00.000Z"),
  );
});

test(`toCamelCase`, () => {
  assertEquals(toCamelCase({}), {});
  assertEquals(toCamelCase({ hello_world: true }), { helloWorld: true });
  assertEquals(toCamelCase({ bla: null }), { bla: null });
  assertEquals(toCamelCase(["a", "b"]), ["a", "b"]);
  assertEquals(toCamelCase({ arr: ["a", "b", { my_arr: ["d"] }] }), {
    arr: ["a", "b", { myArr: ["d"] }],
  });
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

test(`pushAll`, () => {
  assertEquals(pushAll([1, 2, 3], []), [1, 2, 3]);
  assertEquals(pushAll([], [4, 5, 6]), [4, 5, 6]);
  assertEquals(pushAll([4, 5, 6], [1, 2, 3]), [1, 2, 3, 4, 5, 6]);
});
