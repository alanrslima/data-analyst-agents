import { RefObject } from "react";
import { LogEntry } from "../types/index.js";

interface Props {
  log: LogEntry[];
  isRunning: boolean;
  logRef: RefObject<HTMLDivElement>;
}

export function PipelineLog({ log, isRunning, logRef }: Props) {
  if (log.length === 0) return null;

  return (
    <div
      ref={logRef}
      style={{
        background: "rgba(0,0,0,0.5)",
        border: "1px solid #1a1a2e",
        borderRadius: "10px",
        padding: "14px",
        height: "180px",
        overflowY: "auto",
        fontSize: "11px",
        fontFamily: "'DM Mono', monospace",
      }}
    >
      <div style={{ color: "#333", marginBottom: "8px", letterSpacing: "1px" }}>
        EXECUTION LOG
      </div>
      {log.map((entry, i) => (
        <div key={i} style={{ display: "flex", gap: "10px", marginBottom: "4px" }}>
          <span style={{ color: "#333", flexShrink: 0 }}>{entry.ts}</span>
          <span style={{ color: entry.color }}>{entry.msg}</span>
        </div>
      ))}
      {isRunning && (
        <div style={{ color: "#333", animation: "pulse 1s ease-in-out infinite" }}>_</div>
      )}
    </div>
  );
}
