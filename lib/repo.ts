const GITHUB_BASE = "https://github.com/";

export function parseRepoUrl(url: string): { username: string; repo: string } | null {
  try {
    const decoded = decodeURIComponent(url.trim());
    if (!decoded.startsWith(GITHUB_BASE)) return null;
    const path = decoded.slice(GITHUB_BASE.length).replace(/\/$/, "").split(/[?#]/)[0];
    const parts = path.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    return { username: parts[0], repo: parts[1] };
  } catch {
    return null;
  }
}

export function isValidRepoUrl(url: string): boolean {
  return parseRepoUrl(url) !== null;
}
