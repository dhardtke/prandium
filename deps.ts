export * as sqlite from "https://deno.land/x/sqlite@v2.4.0/mod.ts";
export * as Eta from "https://deno.land/x/eta@v1.12.1/mod.ts";
export * as Dom from "https://deno.land/x/deno_dom@v0.1.7-alpha/deno-dom-wasm.ts";
export * as Oak from "https://deno.land/x/oak@v7.2.0/mod.ts";
export { HttpServerStd } from "https://deno.land/x/oak@v7.2.0/http_server_std.ts";
export { default as parseIngredient } from "https://cdn.skypack.dev/parse-ingredient@v0.3.0?min";
export * from "https://cdn.skypack.dev/numeric-quantity@v1.0.1?min";
export * as Zod from "https://cdn.skypack.dev/zod@3.0.0-alpha.33?dts";

import {
  format,
  formatDuration,
  intervalToDuration,
  formatDistanceToNow
} from "https://cdn.skypack.dev/date-fns@v2.19.0?min";
import { default as en } from "https://cdn.skypack.dev/date-fns@v2.19.0/locale/en-US?min";
import { default as de } from "https://cdn.skypack.dev/date-fns@v2.19.0/locale/de?min";

export const dateFns = {
  format,
  formatDuration,
  intervalToDuration,
  formatDistanceToNow,
  locale: {
    en,
    de,
  },
};

// utils
export * as path from "https://deno.land/std@0.93.0/path/mod.ts";
export * as log from "https://deno.land/std@0.93.0/log/mod.ts";
export { LogRecord } from "https://deno.land/std@0.93.0/log/logger.ts";
export * as Cliffy from "https://deno.land/x/cliffy@v0.18.1/command/mod.ts";
export * as fs from "https://deno.land/std@0.93.0/fs/mod.ts";
export * as Colors from "https://deno.land/std@0.93.0/fmt/colors.ts";
export { default as slash } from "https://deno.land/x/slash@v0.3.0/mod.ts";

// types
export type {
  AggregateRating as SchemaAggregateRating,
  NutritionInformation as SchemaNutritionInformation,
  Recipe as SchemaRecipe,
  Review as SchemaReview,
} from "https://cdn.skypack.dev/schema-dts@v0.8.2/schema.d.ts?min";

// tests
export {
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "https://deno.land/std@0.93.0/testing/asserts.ts";
