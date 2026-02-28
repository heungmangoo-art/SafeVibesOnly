export type DetailStatus = "good" | "warn" | "bad";

export interface ScoreDetail {
  id: string;
  category: "security" | "quality" | "dependency";
  status: DetailStatus;
  value?: string; // e.g. "Yes", "No", "32 days ago", "28 packages"
}

export interface ScoreBreakdownItem {
  item: string;
  points: number; // 획득 점수 (감점이면 음수)
  max: number;    // 만점 (감점 항목이면 0으로 두고 points만 표시)
}

export interface ScanResult {
  repoUrl: string;
  security: number;
  quality: number;
  dependencyRisk: number;
  totalScore: number;
  grade: string;
  details?: ScoreDetail[];
  /** 각 항목별 점수 가감 내역 (어디서 감점/가점 됐는지 표시용) */
  qualityBreakdown?: ScoreBreakdownItem[];
  securityBreakdown?: ScoreBreakdownItem[];
  dependencyBreakdown?: ScoreBreakdownItem[];
}
