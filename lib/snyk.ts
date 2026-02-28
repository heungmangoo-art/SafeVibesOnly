const SNYK_API = "https://api.snyk.io";

/**
 * Snyk REST API. Requires SNYK_TOKEN and SNYK_ORG_ID.
 * Only works for repos already imported in your Snyk org.
 * Returns issue count for the project matching repoUrl, or null if not found / no token.
 */
export async function getSnykIssueCount(
  orgId: string,
  repoUrl: string
): Promise<number | null> {
  const token = process.env.SNYK_TOKEN;
  if (!token || !orgId) return null;

  const normalizedRepo = repoUrl.replace(/\/$/, "").toLowerCase();
  const repoSlug = normalizedRepo.replace("https://github.com/", "");

  try {
    const res = await fetch(
      `${SNYK_API}/rest/orgs/${encodeURIComponent(orgId)}/projects?version=2024-06-18`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/vnd.api+json",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: Array<{
        id: string;
        attributes?: { name?: string; targetReference?: string };
      }>;
    };
    const projects = json?.data ?? [];
    const project = projects.find((p) => {
      const name = (p.attributes?.name ?? "").toLowerCase();
      const ref = (p.attributes?.targetReference ?? "").toLowerCase();
      return (
        name.includes(repoSlug) ||
        ref.includes(repoSlug) ||
        name.includes(repoUrl) ||
        ref.includes(normalizedRepo)
      );
    });
    if (!project?.id) return null;

    const issuesRes = await fetch(
      `${SNYK_API}/rest/orgs/${encodeURIComponent(orgId)}/issues?version=2024-06-18&project_id=${encodeURIComponent(project.id)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/vnd.api+json",
        },
        cache: "no-store",
      }
    );
    if (!issuesRes.ok) return null;
    const issuesJson = (await issuesRes.json()) as {
      data?: unknown[];
      meta?: { total?: number };
    };
    const total = issuesJson?.meta?.total ?? issuesJson?.data?.length ?? 0;
    return typeof total === "number" ? total : 0;
  } catch {
    return null;
  }
}

/** More issues = lower security score (0-100). No issues = 100, 10+ = 50, etc. */
export function snykIssuesToSecurityPenalty(issueCount: number): number {
  if (issueCount <= 0) return 0;
  if (issueCount <= 2) return 5;
  if (issueCount <= 5) return 15;
  if (issueCount <= 10) return 25;
  return Math.min(50, 20 + issueCount * 2);
}
