import { createClient } from "@supabase/supabase-js";
import type { ScanResult } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export async function saveScanResult(result: ScanResult): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.from("scan_results").insert({
      repo_url: result.repoUrl,
      score: result.totalScore,
      grade: result.grade,
    });
  } catch (err) {
    console.error("Supabase saveScanResult error:", err);
  }
}

export async function getLatestScanScore(
  username: string,
  repo: string
): Promise<{ score: number; grade: string } | null> {
  if (!supabase) return null;
  try {
    const repoUrl = `https://github.com/${username}/${repo}`;
    const { data, error } = await supabase
      .from("scan_results")
      .select("score, grade")
      .eq("repo_url", repoUrl)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return { score: data.score, grade: data.grade };
  } catch {
    return null;
  }
}
