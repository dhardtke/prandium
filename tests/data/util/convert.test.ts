import { assertEquals } from "../../../deps-test.ts";
import { pushAll, toCamelCase, toDate, toFloat, toInt } from "../../../src/data/util/convert.ts";

Deno.test("convert", async (t) => {
  await t.step("toInt", async (t) => {
    for (const str of ["", undefined, "undefined", "foo", "bar", "   ", "+"]) {
      await t.step(`Given str="${str}" and default=-1 Then it returns the fallback value -1`, () => {
        assertEquals(toInt(str, -1), -1);
      });
    }

    for (const [str, expected] of [
      ["42", 42],
      ["0", 0],
      ["102341998323241321", 102341998323241321]
    ]) {
      await t.step(`Given str="${str}" and default=-1 Then it returns the parsed value ${expected}`, () => {
        assertEquals(toInt(str as string, -1), expected);
      });
    }
  });

  await t.step("toFloat", async (t) => {
    for (const str of ["", undefined, "undefined", "foo", "bar", "   ", "+"]) {
      await t.step(`Given str="${str}" and default=-1 Then it returns the fallback value -1`, () => {
        assertEquals(toFloat(str, -1), -1);
      });
    }

    for (const [str, expected] of [
      ["42", 42],
      ["0", 0],
      ["102341998323241321", 102341998323241321],
      ["432934294823942.20012", 432934294823942.20012]
    ]) {
      await t.step(`Given str="${str}" and default=-1 Then it returns the parsed value ${expected}`, () => {
        assertEquals(toFloat(str as string, -1), expected);
      });
    }
  });

  await t.step("toDate", async (t) => {
    for (const str of ["", undefined, "abc"]) {
      const fallback = new Date(0);
      await t.step(`Given str="${str}" and _default=${fallback} Then it returns the fallback value`, () => {
        assertEquals(toDate(str, fallback), fallback);
      });
    }

    for (const [str, expected] of [
      ["0", new Date(0)],
      ["1616804763", new Date(1616804763)],
      ["2016-09-12T00:00:00.000Z", new Date("2016-09-12T00:00:00.000Z")]
    ]) {
      await t.step(`Given str="${str}" and _default=undefined Then it returns the parsed value ${expected}`, () => {
        assertEquals(toDate(str as string, undefined), expected);
      });
    }
  });

  await t.step("toCamelCase", () => {
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

  await t.step("pushAll", () => {
    assertEquals(pushAll([1, 2, 3], []), [1, 2, 3]);
    assertEquals(pushAll([], [4, 5, 6]), [4, 5, 6]);
    assertEquals(pushAll([4, 5, 6], [1, 2, 3]), [1, 2, 3, 4, 5, 6]);
  });
});
