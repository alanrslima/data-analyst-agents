import { randomUUID } from "crypto";
import {
  PipelineRun,
  AgentMetrics,
  UsageStats,
  AgentUsageStat,
  PipelineStatus,
} from "../types/metrics.js";
import { AgentId } from "../types/index.js";

// ─── Config ───────────────────────────────────────────────────────────────────

const MAX_RUNS = 200; // keep at most 200 completed run records in memory

// ─── Token estimation ─────────────────────────────────────────────────────────
// Ollama doesn't expose token counts in the basic /api/chat response.
// We estimate using the common heuristic: ~4 chars per token.

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── Store ────────────────────────────────────────────────────────────────────

const runs: PipelineRun[] = [];
const startedAt = Date.now();

// ─── Public API ───────────────────────────────────────────────────────────────

/** Creates a new run record and returns its ID. */
export function startRun(opts: {
  model: string;
  inputBytes: number;
  clientIp: string;
}): string {
  const runId = randomUUID();
  const run: PipelineRun = {
    runId,
    startedAt: new Date().toISOString(),
    status: "running",
    model: opts.model,
    inputBytes: opts.inputBytes,
    agents: [],
    clientIp: opts.clientIp,
  };

  runs.push(run);
  if (runs.length > MAX_RUNS) runs.shift();

  return runId;
}

/** Appends a completed agent record to an existing run. */
export function recordAgentMetrics(runId: string, metrics: AgentMetrics): void {
  const run = runs.find((r) => r.runId === runId);
  if (!run) return;
  run.agents.push(metrics);
}

/** Marks the run as completed or failed. */
export function finishRun(
  runId: string,
  status: Exclude<PipelineStatus, "running">,
  error?: string
): void {
  const run = runs.find((r) => r.runId === runId);
  if (!run) return;

  const now = Date.now();
  run.completedAt = new Date().toISOString();
  run.status = status;
  run.totalDurationMs = now - new Date(run.startedAt).getTime();
  if (error) run.error = error;
}

/** Returns all pipeline run records (newest-last), with optional limit. */
export function getRuns(limit = 50): PipelineRun[] {
  return runs.slice(-limit);
}

/** Returns a single run by ID. */
export function getRun(runId: string): PipelineRun | undefined {
  return runs.find((r) => r.runId === runId);
}

/** Computes aggregated usage statistics across all stored runs. */
export function getUsageStats(): UsageStats {
  const completed = runs.filter((r) => r.status === "completed");
  const failed    = runs.filter((r) => r.status === "failed");

  // Average pipeline duration
  const durations = completed
    .map((r) => r.totalDurationMs ?? 0)
    .filter((d) => d > 0);
  const avgPipelineDurationMs =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;

  // Totals
  let totalInputBytes = 0;
  let totalPromptTokensEst = 0;
  let totalOutputTokensEst = 0;
  const byModel: Record<string, number> = {};

  for (const run of runs) {
    totalInputBytes += run.inputBytes;
    byModel[run.model] = (byModel[run.model] ?? 0) + 1;
    for (const a of run.agents) {
      totalPromptTokensEst += a.promptTokensEst;
      totalOutputTokensEst += a.outputTokensEst;
    }
  }

  // Per-agent breakdown
  const agentIds: AgentId[] = ["parser", "statistician", "analyst", "reporter"];
  const byAgent: AgentUsageStat[] = agentIds.map((agentId) => {
    const agentRuns = runs.flatMap((r) =>
      r.agents.filter((a) => a.agentId === agentId)
    );
    const successes = agentRuns.filter((a) => a.status === "success");
    const errors    = agentRuns.filter((a) => a.status === "error");
    const avgMs =
      successes.length > 0
        ? Math.round(
            successes.reduce((s, a) => s + a.durationMs, 0) / successes.length
          )
        : 0;

    return {
      agentId,
      totalRuns: agentRuns.length,
      successRuns: successes.length,
      errorRuns: errors.length,
      avgDurationMs: avgMs,
      totalPromptTokensEst: agentRuns.reduce((s, a) => s + a.promptTokensEst, 0),
      totalOutputTokensEst: agentRuns.reduce((s, a) => s + a.outputTokensEst, 0),
    };
  });

  // Recent error rate (last 20 finished runs)
  const recent = runs
    .filter((r) => r.status !== "running")
    .slice(-20);
  const recentErrorRate =
    recent.length > 0
      ? recent.filter((r) => r.status === "failed").length / recent.length
      : 0;

  return {
    totalPipelineRuns: runs.length,
    completedRuns: completed.length,
    failedRuns: failed.length,
    avgPipelineDurationMs,
    totalInputBytes,
    totalPromptTokensEst,
    totalOutputTokensEst,
    byModel,
    byAgent,
    recentErrorRate: Math.round(recentErrorRate * 1000) / 10, // percent, 1 dp
    uptimeSec: Math.floor((Date.now() - startedAt) / 1000),
  };
}
