"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { generateEmptySchedule } from "@/lib/scheduler";
import { Calendar as CalendarIcon, Users, Plus, Save, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import InviteModal from "@/components/InviteModal";

export default function Dashboard() {
    const { user } = useAuth();
    const [org, setOrg] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isInviteOpen, setIsInviteOpen] = useState(false);

    useEffect(() => {
        if (user) {
            fetchOrgData();
        }
    }, [user]);

    const fetchOrgData = async () => {
        try {
            const orgDoc = await getDoc(doc(db, "organizations", user.uid));
            if (orgDoc.exists()) {
                const data = orgDoc.data();
                setOrg(data);
                const scheduleDoc = await getDoc(doc(db, "schedules", `${user.uid}-week-1`));
                if (scheduleDoc.exists()) {
                    setSchedule(scheduleDoc.data().days);
                } else {
                    setSchedule(generateEmptySchedule(data));
                }

                const empQuery = query(collection(db, "users"), where("organizationId", "==", user.uid));
                const empSnap = await getDocs(empQuery);
                setEmployees(empSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
            setLoading(false);
        } catch (err) {
            console.error("Fetch error", err);
            setLoading(false);
        }
    };

    const assignEmployee = (dayIdx, shiftIdx, empId) => {
        const newSchedule = [...schedule];
        newSchedule[dayIdx].shifts[shiftIdx].employeeId = empId;
        setSchedule(newSchedule);
    };

    const saveSchedule = async () => {
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "schedules", `${user.uid}-week-1`), {
                days: schedule,
                updatedAt: new Date().toISOString()
            });
            alert("Schedule saved!");
        } catch (e) {
            const { setDoc } = await import("firebase/firestore");
            await setDoc(doc(db, "schedules", `${user.uid}-week-1`), {
                days: schedule,
                organizationId: user.uid,
                updatedAt: new Date().toISOString()
            });
            alert("Schedule created and saved!");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading your workspace...</div>;
    if (!org) return <div style={{ padding: '2rem', textAlign: 'center' }}>Organization not found. Please complete onboarding.</div>;

    return (
        <div className="fade-in" style={{ padding: '2rem' }}>
            <InviteModal
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                orgId={user.uid}
                businessName={org.businessName}
            />

            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{org.businessName}</h1>
                    <p style={{ color: 'var(--ring)' }}>{org.department} • Manager Dashboard</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn glass" onClick={() => setIsInviteOpen(true)}><UserPlus size={18} /> Invite Team</button>
                    <button className="btn btn-primary" onClick={saveSchedule} disabled={isSaving}>
                        <Save size={18} /> {isSaving ? "Saving..." : "Save Weekly Schedule"}
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div className="card glass" style={{ overflowX: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CalendarIcon size={20} className="text-secondary" /> Weekly Schedule
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <button className="btn glass" style={{ padding: '4px 8px' }}><ChevronLeft size={16} /></button>
                            <span style={{ fontWeight: 600 }}>Jan 18 - Jan 24</span>
                            <button className="btn glass" style={{ padding: '4px 8px' }}><ChevronRight size={16} /></button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', minWidth: '1000px' }}>
                        {schedule.map((day, dIdx) => (
                            <div key={day.day} style={{ flex: 1, minWidth: '140px' }}>
                                <div style={{
                                    textAlign: 'center',
                                    padding: '1rem',
                                    background: day.active ? 'var(--primary-glow)' : 'var(--border)',
                                    borderRadius: '12px 12px 0 0',
                                    fontWeight: 700,
                                    fontSize: '0.875rem'
                                }}>
                                    {day.day}
                                </div>
                                <div style={{
                                    background: 'var(--input)',
                                    minHeight: '400px',
                                    padding: '0.5rem',
                                    borderRadius: '0 0 12px 12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    {day.shifts.map((shift, sIdx) => (
                                        <div key={shift.id} className="card" style={{
                                            padding: '0.75rem',
                                            fontSize: '0.75rem',
                                            background: 'white',
                                            border: shift.employeeId ? '2px solid var(--primary)' : '1px dashed var(--ring)'
                                        }}>
                                            <div style={{ fontWeight: 700, marginBottom: '0.25rem', textTransform: 'capitalize' }}>{shift.type}</div>
                                            <div style={{ color: 'var(--ring)', marginBottom: '0.5rem' }}>{shift.start} - {shift.end}</div>

                                            <select
                                                style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid var(--border)' }}
                                                value={shift.employeeId || ""}
                                                onChange={(e) => assignEmployee(dIdx, sIdx, e.target.value)}
                                            >
                                                <option value="">Unassigned</option>
                                                {employees.map(emp => (
                                                    <option key={emp.id} value={emp.id}>{emp.displayName || emp.email}</option>
                                                ))}
                                                {employees.length === 0 && (
                                                    <>
                                                        <option value="demo1">John Doe</option>
                                                        <option value="demo2">Jane Smith</option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    ))}
                                    {!day.active && (
                                        <div style={{ textAlign: 'center', color: 'var(--ring)', fontSize: '0.75rem', marginTop: '2rem' }}>
                                            Closed
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card glass">
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={18} /> Team Members
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {employees.length === 0 ? (
                                <div style={{ fontSize: '0.875rem', color: 'var(--ring)', textAlign: 'center', padding: '1rem' }}>
                                    No employees yet.<br />
                                    <button className="btn glass" onClick={() => setIsInviteOpen(true)} style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>Invite Employee</button>
                                </div>
                            ) : (
                                employees.map(emp => (
                                    <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                            {emp.displayName?.[0] || 'E'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.displayName}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--ring)' }}>{emp.role}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="card glass" style={{ background: 'var(--primary)', color: 'white' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Time Off Requests</h3>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                            No pending requests.
                        </div>
                        <button className="btn" style={{ background: 'white', color: 'var(--primary)', marginTop: '1rem', width: '100%', fontSize: '0.75rem' }}>
                            Review Requests
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
