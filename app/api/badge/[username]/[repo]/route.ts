import { NextResponse } from "next/server";
import { getLatestScanScore } from "@/lib/supabase";

function getGradeColor(grade: string): string {
  if (grade === "S" || grade === "A") return "#00ff88";
  if (grade === "B") return "#ffcc00";
  return "#ff4444";
}

function badgeSvg(score: number, grade: string): string {
  const color = getGradeColor(grade);
  const label = "SafeVibesOnly";
  const value = `${score}`;
  const height = 20;
  const radius = height / 2;
  const labelWidth = 88;
  const valueWidth = Math.max(24, value.length * 7 + 14);
  const totalWidth = labelWidth + valueWidth;

  // Left pill: rounded left edge only
  const leftPath = `M${radius} 0h${labelWidth - radius}v${height}h-${labelWidth - radius}a${radius} ${radius} 0 0 1 -${radius} -${radius}V${radius}a${radius} ${radius} 0 0 1 ${radius} -${radius}z`;
  const rightPath = `M${labelWidth} ${radius}a${radius} 0 0 1 ${radius}-${radius}h${valueWidth - radius * 2}a${radius} 0 0 1 ${radius} ${radius}a${radius} 0 0 1 -${radius} ${radius}H${labelWidth}a${radius} 0 0 1 -${radius}-${radius}L${labelWidth} ${radius}z`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1a222c"/>
      <stop offset="1" stop-color="#0d1117"/>
    </linearGradient>
  </defs>
  <path d="${leftPath}" fill="url(#bg)"/>
  <path d="${rightPath}" fill="${color}"/>
  <text x="${labelWidth / 2}" y="${height / 2}" dominant-baseline="central" fill="#7ee787" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="10" font-weight="600" text-anchor="middle">${label}</text>
  <text x="${labelWidth + valueWidth / 2}" y="${height / 2}" dominant-baseline="central" fill="#0d1117" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="10" font-weight="700" text-anchor="middle">${value}</text>
</svg>`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string; repo: string }> }
) {
  const { username, repo } = await params;
  const { searchParams } = new URL(request.url);
  const queryScore = searchParams.get("score");
  const queryGrade = searchParams.get("grade");

  let score: number;
  let grade: string;

  if (queryScore !== null && queryGrade !== null) {
    const parsed = parseInt(queryScore, 10);
    score = Number.isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    grade = ["S", "A", "B", "C", "D"].includes(queryGrade) ? queryGrade : "N/A";
  } else {
    const scoreData = await getLatestScanScore(username, repo);
    score = scoreData?.score ?? 0;
    grade = scoreData?.grade ?? "N/A";
  }

  const svg = badgeSvg(score, grade);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}
