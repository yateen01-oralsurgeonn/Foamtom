// Helpers for the feasibility results file (design 7.2, requirements 1.12 and 1.13).
// Pure. A reading code is one of: R right, W wrong, U unknown, N null.

export type ReadingCode = 'R' | 'W' | 'U' | 'N';

/** Right readings needed, out of the three tries, for a surface to pass. */
const RIGHT_NEEDED = 2;

/** True when at least 2 of the codes are `R`. `U` and `N` count as not right. */
export function surfacePasses(codes: readonly ReadingCode[]): boolean {
  return codes.filter((code) => code === 'R').length >= RIGHT_NEEDED;
}

/** How many surfaces pass. Each row holds the three codes of one surface. */
export function countPasses(rows: readonly (readonly ReadingCode[])[]): number {
  return rows.filter((codes) => surfacePasses(codes)).length;
}
