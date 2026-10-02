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
  daily: { date: string; count: number }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/analytics", {
        cache: "no-store",
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Impossible de charger les statistiques.");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAnalytics();
  }, []);

  const stats = data
    ? [
        ["Utilisateurs", data.total],
        ["Nouveaux · 7 jours", data.new7],
        ["Actifs · 7 jours", data.active7],
        ["Actifs · 30 jours", data.active30],
        ["Comptes vérifiés", `${data.verificationRate}%`],
        ["Croissance · 30 jours", `${data.growth}%`],
      ]
    : [];

  const maxDaily = Math.max(1, ...(data?.daily.map((day) => day.count) ?? []));

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm text-indigo-400">Administration</p>
            <h1 className="mt-1 text-3xl font-bold">Analytics</h1>
          </div>

          <button
            onClick={() => void loadAnalytics()}
            disabled={loading}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Chargement…" : "Actualiser"}
          </button>
        </header>

        {error && (
          <p role="alert" className="mb-6 rounded-lg bg-red-950 p-4 text-red-300">
            {error}
          </p>
        )}

        {loading && !data && <p className="text-slate-400">Chargement des statistiques…</p>}

        {data && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map(([label, value]) => (
                <article key={label} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-3 text-3xl font-semibold">{value}</p>
                </article>
              ))}
            </section>

            <section className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-6">
              <h2 className="mb-6 text-lg font-semibold">Inscriptions · 30 derniers jours</h2>
              <div className="flex h-48 items-end gap-1">
                {data.daily.map((day) => (
                  <div
                    key={day.date}
                    title={`${day.date} : ${day.count}`}
                    className="min-w-0 flex-1 rounded-t bg-indigo-500 hover:bg-indigo-400"
                    style={{
                      height: `${Math.max(4, (day.count / maxDaily) * 100)}%`,
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>{data.daily[0]?.date}</span>
                <span>{data.daily.at(-1)?.date}</span>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}