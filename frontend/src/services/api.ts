import {
  AgentId,
  AgentRunEvent,
  PipelineResults,
  AgentMeta,
} from "../types/index.js";
import {
  UsageStats,
  PipelineRun,
  LogEntry,
  LogLevel,
} from "../types/metrics.js";

const API_BASE = "/api";

// ─── Fetch Agent Metadata ─────────────────────────────────────────────────────

export async function fetchAgents(): Promise<AgentMeta[]> {
  const res = await fetch(`${API_BASE}/agents`);
  if (!res.ok) throw new Error("Failed to fetch agents");
  const json = await res.json();
  return json.agents as AgentMeta[];
}

// ─── Observability ────────────────────────────────────────────────────────────

export async function fetchMetrics(): Promise<UsageStats> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error("Failed to fetch metrics");
  const json = await res.json();
  return json.metrics as UsageStats;
}

export async function fetchRuns(limit = 50): Promise<PipelineRun[]> {
  const res = await fetch(`${API_BASE}/runs?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch runs");
  const json = await res.json();
  return json.runs as PipelineRun[];
}

export async function fetchRun(runId: string): Promise<PipelineRun> {
  const res = await fetch(`${API_BASE}/runs/${runId}`);
  if (!res.ok) throw new Error(`Failed to fetch run ${runId}`);
  const json = await res.json();
  return json.run as PipelineRun;
}

export async function fetchLogs(opts?: {
  level?: LogLevel;
  limit?: number;
  since?: string;
}): Promise<LogEntry[]> {
  const params = new URLSearchParams();
  if (opts?.level) params.set("level", opts.level);
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.since) params.set("since", opts.since);
  const res = await fetch(`${API_BASE}/logs?${params}`);
  if (!res.ok) throw new Error("Failed to fetch logs");
  const json = await res.json();
  return json.logs as LogEntry[];
}

export async function clearLogs(): Promise<void> {
  await fetch(`${API_BASE}/logs`, { method: "DELETE" });
}

// ─── SSE Pipeline Runner ──────────────────────────────────────────────────────

export interface PipelineCallbacks {
  onAgentStart: (agentId: AgentId) => void;
  onAgentDone: (agentId: AgentId, result: unknown) => void;
  onAgentError: (agentId: AgentId, message: string) => void;
  onLog: (msg: string, color?: string) => void;
  onComplete: (results: PipelineResults) => void;
  onError: (message: string) => void;
}

export async function runPipeline(
  data: string,
  callbacks: PipelineCallbacks,
): Promise<void> {
  const res = await fetch(`${API_BASE}/pipeline/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({ error: "Request failed" }));
    callbacks.onError(json.error ?? "Request failed");
    return;
  }

  if (!res.body) {
    callbacks.onError("No response body");
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;

      const raw = line.slice(6).trim();
      if (!raw) continue;

      let event: Record<string, unknown>;
      try {
        event = JSON.parse(raw);
      } catch {
        continue;
      }

      if (event.type === "pipeline_complete") {
        callbacks.onLog("■ Pipeline complete", "#fff");
        callbacks.onComplete(event.results as PipelineResults);
        return;
      }

      if (event.type === "pipeline_error") {
        callbacks.onError(event.message as string);
        return;
      }

      const agentEvent = event as AgentRunEvent;

      if (agentEvent.status === "running") {
        callbacks.onAgentStart(agentEvent.agentId);
        callbacks.onLog(
          `● ${agentEvent.message}`,
          getAgentColor(agentEvent.agentId),
        );
      } else if (agentEvent.status === "done") {
        callbacks.onAgentDone(agentEvent.agentId, agentEvent.result);
        callbacks.onLog(
          `✓ ${agentEvent.message}`,
          getAgentColor(agentEvent.agentId),
        );
      } else if (agentEvent.status === "error") {
        callbacks.onAgentError(agentEvent.agentId, agentEvent.message);
        callbacks.onLog(`✗ ${agentEvent.message}`, "#ff4444");
      }
    }
  }
}

function getAgentColor(agentId: AgentId): string {
  const colors: Record<AgentId, string> = {
    parser: "#00d4ff",
    statistician: "#ff6b35",
    analyst: "#a8ff3e",
    reporter: "#d4a1ff",
  };
  return colors[agentId] ?? "#888";
}

// ─── SSE Pipeline Runner ──────────────────────────────────────────────────────

export interface PipelineCallbacks {
  onAgentStart: (agentId: AgentId) => void;
  onAgentDone: (agentId: AgentId, result: unknown) => void;
  onAgentError: (agentId: AgentId, message: string) => void;
  onLog: (msg: string, color?: string) => void;
  onComplete: (results: PipelineResults) => void;
  onError: (message: string) => void;
}
