"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Msg = { who: "bot" | "user"; text: string };

const starterPrompts = [
  "What should I do today?",
  "I need a producer.",
  "Help me promote my single.",
];

const canned: { keys: string[]; reply: string }[] = [
  {
    keys: ["promot", "market"],
    reply:
      "Let's make it simple.\n\nYour next 3 moves:\n1. Create your release announcement.\n2. Record 3 short videos using the song.\n3. Send the song to 5 relevant creators.\n\nStart with #1.",
  },
  {
    keys: ["producer", "collaborat"],
    reply:
      "Got it. I'll surface 3 producers near you who fit your genre — check the Connect tab. Want me to draft a message to send them?",
  },
  {
    keys: ["release"],
    reply:
      "Here's the order that works best:\n1. Lock the final mix.\n2. Finish artwork.\n3. Submit to distribution 2 weeks early.\n4. Line up promo content.\n\nStart with #1.",
  },
  {
    keys: ["today", "next"],
    reply:
      "Right now, your highest-impact move is finishing the second verse of your single — it's blocking mixing. Want to start a focus session?",
  },
  {
    keys: ["stuck", "finish"],
    reply:
      "Let's shrink it. Pick the smallest next physical action — even 10 minutes counts. What's the very next thing you'd do if you sat down right now?",
  },
];

export default function MollaAI() {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([
    { who: "bot", text: "Hey Jay 👋 What do you need help with today?" },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, typing]);

  function send(text: string) {
    const val = text.trim();
    if (!val) return;
    setMessages((m) => [...m, { who: "user", text: val }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      const lower = val.toLowerCase();
      const hit = canned.find((c) => c.keys.some((k) => lower.includes(k)));
      setTyping(false);
      setMessages((m) => [
        ...m,
        {
          who: "bot",
          text:
            hit?.reply ||
            "Let's make it simple.\n\nYour next move: break this into one small, doable step and do it in the next 30 minutes. What's the step?",
        },
      ]);
    }, 700);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex items-center gap-3 px-5 pt-5">
        <button
          onClick={() => router.push("/")}
          className="w-[34px] h-[34px] rounded-full bg-molla-gray flex items-center justify-center"
        >
          ←
        </button>
        <div className="text-base font-extrabold tracking-wide">
          M<span className="inline-flex w-[14px] h-[14px] rounded-full bg-molla-yellow items-center justify-center text-[9px] mx-[1px]">●</span>LLA AI
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-4 py-3 rounded-2xl mb-2.5 text-sm leading-relaxed whitespace-pre-line ${
              m.who === "bot"
                ? "bg-molla-gray rounded-bl-sm"
                : "bg-molla-blue text-white ml-auto rounded-br-sm"
            }`}
          >
            {m.text}
          </div>
        ))}
        {typing && (
          <div className="bg-molla-gray rounded-2xl rounded-bl-sm w-16 px-4 py-3.5 flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-molla-sub animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-molla-sub animate-pulse [animation-delay:0.2s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-molla-sub animate-pulse [animation-delay:0.4s]" />
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 px-5 mb-2">
          {starterPrompts.map((p) => (
            <button
              key={p}
              onClick={() => send(p)}
              className="border-[1.5px] border-molla-line rounded-full px-3.5 py-2 text-[13px] font-bold"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2.5 px-5 py-3.5 border-t border-molla-line">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send(input)}
          placeholder="Type a message…"
          className="flex-1 border border-molla-line rounded-full px-4 py-3 text-sm"
        />
        <button
          onClick={() => send(input)}
          className="w-[42px] h-[42px] rounded-full bg-molla-blue text-white flex-shrink-0"
        >
          ➤
        </button>
      </div>
    </div>
  );
}
