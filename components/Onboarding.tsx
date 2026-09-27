"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setState } from "@/lib/store";

const steps = [
  {
    key: "goal",
    q: "What's your goal?",
    opts: [
      "Release my first song",
      "Release a single",
      "Release an EP",
      "Grow my audience",
      "Make money from music",
      "Build my artist brand",
      "Find my team",
      "Improve my skills",
      "Stay consistent",
    ],
  },
  {
    key: "where",
    q: "Where are you right now?",
    opts: [
      "Just starting out",
      "I have unreleased music",
      "I've released before",
      "I'm actively building momentum",
    ],
  },
  {
    key: "blocker",
    q: "What's blocking you?",
    opts: [
      "I don't know what to do",
      "I procrastinate",
      "I need collaborators",
      "I don't have the right tools",
      "I need money",
      "I need exposure",
      "I need better skills",
      "I'm stuck",
    ],
  },
  {
    key: "time",
    q: "How much time can you dedicate each day?",
    opts: ["15 min", "30 min", "1 hour", "2+ hours"],
  },
] as const;

export default function Onboarding() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const step = steps[index];
  const selected = answers[step.key];

  function choose(opt: string) {
    setAnswers((a) => ({ ...a, [step.key]: opt }));
  }

  async function next() {
    if (!selected) return;
    if (index < steps.length - 1) {
      setIndex(index + 1);
    } else {
      await setState({ ...answers, onboarded: true } as any);
      router.push("/plan");
    }
  }

  return (
    <div className="flex flex-col min-h-screen px-5 pt-7 pb-6">
      <div className="text-xl font-extrabold tracking-wide mb-6">
        M<span className="inline-flex w-[18px] h-[18px] rounded-full bg-molla-yellow items-center justify-center text-[10px] mx-[1px]">●</span>LLA
      </div>

      <div className="flex gap-1.5 mb-5">
        {steps.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i < index ? "bg-molla-yellow" : "bg-molla-line"}`}
          />
        ))}
      </div>

      <h1 className="text-2xl font-extrabold leading-snug mb-5">{step.q}</h1>

      <div className="flex-1">
        {step.opts.map((opt) => (
          <button
            key={opt}
            onClick={() => choose(opt)}
            className={`block w-full text-left px-4 py-4 mb-2.5 rounded-2xl border-[1.5px] font-semibold ${
              selected === opt
                ? "border-molla-yellow bg-[#FFF9E5]"
                : "border-molla-line bg-white"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      <button
        onClick={next}
        disabled={!selected}
        className="w-full bg-molla-yellow text-molla-black font-bold rounded-2xl py-4 disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}
