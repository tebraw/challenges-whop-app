// lib/streak.ts
export function diffDaysInclusive(start: Date | string, end: Date | string) {
  const s = new Date(start);
  const e = new Date(end);

  // Falls endAt exakt 00:00:00 UTC gespeichert ist (exklusiv), nimm einen Tick zurück
  const endIsMidnightUTC =
    e.getUTCHours() === 0 &&
    e.getUTCMinutes() === 0 &&
    e.getUTCSeconds() === 0 &&
    e.getUTCMilliseconds() === 0;
  const eAdj = endIsMidnightUTC ? new Date(e.getTime() - 1) : e;

  const sUTC = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate());
  const eUTC = Date.UTC(eAdj.getUTCFullYear(), eAdj.getUTCMonth(), eAdj.getUTCDate());
  const days = Math.floor((eUTC - sUTC) / 86_400_000) + 1; // inklusiv
  return Math.max(1, days);
}

export function calcUiMax(
  cadence: string | null | undefined,
  startAt?: Date | string | null,
  endAt?: Date | string | null
) {
  if (cadence === "END_OF_CHALLENGE") return 1;
  if (cadence === "DAILY" && startAt && endAt) return diffDaysInclusive(startAt, endAt);
  return 7; // Fallback
}
