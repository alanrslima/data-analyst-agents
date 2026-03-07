// ─── Agent Types ──────────────────────────────────────────────────────────────

export type AgentId = "parser" | "statistician" | "analyst" | "reporter";
export type AgentStatus = "idle" | "running" | "done" | "error";

export interface AgentMeta {
  id: AgentId;
  name: string;
  icon: string;
  role: string;
  color: string;
  description: string;
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

export interface PipelineResults {
  parser?: ParserResult;
  statistician?: StatisticsResult;
  analyst?: AnalystResult;
  reporter?: ReporterResult;
}

// ─── SSE Event types ──────────────────────────────────────────────────────────

export interface AgentRunEvent {
  agentId: AgentId;
  status: "running" | "done" | "error";
  result?: AgentResult;
  message: string;
  timestamp: string;
}

export interface PipelineCompleteEvent {
  type: "pipeline_complete";
  results: PipelineResults;
  timestamp: string;
}

export interface PipelineErrorEvent {
  type: "pipeline_error";
  message: string;
}

export type SSEEvent = AgentRunEvent | PipelineCompleteEvent | PipelineErrorEvent;

// ─── Log entry ────────────────────────────────────────────────────────────────

export interface LogEntry {
  msg: string;
  color: string;
  ts: string;
}
