// Dates are plain "YYYY-MM-DD" strings; math is done in UTC so DST and server timezone never matter.
const toUTC = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};
const fmt = (dt) => dt.toISOString().slice(0, 10);

export function addDays(s, n) {
  const dt = toUTC(s);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fmt(dt);
}

// Monday of the week containing s
export function weekStart(s) {
  const dow = (toUTC(s).getUTCDay() + 6) % 7; // Mon=0
  return addDays(s, -dow);
}

export function weekDays(start) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekdayIdx(s) {
  return (toUTC(s).getUTCDay() + 6) % 7;
}

export function todayLocal() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

export function isDate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && fmt(toUTC(s)) === s;
}

export function prettyDate(s) {
  return toUTC(s).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

export function prettyRange(start) {
  return `${prettyDate(start)} – ${prettyDate(addDays(start, 6))}, ${toUTC(addDays(start, 6)).getUTCFullYear()}`;
}
