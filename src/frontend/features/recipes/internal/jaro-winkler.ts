// Based on https://gist.github.com/sumn2u/0e0b5d9505ad096284928a987ace13fb
export function jaroWinklerDistance(s1: string, s2: string): number {
  if (s1.length === 0 || s2.length === 0) {
    return 0;
  }
  if (s1 === s2) {
    return 1;
  }

  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches: boolean[] = Array.from({ length: s1.length }, () => false);
  const s2Matches: boolean[] = Array.from({ length: s2.length }, () => false);
  let matches = 0;

  for (let i = 0; i < s1.length; i++) {
    const low = i >= range ? i - range : 0;
    const high = i + range <= s2.length ? i + range : s2.length - 1;
    for (let j = low; j <= high; j++) {
      if (s1Matches[i] !== true && s2Matches[j] !== true && s1[i] === s2[j]) {
        matches++;
        s1Matches[i] = true;
        s2Matches[j] = true;
        break;
      }
    }
  }
  if (matches === 0) {
    return 0;
  }

  let k = 0;
  let transpositions = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i] === true) {
      let j = k;
      for (; j < s2.length; j++) {
        if (s2Matches[j] === true) {
          k = j + 1;
          break;
        }
      }
      if (s1[i] !== s2[j]) {
        transpositions++;
      }
    }
  }

  let weight = (matches / s1.length + matches / s2.length + (matches - transpositions / 2) / matches) / 3;
  if (weight > 0.7) {
    let prefix = 0;
    while (prefix < 4 && s1[prefix] === s2[prefix]) {
      prefix++;
    }
    weight += prefix * 0.1 * (1 - weight);
  }
  return weight;
}
