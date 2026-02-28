"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { saveScanResult } from "@/lib/supabase";
import { parseRepoUrl, isValidRepoUrl } from "@/lib/repo";
import type { ScanResult, ScoreDetail } from "@/lib/types";
import { useLocale } from "../LocaleProvider";

const BADGE_BASE = "https://SafeVibesOnly.dev";

function getGradeColor(grade: string): string {
  if (grade === "S" || grade === "A") return "#00ff88";
  if (grade === "B") return "#ffcc00";
  return "#ff4444";
}

function ResultLoadingFallback() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground/20 border-t-point" />
      <p className="mt-4 text-foreground/80">{t.result.loading}</p>
    </div>
  );
}

function ResultContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const repoParam = searchParams.get("repo") ?? "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!repoParam.trim() || !isValidRepoUrl(repoParam)) {
      router.replace("/");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);
    fetch(`/api/scan?repo=${encodeURIComponent(repoParam)}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (res.ok) return data as ScanResult;
        const msg = typeof data?.error === "string" ? data.error : "Scan failed";
        throw new Error(msg);
      })
      .then(async (data: ScanResult) => {
        if (cancelled) return;
        try {
          await saveScanResult(data);
        } catch {
          // ignore
        }
        setResult(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setResult(null);
          setErrorMessage(err instanceof Error ? err.message : "Scan failed");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [repoParam, router]);

  useEffect(() => {
    if (!repoParam.trim() || !isValidRepoUrl(repoParam)) return;
    if (!loading && !result && !errorMessage) {
      router.replace("/");
    }
  }, [loading, result, errorMessage, repoParam, router]);

  const parsed = parseRepoUrl(repoParam);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-foreground/20 border-t-point" />
        <p className="mt-4 text-foreground/80">{t.result.scanning}</p>
      </div>
    );
  }

  if (!result) {
    if (errorMessage) {
      return (
        <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
          <div className="max-w-md text-center">
            <p className="text-foreground font-mono text-lg mb-2">{t.result.scanErrorTitle}</p>
            <p className="text-foreground/80 text-sm mb-6 whitespace-pre-wrap">{errorMessage}</p>
            <Link
              href="/"
              className="text-point hover:underline text-sm"
            >
              {t.result.back}
            </Link>
          </div>
        </div>
      );
    }
    return null;
  }

  if (!parsed) {
    return null;
  }

  const { username, repo } = parsed;
  const gradeColor = getGradeColor(result.grade);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,minmax(320px,400px)] gap-8 lg:gap-12">
          {/* Left: technical score & details */}
          <div className="min-w-0">
        <Link
          href="/"
          className="text-sm text-point hover:underline mb-6 inline-block"
        >
          {t.result.back}
        </Link>

        <header className="mb-8">
          <h1 className="font-mono text-lg text-foreground/80 break-all">
            {username} / {repo}
          </h1>
          <a
            href={result.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-point hover:underline text-sm"
          >
            {result.repoUrl}
          </a>
        </header>

        <section className="mb-10">
          <div className="flex flex-col items-center gap-4">
            <div className="relative h-32 w-32">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity={0.1}
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={gradeColor}
                  strokeWidth="2"
                  strokeDasharray={`${result.totalScore}, 100`}
                  strokeLinecap="round"
                  className="transition-[stroke-dasharray] duration-700"
                />
              </svg>
            </div>
            <div className="text-center">
              <span className="text-5xl font-bold" style={{ color: gradeColor }}>
                {result.totalScore}
              </span>
              <span className="text-foreground/70 ml-1">/ 100</span>
            </div>
            <span
              className="rounded px-4 py-1.5 font-mono text-lg font-medium"
              style={{ backgroundColor: `${gradeColor}20`, color: gradeColor }}
            >
              {t.result.grade} {result.grade}
            </span>
          </div>
        </section>

        <section className="mb-10 space-y-4">
          <h2 className="text-sm font-medium uppercase tracking-wider text-foreground/70">
            {t.result.breakdown}
          </h2>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-sm text-foreground/80">
                <span>{t.home.security}</span>
                <span>{result.security}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-foreground/10">
                <div
                  className="h-2 rounded-full bg-point transition-[width] duration-500"
                  style={{ width: `${result.security}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm text-foreground/80">
                <span>{t.home.codeQuality}</span>
                <span>{result.quality}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-foreground/10">
                <div
                  className="h-2 rounded-full bg-point transition-[width] duration-500"
                  style={{ width: `${result.quality}%` }}
                />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm text-foreground/80">
                <span>{t.home.dependencyRisk}</span>
                <span>{result.dependencyRisk}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-foreground/10">
                <div
                  className="h-2 rounded-full bg-point transition-[width] duration-500"
                  style={{ width: `${result.dependencyRisk}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {result.details && result.details.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-foreground/70">
              {t.result.detailsTitle}
            </h2>
            <div className="space-y-6">
              {(["security", "quality", "dependency"] as const).map((cat) => {
                const items = result.details!.filter((d) => d.category === cat);
                if (items.length === 0) return null;
                const categoryLabel =
                  cat === "security"
                    ? t.home.security
                    : cat === "quality"
                      ? t.home.codeQuality
                      : t.home.dependencyRisk;
                return (
                  <div key={cat} className="rounded-lg border border-foreground/10 bg-foreground/5 p-4">
                    <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-foreground/60">
                      {categoryLabel}
                    </h3>
                    <ul className="space-y-3">
                      {items.map((item) => (
                        <DetailRow key={item.id} item={item} t={t} />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mb-10 rounded-lg border border-foreground/10 bg-foreground/5 p-4">
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground/60">
            {t.result.scoreCriteriaTitle}
          </h3>
          <ul className="space-y-1 text-xs text-foreground/70">
            <li>• {t.result.scoreCriteriaSecurity}</li>
            <li>• {t.result.scoreCriteriaQuality}</li>
            <li>• {t.result.scoreCriteriaDeps}</li>
          </ul>
        </section>

        <section className="rounded-xl border border-foreground/10 bg-foreground/5 p-6">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-foreground/70">
            {t.result.badge}
          </h2>
          <p className="mb-2 text-xs text-foreground/70">
            {t.result.preview}
          </p>
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-background/80 p-4">
            <img
              src={`/api/badge/${username}/${repo}?score=${result.totalScore}&grade=${encodeURIComponent(result.grade)}`}
              alt={`SafeVibesOnly Score: ${result.totalScore}`}
              className="h-7"
            />
          </div>
          <p className="mb-2 text-xs text-foreground/70">
            {t.result.addToReadme}
          </p>
          <pre className="mb-4 overflow-x-auto rounded bg-background p-4 text-sm text-foreground/90">
            {`![SafeVibesOnly Score](${BADGE_BASE}/api/badge/${username}/${repo})`}
          </pre>
          <CopyButton
            text={`![SafeVibesOnly Score](${BADGE_BASE}/api/badge/${username}/${repo})`}
            copyLabel={t.result.copy}
            copiedLabel={t.result.copied}
          />
        </section>
          </div>

          {/* Right: plain-language panel for non-developers */}
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <PlainPanel t={t} />
          </aside>
        </div>
      </main>
    </div>
  );
}

function PlainPanel({ t }: { t: ReturnType<typeof useLocale>["t"] }) {
  const plain = t.result as unknown as {
    plainTitle: string;
    plainIntro: string;
    plainSecurityWhat: string;
    plainSecurityExample: string;
    plainQualityWhat: string;
    plainQualityExample: string;
    plainDependencyWhat: string;
    plainDependencyExample: string;
    plainTermsTitle: string;
    plainTermLabel: { env: string; secrets: string; readme: string; lockFile: string; ci: string; license: string };
    plainTerms: {
      env: string;
      secrets: string;
      readme: string;
      lockFile: string;
      ci: string;
      license: string;
    };
  };
  return (
    <div className="rounded-xl border border-foreground/15 bg-foreground/[0.03] p-5 md:p-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-point">
        {plain.plainTitle}
      </h2>
      <p className="mb-5 text-sm text-foreground/85 leading-relaxed">
        {plain.plainIntro}
      </p>

      <div className="space-y-5">
        <div>
          <p className="mb-1.5 text-xs font-medium text-foreground/90">
            {plain.plainSecurityWhat}
          </p>
          <p className="text-xs text-foreground/70 leading-relaxed">
            {plain.plainSecurityExample}
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-foreground/90">
            {plain.plainQualityWhat}
          </p>
          <p className="text-xs text-foreground/70 leading-relaxed">
            {plain.plainQualityExample}
          </p>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-foreground/90">
            {plain.plainDependencyWhat}
          </p>
          <p className="text-xs text-foreground/70 leading-relaxed">
            {plain.plainDependencyExample}
          </p>
        </div>
      </div>

      <h3 className="mt-6 mb-2 text-xs font-medium uppercase tracking-wider text-foreground/70">
        {plain.plainTermsTitle}
      </h3>
      <dl className="space-y-2.5 text-xs text-foreground/75">
        <div>
          <dt className="font-medium text-foreground/90">· {plain.plainTermLabel.env}</dt>
          <dd className="mt-0.5 pl-0">{plain.plainTerms.env}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground/90">· {plain.plainTermLabel.secrets}</dt>
          <dd className="mt-0.5 pl-0">{plain.plainTerms.secrets}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground/90">· {plain.plainTermLabel.readme}</dt>
          <dd className="mt-0.5 pl-0">{plain.plainTerms.readme}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground/90">· {plain.plainTermLabel.lockFile}</dt>
          <dd className="mt-0.5 pl-0">{plain.plainTerms.lockFile}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground/90">· {plain.plainTermLabel.ci}</dt>
          <dd className="mt-0.5 pl-0">{plain.plainTerms.ci}</dd>
        </div>
        <div>
          <dt className="font-medium text-foreground/90">· {plain.plainTermLabel.license}</dt>
          <dd className="mt-0.5 pl-0">{plain.plainTerms.license}</dd>
        </div>
      </dl>
    </div>
  );
}

function DetailRow({
  item,
  t,
}: {
  item: ScoreDetail;
  t: ReturnType<typeof useLocale>["t"];
}) {
  const [plainOpen, setPlainOpen] = useState(false);
  const meta = (t.result.details as Record<string, { label: string; tip: string; plain?: string }>)[item.id];
  const label = meta?.label ?? item.id;
  const tip = meta?.tip;
  const plain = meta?.plain;
  const isGood = item.status === "good";
  const isWarn = item.status === "warn";
  const isBad = item.status === "bad";
  const showTip = (isWarn || isBad) && tip;
  const hasPlain = typeof plain === "string" && plain.length > 0;
  const toggleLabel = (t.result as { detailPlainToggle?: string }).detailPlainToggle ?? "In plain language";

  return (
    <li className="rounded-md border border-foreground/10 bg-background/50 p-3">
      <div className="flex items-center gap-2">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm"
          style={{
            background: isGood ? "#00ff8820" : isWarn ? "#ffcc0020" : "#ff444420",
            color: isGood ? "#00ff88" : isWarn ? "#ffcc00" : "#ff4444",
          }}
          aria-hidden
        >
          {isGood ? "✓" : isWarn ? "!" : "✕"}
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {item.value != null && (
            <span className="ml-2 text-xs text-foreground/60">({item.value})</span>
          )}
        </div>
        {isGood && (
          <span className="text-xs text-foreground/50">{t.result.detailGood}</span>
        )}
      </div>
      {showTip && (
        <p className="mt-2 border-t border-foreground/10 pt-2 text-xs text-foreground/70">
          <span className="font-medium text-foreground/80">{t.result.improveTip}: </span>
          {tip}
        </p>
      )}
      {hasPlain && (
        <div className="mt-2 border-t border-foreground/10 pt-2">
          <button
            type="button"
            onClick={() => setPlainOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-point hover:underline"
          >
            <span>{toggleLabel}</span>
            <span className="shrink-0 text-foreground/60" aria-hidden>
              {plainOpen ? "▲" : "▼"}
            </span>
          </button>
          {plainOpen && (
            <p className="mt-1.5 rounded bg-foreground/5 px-2.5 py-2 text-xs leading-relaxed text-foreground/85">
              {plain}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function CopyButton({
  text,
  copyLabel,
  copiedLabel,
}: {
  text: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg bg-point px-4 py-2 text-sm font-medium text-background transition hover:opacity-90"
    >
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<ResultLoadingFallback />}>
      <ResultContent />
    </Suspense>
  );
}
