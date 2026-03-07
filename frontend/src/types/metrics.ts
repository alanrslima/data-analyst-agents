import { AgentId } from "./index.js";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  ts: string;
  level: LogLevel;
  msg: string;
  ctx?: Record<string, unknown>;
}

export interface AgentMetrics {
  agentId: AgentId;
  model: string;
  status: "success" | "error";
  durationMs: number;
  promptTokensEst: number;
  outputTokensEst: number;
  errorMessage?: string;
}

export type PipelineStatus = "running" | "completed" | "failed";

export interface PipelineRun {
  runId: string;
  startedAt: string;
  completedAt?: string;
  status: PipelineStatus;
  model: string;
  inputBytes: number;
  totalDurationMs?: number;
  agents: AgentMetrics[];
  clientIp: string;
  error?: string;
}

export interface AgentUsageStat {
  agentId: AgentId;
  totalRuns: number;
  successRuns: number;
  errorRuns: number;
  avgDurationMs: number;
  totalPromptTokensEst: number;
  totalOutputTokensEst: number;
}

export interface UsageStats {
  totalPipelineRuns: number;
  completedRuns: number;
  failedRuns: number;
  avgPipelineDurationMs: number;
  totalInputBytes: number;
  totalPromptTokensEst: number;
  totalOutputTokensEst: number;
  byModel: Record<string, number>;
  byAgent: AgentUsageStat[];
  recentErrorRate: number;
  uptimeSec: number;
}
