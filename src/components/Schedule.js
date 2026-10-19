"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { STORE_NAME, DAY_NAMES, SHIFTS, SHIFT_ORDER, shiftAllowed, openHours, fmtTime } from "@/lib/config";
import { addDays, prettyDate, prettyRange, todayLocal, weekDays, weekStart } from "@/lib/dates";
import { dayCoverage } from "@/lib/coverage";

const PIN_KEY = "ff-manager-pin";

export default function Schedule({ manager = false }) {
  const [db, setDb] = useState(null);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [week, setWeek] = useState(null);
  const [newName, setNewName] = useState("");

  const today = week ? todayLocal() : "";

  useEffect(() => {
    setWeek(weekStart(todayLocal()));
    try {
      setPin(localStorage.getItem(PIN_KEY) || "");
    } catch {}
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      setDb(await res.json());
    } catch {
      setError("Can't reach the server.");
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15000);
    return () => clearInterval(t);
  }, [refresh]);

  // Editing is allowed when no PIN is configured on the server, or the stored PIN has been verified.
  const [verified, setVerified] = useState(false);
  const canEdit = manager && db && (!db.pinRequired || verified);

  useEffect(() => {
    if (!db?.pinRequired || !pin) return;
    fetch("/api/action", { method: "POST", headers: { "x-manager-pin": pin }, body: JSON.stringify({ action: "verify" }) })
      .then((r) => setVerified(r.ok));
  }, [db?.pinRequired, pin]);

  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const login = async (ev) => {
    ev.preventDefault();
    const res = await fetch("/api/action", { method: "POST", headers: { "x-manager-pin": pinInput }, body: JSON.stringify({ action: "verify" }) });
    if (!res.ok) return setPinError("Wrong PIN.");
    try {
      localStorage.setItem(PIN_KEY, pinInput);
    } catch {}
    setPinError("");
    setPin(pinInput);
    setVerified(true);
  };

  const act = async (action, payload) => {
    setError("");
    const res = await fetch("/api/action", {
      method: "POST",
      headers: { "x-manager-pin": pin },
      body: JSON.stringify({ action, payload }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      if (res.status === 401) setVerified(false);
      return false;
    }
    setDb(data);
    return true;
  };

  const days = useMemo(() => (week ? weekDays(week) : []), [week]);
  const empById = useMemo(() => Object.fromEntries((db?.employees || []).map((e) => [e.id, e])), [db]);

  const weekHours = useMemo(() => {
    const totals = {};
    if (!db) return totals;
    for (const e of db.entries) if (days.includes(e.date)) totals[e.employeeId] = (totals[e.employeeId] || 0) + SHIFTS[e.shift].hours;
    return totals;
  }, [db, days]);

  if (!db || !week) return <div className="wrap">Loading…</div>;

  if (manager && db.pinRequired && !verified) {
    return (
      <div className="wrap">
        <div className="panel" style={{ maxWidth: 360, margin: "10vh auto" }}>
          <h1 style={{ fontSize: 20, marginTop: 0 }}>{STORE_NAME} Manager</h1>
          <form className="row" onSubmit={login}>
            <input type="password" placeholder="Manager PIN" autoFocus value={pinInput} onChange={(e) => setPinInput(e.target.value)} />
            <button className="btn primary">Log in</button>
          </form>
          {pinError && <div className="error" style={{ marginTop: 8 }}>{pinError}</div>}
        </div>
      </div>
    );
  }

  const minStaff = db.settings.minStaff;

  return (
    <div className="wrap">
      <div className="top">
        <div>
          <h1>{STORE_NAME} {manager ? "Manager Schedule" : "Schedule"}</h1>
          <div className="sub">Mon–Sat 11a–8p · Sun 11a–6p</div>
        </div>
        <div className="row noprint">
          <button className="btn" onClick={() => setWeek(addDays(week, -7))}>◀</button>
          <strong>{prettyRange(week)}</strong>
          <button className="btn" onClick={() => setWeek(addDays(week, 7))}>▶</button>
          <button className="btn" onClick={() => setWeek(weekStart(todayLocal()))}>This week</button>
          <button className="btn" onClick={() => window.print()}>Print</button>
          {manager && <a className="btn" href="/">Employee view</a>}
          {manager && !db.pinRequired && <span className="sub">⚠ No SCHEDULER_PIN set — anyone with this link can edit</span>}
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="week">
        {days.map((date, i) => {
          const hrs = openHours(i);
          const cover = dayCoverage(date, db.entries);
          const low = cover.filter((h) => h.count < minStaff).length;
          return (
            <div key={date} className={"day" + (date === today ? " today" : "")}>
              <div className="day-head">
                <b>{DAY_NAMES[i]}</b>
                <span>{prettyDate(date)} · {fmtTime(hrs.open)}–{fmtTime(hrs.close)}</span>
              </div>
              {SHIFT_ORDER.map((key) => {
                const allowed = shiftAllowed(key, i);
                const people = db.entries.filter((e) => e.date === date && e.shift === key);
                const taken = new Set(db.entries.filter((e) => e.date === date).map((e) => e.employeeId));
                const off = new Set(db.timeOff.filter((t) => t.date === date).map((t) => t.employeeId));
                const options = db.employees.filter((e) => !taken.has(e.id) && !off.has(e.id));
                return (
                  <div key={key} className={"shift" + (allowed ? "" : " na")}>
                    <div className="shift-label">{SHIFTS[key].label}{!allowed && " (n/a — closes 6p)"}</div>
                    {allowed && people.map((p) => (
                      <div className="chip" key={p.id}>
                        <span>{empById[p.employeeId]?.name}</span>
                        {canEdit && <button title="Remove" onClick={() => act("unassign", { entryId: p.id })}>×</button>}
                      </div>
                    ))}
                    {allowed && canEdit && (
                      <select
                        className="noprint"
                        value=""
                        onChange={(e) => e.target.value && act("assign", { date, shift: key, employeeId: e.target.value })}
                      >
                        <option value="">+ Add person</option>
                        {options.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    )}
                  </div>
                );
              })}
              <div className="cover">
                <div className="cover-bars" title="People on the floor each open hour">
                  {cover.map((h) => <i key={h.start} className={h.count < minStaff ? "low" : ""}>{h.count}</i>)}
                </div>
                <div className="cover-hint">
                  {low ? `${low} hr${low > 1 ? "s" : ""} under ${minStaff} staff` : "Coverage OK"} · {fmtTime(hrs.open)} → {fmtTime(hrs.close)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panels">
        <div className="panel">
          <h2>Hours this week</h2>
          <table>
            <thead><tr><th>Employee</th><th className="num">Shifts</th><th className="num">Hours</th></tr></thead>
            <tbody>
              {db.employees.map((e) => (
                <tr key={e.id}>
                  <td>{e.name}</td>
                  <td className="num">{db.entries.filter((x) => x.employeeId === e.id && days.includes(x.date)).length}</td>
                  <td className="num">{weekHours[e.id] || 0}</td>
                </tr>
              ))}
              {db.employees.length === 0 && <tr><td colSpan={3} className="sub">No employees yet.</td></tr>}
            </tbody>
          </table>
        </div>

        {canEdit && (
          <>
            <div className="panel noprint">
              <h2>Team</h2>
              <form
                className="row"
                onSubmit={async (ev) => {
                  ev.preventDefault();
                  if (await act("addEmployee", { name: newName })) setNewName("");
                }}
              >
                <input type="text" placeholder="Add employee name" value={newName} onChange={(e) => setNewName(e.target.value)} />
                <button className="btn primary">Add</button>
              </form>
              <table>
                <tbody>
                  {db.employees.map((e) => (
                    <tr key={e.id}>
                      <td>{e.name}</td>
                      <td className="num">
                        <button
                          className="btn"
                          onClick={() => window.confirm(`Remove ${e.name} and all their shifts?`) && act("removeEmployee", { employeeId: e.id })}
                        >Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="panel noprint">
              <h2>Days off (this week)</h2>
              <div className="sub" style={{ marginBottom: 6 }}>Click a day to mark someone off — they'll be removed from that day and can't be scheduled.</div>
              {db.employees.map((e) => (
                <div key={e.id} style={{ marginBottom: 6 }}>
                  <div>{e.name}</div>
                  {days.map((d, i) => {
                    const on = db.timeOff.some((t) => t.employeeId === e.id && t.date === d);
                    return (
                      <button key={d} className={"toff" + (on ? " on" : "")} onClick={() => act("toggleTimeOff", { employeeId: e.id, date: d })}>
                        {DAY_NAMES[i].slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="panel noprint">
              <h2>Settings</h2>
              <label className="row">
                Minimum staff per open hour
                <input type="number" min="0" max="20" style={{ width: 70 }} defaultValue={minStaff} key={minStaff}
                  onBlur={(e) => Number(e.target.value) !== minStaff && act("setMinStaff", { minStaff: e.target.value })} />
              </label>
              <div className="sub" style={{ marginTop: 6 }}>Hours below this show red in each day's coverage bar.</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
