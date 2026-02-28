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
    <div className="h-full flex flex-col items-center justify-center py-2 px-4 bg-background bg-subtle relative min-h-0 overflow-auto">
      <Link
        href="/"
        className="absolute left-4 top-2 flex items-center gap-2"
        aria-label="Safe Vibes Only"
      >
        <span className="flex flex-col gap-1 rounded-lg bg-foreground/10 p-1 shrink-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f87171]" aria-hidden />
          <span className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]" aria-hidden />
          <span className="w-2.5 h-2.5 rounded-full bg-[#34d399]" aria-hidden />
        </span>
        <span className="text-xs font-semibold tracking-tight text-foreground hover:text-point transition">
          Safe Vibes Only.
        </span>
      </Link>
      <main className="flex-1 flex flex-col justify-center w-full max-w-2xl px-4 py-2 text-foreground min-h-0">
              <header className="mb-3 text-left space-y-1">
                <h1 className="text-base font-semibold tracking-tight text-foreground leading-snug">
                  {t.home.heroTitle}
                </h1>
                <p className="text-xs text-foreground/75 leading-relaxed max-w-xl">
                  {t.home.heroSubtitle}
                </p>
                <p className="text-[11px] text-foreground/50 leading-relaxed max-w-xl whitespace-pre-line">
                  {t.home.scopeNote}
                </p>
              </header>

              <form onSubmit={handleSubmit} className="mb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t.home.placeholder}
                    className="flex-1 min-w-0 rounded-lg border border-foreground/15 bg-foreground/[0.04] px-3 py-2.5 text-sm text-foreground placeholder:text-foreground/45 focus:border-point/50 focus:outline-none focus:ring-1 focus:ring-point/20 transition-colors"
                    aria-invalid={!!error}
                    aria-describedby={error ? "url-error" : undefined}
                  />
                  <button
                    type="submit"
                    className="shrink-0 rounded-lg bg-point px-5 py-2.5 text-sm font-medium text-[#0d1117] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-point/30 focus:ring-offset-2 focus:ring-offset-background"
                  >
                    {t.home.scanNow}
                  </button>
                </div>
                {error && (
                  <p id="url-error" className="mt-1.5 text-xs text-red-400/90" role="alert">
                    {error}
                  </p>
                )}
              </form>

              <section className="rounded-lg border border-foreground/10 bg-foreground/[0.03] p-3">
                <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/60">
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
                      <div className="flex flex-wrap items-center gap-3 border-b border-foreground/10 pb-2">
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-semibold tabular-nums" style={{ color: totalColor }}>
                            {totalScore}
                          </span>
                          <span className="text-foreground/50 text-xs">/ 100</span>
                        </div>
                        <span
                          className="rounded px-1.5 py-0.5 font-mono text-[11px] font-medium"
                          style={{ backgroundColor: `${totalColor}18`, color: totalColor }}
                        >
                          {grade}
                        </span>
                        <img
                          src={`/api/badge/demo/example?score=${totalScore}&grade=${grade}`}
                          alt={`SafeVibesOnly Score: ${totalScore} (${grade})`}
                          className="h-5 ml-auto"
                        />
                      </div>
                      <dl className="mt-2 space-y-1.5">
                        {items.map(({ label, value }) => {
                          const barColor = scoreToColor(value);
                          return (
                            <div key={label}>
                              <div className="mb-0.5 flex justify-between text-[11px]">
                                <dt className="text-foreground/70">{label}</dt>
                                <dd className="tabular-nums font-medium" style={{ color: barColor }}>{value}</dd>
                              </div>
                              <div className="h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
                                <div
                                  className="h-1 rounded-full transition-[width] duration-300"
                                  style={{ width: `${value}%`, backgroundColor: barColor }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </dl>
                    </>
                  );
                })()}
              </section>

              <p className="mt-3 text-left text-[11px] text-foreground/55">
                <Link
                  href="/result?repo=https://github.com/vercel/next.js"
                  className="text-accent hover:underline hover:text-accent/90 transition"
                >
                  {t.home.trySample}
                </Link>
              </p>
      </main>
    </div>
  );
}
