"use client";

import { useEffect, useState } from "react";

type Analytics = {
  total: number;
  new7: number;
  active7: number;
  active30: number;
  verified: number;
  verificationRate: number;
  current30: number;
  previous30: number;
  growth: number;
  daily: {
    date: string;
    count: number;
  }[];
};

export default function AdminPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/admin/analytics", {
        cache: "no-store",
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("You must be signed in.");
        }
        if (response.status === 403) {
          throw new Error("You don't have access to Molla Analytics.");
        }
        throw new Error("Could not load analytics.");
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load analytics."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f5f3] px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm text-[#666]">Loading Molla Analytics…</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#f5f5f3] px-5 py-10">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-2xl font-extrabold text-[#111]">
            Molla Analytics
          </h1>

          <div className="mt-6 rounded-2xl border border-[#eae7e2] bg-white p-5">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const max = Math.max(...data.daily.map((item) => item.count), 1);

  return (
    <main className="min-h-screen bg-[#f5f5f3] px-5 py-8 pb-20">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-[#6a6a6a]">
              Admin
            </p>
            <h1 className="mt-1 text-3xl font-extrabold text-[#111]">
              Molla Analytics
            </h1>
          </div>

          <button
            onClick={() => void loadAnalytics()}
            className="rounded-full border border-[#eae7e2] bg-white px-4 py-2 text-sm font-bold text-[#111]"
          >
            Refresh
          </button>
        </div>

        <section className="mt-6 rounded-3xl border border-[#eae7e2] bg-white p-6">
          <p className="text-sm text-[#6a6a6a]">Utilisateurs inscrits</p>
          <div className="mt-1 text-6xl font-extrabold tracking-tight text-[#111]">
            {data.total.toLocaleString("fr-FR")}
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-[#eae7e2] bg-[#eae7e2] md:grid-cols-4">
          <Stat value={data.new7} label="Nouveaux · 7 jours" />
          <Stat value={data.active7} label="Actifs · 7 jours" />
          <Stat value={data.active30} label="Actifs · 30 jours" />
          <Stat value={`${data.verificationRate}%`} label="Emails vérifiés" />
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-[#eae7e2] bg-white p-6">
            <p className="text-sm font-bold text-[#111]">
              Croissance des inscriptions
            </p>

            <div
              className={`mt-2 text-5xl font-extrabold ${
                data.growth >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {data.growth >= 0 ? "+" : ""}
              {data.growth}%
            </div>

            <p className="mt-2 text-sm text-[#6a6a6a]">
              {data.current30} inscriptions sur les 30 derniers jours contre{" "}
              {data.previous30} les 30 jours précédents.
            </p>
          </div>

          <div className="rounded-3xl border border-[#eae7e2] bg-white p-6">
            <p className="text-sm font-bold text-[#111]">
              Utilisateurs vérifiés
            </p>

            <div className="mt-4 h-4 overflow-hidden rounded-full bg-[#f2efe9]">
              <div
                className="h-full rounded-full bg-[#0f172a]"
                style={{ width: `${data.verificationRate}%` }}
              />
            </div>

            <p className="mt-3 text-sm text-[#6a6a6a]">
              {data.verified} utilisateurs vérifiés sur {data.total}.
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-[#eae7e2] bg-white p-6">
          <div>
            <p className="text-lg font-extrabold text-[#111]">
              Nouvelles inscriptions
            </p>
            <p className="text-sm text-[#6a6a6a]">30 derniers jours</p>
          </div>

          <div className="mt-8 flex h-64 items-end gap-1">
            {data.daily.map((item) => (
              <div
                key={item.date}
                className="group flex h-full flex-1 items-end"
                title={`${item.date}: ${item.count}`}
              >
                <div
                  className="w-full rounded-t-md bg-[#111827] transition-opacity group-hover:opacity-70"
                  style={{
                    height: `${Math.max(
                      (item.count / max) * 100,
                      item.count > 0 ? 4 : 0
                    )}%`,
                  }}
                />
              </div>
            ))}
          </div>

          <div className="mt-3 flex justify-between text-[11px] text-[#6a6a6a]">
            <span>{data.daily[0]?.date}</span>
            <span>{data.daily[data.daily.length - 1]?.date}</span>
          </div>
        </section>
      </div>
    </main>
  );
}

function Stat({
  value,
  label,
}: {
  value: number | string;
  label: string;
}) {
  return (
    <div className="bg-white p-5">
      <div className="text-3xl font-extrabold text-[#111]">
        {typeof value === "number"
          ? value.toLocaleString("fr-FR")
          : value}
      </div>

      <div className="mt-1 text-xs font-semibold text-[#6a6a6a]">
        {label}
      </div>
    </div>
  );
}