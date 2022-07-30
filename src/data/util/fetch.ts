export interface FetchFn {
    (input: RequestInfo, userAgent: string, init?: RequestInit): Promise<Response>;
}

/**
 * A custom wrapper around fetch to make sure requests use the configured User Agent.
 */
export const fetchCustom: FetchFn = (
    input: RequestInfo,
    userAgent: string,
    init?: RequestInit,
): Promise<Response> => {
    return fetch(
        input,
        merge(
            init ?? {},
            {
                headers: {
                    "User-Agent": userAgent,
                    "Accept-Encoding": "UTF-8",
                },
            },
        ),
    );
};

/**
 * Merge `source` and `target` recursively.
 * @param target the target object
 * @param source the source object
 */
// deno-lint-ignore no-explicit-any
const merge = (target: any, source: any) => {
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object) {
            Object.assign(source[key], merge(target[key], source[key]));
        }
    }

    return Object.assign(target || {}, source);
};
