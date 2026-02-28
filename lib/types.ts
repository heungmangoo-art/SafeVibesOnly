export type DetailStatus = "good" | "warn" | "bad";

export interface ScoreDetail {
  id: string;
  category: "security" | "quality" | "dependency";
  status: DetailStatus;
  value?: string; // e.g. "Yes", "No", "32 days ago", "28 packages"
}

export interface ScanResult {
  repoUrl: string;
  security: number;
  quality: number;
  dependencyRisk: number;
  totalScore: number;
  grade: string;
  details?: ScoreDetail[];
}
