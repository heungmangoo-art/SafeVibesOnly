import { NextResponse } from "next/server";
import { scanRepo } from "@/lib/scanner";
import { isValidRepoUrl } from "@/lib/repo";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");
  if (!repo?.trim() || !isValidRepoUrl(repo)) {
    return NextResponse.json({ error: "Invalid repo URL" }, { status: 400 });
  }
  try {
    const result = await scanRepo(repo);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    console.error("scan error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
