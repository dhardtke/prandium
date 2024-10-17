// @formatter:off
export * as sqlite from "https://deno.land/x/sqlite@v3.9.1/mod.ts";
export * as Oak from "https://deno.land/x/oak@v17.1.0/mod.ts";
// workaround for https://github.com/dhardtke/prandium/actions/runs/11377150775/job/31650809264
import * as oakBuildWorkaround from "npm:path-to-regexp@6.2.1";
console.assert(!!oakBuildWorkaround);
export * as needle from "jsr:@needle-di/core";
import { Container } from "jsr:@needle-di/core";
export const container = new Container();

export type { ComponentChildren, VNode } from "https://esm.sh/preact@10.24.3?pin=v67";
export { render } from "https://esm.sh/preact-render-to-string@6.5.11?pin=v66";
export { default as classNames } from "https://cdn.esm.sh/classnames@2.5.1?pin=v66";

// utils
export * as path from "jsr:@std/path";
export * as log from "jsr:@std/log";
export * as fs from "jsr:@std/fs";
export * as Colors from "jsr:@std/fmt/colors";
export { sprintf } from "jsr:@std/fmt/printf";
export * as flags from "jsr:@std/flags";
export * as semVer from "jsr:@std/semver";
export { pooledMap } from "jsr:@std/async";

// types
export type {
    AggregateRating as SchemaAggregateRating,
    NutritionInformation as SchemaNutritionInformation,
    Recipe as SchemaRecipe,
    Review as SchemaReview,
} from "https://esm.sh/schema-dts@1.1.2?pin=v66";
// @formatter:on
