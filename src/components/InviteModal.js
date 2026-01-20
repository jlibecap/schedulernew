"use client";

import { useState } from "react";
import { X, Send, UserPlus } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function InviteModal({ isOpen, onClose, orgId, businessName }) {
    const [email, setEmail] = useState("");
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleInvite = async (e) => {
        e.preventDefault();
        setIsSending(true);
        try {
            await addDoc(collection(db, "invites"), {
                email,
                organizationId: orgId,
                businessName: businessName,
                status: "pending",
                createdAt: serverTimestamp(),
            });
            alert(`Invite sent to ${email}! (In a real app, this would trigger an email)`);
            setEmail("");
            onClose();
        } catch (error) {
            console.error("Invite failed", error);
            alert("Failed to send invite.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="card glass fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <UserPlus size={20} color="var(--primary)" /> Invite Employee
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleInvite}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Employee Email</label>
                        <input
                            type="email"
                            required
                            placeholder="employee@google.com"
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '8px',
                                border: '1px solid var(--border)',
                                background: 'var(--input)'
                            }}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }} disabled={isSending}>
                        {isSending ? "Sending..." : "Send Invite"} <Send size={18} />
                    </button>
                </form>
            </div>
        </div>
    );
}
