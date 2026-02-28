const SCORECARD_API = "https://api.securityscorecards.dev";

export type ScorecardResult = {
  score: number; // 0-10
  date?: string;
  repo?: { name: string; commit?: string };
  checks?: Array<{ name: string; score: number; reason?: string }>;
};

/**
 * OpenSSF Scorecard API (public, no token).
 * GET /projects/github.com/{org}/{repo}
 */
export async function fetchScorecard(
  owner: string,
  repo: string
): Promise<ScorecardResult | null> {
  try {
    const url = `${SCORECARD_API}/projects/github.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as ScorecardResult;
    return data;
  } catch {
    return null;
  }
}

/** Scorecard score 0-10 -> 0-100 for blending */
export function scorecardTo100(score: number): number {
  if (score < 0) return 0;
  return Math.round(Math.min(10, score) * 10);
}
