"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getState, blockerCopy, timeToMinutes, setState } from "@/lib/store";

const weeks = [
  { label: "Week 1", tasks: [["Finish the song", true], ["Define artist identity", true], ["Find a mixing engineer", false]] },
  { label: "Week 2", tasks: [["Finish mix", false], ["Create artwork", false], ["Prepare release assets", false]] },
  { label: "Week 3", tasks: [["Create promotional content", false], ["Prepare release campaign", false], ["Contact collaborators", false]] },
  { label: "Week 4", tasks: [["Release", false], ["Promote", false], ["Track results", false]] },
] as const;

export default function Plan() {
  const router = useRouter();
  const [goal, setGoal] = useState("");
  const [note, setNote] = useState("Let's make real progress, one small move at a time.");
  const [blockerLabel, setBlockerLabel] = useState("Here's how we'll work around that.");

  useEffect(() => {
    (async () => {
      const s = await getState();
      if (s.goal) setGoal(s.goal.charAt(0).toLowerCase() + s.goal.slice(1));
      if (s.blocker) {
        setBlockerLabel(`You told us: "${s.blocker}"`);
        setNote(blockerCopy[s.blocker] || note);
      }
      if (s.time && timeToMinutes[s.time]) {
        await setState({ nextMoveMinutes: timeToMinutes[s.time] });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="px-5 pt-6 pb-10">
      <div className="text-xl font-extrabold tracking-wide mb-2">
        M<span className="inline-flex w-[18px] h-[18px] rounded-full bg-molla-yellow items-center justify-center text-[10px] mx-[1px]">●</span>LLA
      </div>

      <h1 className="text-[22px] font-extrabold mt-3">
        Your 30-day plan{goal ? ` to ${goal}` : ""}
      </h1>
      <p className="text-sm text-molla-sub mt-1.5">Built from your answers. Adjusts as you go.</p>

      <div className="bg-molla-blue text-white rounded-3xl mt-4 p-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold">{blockerLabel}</h3>
          <p className="text-sm text-[#DCE7FF] mt-1">{note}</p>
        </div>
        <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
      </div>

      {weeks.map((w) => (
        <div key={w.label} className="border border-molla-line rounded-card p-5 mt-3.5">
          <div className="font-extrabold text-sm mb-2.5">{w.label}</div>
          {w.tasks.map(([label, done]) => (
            <div key={label as string} className="flex items-center gap-2.5 py-1.5 text-sm">
              <div
                className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] text-white ${
                  done ? "bg-green-600 border-green-600" : "border-molla-line"
                }`}
              >
                {done ? "✓" : ""}
              </div>
              {label}
            </div>
          ))}
        </div>
      ))}

      <button
        onClick={() => router.push("/")}
        className="w-full bg-molla-yellow text-molla-black font-bold rounded-2xl py-4 mt-6"
      >
        Go to my dashboard →
      </button>
    </div>
  );
}
