"use client";

import { useCallback, useEffect, useState } from "react";

type DailyPoint = { date: string; count: number };

type Analytics = {
  total: number;
  verified: number;
  new7: number;
  active7: number;
  active30: number;
  verificationRate: number;
  growth: number;
  current30: number;
  previous30: number;
  daily: DailyPoint[];
  activityDaily: DailyPoint[];
};

export default function AdminPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/analytics", { cache: "no-store" });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Impossible de charger les statistiques.");
      }

      setData(result as Analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const maxSignups = Math.max(1, ...(data?.daily.map((point) => point.count) ?? []));
  const maxActivity = Math.max(1, ...(data?.activityDaily.map((point) => point.count) ?? []));
  const growthMax = Math.max(1, data?.current30 ?? 0, data?.previous30 ?? 0);
  const linePoints = (data?.activityDaily ?? [])
    .map((point, index, points) => {
      const x = points.length > 1 ? (index / (points.length - 1)) * 600 : 300;
      const y = 160 - (point.count / maxActivity) * 140;
      return `${x},${y}`;
    })
    .join(" ");

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

  return (
    <main
      className="min-h-screen px-6 py-10"
      style={{ backgroundColor: "#f8fafc", color: "#0f172a" }}
    >
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-indigo-600">Administration</p>
            <h1 className="mt-1 text-3xl font-bold">Analytics</h1>
          </div>
          <button
            onClick={() => void loadAnalytics()}
            disabled={loading}
            className="rounded-lg border border-slate-300 px-4 py-2 hover:bg-slate-100 disabled:opacity-50"
          >
            {loading ? "Chargement…" : "Actualiser"}
          </button>
        </header>

        {error && <p role="alert" className="mb-6 text-red-600">{error}</p>}
        {loading && !data && <p className="text-slate-500">Chargement…</p>}

        {data && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {stats.map(([label, value]) => (
                <article key={label} className="rounded-xl border border-slate-200 bg-white p-5">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-3 text-3xl font-semibold">{value}</p>
                </article>
              ))}
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-2">
              <article className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-6 text-lg font-semibold">Inscriptions · 30 jours</h2>
                <div className="flex h-48 items-end gap-1">
                  {data.daily.map((point) => (
                    <div
                      key={point.date}
                      title={`${point.date} : ${point.count} inscription(s)`}
                      className="min-w-0 flex-1 rounded-t bg-indigo-500"
                      style={{ height: `${Math.max(3, (point.count / maxSignups) * 100)}%` }}
                    />
                  ))}
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-6 text-lg font-semibold">Utilisateurs actifs uniques · 30 jours</h2>
                <svg viewBox="0 0 600 180" className="h-48 w-full" role="img" aria-label="Courbe d’activité quotidienne">
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke="#0d9488"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-6 text-lg font-semibold">Vérification des comptes</h2>
                <div className="flex items-center justify-center gap-6">
                  <div
                    className="grid h-36 w-36 place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(#4f46e5 ${data.verificationRate}%, #e2e8f0 0)`,

                    }}
                    aria-label={`${data.verificationRate}% des comptes vérifiés`}
                  >
                    <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-xl font-bold">
                      {data.verificationRate}%
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    <p>{data.verified} vérifiés</p>
                    <p>{Math.max(0, data.total - data.verified)} non vérifiés</p>
                  </div>
                </div>
              </article>

              <article className="rounded-xl border border-slate-200 bg-white p-6">
                <h2 className="mb-6 text-lg font-semibold">Inscriptions · comparaison sur 30 jours</h2>
                <div className="space-y-5">
                  {([
                    ["30 jours actuels", data.current30, "bg-indigo-500"],
                    ["30 jours précédents", data.previous30, "bg-sky-400"],
                  ])
                    .map(([label, value, color]) => (
                      <div key={String(label)}>
                        <div className="mb-2 flex justify-between text-sm">
                          <span>{label}</span><span>{value}</span>
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${color}`}
                            style={{ width: `${(Number(value) / growthMax) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}