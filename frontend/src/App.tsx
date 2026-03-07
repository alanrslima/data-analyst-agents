import { useState, useEffect } from "react";
import { AgentMeta } from "./types/index.js";
import { fetchAgents } from "./services/api.js";
import { SAMPLES } from "./services/samples.js";
import { usePipeline } from "./hooks/usePipeline.js";
import { AgentCard } from "./components/AgentCard.js";
import { ResultPanel } from "./components/ResultPanel.js";
import { PipelineLog } from "./components/PipelineLog.js";
import { MetricsDashboard } from "./components/MetricsDashboard.js";

type Page = "pipeline" | "metrics";

const FALLBACK_AGENTS: AgentMeta[] = [
  {
    id: "parser",
    name: "Parser Agent",
    icon: "⬡",
    role: "Data Ingestion & Structuring",
    color: "#00d4ff",
    description: "Reads raw data, detects schema, cleans anomalies",
  },
  {
    id: "statistician",
    name: "Stats Agent",
    icon: "∑",
    role: "Statistical Analysis",
    color: "#ff6b35",
    description: "Computes distributions, correlations, outliers",
  },
  {
    id: "analyst",
    name: "Analyst Agent",
    icon: "◈",
    role: "Pattern Recognition & Insights",
    color: "#a8ff3e",
    description: "Finds patterns, anomalies, business insights",
  },
  {
    id: "reporter",
    name: "Report Agent",
    icon: "❐",
    role: "Synthesis & Recommendations",
    color: "#d4a1ff",
    description: "Synthesizes findings into executive summary",
  },
];

export default function App() {
  const [page, setPage] = useState<Page>("pipeline");
  const [inputData, setInputData] = useState("");
  const [agents, setAgents] = useState<AgentMeta[]>(FALLBACK_AGENTS);

  const {
    isRunning,
    phase,
    agentStatuses,
    agentResults,
    pipelineResults,
    log,
    logRef,
    execute,
  } = usePipeline();

  useEffect(() => {
    fetchAgents()
      .then(setAgents)
      .catch(() => {
        /* use fallback */
      });
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#fff",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <style>{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        @keyframes scan {
          0% { left: -100%; } 100% { left: 100%; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
        }
        @keyframes gridScroll {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
        .run-btn { transition: all 0.3s ease; }
        .run-btn:hover:not(:disabled) { transform: scale(1.02); box-shadow: 0 0 40px #00d4ff44 !important; }
        .run-btn:active:not(:disabled) { transform: scale(0.98); }
        .sample-btn:hover { background: rgba(255,255,255,0.06) !important; }
        .nav-btn:hover { color: #fff !important; }
        textarea:focus { outline: none; border-color: #333 !important; }
      `}</style>

      {/* Grid background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "gridScroll 20s linear infinite",
        }}
      />

      {/* Top nav bar */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(10,10,15,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #1a1a2e",
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          gap: "0",
          height: "52px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginRight: "32px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "linear-gradient(135deg, #00d4ff22, #a8ff3e22)",
              border: "1px solid #00d4ff33",
              borderRadius: "7px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
            }}
          >
            ◈
          </div>
          <span
            style={{
              color: "#fff",
              fontSize: "12px",
              fontFamily: "'DM Mono', monospace",
              letterSpacing: "1px",
            }}
          >
            Agent Pipeline
          </span>
        </div>

        {/* Nav links */}
        {(
          [
            { id: "pipeline", label: "◈ Pipeline" },
            { id: "metrics", label: "▦ Metrics" },
          ] as { id: Page; label: string }[]
        ).map((nav) => (
          <button
            key={nav.id}
            className="nav-btn"
            onClick={() => setPage(nav.id)}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: `2px solid ${page === nav.id ? "#00d4ff" : "transparent"}`,
              color: page === nav.id ? "#00d4ff" : "#444",
              fontSize: "11px",
              padding: "0 18px",
              height: "52px",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: "1.5px",
              transition: "color 0.2s, border-color 0.2s",
            }}
          >
            {nav.label}
          </button>
        ))}
      </nav>

      {/* Page content */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "40px 24px",
        }}
      >
        {/* ── PIPELINE PAGE ── */}
        {page === "pipeline" && (
          <div style={{ animation: "fadeUp 0.3s ease" }}>
            {/* Header */}
            <div style={{ marginBottom: "40px" }}>
              <div
                style={{
                  fontSize: "11px",
                  color: "#444",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  marginBottom: "8px",
                }}
              >
                Multi-Agent System
              </div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                Data Analyst Pipeline
              </h1>
              <p
                style={{
                  color: "#444",
                  fontSize: "12px",
                  maxWidth: "480px",
                  lineHeight: "1.6",
                  margin: "10px 0 0",
                }}
              >
                Four specialized AI agents working in sequence — parsing,
                statistical analysis, pattern recognition, and executive
                reporting.
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 380px",
                gap: "24px",
                alignItems: "start",
              }}
            >
              {/* Left: Input + Results */}
              <div>
                {/* Sample buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "12px",
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: "#444", fontSize: "11px" }}>
                    SAMPLES:
                  </span>
                  {SAMPLES.map((s) => (
                    <button
                      key={s.label}
                      className="sample-btn"
                      onClick={() => setInputData(s.data)}
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid #222",
                        borderRadius: "6px",
                        color: "#888",
                        fontSize: "11px",
                        padding: "5px 12px",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        fontFamily: "'DM Mono', monospace",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <div style={{ position: "relative" }}>
                  <textarea
                    value={inputData}
                    onChange={(e) => setInputData(e.target.value)}
                    placeholder={
                      "Paste CSV, JSON, or plain text data here...\n\nExample:\ndate,sales,region\n2024-01,4200,North\n..."
                    }
                    style={{
                      width: "100%",
                      height: "240px",
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid #1e1e2e",
                      borderRadius: "12px",
                      color: "#ccc",
                      fontSize: "12px",
                      fontFamily: "'DM Mono', monospace",
                      padding: "16px",
                      resize: "vertical",
                      lineHeight: "1.6",
                      transition: "border-color 0.2s",
                    }}
                  />
                  {inputData && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "12px",
                        right: "12px",
                        color: "#444",
                        fontSize: "10px",
                      }}
                    >
                      {inputData.split("\n").length} lines · {inputData.length}{" "}
                      chars
                    </div>
                  )}
                </div>

                {/* Run button */}
                <button
                  className="run-btn"
                  onClick={() => execute(inputData)}
                  disabled={isRunning || !inputData.trim()}
                  style={{
                    marginTop: "16px",
                    width: "100%",
                    padding: "16px",
                    background: isRunning
                      ? "rgba(0,212,255,0.05)"
                      : "rgba(0,212,255,0.1)",
                    border: `1px solid ${isRunning ? "#00d4ff66" : "#00d4ff44"}`,
                    borderRadius: "10px",
                    color: isRunning ? "#00d4ff99" : "#00d4ff",
                    fontSize: "13px",
                    fontFamily: "'DM Mono', monospace",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    cursor:
                      isRunning || !inputData.trim()
                        ? "not-allowed"
                        : "pointer",
                    opacity: !inputData.trim() ? 0.4 : 1,
                  }}
                >
                  {isRunning ? (
                    <span
                      style={{ animation: "pulse 1s ease-in-out infinite" }}
                    >
                      ● Running Pipeline…
                    </span>
                  ) : (
                    "▶ Run Agent Pipeline"
                  )}
                </button>

                <ResultPanel results={pipelineResults} />
              </div>

              {/* Right: Agent cards + pipeline status + log */}
              <div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  {agents.map((agent) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      status={agentStatuses[agent.id]}
                      result={agentResults[agent.id]}
                    />
                  ))}
                </div>

                {phase !== "idle" && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "6px",
                      marginBottom: "16px",
                      alignItems: "center",
                    }}
                  >
                    {agents.map((a, i) => (
                      <div
                        key={a.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background:
                              agentStatuses[a.id] !== "idle" ? a.color : "#222",
                            boxShadow:
                              agentStatuses[a.id] !== "idle"
                                ? `0 0 8px ${a.color}`
                                : "none",
                            transition: "all 0.3s",
                          }}
                        />
                        {i < agents.length - 1 && (
                          <div
                            style={{
                              width: "16px",
                              height: "1px",
                              background: "#222",
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <PipelineLog log={log} isRunning={isRunning} logRef={logRef} />
              </div>
            </div>
          </div>
        )}

        {/* ── METRICS PAGE ── */}
        {page === "metrics" && <MetricsDashboard />}
      </div>
    </div>
  );
}
