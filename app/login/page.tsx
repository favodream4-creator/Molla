"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }

    void loadUser();
  }, []);

  async function sendLink() {
    setError("");
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col justify-center px-8 text-center">
      <div className="mb-2 text-2xl font-extrabold tracking-wide">
        M
        <span className="mx-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-molla-yellow text-xs">
          ●
        </span>
        LLA
      </div>

      <p className="mb-8 text-molla-sub">Your music career, connected.</p>

      {sent ? (
        <p className="text-sm">
          Check your inbox — we sent a magic link to <b>{email}</b>. Click it to
          sign in.
        </p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="mb-3 rounded-2xl border border-molla-line px-4 py-3.5 text-sm"
          />

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <button
            onClick={sendLink}
            disabled={!email}
            className="w-full rounded-2xl bg-molla-yellow py-4 font-bold text-molla-black disabled:opacity-40"
          >
            Send magic link
          </button>
        </>
      )}
    </div>
  );
}
