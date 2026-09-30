"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics/trackEvent";

export default function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function sendLink() {
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="flex flex-col min-h-screen justify-center px-8 text-center">
      <div className="text-2xl font-extrabold tracking-wide mb-2">
        M<span className="inline-flex w-5 h-5 rounded-full bg-molla-yellow items-center justify-center text-xs mx-0.5">●</span>LLA
      </div>
      <p className="text-molla-sub mb-8">Your music career, connected.</p>

      {sent ? (
        <p className="text-sm">
          Check your inbox — we sent a magic link to <b>{email}</b>. Click it to sign in.
        </p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="border border-molla-line rounded-2xl px-4 py-3.5 text-sm mb-3"
          />
          {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
          <button
            onClick={sendLink}
            disabled={!email}
            className="w-full bg-molla-yellow text-molla-black font-bold rounded-2xl py-4 disabled:opacity-40"
          >
            Send magic link
          </button>
        </>
      )}
    </div>
  );
}

// après création de compte réussie
await trackEvent("signup", {
  source: "magic_link",
});
