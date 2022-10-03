// @formatter:off
export * as sqlite from "https://deno.land/x/sqlite@v3.5.0/mod.ts";
export * as Oak from "https://deno.land/x/oak@v11.1.0/mod.ts";
export * as Reflect from "https://esm.sh/@abraham/reflection@0.10.0?pin=v66&no-check";
export { container, injectable, singleton, inject, Lifecycle, registry, type Disposable } from "https://esm.sh/tsyringe@4.7.0?pin=v66";

export type { ComponentChildren, VNode } from "https://esm.sh/preact@10.11.0?pin=v67";
export { render } from "https://esm.sh/preact-render-to-string@5.2.4?pin=v66";
// export { default as classNames } from "https://cdn.esm.sh/classnames@2.3.2?pin=v66";
export { default as classNames } from "http://cdn.esm.sh/v66/classnames@2.3.2/es2022/classnames.js";
// FIXME this is a nasty workaround to ensure Deno adds jsx-runtime files to lock.json - remove maybe once https://github.com/denoland/deno/issues/14723 is fixed
import "https://esm.sh/preact@10.11.0?pin=v67/jsx-runtime";

// utils
export * as path from "https://deno.land/std@0.158.0/path/mod.ts";
export * as log from "https://deno.land/std@0.158.0/log/mod.ts";
export { LogRecord } from "https://deno.land/std@0.158.0/log/logger.ts";
export * as fs from "https://deno.land/std@0.158.0/fs/mod.ts";
export * as Colors from "https://deno.land/std@0.158.0/fmt/colors.ts";
export { sprintf } from "https://deno.land/std@0.158.0/fmt/printf.ts";
export { default as slash } from "https://deno.land/x/slash@v0.3.0/mod.ts";
export * as flags from "https://deno.land/std@0.158.0/flags/mod.ts";
export { satisfies } from "https://deno.land/std@0.158.0/semver/mod.ts";
export { pooledMap } from "https://deno.land/std@0.158.0/async/mod.ts";

// types
export type {
    AggregateRating as SchemaAggregateRating,
    NutritionInformation as SchemaNutritionInformation,
    Recipe as SchemaRecipe,
    Review as SchemaReview,
} from "https://esm.sh/schema-dts@1.1.0?pin=v66";
// @formatter:on
