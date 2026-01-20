"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Save, Clock, Users, Building, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

const STEPS = [
    { id: "business", title: "Business Info", icon: <Building size={20} /> },
    { id: "hours", title: "Operating Hours", icon: <Clock size={20} /> },
    { id: "shifts", title: "Shift Requirements", icon: <Users size={20} /> },
];

export default function OnboardingPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        businessName: "",
        department: "",
        hours: {
            Monday: { open: "09:00", close: "17:00", active: true },
            Tuesday: { open: "09:00", close: "17:00", active: true },
            Wednesday: { open: "09:00", close: "17:00", active: true },
            Thursday: { open: "09:00", close: "17:00", active: true },
            Friday: { open: "09:00", close: "17:00", active: true },
            Saturday: { open: "10:00", close: "16:00", active: false },
            Sunday: { open: "10:00", close: "16:00", active: false },
        },
        shiftRequirements: {
            morning: { count: 2, start: "08:00", end: "16:00" },
            afternoon: { count: 2, start: "12:00", end: "20:00" },
            evening: { count: 1, start: "16:00", end: "00:00" },
        }
    });

    const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
    const prevStep = () => setStep((s) => Math.max(s - 1, 0));

    const handleComplete = async () => {
        if (!user) return alert("Please sign in first");
        setIsSaving(true);
        try {
            await setDoc(doc(db, "organizations", user.uid), {
                ...formData,
                managerId: user.uid,
                managerEmail: user.email,
                createdAt: new Date().toISOString()
            });
            router.push("/dashboard");
        } catch (error) {
            console.error("Save failed", error);
            alert("Failed to save organization. Check your Firebase permissions.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fade-in" style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Setup Your Organization</h1>
                <p style={{ color: 'var(--ring)' }}>Tell us about your business to help us generate the perfect schedule.</p>
            </header>

            {/* Progress Bar */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem' }}>
                {STEPS.map((s, idx) => (
                    <div key={s.id} style={{
                        flex: 1,
                        height: '4px',
                        background: idx <= step ? 'var(--primary)' : 'var(--border)',
                        borderRadius: '2px',
                        transition: 'all 0.3s ease'
                    }} />
                ))}
            </div>

            <div className="card glass" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ flex: 1 }}>
                    {step === 0 && (
                        <div className="fade-in">
                            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Building className="text-primary" /> Business Details
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Organization Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Acme Corp"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--input)',
                                            color: 'var(--foreground)'
                                        }}
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Department / Team</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sales, Frontend Dev"
                                        style={{
                                            width: '100%',
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)',
                                            background: 'var(--input)',
                                            color: 'var(--foreground)'
                                        }}
                                        value={formData.department}
                                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div className="fade-in">
                            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock className="text-primary" /> Operating Hours
                            </h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {Object.entries(formData.hours).map(([day, data]) => (
                                    <div key={day} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '0.5rem',
                                        borderBottom: '1px solid var(--border)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '150px' }}>
                                            <input
                                                type="checkbox"
                                                checked={data.active}
                                                onChange={(e) => {
                                                    const newHours = { ...formData.hours };
                                                    newHours[day].active = e.target.checked;
                                                    setFormData({ ...formData, hours: newHours });
                                                }}
                                            />
                                            <span style={{ fontWeight: 600 }}>{day}</span>
                                        </div>
                                        {data.active ? (
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <input type="time" value={data.open} onChange={(e) => {
                                                    const newHours = { ...formData.hours };
                                                    newHours[day].open = e.target.value;
                                                    setFormData({ ...formData, hours: newHours });
                                                }} style={{ padding: '0.25rem', borderRadius: '4px', border: 'none', background: 'var(--input)' }} />
                                                <span>to</span>
                                                <input type="time" value={data.close} onChange={(e) => {
                                                    const newHours = { ...formData.hours };
                                                    newHours[day].close = e.target.value;
                                                    setFormData({ ...formData, hours: newHours });
                                                }} style={{ padding: '0.25rem', borderRadius: '4px', border: 'none', background: 'var(--input)' }} />
                                            </div>
                                        ) : (
                                            <span style={{ color: 'var(--ring)', fontSize: '0.875rem' }}>Closed</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="fade-in">
                            <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Users className="text-primary" /> Shift Requirements
                            </h2>
                            <p style={{ color: 'var(--ring)', marginBottom: '1.5rem' }}>Specify how many employees you need for each shift type.</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {Object.entries(formData.shiftRequirements).map(([type, data]) => (
                                    <div key={type} className="card" style={{ background: 'var(--input)', border: 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <span style={{ textTransform: 'capitalize', fontWeight: 700 }}>{type} Shift</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <label>Count:</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={data.count}
                                                    onChange={(e) => {
                                                        const newShifts = { ...formData.shiftRequirements };
                                                        newShifts[type].count = parseInt(e.target.value);
                                                        setFormData({ ...formData, shiftRequirements: newShifts });
                                                    }}
                                                    style={{ width: '50px', padding: '0.25rem', textAlign: 'center' }}
                                                />
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '2rem' }}>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '0.75rem', display: 'block' }}>Starts</label>
                                                <input type="time" value={data.start} onChange={(e) => {
                                                    const newShifts = { ...formData.shiftRequirements };
                                                    newShifts[type].start = e.target.value;
                                                    setFormData({ ...formData, shiftRequirements: newShifts });
                                                }} style={{ width: '100%', padding: '0.5rem', background: 'white' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ fontSize: '0.75rem', display: 'block' }}>Ends</label>
                                                <input type="time" value={data.end} onChange={(e) => {
                                                    const newShifts = { ...formData.shiftRequirements };
                                                    newShifts[type].end = e.target.value;
                                                    setFormData({ ...formData, shiftRequirements: newShifts });
                                                }} style={{ width: '100%', padding: '0.5rem', background: 'white' }} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}>
                    <button
                        className="btn glass"
                        onClick={prevStep}
                        disabled={step === 0}
                        style={{ opacity: step === 0 ? 0.5 : 1 }}
                    >
                        <ArrowLeft size={18} /> Back
                    </button>

                    {step < STEPS.length - 1 ? (
                        <button className="btn btn-primary" onClick={nextStep}>
                            Next Step <ArrowRight size={18} />
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleComplete} disabled={isSaving}>
                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                            {isSaving ? "Saving..." : "Complete Setup"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
