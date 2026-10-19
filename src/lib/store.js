import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { SHIFTS, shiftAllowed } from "./config";
import { isDate, weekdayIdx } from "./dates";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "schedule.json");

const EMPTY = { employees: [], entries: [], timeOff: [], settings: { minStaff: 2 } };

// Serialize every read-modify-write so concurrent requests can't clobber each other.
let queue = Promise.resolve();
function locked(fn) {
  const run = queue.then(fn);
  queue = run.catch(() => {});
  return run;
}

async function load() {
  try {
    return { ...EMPTY, ...JSON.parse(await fs.readFile(FILE, "utf8")) };
  } catch (e) {
    if (e.code === "ENOENT") return structuredClone(EMPTY);
    throw e;
  }
}

async function save(db) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}

export const readState = () => locked(load);

export class UserError extends Error {}
const fail = (msg) => {
  throw new UserError(msg);
};

const id = () => crypto.randomBytes(6).toString("hex");

const actions = {
  addEmployee(db, { name }) {
    name = String(name || "").trim().slice(0, 40);
    if (!name) fail("Enter a name.");
    if (db.employees.some((e) => e.name.toLowerCase() === name.toLowerCase())) fail(`${name} already exists.`);
    db.employees.push({ id: id(), name });
  },
  removeEmployee(db, { employeeId }) {
    db.employees = db.employees.filter((e) => e.id !== employeeId);
    db.entries = db.entries.filter((e) => e.employeeId !== employeeId);
    db.timeOff = db.timeOff.filter((t) => t.employeeId !== employeeId);
  },
  assign(db, { date, shift, employeeId }) {
    if (!isDate(date) || !SHIFTS[shift]) fail("Bad shift.");
    const emp = db.employees.find((e) => e.id === employeeId);
    if (!emp) fail("Unknown employee.");
    if (!shiftAllowed(shift, weekdayIdx(date))) fail("That shift runs past closing on this day.");
    if (db.timeOff.some((t) => t.employeeId === employeeId && t.date === date)) fail(`${emp.name} has requested off that day.`);
    if (db.entries.some((e) => e.employeeId === employeeId && e.date === date)) fail(`${emp.name} is already scheduled that day.`);
    db.entries.push({ id: id(), date, shift, employeeId });
  },
  unassign(db, { entryId }) {
    db.entries = db.entries.filter((e) => e.id !== entryId);
  },
  toggleTimeOff(db, { employeeId, date }) {
    if (!isDate(date) || !db.employees.some((e) => e.id === employeeId)) fail("Bad request.");
    const had = db.timeOff.some((t) => t.employeeId === employeeId && t.date === date);
    db.timeOff = db.timeOff.filter((t) => !(t.employeeId === employeeId && t.date === date));
    if (!had) {
      db.timeOff.push({ employeeId, date });
      db.entries = db.entries.filter((e) => !(e.employeeId === employeeId && e.date === date));
    }
  },
  setMinStaff(db, { minStaff }) {
    const n = Number(minStaff);
    if (!Number.isInteger(n) || n < 0 || n > 20) fail("Minimum staff must be 0-20.");
    db.settings.minStaff = n;
  },
};

export function applyAction(action, payload) {
  const fn = actions[action];
  if (!fn) throw new UserError("Unknown action.");
  return locked(async () => {
    const db = await load();
    fn(db, payload || {});
    await save(db);
    return db;
  });
}
