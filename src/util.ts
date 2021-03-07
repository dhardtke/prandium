export function toInt(s: string, _default: number = 0): number {
    return parseInt(s, 10) || _default;
}
