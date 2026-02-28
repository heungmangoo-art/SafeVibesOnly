const SOCKET_API = "https://api.socket.dev";

export type SocketScoreResponse = {
  score?: number; // 0-1 depscore
  metadata?: { depscore?: number };
};

/**
 * Socket.dev package score (npm). Requires SOCKET_API_KEY.
 * Uses v0 endpoint: GET /v0/npm/{package}/{version}/score
 */
export async function fetchSocketScore(
  packageName: string,
  version: string
): Promise<number | null> {
  const token = process.env.SOCKET_API_KEY;
  if (!token) return null;
  try {
    const encodedName = encodeURIComponent(packageName);
    const encodedVersion = encodeURIComponent(version);
    const res = await fetch(
      `${SOCKET_API}/v0/npm/${encodedName}/${encodedVersion}/score`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as SocketScoreResponse;
    const score = data?.score ?? data?.metadata?.depscore;
    if (typeof score !== "number") return null;
    return Math.max(0, Math.min(1, score));
  } catch {
    return null;
  }
}

/** Socket depscore 0-1 -> 0-100 for dependency risk */
export function socketScoreTo100(score: number): number {
  return Math.round(score * 100);
}
