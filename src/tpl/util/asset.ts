import { existsSync } from "node:fs";
import path from "node:path";
import { root } from "../../shared/util.ts";

const AssetsDir = root("assets");
const CompiledAssetsDir = root("out/assets");

export const asset = {
    ifExists: (checked: string, _default: string): string => {
        if ([AssetsDir, CompiledAssetsDir].some((dir) => existsSync(path.join(dir, checked)))) {
            return checked;
        }
        return _default;
    },
};
