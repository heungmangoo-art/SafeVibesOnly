"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "./LocaleProvider";

const GITHUB_BASE = "https://github.com/";

function scoreToColor(score: number): string {
  if (score >= 90) return "#34d399";
  if (score >= 80) return "#34d399";
  if (score >= 70) return "#fbbf24";
  if (score >= 60) return "#f87171";
  return "#f87171";
}

export default function Home() {
  const { t } = useLocale();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = url.trim();
    if (!trimmed) {
      setError(t.errors.urlRequired);
      return;
    }
    if (!trimmed.startsWith(GITHUB_BASE)) {
      setError(t.errors.urlMustStartWith);
      return;
    }
    router.push(`/result?repo=${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-4 px-4 bg-background bg-subtle">
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-6 sm:py-8 text-foreground flex flex-col justify-center">
              <header className="mb-5 text-center space-y-2">
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl leading-snug whitespace-pre-line">
                  {t.home.heroTitle}
                </h1>
                <p className="text-sm text-foreground/75 sm:text-base leading-relaxed max-w-xl mx-auto">
                  {t.home.heroSubtitle}
                </p>
                <p className="text-xs text-foreground/50 leading-relaxed max-w-xl mx-auto whitespace-pre-line">
                  {t.home.scopeNote}
                </p>
              </header>

              <form onSubmit={handleSubmit} className="mb-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.home.placeholder}
                    className="flex-1 rounded-3xl border border-foreground/12 bg-foreground/[0.04] px-5 py-3.5 text-foreground placeholder:text-foreground/40 focus:border-point/60 focus:outline-none focus:ring-2 focus:ring-point/15 transition-all shadow-sm"
                    aria-invalid={!!error}
                    aria-describedby={error ? "url-error" : undefined}
                  />
                  <button
                    type="submit"
                    className="rounded-3xl bg-point px-6 py-3.5 font-semibold text-[#0d1117] transition hover:opacity-90 hover:shadow-lg hover:shadow-point/25 active:scale-[0.98] shadow-md shadow-point/15"
                  >
                    {t.home.scanNow}
                  </button>
                </div>
                {error && (
                  <p id="url-error" className="mt-2 text-sm text-red-400/90" role="alert">
                    {error}
                  </p>
                )}
              </form>

              <section className="rounded-3xl border border-foreground/10 bg-foreground/[0.03] p-4 shadow-sm">
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground/55">
                  {t.home.demo}
                </h2>
                {(() => {
                  const demoScore = { security: 82, quality: 75, dependency: 52 };
                  const totalScore = Math.round(
                    demoScore.security * 0.4 + demoScore.quality * 0.35 + demoScore.dependency * 0.25
                  );
                  const grade = totalScore >= 90 ? "S" : totalScore >= 80 ? "A" : totalScore >= 70 ? "B" : totalScore >= 60 ? "C" : "D";
                  const totalColor = scoreToColor(totalScore);
                  const items = [
                    { label: t.home.security, value: demoScore.security },
                    { label: t.home.codeQuality, value: demoScore.quality },
                    { label: t.home.dependencyRisk, value: demoScore.dependency },
                  ];
                  return (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold sm:text-3xl" style={{ color: totalColor }}>
                            {totalScore}
                          </span>
                          <span className="text-foreground/60 text-sm">/ 100</span>
                        </div>
                        <span
                          className="rounded-2xl px-3 py-1 font-mono text-xs font-semibold"
                          style={{ backgroundColor: `${totalColor}20`, color: totalColor }}
                        >
                          {grade}
                        </span>
                        <img
                          src={`/api/badge/demo/example?score=${totalScore}&grade=${grade}`}
                          alt={`SafeVibesOnly Score: ${totalScore} (${grade})`}
                          className="h-6"
                        />
                      </div>
                      <div className="mt-4 space-y-2">
                        {items.map(({ label, value }) => {
                          const barColor = scoreToColor(value);
                          return (
                            <div key={label}>
                              <div className="mb-1 flex justify-between text-xs text-foreground/65">
                                <span>{label}</span>
                                <span style={{ color: barColor }}>{value}</span>
                              </div>
                              <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
                                <div
                                  className="h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${value}%`, backgroundColor: barColor }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  );
                })()}
              </section>

              <p className="mt-4 text-center text-xs text-foreground/55">
                <Link
                  href="/result?repo=https://github.com/vercel/next.js"
                  className="text-accent hover:underline hover:text-accent/90 transition rounded-full px-4 py-2 hover:bg-accent/10"
                >
                  {t.home.trySample}
                </Link>
              </p>
      </main>
    </div>
  );
}
