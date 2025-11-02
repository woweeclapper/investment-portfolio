// src/components/AuthGate.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import type { Session } from '@supabase/supabase-js';

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // 🔹 new: track loading state
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false); // stop loading once we know
    });

    // Subscribe to auth state changes
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setLoading(false);
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    // 🔹 Prevents flicker between login form and dashboard
    return <div style={{ padding: '2rem' }}>Loading session…</div>;
  }

  if (!session) {
    return (
      <div style={{ maxWidth: 360, margin: '4rem auto' }}>
        <h2>Private Dashboard</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const { error } = await supabase.auth.signInWithOtp({
              email,
              options: { emailRedirectTo: window.location.origin },
            });
            if (error) {
              alert(error.message);
            } else {
              alert('Check your email for the login link.');
            }
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
          <button type="submit">Send Magic Link</button>
        </form>
      </div>
    );
  }

  // Logged-in view: show badge + sign out
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontSize: '0.9rem', color: '#555' }}>
          Logged in as <strong>{session.user.email}</strong>
        </span>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            setSession(null);
          }}
        >
          Sign Out
        </button>
      </div>
      {children}
    </div>
  );
}
