import { stat } from "node:fs/promises";
import path from "node:path";
import { AppRequest } from "./types.ts";

const Encodings = [
    { name: "br", extension: ".br" },
    { name: "gzip", extension: ".gz" },
] as const;

/**
 * Whether the Accept-Encoding header allows the given encoding (i.e. it is listed, or covered by `*`, with a q-value above 0).
 */
function acceptsEncoding(request: Request, encoding: string): boolean {
    const header = request.headers.get("Accept-Encoding");
    if (!header) {
        return false;
    }
    let accepted = false;
    for (const part of header.split(",")) {
        const [name, ...parameters] = part.trim().toLowerCase().split(";");
        const q = parameters.map((p) => p.trim()).find((p) => p.startsWith("q="));
        const quality = q ? parseFloat(q.substring(2)) : 1;
        if (name === encoding) {
            return quality > 0;
        }
        if (name === "*") {
            accepted = quality > 0;
        }
    }
    return accepted;
}

function decodePath(relativePath: string): string | undefined {
    try {
        return decodeURIComponent(relativePath);
    } catch {
        return undefined;
    }
}

function isHidden(relativePath: string): boolean {
    return relativePath.split(/[/\\]/).some((segment) => segment.startsWith(".") && segment !== "." && segment !== "..");
}

async function fileStats(file: string) {
    try {
        const stats = await stat(file);
        return stats.isFile() ? stats : undefined;
    } catch {
        return undefined;
    }
}

function etagMatches(ifNoneMatch: string, etag: string): boolean {
    const weak = (tag: string) => tag.trim().replace(/^W\//, "");
    return ifNoneMatch.trim() === "*" || ifNoneMatch.split(",").some((candidate) => weak(candidate) === weak(etag));
}

/**
 * Serves the file `relativePath` (as found in the URL, i.e. still URL-encoded) from the directory `root`.
 * Precompressed variants (`.br`, `.gz`) are served if the client accepts them. Hidden files and paths outside `root` are never served.
 * @return the response or `undefined` if there is no such file
 */
export async function serveFile(req: AppRequest, root: string, relativePath: string): Promise<Response | undefined> {
    const decoded = decodePath(relativePath);
    if (!decoded || decoded.includes("\0") || isHidden(decoded)) {
        return undefined;
    }
    const rootDir = path.resolve(root);
    const file = path.resolve(rootDir, decoded);
    if (!file.startsWith(rootDir + path.sep)) {
        return undefined;
    }

    let servedFile = file;
    let stats = await fileStats(file);
    const headers = new Headers({ Vary: "Accept-Encoding" });
    for (const encoding of Encodings) {
        if (acceptsEncoding(req.request, encoding.name)) {
            const compressedStats = await fileStats(file + encoding.extension);
            if (compressedStats) {
                servedFile = file + encoding.extension;
                stats = compressedStats;
                headers.set("Content-Encoding", encoding.name);
                break;
            }
        }
    }
    if (!stats) {
        return undefined;
    }

    // the type is derived from the original file name, not from the .br / .gz file
    headers.set("Content-Type", Bun.file(file).type);
    headers.set("Cache-Control", "max-age=0");
    // round down to seconds as this is the precision of the header
    const mtime = stats.mtime.getTime() - (stats.mtime.getTime() % 1000);
    headers.set("Last-Modified", new Date(mtime).toUTCString());
    const etag = `W/"${stats.size.toString(16)}-${mtime.toString(16)}"`;
    headers.set("ETag", etag);

    const ifNoneMatch = req.request.headers.get("If-None-Match");
    if (ifNoneMatch && etagMatches(ifNoneMatch, etag)) {
        return new Response(null, { status: 304, headers });
    }
    if (req.request.method === "HEAD") {
        headers.set("Content-Length", String(stats.size));
        return new Response(null, { status: 200, headers });
    }
    return new Response(Bun.file(servedFile), { status: 200, headers });
}
