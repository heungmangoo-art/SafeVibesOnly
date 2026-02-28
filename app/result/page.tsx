"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { saveScanResult } from "@/lib/supabase";
import { parseRepoUrl, isValidRepoUrl } from "@/lib/repo";
import type { ScanResult, ScoreDetail } from "@/lib/types";
import { useLocale } from "../LocaleProvider";

function getBadgeBase(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || "https://SafeVibesOnly.dev";
}

/** detail id → breakdown item key (for score display next to each row) */
const DETAIL_TO_BREAKDOWN: Record<string, Record<string, string>> = {
  quality: {
    description: "description",
    readme_present: "readme",
    contributing: "contributing",
    ci_workflow: "ci",
    test_script: "testScript",
    package_repository: "packageRepo",
    open_issues: "openIssues",
    repo_size: "size",
  },
  security: {
    exposed_env: "exposedEnv",
    gitignore_env: "gitignoreEnv",
    sensitive_readme: "sensitiveReadme",
    console_log_secrets: "consoleLogSecrets",
    hardcoded_secrets: "hardcodedSecrets",
    security_md: "securityMd",
    readme_http: "readmeHttp",
    dangerous_scripts: "dangerousScripts",
  },
  dependency: {
    dep_count: "depCount",
    lock_file: "lockFile",
    recent_activity: "recentActivity",
    license: "license",
  },
};

function getScoreForDetail(
  category: "security" | "quality" | "dependency",
  detailId: string,
  breakdowns: {
    quality?: { item: string; points: number; max: number }[];
    security?: { item: string; points: number; max: number }[];
    dependency?: { item: string; points: number; max: number }[];
  }
): string | null {
  const key = DETAIL_TO_BREAKDOWN[category]?.[detailId];
  if (!key) return null;
  const arr = breakdowns[category];
  if (!arr?.length) return null;
  const entry = arr.find((x) => x.item === key);
  if (!entry) return null;
  if (entry.max > 0) return `${entry.points} / ${entry.max}`;
  return String(entry.points);
}

function getGradeColor(grade: string): string {
  if (grade === "S" || grade === "A") return "#34d399";
  if (grade === "B") return "#fbbf24";
  return "#f87171";
}

function scoreToColor(score: number): string {
  if (score >= 80) return "#34d399";
  if (score >= 70) return "#fbbf24";
  if (score >= 60) return "#f87171";
  return "#f87171";
}

function ResultLoadingFallback() {
  const { t } = useLocale();
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 bg-background bg-subtle text-foreground">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-point" />
      <p className="mt-3 text-sm text-foreground/80">{t.result.loading}</p>
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
      <div className="h-full flex flex-col items-center justify-center px-4 bg-background bg-subtle text-foreground">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-point" />
        <p className="mt-3 text-sm text-foreground/80">{t.result.scanning}</p>
      </div>
    );
  }

  if (!result) {
    if (errorMessage) {
      return (
        <div className="h-full flex flex-col items-center justify-center px-4 bg-background bg-subtle text-foreground">
          <div className="max-w-md text-center">
            <p className="text-foreground font-mono text-sm mb-1.5">{t.result.scanErrorTitle}</p>
            <p className="text-foreground/80 text-xs mb-4 whitespace-pre-wrap">{errorMessage}</p>
              <Link
                href="/"
                className="text-accent hover:underline text-xs"
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
    <div className="h-full min-h-0 bg-background bg-subtle text-foreground overflow-auto">
      <main className="mx-auto max-w-4xl w-full px-4 py-4">
        <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <Link
            href="/"
            className="text-xs text-accent hover:underline"
          >
            {t.result.back}
          </Link>
          <ShareToXButton
            score={result.totalScore}
            grade={result.grade}
            repoName={`${username}/${repo}`}
            label={t.result.shareToX}
          />
        </div>

        <header className="mb-3">
          <h1 className="font-mono text-sm text-foreground/85 break-all">
            {username} / {repo}
          </h1>
          <a
            href={result.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline text-xs"
          >
            {result.repoUrl}
          </a>
        </header>

        <section className="rounded-lg border border-foreground/10 bg-foreground/[0.03] p-3 mb-4">
          <div className="flex flex-wrap items-center gap-3 border-b border-foreground/10 pb-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-semibold tabular-nums" style={{ color: gradeColor }}>
                {result.totalScore}
              </span>
              <span className="text-foreground/50 text-xs">/ 100</span>
            </div>
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[11px] font-medium"
              style={{ backgroundColor: `${gradeColor}18`, color: gradeColor }}
            >
              {t.result.grade} {result.grade}
            </span>
            <div className="relative h-12 w-12 ml-auto shrink-0">
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
                  className="transition-[stroke-dasharray] duration-500"
                />
              </svg>
            </div>
          </div>
          <dl className="mt-2 space-y-1.5">
            <div>
              <div className="mb-0.5 flex justify-between text-[11px]">
                <dt className="text-foreground/70">{t.home.security}</dt>
                <dd className="tabular-nums font-medium" style={{ color: scoreToColor(result.security) }}>{result.security} / 100</dd>
              </div>
              <div className="h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className="h-1 rounded-full transition-[width] duration-300"
                  style={{ width: `${result.security}%`, backgroundColor: scoreToColor(result.security) }}
                />
              </div>
            </div>
            <div>
              <div className="mb-0.5 flex justify-between text-[11px]">
                <dt className="text-foreground/70">{t.home.codeQuality}</dt>
                <dd className="tabular-nums font-medium" style={{ color: scoreToColor(result.quality) }}>{result.quality} / 100</dd>
              </div>
              <div className="h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className="h-1 rounded-full transition-[width] duration-300"
                  style={{ width: `${result.quality}%`, backgroundColor: scoreToColor(result.quality) }}
                />
              </div>
            </div>
            <div>
              <div className="mb-0.5 flex justify-between text-[11px]">
                <dt className="text-foreground/70">{t.home.dependencyRisk}</dt>
                <dd className="tabular-nums font-medium" style={{ color: scoreToColor(Number(result.dependencyRisk)) }}>{result.dependencyRisk} / 100</dd>
              </div>
              <div className="h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
                <div
                  className="h-1 rounded-full transition-[width] duration-300"
                  style={{ width: `${result.dependencyRisk}%`, backgroundColor: scoreToColor(Number(result.dependencyRisk)) }}
                />
              </div>
            </div>
          </dl>
        </section>

        {result.details && result.details.length > 0 && (
          <section className="mb-4">
            <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/60">
              {t.result.detailsTitle}
            </h2>
            <div className="space-y-3">
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
                  <div key={cat} className="rounded-lg border border-foreground/10 bg-foreground/[0.03] p-3">
                    <h3 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/60">
                      {categoryLabel}
                    </h3>
                    <ul className="space-y-2">
                      {items.map((item) => (
                        <DetailRow
                          key={item.id}
                          item={item}
                          t={t}
                          scoreText={getScoreForDetail(cat, item.id, {
                            quality: result.qualityBreakdown ?? undefined,
                            security: result.securityBreakdown ?? undefined,
                            dependency: result.dependencyBreakdown ?? undefined,
                          })}
                        />
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="rounded-lg border border-foreground/10 bg-foreground/[0.03] p-3">
          <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-foreground/60">
            {t.result.badge}
          </h2>
          <p className="mb-2 text-xs text-foreground/75 leading-relaxed">
            {t.result.badgeReadmeExplain}
          </p>
          <p className="mb-1.5 text-[11px] text-foreground/60">
            {t.result.preview}
          </p>
          <div className="mb-2 flex items-center rounded-lg border border-foreground/10 bg-background/80 p-3">
            <img
              src={`/api/badge/${username}/${repo}?score=${result.totalScore}&grade=${encodeURIComponent(result.grade)}`}
              alt={`SafeVibesOnly Score: ${result.totalScore}`}
              className="h-5"
            />
          </div>
          <p className="mb-1.5 text-[11px] text-foreground/60">
            {t.result.addToReadme}
          </p>
          <pre className="mb-3 overflow-x-auto rounded-lg bg-background/80 border border-foreground/10 p-3 text-[11px] text-foreground/90">
            {`![SafeVibesOnly Score](${getBadgeBase()}/api/badge/${username}/${repo})`}
          </pre>
          <CopyButton
            text={`![SafeVibesOnly Score](${getBadgeBase()}/api/badge/${username}/${repo})`}
            copyLabel={t.result.copy}
            copiedLabel={t.result.copied}
          />
        </section>
        </div>
      </main>
    </div>
  );
}

function DetailRow({
  item,
  t,
  scoreText,
}: {
  item: ScoreDetail;
  t: ReturnType<typeof useLocale>["t"];
  scoreText?: string | null;
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
    <li className="rounded-lg border border-foreground/10 bg-foreground/[0.02] p-2">
      <div className="flex items-center gap-1.5">
        <span
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px]"
          style={{
            background: isGood ? "#34d39920" : isWarn ? "#fbbf2420" : "#f8717120",
            color: isGood ? "#34d399" : isWarn ? "#fbbf24" : "#f87171",
          }}
          aria-hidden
        >
          {isGood ? "✓" : isWarn ? "!" : "✕"}
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-xs font-medium text-foreground">{label}</span>
          {item.value != null && (
            <span className="ml-1.5 text-[11px] text-foreground/60">({item.value})</span>
          )}
        </div>
        {scoreText != null && (
          <span className={`shrink-0 font-mono text-[11px] tabular-nums ${scoreText.startsWith("-") ? "text-red-400" : "text-point"}`}>
            {scoreText}
          </span>
        )}
        {isGood && scoreText == null && (
          <span className="text-[11px] text-foreground/50">{t.result.detailGood}</span>
        )}
      </div>
      {showTip && (
        <p className="mt-1.5 border-t border-foreground/10 pt-1.5 text-[11px] text-foreground/70">
          <span className="font-medium text-foreground/80">{t.result.improveTip}: </span>
          {tip}
        </p>
      )}
      {hasPlain && (
        <div className="mt-1.5 border-t border-foreground/10 pt-1.5">
          <button
            type="button"
            onClick={() => setPlainOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-1.5 text-left text-[11px] font-medium text-point hover:underline"
          >
            <span>{toggleLabel}</span>
            <span className="shrink-0 text-foreground/60" aria-hidden>
              {plainOpen ? "▲" : "▼"}
            </span>
          </button>
          {plainOpen && (
            <p className="mt-1 rounded bg-foreground/5 px-2 py-1.5 text-[11px] leading-relaxed text-foreground/85">
              {plain}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function ShareToXButton({
  score,
  grade,
  repoName,
  label,
}: {
  score: number;
  grade: string;
  repoName: string;
  label: string;
}) {
  function handleShare() {
    const text = `My SafeVibesOnly security score: ${score} (${grade}) for ${repoName} 🛡️`;
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : `${getBadgeBase()}/result`;
    const intentUrl = `https://twitter.com/intent/tweet?${new URLSearchParams({
      text,
      url,
    }).toString()}`;
    window.open(intentUrl, "_blank", "noopener,noreferrer,width=550,height=420");
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-lg border border-foreground/15 bg-transparent px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-foreground/10 hover:border-foreground/25"
      aria-label={label}
    >
      {label}
    </button>
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
      className="rounded-lg bg-point px-3 py-1.5 text-xs font-medium text-[#0d1117] transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-point/30 focus:ring-offset-2 focus:ring-offset-background"
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
