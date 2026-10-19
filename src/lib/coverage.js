import { SHIFTS, openHours } from "./config";
import { weekdayIdx } from "./dates";

// For each open hour of a day, how many scheduled people are on the floor for the whole hour.
export function dayCoverage(date, entries) {
  const { open, close } = openHours(weekdayIdx(date));
  const dayEntries = entries.filter((e) => e.date === date);
  const hours = [];
  for (let m = open; m < close; m += 60) {
    const count = dayEntries.filter((e) => SHIFTS[e.shift].start <= m && SHIFTS[e.shift].end >= m + 60).length;
    hours.push({ start: m, count });
  }
  return hours;
}
