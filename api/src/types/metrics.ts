import { AgentId } from "./index.js";

// ─── Log Levels ───────────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  id: string;
  ts: string;           // ISO timestamp
  level: LogLevel;
  msg: string;
  ctx?: Record<string, unknown>; // arbitrary structured context
}

// ─── Per-Agent Metrics ────────────────────────────────────────────────────────

export interface AgentMetrics {
  agentId: AgentId;
  model: string;
  status: "success" | "error";
  durationMs: number;
  promptTokensEst: number;   // character-based estimate (Ollama doesn't expose tokens)
  outputTokensEst: number;
  errorMessage?: string;
}

// ─── Per-Pipeline Run Record ──────────────────────────────────────────────────

export type PipelineStatus = "running" | "completed" | "failed";

export interface PipelineRun {
  runId: string;
  startedAt: string;        // ISO
  completedAt?: string;     // ISO
  status: PipelineStatus;
  model: string;
  inputBytes: number;
  totalDurationMs?: number;
  agents: AgentMetrics[];
  clientIp: string;
  error?: string;
}

// ─── Aggregated Usage Stats ───────────────────────────────────────────────────

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
  byModel: Record<string, number>;       // model → run count
  byAgent: AgentUsageStat[];
  recentErrorRate: number;               // last 20 runs
  uptimeSec: number;
}
