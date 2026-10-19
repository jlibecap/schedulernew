// Furniture Fair store hours and shift definitions. Times are minutes after midnight.
export const STORE_NAME = "Furniture Fair";

const t = (h, m = 0) => h * 60 + m;

export const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

// Open hours by weekday index (0 = Monday ... 6 = Sunday)
export function openHours(weekdayIdx) {
  return weekdayIdx === 6 ? { open: t(11), close: t(18) } : { open: t(11), close: t(20) };
}

export const SHIFTS = {
  open_close: { key: "open_close", label: "10:30a – 8p", start: t(10, 30), end: t(20), hours: 9.5 },
  mid_close: { key: "mid_close", label: "12p – 8p", start: t(12), end: t(20), hours: 8 },
  open_early: { key: "open_early", label: "10:30a – 6p", start: t(10, 30), end: t(18), hours: 7.5 },
};
export const SHIFT_ORDER = ["open_close", "mid_close", "open_early"];

// A shift is only usable on a day if it ends by closing time (Sundays close at 6pm).
export function shiftAllowed(shiftKey, weekdayIdx) {
  return SHIFTS[shiftKey].end <= openHours(weekdayIdx).close;
}

export function fmtTime(mins) {
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const h = ((h24 + 11) % 12) + 1;
  return `${h}${m ? ":" + String(m).padStart(2, "0") : ""}${h24 < 12 ? "a" : "p"}`;
}
