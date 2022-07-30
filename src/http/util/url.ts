export function copyUrlAndDo(url: URL, ...operations: ((url: URL) => unknown)[]) {
    const urlCopy = new URL(url.toString());
    operations.forEach((op) => op(urlCopy));
    return urlCopy;
}
