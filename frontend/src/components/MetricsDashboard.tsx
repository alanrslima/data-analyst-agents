import { useState } from "react";
import { useMetrics } from "../hooks/useMetrics.js";
import { StatCard } from "./dashboard/StatCard.js";
import { MiniBar } from "./dashboard/MiniBar.js";
import { SparkLine } from "./dashboard/SparkLine.js";
import { RunsTable } from "./dashboard/RunsTable.js";
import { LogViewer } from "./dashboard/LogViewer.js";
import { AgentPerformanceGrid } from "./dashboard/AgentPerformanceGrid.js";

type Tab = "overview" | "agents" | "runs" | "logs";

function fmtMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function fmtUptime(sec: number) {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
}

function fmtBytes(b: number) {
  if (b >= 1_048_576) return `${(b / 1_048_576).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

function fmtTokens(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

export function MetricsDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const { stats, runs, loading, error, lastRefreshed, refresh } = useMetrics(
    autoRefresh ? 5000 : 0
  );

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "agents",   label: "Agents" },
    { id: "runs",     label: `Runs${runs.length ? ` (${runs.length})` : ""}` },
    { id: "logs",     label: "Logs" },
  ];

  // Build sparkline data from runs (duration over time)
  const durationSpark = runs
    .filter((r) => r.status === "completed" && r.totalDurationMs)
    .slice(-20)
    .map((r) => r.totalDurationMs!);

  // Model distribution bars
  const modelBars = stats
    ? Object.entries(stats.byModel).map(([name, count], i) => ({
        label: name.split(":")[0].slice(0, 8),
        value: count,
        color: ["#00d4ff", "#ff6b35", "#a8ff3e", "#d4a1ff"][i % 4],
      }))
    : [];

  return (
    <div style={{ minHeight: "100vh", fontFamily: "'DM Mono', monospace" }}>

      {/* Page header */}
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#444", letterSpacing: "3px", textTransform: "uppercase", marginBottom: "6px" }}>
              Observability
            </div>
            <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "24px", fontWeight: 700, color: "#fff" }}>
              Metrics Dashboard
            </h2>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {lastRefreshed && (
              <span style={{ fontSize: "10px", color: "#333" }}>
                updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              style={{
                background: autoRefresh ? "#00d4ff11" : "transparent",
                border: `1px solid ${autoRefresh ? "#00d4ff44" : "#222"}`,
                borderRadius: "6px",
                color: autoRefresh ? "#00d4ff" : "#444",
                fontSize: "10px",
                padding: "5px 12px",
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {autoRefresh && <span style={{ animation: "pulse 1s ease-in-out infinite" }}>●</span>}
              {autoRefresh ? "auto 5s" : "auto off"}
            </button>
            <button
              onClick={refresh}
              disabled={loading}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid #222",
                borderRadius: "6px",
                color: "#666",
                fontSize: "10px",
                padding: "5px 12px",
                cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {loading ? "…" : "↻ refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          background: "#ff444411",
          border: "1px solid #ff444433",
          borderRadius: "10px",
          padding: "14px 18px",
          marginBottom: "24px",
          fontSize: "12px",
          color: "#ff8888",
          fontFamily: "'DM Mono', monospace",
        }}>
          ⚠ {error} — is the API running at localhost:3001?
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "28px", borderBottom: "1px solid #1a1a2e", paddingBottom: "0" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${tab === t.id ? "#00d4ff" : "transparent"}`,
              color: tab === t.id ? "#00d4ff" : "#444",
              fontSize: "11px",
              padding: "10px 18px",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              transition: "color 0.2s, border-color 0.2s",
              marginBottom: "-1px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", animation: "fadeUp 0.3s ease" }}>

          {/* KPI row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
            <StatCard
              label="Total Runs"
              value={stats?.totalPipelineRuns ?? "—"}
              sub={`${stats?.completedRuns ?? 0} completed · ${stats?.failedRuns ?? 0} failed`}
              color="#00d4ff"
              accent
            />
            <StatCard
              label="Avg Duration"
              value={stats ? fmtMs(stats.avgPipelineDurationMs) : "—"}
              sub="per full pipeline run"
              color="#ff6b35"
            />
            <StatCard
              label="Error Rate"
              value={stats ? `${stats.recentErrorRate}%` : "—"}
              sub="last 20 runs"
              color={stats && stats.recentErrorRate > 10 ? "#ff4444" : "#a8ff3e"}
              accent={!!stats && stats.recentErrorRate > 10}
            />
            <StatCard
              label="Uptime"
              value={stats ? fmtUptime(stats.uptimeSec) : "—"}
              sub="since last restart"
              color="#d4a1ff"
            />
          </div>

          {/* Second row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
            <StatCard
              label="Total Input"
              value={stats ? fmtBytes(stats.totalInputBytes) : "—"}
              sub="data processed"
            />
            <StatCard
              label="Prompt Tokens Est."
              value={stats ? fmtTokens(stats.totalPromptTokensEst) : "—"}
              sub="across all agents"
            />
            <StatCard
              label="Output Tokens Est."
              value={stats ? fmtTokens(stats.totalOutputTokensEst) : "—"}
              sub="across all agents"
            />
          </div>

          {/* Charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

            {/* Duration trend */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid #1e1e2e",
              borderRadius: "12px",
              padding: "20px",
            }}>
              <div style={{ fontSize: "10px", color: "#444", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px" }}>
                Pipeline Duration — last 20 runs
              </div>
              {durationSpark.length >= 2 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <SparkLine values={durationSpark} color="#00d4ff" width={380} height={60} />
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#333" }}>
                    <span>oldest</span>
                    <span>newest</span>
                  </div>
                </div>
              ) : (
                <div style={{ color: "#333", fontSize: "12px", textAlign: "center", padding: "32px 0" }}>
                  Need ≥ 2 runs to plot
                </div>
              )}
            </div>

            {/* Model distribution */}
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid #1e1e2e",
              borderRadius: "12px",
              padding: "20px",
            }}>
              <div style={{ fontSize: "10px", color: "#444", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px" }}>
                Runs by Model
              </div>
              {modelBars.length > 0 ? (
                <MiniBar bars={modelBars} height={80} unit=" runs" />
              ) : (
                <div style={{ color: "#333", fontSize: "12px", textAlign: "center", padding: "32px 0" }}>
                  No model data yet
                </div>
              )}
            </div>
          </div>

          {/* Status breakdown */}
          {stats && (stats.totalPipelineRuns > 0) && (
            <div style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid #1e1e2e",
              borderRadius: "12px",
              padding: "20px",
            }}>
              <div style={{ fontSize: "10px", color: "#444", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "16px" }}>
                Run Status Distribution
              </div>
              <div style={{ display: "flex", gap: "0", height: "12px", borderRadius: "6px", overflow: "hidden" }}>
                {[
                  { label: "completed", count: stats.completedRuns, color: "#a8ff3e" },
                  { label: "failed",    count: stats.failedRuns,    color: "#ff4444" },
                  { label: "running",   count: stats.totalPipelineRuns - stats.completedRuns - stats.failedRuns, color: "#ffcc00" },
                ].filter((s) => s.count > 0).map((seg) => (
                  <div
                    key={seg.label}
                    title={`${seg.label}: ${seg.count}`}
                    style={{
                      flex: seg.count,
                      background: seg.color,
                      opacity: 0.7,
                      transition: "flex 0.6s ease",
                    }}
                  />
                ))}
              </div>
              <div style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
                {[
                  { label: "Completed", count: stats.completedRuns, color: "#a8ff3e" },
                  { label: "Failed",    count: stats.failedRuns,    color: "#ff4444" },
                ].map((s) => (
                  <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#666", fontFamily: "'DM Mono', monospace" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: s.color, opacity: 0.7 }} />
                    {s.label}: {s.count}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── AGENTS TAB ── */}
      {tab === "agents" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          {stats?.byAgent && stats.byAgent.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <AgentPerformanceGrid stats={stats.byAgent} />

              {/* Agent duration comparison */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid #1e1e2e",
                borderRadius: "12px",
                padding: "20px",
              }}>
                <div style={{ fontSize: "10px", color: "#444", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "20px" }}>
                  Avg Duration by Agent
                </div>
                <MiniBar
                  bars={stats.byAgent.map((a) => ({
                    label: a.agentId.slice(0, 5),
                    value: a.avgDurationMs,
                    color: ({ parser: "#00d4ff", statistician: "#ff6b35", analyst: "#a8ff3e", reporter: "#d4a1ff" } as Record<string, string>)[a.agentId] ?? "#888",
                  }))}
                  height={100}
                  unit="ms"
                />
              </div>

              {/* Token usage table */}
              <div style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid #1e1e2e",
                borderRadius: "12px",
                overflow: "hidden",
              }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 80px 80px 80px 80px",
                  padding: "10px 16px",
                  background: "rgba(255,255,255,0.02)",
                  borderBottom: "1px solid #1e1e2e",
                  fontSize: "10px",
                  color: "#333",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  gap: "8px",
                }}>
                  <span>Agent</span>
                  <span>Runs</span>
                  <span>Errors</span>
                  <span>Avg ms</span>
                  <span>↑ tokens</span>
                  <span>↓ tokens</span>
                </div>
                {stats.byAgent.map((a) => {
                  const color = ({ parser: "#00d4ff", statistician: "#ff6b35", analyst: "#a8ff3e", reporter: "#d4a1ff" } as Record<string, string>)[a.agentId] ?? "#888";
                  return (
                    <div key={a.agentId} style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 80px 80px 80px 80px 80px",
                      padding: "12px 16px",
                      borderBottom: "1px solid #111",
                      gap: "8px",
                      alignItems: "center",
                    }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color, fontFamily: "'DM Mono', monospace" }}>
                        <span style={{ opacity: 0.6 }}>{{ parser: "⬡", statistician: "∑", analyst: "◈", reporter: "❐" }[a.agentId]}</span>
                        {a.agentId}
                      </span>
                      <span style={{ fontSize: "12px", color: "#888", fontFamily: "'DM Mono', monospace" }}>{a.totalRuns}</span>
                      <span style={{ fontSize: "12px", color: a.errorRuns > 0 ? "#ff6666" : "#555", fontFamily: "'DM Mono', monospace" }}>{a.errorRuns}</span>
                      <span style={{ fontSize: "12px", color: "#888", fontFamily: "'DM Mono', monospace" }}>{a.avgDurationMs > 0 ? fmtMs(a.avgDurationMs) : "—"}</span>
                      <span style={{ fontSize: "12px", color: "#666", fontFamily: "'DM Mono', monospace" }}>{fmtTokens(a.totalPromptTokensEst)}</span>
                      <span style={{ fontSize: "12px", color: "#666", fontFamily: "'DM Mono', monospace" }}>{fmtTokens(a.totalOutputTokensEst)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "80px", color: "#333", fontSize: "13px" }}>
              No agent data yet. Run the pipeline first.
            </div>
          )}
        </div>
      )}

      {/* ── RUNS TAB ── */}
      {tab === "runs" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <RunsTable runs={runs} />
        </div>
      )}

      {/* ── LOGS TAB ── */}
      {tab === "logs" && (
        <div style={{ animation: "fadeUp 0.3s ease" }}>
          <LogViewer autoRefresh={false} />
        </div>
      )}
    </div>
  );
}
