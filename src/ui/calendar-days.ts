// Calendar day maths on YYYY-MM-DD strings (parent-screen design 5.3).
// Integer arithmetic only: no clock, no time zone, no locale. The same input gives the same
// output on any machine.

export interface CivilDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) return isLeapYear(year) ? 29 : 28;
  return month === 4 || month === 6 || month === 9 || month === 11 ? 30 : 31;
}

/** Parses exactly YYYY-MM-DD. Returns null for anything that is not a real calendar day. */
export function parseDate(text: string): CivilDate | null {
  if (typeof text !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (match === null) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

/** Days since 1970-01-01 for a civil day (proleptic Gregorian calendar). */
export function daysFromCivil(year: number, month: number, day: number): number {
  const y = month <= 2 ? year - 1 : year;
  const era = Math.floor(y / 400);
  const yoe = y - era * 400;
  const mp = month > 2 ? month - 3 : month + 9;
  const doy = Math.floor((153 * mp + 2) / 5) + day - 1;
  const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy;
  return era * 146097 + doe - 719468;
}

/** The inverse of `daysFromCivil`. */
export function civilFromDays(days: number): CivilDate {
  const z = days + 719468;
  const era = Math.floor(z / 146097);
  const doe = z - era * 146097;
  const yoe = Math.floor((doe - Math.floor(doe / 1460) + Math.floor(doe / 36524) - Math.floor(doe / 146096)) / 365);
  const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100));
  const mp = Math.floor((5 * doy + 2) / 153);
  const day = doy - Math.floor((153 * mp + 2) / 5) + 1;
  const month = mp < 10 ? mp + 3 : mp - 9;
  const year = yoe + era * 400 + (month <= 2 ? 1 : 0);
  return { year, month, day };
}

/** Weekday of a day count from `daysFromCivil`: 0 = Sunday ... 6 = Saturday. 1970-01-01 was a Thursday. */
export function weekdayIndex(days: number): number {
  return (((days + 4) % 7) + 7) % 7;
}

function pad(value: number, width: number): string {
  return String(value).padStart(width, '0');
}

function formatCivil(civil: CivilDate): string {
  return `${pad(civil.year, 4)}-${pad(civil.month, 2)}-${pad(civil.day, 2)}`;
}

/**
 * The `n` consecutive days ending at `today`, oldest first, as YYYY-MM-DD strings.
 * Returns [] when `today` does not parse, when `n` is not a whole number of at least 1,
 * or when the range would leave the years 0000 to 9999.
 */
export function windowDates(today: string, n: number): string[] {
  const parsed = parseDate(today);
  if (parsed === null) return [];
  if (!Number.isInteger(n) || n < 1) return [];
  const last = daysFromCivil(parsed.year, parsed.month, parsed.day);
  const first = last - (n - 1);
  const firstCivil = civilFromDays(first);
  if (firstCivil.year < 0) return [];
  const out: string[] = [];
  for (let d = first; d <= last; d++) out.push(formatCivil(civilFromDays(d)));
  return out;
}
