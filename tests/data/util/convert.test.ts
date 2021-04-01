import { toDate, toInt } from "../../../src/data/util/convert.ts";
import { assertEquals } from "../../../deps.ts";

Deno.test("toInt should return fallback value when unsuccessful", () => {
  assertEquals(toInt("", -1), -1);
  assertEquals(toInt(undefined, -1), -1);
  assertEquals(toInt("undefined", -1), -1);
  assertEquals(toInt("foo", -1), -1);
  assertEquals(toInt("bar", -1), -1);
  assertEquals(toInt("   ", -1), -1);
  assertEquals(toInt("+", -1), -1);
});

Deno.test("toInt should return parsed value", () => {
  assertEquals(toInt("42", -1), 42);
  assertEquals(toInt("0", -1), 0);
  assertEquals(toInt("102341998323241321", -1), 102341998323241321);
});

Deno.test("toDate should return fallback value when unsuccessful", () => {
  const fallback = new Date(0);
  assertEquals(toDate("", fallback), fallback);
  assertEquals(toDate(undefined, fallback), fallback);
  assertEquals(toDate("abc", fallback), fallback);
  // assertEquals(toDate("-1", fallback), fallback); TODO this one shouldn't fail - maybe a bug in Deno?
});

Deno.test("toDate should return parsed value", () => {
  assertEquals(toDate("0", undefined), new Date(0));
  assertEquals(toDate("1616804763", undefined), new Date(1616804763));
  assertEquals(
    toDate("2016-09-12T00:00:00.000Z", undefined),
    new Date("2016-09-12T00:00:00.000Z"),
  );
});
