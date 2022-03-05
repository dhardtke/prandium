// @formatter:off
export * as sqlite from "https://deno.land/x/sqlite@v3.2.1/mod.ts";
import * as Reflect from "https://esm.sh/@abraham/reflection@0.9.1?pin=v66&no-check";
console.assert(Boolean(Reflect));
export { container, injectable, singleton, inject, Lifecycle } from "https://esm.sh/tsyringe@4.4.0?pin=v66";

// utils
export * as path from "https://deno.land/std@0.127.0/path/mod.ts";
export * as log from "https://deno.land/std@0.127.0/log/mod.ts";
export { LogRecord } from "https://deno.land/std@0.127.0/log/logger.ts";
export * as fs from "https://deno.land/std@0.127.0/fs/mod.ts";
export * as Colors from "https://deno.land/std@0.127.0/fmt/colors.ts";
export { sprintf } from "https://deno.land/std@0.127.0/fmt/printf.ts";
export { default as slash } from "https://deno.land/x/slash@v0.3.0/mod.ts";

// types
export type {
  AggregateRating as SchemaAggregateRating,
  NutritionInformation as SchemaNutritionInformation,
  Recipe as SchemaRecipe,
  Review as SchemaReview,
} from "https://esm.sh/schema-dts@1.0.0?pin=v66";

// tests
export {
  assertEquals,
  assertNotEquals,
  assertThrows,
  assertRejects,
  unreachable,
} from "https://deno.land/std@0.127.0/testing/asserts.ts";
// @formatter:on
