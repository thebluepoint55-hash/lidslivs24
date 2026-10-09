// Все даты демо считаются от момента первого запуска,
// поэтому данные всегда выглядят «свежими».

const HOUR = 3600_000;
const DAY = 24 * HOUR;

let base = Date.now();

export function setBaseNow(ms: number) {
  base = ms;
}

/** n дней назад, в указанное время (часы:минуты) */
export function daysAgo(n: number, hh = 10, mm = 0): string {
  const d = new Date(base - n * DAY);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

/** через n дней, в указанное время */
export function inDays(n: number, hh = 10, mm = 0): string {
  return daysAgo(-n, hh, mm);
}

export function hoursAgo(n: number): string {
  return new Date(base - n * HOUR).toISOString();
}

export function minutesAgo(n: number): string {
  return new Date(base - n * 60_000).toISOString();
}
