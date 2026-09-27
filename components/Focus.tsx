"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getState, setState } from "@/lib/store";

export default function Focus() {
  const router = useRouter();
  const [title, setTitle] = useState("Finish the second verse of your single");
  const [secondsLeft, setSecondsLeft] = useState(45 * 60);
  const [status, setStatus] = useState("Timer's running. Come back and mark it done when you finish.");

  useEffect(() => {
    (async () => {
      const s = await getState();
      setTitle(s.nextMoveTitle);
      setSecondsLeft(s.nextMoveMinutes * 60);
    })();
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) {
      setStatus("Time's up — mark it done if you finished, or keep going.");
      return;
    }
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  async function complete() {
    const s = await getState();
    await setState({
      artworkDone: true,
      progress: Math.min(100, s.progress + 6),
      nextMoveTitle: "Create your single's artwork",
      nextMoveMinutes: 30,
      streak: s.streak + 1,
    });
    router.push("/");
  }

  const m = Math.max(0, Math.floor(secondsLeft / 60));
  const sec = Math.max(0, secondsLeft % 60);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-5 pt-5">
        <button
          onClick={() => router.push("/")}
          className="w-8.5 h-8.5 w-[34px] h-[34px] rounded-full bg-molla-gray flex items-center justify-center"
        >
          ←
        </button>
        <h2 className="text-[17px] font-extrabold">Focus session</h2>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-sm text-molla-sub">MY FIRST SINGLE</p>
        <h1 className="text-xl font-extrabold mt-2 leading-snug">{title}</h1>
        <div className="text-5xl font-extrabold tabular-nums mt-5 mb-2">
          {m}:{String(sec).padStart(2, "0")}
        </div>
        <p className="text-sm text-molla-sub">{status}</p>

        <button
          onClick={complete}
          className="w-full bg-molla-yellow text-molla-black font-bold rounded-2xl py-4 mt-7"
        >
          Mark move as complete
        </button>
        <button
          onClick={() => router.push("/ai")}
          className="w-full border border-molla-line text-molla-sub font-bold rounded-2xl py-4 mt-2.5"
        >
          Ask MOLLA for help instead
        </button>
      </div>
    </div>
  );
}
