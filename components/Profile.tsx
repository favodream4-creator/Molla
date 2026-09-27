"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getState } from "@/lib/store";

export default function Profile() {
  const [progress, setProgress] = useState(72);

  useEffect(() => {
    (async () => {
      setProgress((await getState()).progress);
    })();
  }, []);

  return (
    <div className="pt-6 pb-28 px-5">
      <div className="flex justify-end text-lg">⚙️</div>

      <div className="text-center mt-2">
        <div className="w-[88px] h-[88px] rounded-full bg-molla-black mx-auto mb-3.5" />
        <h2 className="text-lg font-extrabold">Jay Carter</h2>
        <p className="text-sm text-molla-sub mt-1">Artist · Atlanta, GA</p>
        <div className="mt-2.5 space-x-1.5">
          {["Hip-Hop", "R&B", "Alternative"].map((tag) => (
            <span key={tag} className="inline-block bg-molla-gray text-xs font-bold px-3 py-1.5 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <p className="text-sm text-molla-sub mt-4 leading-relaxed">
        I create music that feels real and connects with people. Currently working on my debut EP.
      </p>

      <div className="text-xs font-extrabold text-molla-sub mt-6 mb-2.5">CURRENT PROJECT</div>
      <Link href="/project" className="block border border-molla-line rounded-card p-5">
        <div className="flex justify-between mb-2.5">
          <span className="font-extrabold">Debut Single</span>
          <span className="text-molla-blue font-extrabold">{progress}%</span>
        </div>
        <div className="h-2 bg-molla-gray rounded-full overflow-hidden">
          <div className="h-full bg-molla-blue rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </Link>

      <div className="text-xs font-extrabold text-molla-sub mt-6 mb-1">LOOKING FOR</div>
      <ul>
        {["Producer", "Mixing Engineer", "Videographer"].map((s) => (
          <li key={s} className="py-2.5 border-b border-molla-line text-sm font-semibold">
            {s}
          </li>
        ))}
      </ul>

      <button className="w-full border border-molla-line text-molla-sub font-bold rounded-2xl py-4 mt-5">
        Edit profile
      </button>
    </div>
  );
}
