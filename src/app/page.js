"use client";

import { Calendar, Users, Clock, ArrowRight, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handleGetStarted = async () => {
    if (!user) {
      const loggedInUser = await loginWithGoogle();
      if (loggedInUser) {
        router.push("/onboarding");
      }
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div className="fade-in" style={{ padding: '0 2rem' }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '2rem 0',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="glass" style={{ padding: '0.5rem', display: 'flex' }}>
            <Calendar size={24} color="var(--primary)" />
          </div>
          <span style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.05em' }}>
            Antigravity<span style={{ color: 'var(--primary)' }}>Scheduler</span>
          </span>
        </div>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={user.photoURL} alt={user.displayName} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
            <Link href="/onboarding" className="btn btn-primary" style={{ padding: '8px 16px' }}>Go to Dashboard</Link>
          </div>
        ) : (
          <button className="btn glass" onClick={loginWithGoogle} style={{ fontWeight: 500 }}>
            <LogIn size={18} /> Sign In
          </button>
        )}
      </header>

      <main style={{ maxWidth: '1200px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass" style={{
          display: 'inline-flex',
          padding: '0.5rem 1rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--primary)',
          marginBottom: '2rem'
        }}>
          ✨ Now with Google Calendar Sync
        </div>

        <h1 style={{
          fontSize: 'clamp(3rem, 8vw, 5rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          marginBottom: '1.5rem'
        }}>
          Scheduling for the <br />
          <span style={{
            background: 'linear-gradient(to right, var(--primary), var(--secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>Modern Workspace</span>
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: 'var(--ring)',
          maxWidth: '600px',
          margin: '0 auto 3rem',
          lineHeight: 1.6
        }}>
          Automate your employee shifts, manage time-off requests, and sync everything directly to Google Calendar in one beautiful interface.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '6rem' }}>
          <button onClick={handleGetStarted} className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            Start Building Schedule <ArrowRight size={20} />
          </button>
          <button className="btn glass" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
            View Demo
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2rem'
        }}>
          <div className="card glass">
            <Users size={32} color="var(--primary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Employee Invites</h3>
            <p style={{ color: 'var(--ring)' }}>Send invites via Google accounts and manage your team effortlessly.</p>
          </div>
          <div className="card glass">
            <Clock size={32} color="var(--secondary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Time Off Workflow</h3>
            <p style={{ color: 'var(--ring)' }}>Streamlined approval process for vacation and sick days.</p>
          </div>
          <div className="card glass">
            <Calendar size={32} color="var(--accent)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>Calendar Sync</h3>
            <p style={{ color: 'var(--ring)' }}>Automatically push finalized schedules to employee Google Calendars.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
