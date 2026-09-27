"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Collaborator = {
  id: string;
  name: string;
  role: string;
  location: string | null;
  genres: string | null;
  skills: string | null;
};

const filters = ["All", "Producers", "Engineers", "Designers"];

export default function Connect() {
  const [people, setPeople] = useState<Collaborator[]>([]);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: collaborators } = await supabase
        .from("collaborators")
        .select("*")
        .order("created_at", { ascending: true });
      setPeople(collaborators ?? []);

      if (user) {
        const { data: reqs } = await supabase
          .from("connection_requests")
          .select("collaborator_id")
          .eq("user_id", user.id);
        setRequested(new Set((reqs ?? []).map((r) => r.collaborator_id)));
      }
      setLoading(false);
    })();
  }, []);

  async function connect(collaboratorId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setRequested((r) => new Set(r).add(collaboratorId));
    await supabase
      .from("connection_requests")
      .upsert({ user_id: user.id, collaborator_id: collaboratorId });
  }

  const filterMap: Record<string, string> = {
    Producers: "Producer",
    Engineers: "Engineer",
    Designers: "Designer",
  };
  const visible =
    activeFilter === "All"
      ? people
      : people.filter((p) => p.role.includes(filterMap[activeFilter] ?? ""));

  return (
    <div className="pt-6 pb-28">
      <h2 className="text-lg font-extrabold px-5">Connect</h2>

      <div className="mx-5 mt-3.5 bg-molla-gray rounded-2xl px-4 py-3 text-sm text-molla-sub">
        Search for a collaborator…
      </div>

      <div className="flex gap-2 px-5 mt-3 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3.5 py-2 rounded-full text-[13px] font-bold whitespace-nowrap ${
              activeFilter === f ? "bg-molla-black text-white" : "bg-molla-gray"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="mt-2">
        {loading && <p className="px-5 py-6 text-sm text-molla-sub">Loading…</p>}
        {!loading && visible.length === 0 && (
          <p className="px-5 py-6 text-sm text-molla-sub">No collaborators match this filter yet.</p>
        )}
        {visible.map((p) => {
          const isRequested = requested.has(p.id);
          return (
            <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 border-b border-molla-line">
              <div className="w-[52px] h-[52px] rounded-full bg-molla-gray flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-extrabold text-[15px]">{p.name}</h4>
                <p className="text-[13px] text-molla-sub mt-0.5">
                  {p.role}
                  {p.location ? ` · ${p.location}` : ""}
                </p>
                {(p.genres || p.skills) && (
                  <p className="text-[13px] text-molla-sub">{p.genres || p.skills}</p>
                )}
              </div>
              <button
                onClick={() => !isRequested && connect(p.id)}
                disabled={isRequested}
                className={`rounded-lg px-3.5 py-2 text-[13px] font-bold flex-shrink-0 ${
                  isRequested ? "bg-molla-gray text-molla-sub" : "bg-molla-blue text-white"
                }`}
              >
                {isRequested ? "Requested" : "Connect"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="text-xs font-extrabold text-molla-sub px-5 mt-6">RECOMMENDED FOR YOU</div>
      <p className="text-sm text-molla-sub px-5 mt-1.5">
        You&rsquo;re preparing a release. These mixing engineers may help.
      </p>
    </div>
  );
}
