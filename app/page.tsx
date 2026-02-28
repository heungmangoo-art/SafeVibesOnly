"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "./LocaleProvider";

const GITHUB_BASE = "https://github.com/";

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
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-2xl px-6 py-16">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t.home.heroTitle}
          </h1>
          <p className="text-lg text-foreground/80">
            {t.home.heroSubtitle}
          </p>
        </header>

        <form onSubmit={handleSubmit} className="mb-16">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t.home.placeholder}
              className="flex-1 rounded-lg border border-foreground/20 bg-foreground/5 px-4 py-3 text-foreground placeholder:text-foreground/50 focus:border-point focus:outline-none focus:ring-1 focus:ring-point"
              aria-invalid={!!error}
              aria-describedby={error ? "url-error" : undefined}
            />
            <button
              type="submit"
              className="rounded-lg bg-point px-6 py-3 font-medium text-background transition hover:opacity-90"
            >
              {t.home.scanNow}
            </button>
          </div>
          {error && (
            <p id="url-error" className="mt-2 text-sm text-red-400" role="alert">
              {error}
            </p>
          )}
        </form>

        <section className="rounded-xl border border-foreground/10 bg-foreground/5 p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-foreground/70">
            {t.home.demo}
          </h2>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-point">78</span>
              <span className="text-foreground/70">/ 100</span>
            </div>
            <span className="rounded bg-foreground/15 px-3 py-1 font-mono text-sm font-medium text-point">
              B
            </span>
            <img
              src="/api/badge/demo/example?score=78&grade=B"
              alt="SafeVibesOnly Score: 78 (B)"
              className="h-7"
            />
          </div>
          <div className="mt-6 space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-xs text-foreground/70">
                <span>{t.home.security}</span>
                <span>82</span>
              </div>
              <div className="h-2 w-full rounded-full bg-foreground/10">
                <div
                  className="h-2 rounded-full bg-point"
                  style={{ width: "82%" }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-foreground/70">
                <span>{t.home.codeQuality}</span>
                <span>75</span>
              </div>
              <div className="h-2 w-full rounded-full bg-foreground/10">
                <div
                  className="h-2 rounded-full bg-point"
                  style={{ width: "75%" }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-foreground/70">
                <span>{t.home.dependencyRisk}</span>
                <span>77</span>
              </div>
              <div className="h-2 w-full rounded-full bg-foreground/10">
                <div
                  className="h-2 rounded-full bg-point"
                  style={{ width: "77%" }}
                />
              </div>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-foreground/60">
          <Link href="/result?repo=https://github.com/vercel/next.js" className="text-point hover:underline">
            {t.home.trySample}
          </Link>
        </p>
      </main>
    </div>
  );
}
