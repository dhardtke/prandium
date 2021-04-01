export * as sqlite from "https://deno.land/x/sqlite@v2.4.0/mod.ts";
export * as Eta from "https://deno.land/x/eta@v1.12.1/mod.ts";
export * as Dom from "https://deno.land/x/deno_dom@v0.1.7-alpha/deno-dom-wasm.ts";
export * as Oak from "https://deno.land/x/oak@v6.5.0/mod.ts";
export { default as parseIngredient } from "https://cdn.skypack.dev/parse-ingredient@v0.3.0?min";
export * from "https://cdn.skypack.dev/numeric-quantity@v1.0.1?min";

import {
  format,
  formatDuration,
  intervalToDuration,
} from "https://cdn.skypack.dev/date-fns@2.19.0?min";
import { default as locale } from "https://cdn.skypack.dev/date-fns@2.19.0/locale?min";

export const dateFns = {
  format,
  formatDuration,
  intervalToDuration,
  locale,
};

// utils
export * as path from "https://deno.land/std@0.91.0/path/mod.ts";
export * as log from "https://deno.land/std@0.91.0/log/mod.ts";
export { LogRecord } from "https://deno.land/std@0.91.0/log/logger.ts";
export * as Cliffy from "https://deno.land/x/cliffy@v0.18.1/command/mod.ts";
export * as fs from "https://deno.land/std@0.91.0/fs/mod.ts";
export * as Colors from "https://deno.land/std@0.91.0/fmt/colors.ts";

// types
export type {
  AggregateRating as SchemaAggregateRating,
  NutritionInformation as SchemaNutritionInformation,
  Recipe as SchemaRecipe,
  Review as SchemaReview,
} from "https://cdn.skypack.dev/schema-dts@v0.8.2/schema.d.ts?min";
