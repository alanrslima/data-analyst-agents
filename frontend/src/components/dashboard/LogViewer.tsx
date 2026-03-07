import { useState, useRef, useEffect } from "react";
import { LogEntry, LogLevel } from "../../types/metrics.js";
import { fetchLogs, clearLogs } from "../../services/api.js";

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: "#555",
  info:  "#00d4ff",
  warn:  "#ffcc00",
  error: "#ff4444",
};

const LEVEL_BG: Record<LogLevel, string> = {
  debug: "transparent",
  info:  "transparent",
  warn:  "#ffcc0008",
  error: "#ff444408",
};

const LEVELS: LogLevel[] = ["debug", "info", "warn", "error"];

interface Props {
  autoRefresh?: boolean;
}

export function LogViewer({ autoRefresh = false }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<LogLevel>("debug");
  const [loading, setLoading] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [liveRefresh, setLiveRefresh] = useState(autoRefresh);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const entries = await fetchLogs({ level: filterLevel, limit: 300 });
      setLogs(entries);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    await clearLogs();
    setLogs([]);
  }

  useEffect(() => { load(); }, [filterLevel]);

  useEffect(() => {
    if (!liveRefresh) return;
    const id = setInterval(load, 3000);
    return () => clearInterval(id);
  }, [liveRefresh, filterLevel]);

  useEffect(() => {
    if (autoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  function fmtCtx(ctx: Record<string, unknown>) {
    return Object.entries(ctx)
      .map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`)
      .join("  ");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <span style={{ color: "#444", fontSize: "11px", fontFamily: "'DM Mono', monospace" }}>LEVEL:</span>
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setFilterLevel(l)}
            style={{
              background: filterLevel === l ? `${LEVEL_COLOR[l]}22` : "transparent",
              border: `1px solid ${filterLevel === l ? LEVEL_COLOR[l] : "#222"}`,
              borderRadius: "5px",
              color: filterLevel === l ? LEVEL_COLOR[l] : "#444",
              fontSize: "10px",
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              textTransform: "uppercase",
              letterSpacing: "1px",
              transition: "all 0.15s",
            }}
          >
            {l}
          </button>
        ))}

        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          {/* Live toggle */}
          <button
            onClick={() => setLiveRefresh(!liveRefresh)}
            style={{
              background: liveRefresh ? "#00d4ff22" : "transparent",
              border: `1px solid ${liveRefresh ? "#00d4ff" : "#222"}`,
              borderRadius: "5px",
              color: liveRefresh ? "#00d4ff" : "#444",
              fontSize: "10px",
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            {liveRefresh && <span style={{ animation: "pulse 1s ease-in-out infinite" }}>●</span>}
            {liveRefresh ? "live" : "live off"}
          </button>

          <button
            onClick={load}
            disabled={loading}
            style={{
              background: "transparent",
              border: "1px solid #222",
              borderRadius: "5px",
              color: "#555",
              fontSize: "10px",
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            {loading ? "…" : "↻ refresh"}
          </button>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            style={{
              background: autoScroll ? "#a8ff3e22" : "transparent",
              border: `1px solid ${autoScroll ? "#a8ff3e44" : "#222"}`,
              borderRadius: "5px",
              color: autoScroll ? "#a8ff3e" : "#444",
              fontSize: "10px",
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            ↓ auto-scroll
          </button>

          <button
            onClick={handleClear}
            style={{
              background: "transparent",
              border: "1px solid #ff444433",
              borderRadius: "5px",
              color: "#ff4444",
              fontSize: "10px",
              padding: "4px 10px",
              cursor: "pointer",
              fontFamily: "'DM Mono', monospace",
            }}
          >
            ✕ clear
          </button>
        </div>
      </div>

      {/* Log count */}
      <div style={{ fontSize: "11px", color: "#333", fontFamily: "'DM Mono', monospace" }}>
        {logs.length} entries
        {liveRefresh && <span style={{ color: "#00d4ff", marginLeft: "8px" }}>● live</span>}
      </div>

      {/* Log list */}
      <div style={{
        background: "#050508",
        border: "1px solid #1a1a2e",
        borderRadius: "10px",
        overflowY: "auto",
        maxHeight: "520px",
        fontFamily: "'DM Mono', monospace",
        fontSize: "11px",
      }}>
        {logs.length === 0 ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#333" }}>
            No log entries at level ≥ {filterLevel}
          </div>
        ) : (
          logs.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: "grid",
                gridTemplateColumns: "90px 44px 1fr",
                gap: "12px",
                padding: "7px 14px",
                borderBottom: "1px solid #0d0d1a",
                background: LEVEL_BG[entry.level],
                alignItems: "baseline",
              }}
            >
              <span style={{ color: "#2a2a3a", fontSize: "10px", whiteSpace: "nowrap" }}>
                {new Date(entry.ts).toLocaleTimeString()}
              </span>
              <span style={{
                color: LEVEL_COLOR[entry.level],
                fontSize: "9px",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: 600,
              }}>
                {entry.level}
              </span>
              <span style={{ color: "#aaa" }}>
                {entry.msg}
                {entry.ctx && Object.keys(entry.ctx).length > 0 && (
                  <span style={{ color: "#2a2a4a", marginLeft: "10px" }}>
                    {fmtCtx(entry.ctx)}
                  </span>
                )}
              </span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
