import { AgentMeta, AgentStatus } from "../types/index.js";

interface Props {
  agent: AgentMeta;
  status: AgentStatus;
  result?: unknown;
}

export function AgentCard({ agent, status, result }: Props) {
  const statusColor =
    status === "running"
      ? "#ffcc00"
      : status === "done"
      ? agent.color
      : status === "error"
      ? "#ff4444"
      : "#2a2a3a";

  const statusLabel =
    status === "running"
      ? "● RUNNING"
      : status === "done"
      ? "✓ DONE"
      : status === "error"
      ? "✗ ERROR"
      : "○ IDLE";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${status === "idle" ? "#2a2a3a" : statusColor}`,
        borderRadius: "12px",
        padding: "20px",
        transition: "all 0.4s ease",
        boxShadow:
          status !== "idle"
            ? `0 0 20px ${statusColor}22, inset 0 0 20px ${statusColor}08`
            : "none",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {status === "running" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "-100%",
            width: "100%",
            height: "2px",
            background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)`,
            animation: "scan 1.5s linear infinite",
          }}
        />
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "10px" }}>
        <span style={{ fontSize: "28px", color: statusColor, fontFamily: "monospace", transition: "color 0.3s" }}>
          {agent.icon}
        </span>
        <div>
          <div style={{ color: "#fff", fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: "14px" }}>
            {agent.name}
          </div>
          <div style={{ color: "#666", fontSize: "11px", fontFamily: "'DM Mono', monospace" }}>
            {agent.role}
          </div>
        </div>
        <div style={{
          marginLeft: "auto",
          fontSize: "10px",
          fontFamily: "'DM Mono', monospace",
          color: statusColor,
          textTransform: "uppercase",
          letterSpacing: "1px",
        }}>
          {statusLabel}
        </div>
      </div>

      <div style={{ color: "#555", fontSize: "12px", fontFamily: "'DM Mono', monospace", marginBottom: "12px" }}>
        {agent.description}
      </div>

      {result && status === "done" && (
        <div style={{
          background: "rgba(0,0,0,0.4)",
          borderRadius: "8px",
          padding: "12px",
          fontSize: "11px",
          fontFamily: "'DM Mono', monospace",
          color: "#aaa",
          maxHeight: "120px",
          overflowY: "auto",
        }}>
          {Object.entries(result as Record<string, unknown>)
            .slice(0, 3)
            .map(([k, v]) => (
              <div key={k} style={{ marginBottom: "4px" }}>
                <span style={{ color: agent.color }}>{k}: </span>
                <span>
                  {typeof v === "object"
                    ? JSON.stringify(v).slice(0, 60) + "…"
                    : String(v).slice(0, 60)}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
