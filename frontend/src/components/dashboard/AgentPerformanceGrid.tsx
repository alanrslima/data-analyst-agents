import { AgentUsageStat } from "../../types/metrics.js";

const AGENT_META: Record<string, { icon: string; color: string; label: string }> = {
  parser:       { icon: "⬡", color: "#00d4ff", label: "Parser" },
  statistician: { icon: "∑", color: "#ff6b35", label: "Stats" },
  analyst:      { icon: "◈", color: "#a8ff3e", label: "Analyst" },
  reporter:     { icon: "❐", color: "#d4a1ff", label: "Reporter" },
};

function fmtMs(ms: number) {
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

function fmtTokens(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// Tiny SVG donut for success rate
function SuccessRing({ rate, color }: { rate: number; color: string }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const filled = (rate / 100) * circ;

  return (
    <svg width="56" height="56" viewBox="0 0 56 56">
      <circle cx="28" cy="28" r={r} fill="none" stroke="#1a1a2e" strokeWidth="4" />
      <circle
        cx="28" cy="28" r={r}
        fill="none"
        stroke={color}
        strokeWidth="4"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color}88)`, transition: "stroke-dasharray 0.6s ease" }}
      />
      <text
        x="28" y="32"
        textAnchor="middle"
        fill={color}
        fontSize="10"
        fontFamily="monospace"
        fontWeight="600"
      >
        {rate.toFixed(0)}%
      </text>
    </svg>
  );
}

interface Props {
  stats: AgentUsageStat[];
}

export function AgentPerformanceGrid({ stats }: Props) {
  if (stats.length === 0) return null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
      {stats.map((s) => {
        const meta = AGENT_META[s.agentId] ?? { icon: "?", color: "#888", label: s.agentId };
        const successRate = s.totalRuns > 0 ? (s.successRuns / s.totalRuns) * 100 : 0;
        const totalTokens = s.totalPromptTokensEst + s.totalOutputTokensEst;

        return (
          <div key={s.agentId} style={{
            background: `${meta.color}06`,
            border: `1px solid ${meta.color}22`,
            borderRadius: "12px",
            padding: "18px 16px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: "20px", color: meta.color }}>{meta.icon}</span>
                <div style={{ fontSize: "11px", color: meta.color, fontFamily: "'DM Mono', monospace", marginTop: "4px" }}>
                  {meta.label}
                </div>
              </div>
              <SuccessRing rate={successRate} color={meta.color} />
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              {[
                { label: "runs",     value: String(s.totalRuns) },
                { label: "errors",   value: String(s.errorRuns), highlight: s.errorRuns > 0 },
                { label: "avg time", value: s.avgDurationMs > 0 ? fmtMs(s.avgDurationMs) : "—" },
                { label: "tokens",   value: fmtTokens(totalTokens) },
              ].map(({ label, value, highlight }) => (
                <div key={label}>
                  <div style={{ fontSize: "9px", color: "#333", fontFamily: "'DM Mono', monospace", textTransform: "uppercase", letterSpacing: "1px" }}>
                    {label}
                  </div>
                  <div style={{ fontSize: "14px", color: highlight ? "#ff6666" : "#ccc", fontFamily: "'DM Mono', monospace", fontWeight: 500, marginTop: "2px" }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            {/* Token breakdown bar */}
            {totalTokens > 0 && (
              <div>
                <div style={{ fontSize: "9px", color: "#333", fontFamily: "'DM Mono', monospace", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "1px" }}>
                  prompt / output tokens
                </div>
                <div style={{ height: "4px", background: "#1a1a2e", borderRadius: "2px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(s.totalPromptTokensEst / totalTokens) * 100}%`,
                    background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`,
                    borderRadius: "2px",
                    transition: "width 0.6s ease",
                  }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px", fontSize: "9px", color: "#333", fontFamily: "'DM Mono', monospace" }}>
                  <span>↑ {fmtTokens(s.totalPromptTokensEst)}</span>
                  <span>↓ {fmtTokens(s.totalOutputTokensEst)}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
