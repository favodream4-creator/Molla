"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getState } from "@/lib/store";
import Feed from "@/components/Feed";

export default function Home() {
  const router = useRouter();
  const [streak, setStreak] = useState(4);
  const [progress, setProgress] = useState(72);
  const [artworkDone, setArtworkDone] = useState(false);
  const [nextTitle, setNextTitle] = useState("Finish the second verse of your single");
  const [nextMinutes, setNextMinutes] = useState(45);

  useEffect(() => {
    let active = true;
    (async () => {
      const s = await getState();
      if (!active) return;
      if (!s.onboarded) {
        router.replace("/onboarding");
        return;
      }
      setStreak(s.streak);
      setProgress(s.progress);
      setArtworkDone(s.artworkDone);
      setNextTitle(s.nextMoveTitle);
      setNextMinutes(s.nextMoveMinutes);
    })();
    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="pb-28">
      {/* App bar */}
      <div className="flex items-center justify-between px-5 pt-5">
        <div className="text-xl font-extrabold tracking-wide">
          M<span className="inline-flex w-[18px] h-[18px] rounded-full bg-molla-yellow items-center justify-center text-[10px] mx-[1px]">●</span>LLA
        </div>
        <button
          onClick={async () => {
            const { createClient } = await import("@/lib/supabase/client");
            await createClient().auth.signOut();
            router.replace("/login");
          }}
          className="w-9 h-9 rounded-full bg-molla-black text-white flex items-center justify-center font-bold text-sm"
        >
          J
        </button>
      </div>

      {/* Greeting */}
      <div className="px-5 mt-3">
        <p className="text-sm text-molla-sub">Good morning, Jay 👋</p>
        <h1 className="text-lg font-extrabold mt-0.5">Your career is moving.</h1>
        <div className="flex items-center gap-1.5 mt-2 text-sm font-bold text-molla-sub">
          🔥 <span>{streak}</span>-day move streak
        </div>
      </div>

      <Feed />

      {/* Next move */}
      <div className="bg-molla-black text-white rounded-3xl mx-5 mt-4 p-5">
        <div className="text-molla-yellow font-extrabold text-xs tracking-wide">
          YOUR NEXT MOVE
        </div>
        <h2 className="text-xl font-extrabold my-2.5 leading-snug">{nextTitle}</h2>
        <div className="flex gap-3.5 text-sm text-[#C7CBD1] mb-4">
          <span>My First Single</span>
          <span>·</span>
          <span>⏱ {nextMinutes} min</span>
        </div>
        <Link
          href="/focus"
          className="block text-center w-full bg-molla-yellow text-molla-black font-bold rounded-2xl py-4"
        >
          Start move →
        </Link>
      </div>

      {/* Ask MOLLA */}
      <div className="text-xs font-extrabold text-molla-sub mx-5 mt-6 mb-2.5">
        ASK MOLLA
      </div>
      <Link
        href="/ai"
        className="w-full bg-molla-blue text-white rounded-3xl mx-5 p-5 flex items-center justify-between gap-3 max-w-[calc(100%-40px)]"
      >
        <div className="text-left">
          <h3 className="font-bold">Need help with your next move?</h3>
          <p className="text-sm text-[#DCE7FF]">Ask →</p>
        </div>
        <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-xl flex-shrink-0">
          🤖
        </div>
      </Link>

      {/* Current project */}
      <div className="text-xs font-extrabold text-molla-sub mx-5 mt-6 mb-2.5">
        CURRENT PROJECT
      </div>
      <Link href="/project" className="block border border-molla-line rounded-card mx-5 p-5">
        <div className="flex justify-between items-center">
          <span className="font-extrabold text-[15px]">Debut Single</span>
          <span className="font-extrabold text-molla-blue">{progress}%</span>
        </div>
        <div className="h-2 bg-molla-gray rounded-full overflow-hidden my-3">
          <div className="h-full bg-molla-blue rounded-full" style={{ width: `${progress}%` }} />
        </div>
        {[
          { label: "Recording", done: true },
          { label: "Mixing", done: true },
          { label: "Artwork", done: artworkDone },
          { label: "Distribution", done: false },
          { label: "Promotion", done: false },
        ].map((t) => (
          <div key={t.label} className="flex items-center gap-2.5 py-1.5 text-sm">
            <div
              className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 ${
                t.done ? "bg-green-600 border-green-600" : "border-molla-line"
              }`}
            />
            {t.label}
          </div>
        ))}
      </Link>

      {/* People you may need */}
      <div className="text-xs font-extrabold text-molla-sub mx-5 mt-6 mb-2.5">
        PEOPLE YOU MAY NEED
      </div>
      <div className="flex gap-3 overflow-x-auto px-5">
        {["Producer", "Mixing Engineer", "Videographer", "Designer"].map((role) => (
          <div key={role} className="min-w-[140px] border border-molla-line rounded-2xl p-3.5 flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-molla-gray mb-2.5" />
            <h4 className="text-sm font-extrabold">{role}</h4>
          </div>
        ))}
      </div>

      {/* Opportunities */}
      <div className="text-xs font-extrabold text-molla-sub mx-5 mt-6 mb-2.5">
        OPPORTUNITIES FOR YOU
      </div>
      <div className="border border-molla-line rounded-2xl mx-5 mb-3 p-4">
        <span className="bg-molla-yellow text-molla-black text-[11px] font-extrabold px-2.5 py-1 rounded-full">
          SHOWCASE
        </span>
        <h4 className="font-extrabold mt-2">Rising Stars Showcase</h4>
        <p className="text-sm text-molla-sub mt-1">New York, NY · Nov 15</p>
      </div>
    </div>
  );
}
