import {log, path} from "../../deps.ts";
import {Helper} from "./helpers.ts";

const SCRIPT_DIR = path.dirname(path.fromFileUrl(import.meta.url));

export class IconHelper implements Helper {
    private static ICON_DIR = path.resolve(SCRIPT_DIR, "..", "..", "..", "assets", "node_modules", "bootstrap-icons", "icons");

    public static INSTANCE: IconHelper = new IconHelper();

    private cache: Map<String, any> = new Map();

    private constructor() {
    }

    /**
     * Reads the SVG contents for an icon with the given name.
     * @param name the icon name, e.g. "arrow-right-short"
     */
    public i = (name: string): string | undefined => {
        if (this.cache.has(name)) {
            return this.cache.get(name);
        }
        const _path = IconHelper.buildPath(name);
        if (path.dirname(_path) !== IconHelper.ICON_DIR) {
            throw new Error(`Detected attempt to read outside of icon dir: ${_path}`);
        }
        try {
            const svg = Deno.readTextFileSync(_path);
            this.cache.set(name, svg);
            return svg;
        } catch (e) {
            log.warning(`Icon ${name} not found. Attempted path: ${_path}`);
            return undefined;
        }
    }

    private static buildPath(name: string): string {
        return path.resolve(IconHelper.ICON_DIR, `${name}.svg`);
    }

    public api = {
        i: this.i
    };
}
