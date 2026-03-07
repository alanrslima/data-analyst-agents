import { useState } from "react";
import { PipelineRun } from "../../types/metrics.js";

const AGENT_COLORS: Record<string, string> = {
  parser: "#00d4ff",
  statistician: "#ff6b35",
  analyst: "#a8ff3e",
  reporter: "#d4a1ff",
};

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  completed: { color: "#a8ff3e", label: "✓ done" },
  failed:    { color: "#ff4444", label: "✗ failed" },
  running:   { color: "#ffcc00", label: "● running" },
};

function fmtMs(ms: number | undefined) {
  if (!ms) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function fmtBytes(b: number) {
  return b >= 1024 ? `${(b / 1024).toFixed(1)} KB` : `${b} B`;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString();
}

interface Props {
  runs: PipelineRun[];
}

export function RunsTable({ runs }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (runs.length === 0) {
    return (
      <div style={{
        border: "1px solid #1e1e2e",
        borderRadius: "12px",
        padding: "48px",
        textAlign: "center",
        color: "#333",
        fontFamily: "'DM Mono', monospace",
        fontSize: "13px",
      }}>
        No pipeline runs yet. Run the pipeline to see data here.
      </div>
    );
  }

  return (
    <div style={{ border: "1px solid #1e1e2e", borderRadius: "12px", overflow: "hidden" }}>
      {/* Header */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 80px 90px 80px 90px 70px",
        padding: "10px 16px",
        background: "rgba(255,255,255,0.02)",
        borderBottom: "1px solid #1e1e2e",
        fontSize: "10px",
        color: "#444",
        fontFamily: "'DM Mono', monospace",
        textTransform: "uppercase",
        letterSpacing: "1px",
        gap: "8px",
      }}>
        <span>Run ID</span>
        <span>Status</span>
        <span>Model</span>
        <span>Duration</span>
        <span>Input</span>
        <span>Time</span>
      </div>

      {[...runs].reverse().map((run) => {
        const st = STATUS_STYLE[run.status] ?? STATUS_STYLE.running;
        const isOpen = expanded === run.runId;

        return (
          <div key={run.runId}>
            <div
              onClick={() => setExpanded(isOpen ? null : run.runId)}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 90px 80px 90px 70px",
                padding: "12px 16px",
                borderBottom: "1px solid #111",
                cursor: "pointer",
                transition: "background 0.15s",
                background: isOpen ? "rgba(255,255,255,0.03)" : "transparent",
                gap: "8px",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = isOpen ? "rgba(255,255,255,0.03)" : "transparent")}
            >
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {isOpen ? "▾" : "▸"} {run.runId.slice(0, 20)}…
              </span>
              <span style={{ fontSize: "10px", color: st.color, fontFamily: "'DM Mono', monospace" }}>{st.label}</span>
              <span style={{ fontSize: "11px", color: "#888", fontFamily: "'DM Mono', monospace" }}>{run.model}</span>
              <span style={{ fontSize: "11px", color: "#888", fontFamily: "'DM Mono', monospace" }}>{fmtMs(run.totalDurationMs)}</span>
              <span style={{ fontSize: "11px", color: "#555", fontFamily: "'DM Mono', monospace" }}>{fmtBytes(run.inputBytes)}</span>
              <span style={{ fontSize: "11px", color: "#444", fontFamily: "'DM Mono', monospace" }}>{fmtTime(run.startedAt)}</span>
            </div>

            {/* Expanded detail */}
            {isOpen && (
              <div style={{
                background: "rgba(0,0,0,0.3)",
                borderBottom: "1px solid #111",
                padding: "16px",
                animation: "fadeUp 0.2s ease forwards",
              }}>
                {run.error && (
                  <div style={{
                    background: "#ff444411",
                    border: "1px solid #ff444433",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    marginBottom: "14px",
                    fontSize: "12px",
                    color: "#ff8888",
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    ✗ {run.error}
                  </div>
                )}

                <div style={{
                  fontSize: "10px",
                  color: "#444",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: "10px",
                }}>
                  Agent Breakdown
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                  {run.agents.map((a) => {
                    const color = AGENT_COLORS[a.agentId] ?? "#888";
                    return (
                      <div key={a.agentId} style={{
                        background: `${color}08`,
                        border: `1px solid ${color}22`,
                        borderRadius: "8px",
                        padding: "12px",
                      }}>
                        <div style={{ fontSize: "10px", color, fontFamily: "'DM Mono', monospace", textTransform: "uppercase", marginBottom: "8px" }}>
                          {a.agentId}
                        </div>
                        <div style={{ fontSize: "11px", color: a.status === "success" ? "#aaa" : "#ff6666", fontFamily: "'DM Mono', monospace" }}>
                          {a.status === "success" ? `✓ ${fmtMs(a.durationMs)}` : `✗ error`}
                        </div>
                        <div style={{ fontSize: "10px", color: "#444", fontFamily: "'DM Mono', monospace", marginTop: "4px" }}>
                          ↑ {a.promptTokensEst}t  ↓ {a.outputTokensEst}t
                        </div>
                        {a.errorMessage && (
                          <div style={{ fontSize: "10px", color: "#ff6666", marginTop: "4px", fontFamily: "'DM Mono', monospace" }}>
                            {a.errorMessage.slice(0, 60)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
