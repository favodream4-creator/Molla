"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getState } from "@/lib/store";

export default function ProjectDetail() {
  const router = useRouter();
  const [progress, setProgress] = useState(72);
  const [artworkDone, setArtworkDone] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getState();
      setProgress(s.progress);
      setArtworkDone(s.artworkDone);
    })();
  }, []);

  const rows: [string, "done" | "progress" | "pending"][] = [
    ["Recording", "done"],
    ["Mixing", "done"],
    ["Mastering", "done"],
    ["Artwork", artworkDone ? "done" : "progress"],
    ["Distribution", "pending"],
    ["Promotion", "pending"],
  ];

  const pillClass = {
    done: "bg-green-100 text-green-700",
    progress: "bg-[#FFF3CD] text-[#92730B]",
    pending: "bg-molla-gray text-molla-sub",
  };
  const pillLabel = { done: "Done", progress: "In progress", pending: "Pending" };

  return (
    <div className="px-5 pt-5 pb-10">
      <div className="flex items-center gap-3 mb-2">
        <button
          onClick={() => router.push("/")}
          className="w-[34px] h-[34px] rounded-full bg-molla-gray flex items-center justify-center"
        >
          ←
        </button>
        <h2 className="text-[17px] font-extrabold">Project details</h2>
      </div>

      <div className="bg-molla-black text-white rounded-3xl mt-4 p-5">
        <p className="text-xs font-bold text-[#C7CBD1]">DEBUT SINGLE</p>
        <div className="text-4xl font-extrabold text-molla-yellow mt-2">{progress}%</div>
        <p className="text-sm text-[#C7CBD1]">complete</p>
      </div>

      {rows.map(([label, status]) => (
        <div key={label} className="flex items-center justify-between py-3.5 border-b border-molla-line text-sm font-semibold">
          {label}
          <span className={`text-xs font-bold px-2.5 py-1.5 rounded-full ${pillClass[status]}`}>
            {pillLabel[status]}
          </span>
        </div>
      ))}

      <div className="text-xs font-extrabold text-molla-sub mt-6 mb-2.5">PROJECT TEAM</div>
      <div className="flex">
        <div className="w-9 h-9 rounded-full bg-molla-black text-white flex items-center justify-center font-bold text-sm -mr-2.5">M</div>
        <div className="w-9 h-9 rounded-full bg-molla-blue text-white flex items-center justify-center font-bold text-sm -mr-2.5">L</div>
        <div className="w-9 h-9 rounded-full bg-molla-sub text-white flex items-center justify-center font-bold text-xs">+2</div>
      </div>

      <button className="w-full bg-molla-yellow text-molla-black font-bold rounded-2xl py-4 mt-6">
        View tasks →
      </button>
    </div>
  );
}
