"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Opportunity = {
  id: string;
  tag: string;
  title: string;
  meta: string | null;
};

const gradients = [
  "from-molla-blue to-molla-black",
  "from-molla-yellow to-molla-black",
  "from-molla-black to-molla-blue",
];

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: opps } = await supabase
        .from("opportunities")
        .select("*")
        .order("created_at", { ascending: true });
      setOpportunities(opps ?? []);

      if (user) {
        const { data: apps } = await supabase
          .from("opportunity_applications")
          .select("opportunity_id")
          .eq("user_id", user.id);
        setApplied(new Set((apps ?? []).map((a) => a.opportunity_id)));
      }
      setLoading(false);
    })();
  }, []);

  async function apply(opportunityId: string) {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setApplied((a) => new Set(a).add(opportunityId));
    await supabase
      .from("opportunity_applications")
      .upsert({ user_id: user.id, opportunity_id: opportunityId });
  }

  return (
    <div className="pt-6 pb-28">
      <h2 className="text-lg font-extrabold px-5">Opportunities</h2>

      <div className="flex gap-2 px-5 mt-3.5 overflow-x-auto">
        {["All", "Open mics", "Showcases", "Playlists"].map((f, i) => (
          <span
            key={f}
            className={`px-3.5 py-2 rounded-full text-[13px] font-bold whitespace-nowrap ${
              i === 0 ? "bg-molla-black text-white" : "bg-molla-gray"
            }`}
          >
            {f}
          </span>
        ))}
      </div>

      <div className="px-5 mt-4 space-y-3.5">
        {loading && <p className="text-sm text-molla-sub">Loading…</p>}
        {!loading && opportunities.length === 0 && (
          <p className="text-sm text-molla-sub">No opportunities posted yet — check back soon.</p>
        )}
        {opportunities.map((o, i) => {
          const isApplied = applied.has(o.id);
          return (
            <div key={o.id} className="border border-molla-line rounded-card p-4">
              <div className={`h-[100px] rounded-xl mb-3 bg-gradient-to-br ${gradients[i % gradients.length]}`} />
              <span className="bg-molla-yellow text-molla-black text-[11px] font-extrabold px-2.5 py-1 rounded-full">
                {o.tag}
              </span>
              <h4 className="font-extrabold mt-2">{o.title}</h4>
              {o.meta && <p className="text-sm text-molla-sub mt-1.5 mb-3.5">{o.meta}</p>}
              <button
                onClick={() => !isApplied && apply(o.id)}
                disabled={isApplied}
                className={`w-full font-bold rounded-2xl py-3.5 ${
                  isApplied ? "bg-molla-gray text-molla-sub" : "bg-molla-black text-white"
                }`}
              >
                {isApplied ? "Applied ✓" : "Apply →"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
