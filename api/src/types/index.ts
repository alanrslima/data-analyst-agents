// ─── Agent Types ──────────────────────────────────────────────────────────────

export type AgentId = "parser" | "statistician" | "analyst" | "reporter";

export interface AgentDefinition {
  id: AgentId;
  name: string;
  icon: string;
  role: string;
  color: string;
  description: string;
  systemPrompt: string;
}

// ─── Agent Result Types ───────────────────────────────────────────────────────

export interface ParserResult {
  schema: string[];
  rowEstimate: number;
  issues: string[];
  dataQuality: "good" | "fair" | "poor";
  summary: string;
}

export interface StatisticsResult {
  keyMetrics: Array<{ name: string; value: string }>;
  outliers: string[];
  trends: string[];
  correlations: string[];
  statisticalInsight: string;
}

export interface AnalystResult {
  patterns: string[];
  anomalies: string[];
  insights: string[];
  risks: string[];
  opportunities: string[];
}

export interface ReporterResult {
  executiveSummary: string;
  keyFindings: string[];
  recommendations: string[];
  nextSteps: string[];
  confidence: "high" | "medium" | "low";
  reportTitle: string;
}

export type AgentResult = ParserResult | StatisticsResult | AnalystResult | ReporterResult;

// ─── Pipeline Types ───────────────────────────────────────────────────────────

export interface PipelineResults {
  parser?: ParserResult;
  statistician?: StatisticsResult;
  analyst?: AnalystResult;
  reporter?: ReporterResult;
}

export interface RunPipelineRequest {
  data: string;
}

export interface RunPipelineResponse {
  success: boolean;
  results: PipelineResults;
  error?: string;
}

export interface AgentRunEvent {
  agentId: AgentId;
  status: "running" | "done" | "error";
  result?: AgentResult;
  message: string;
  timestamp: string;
}
