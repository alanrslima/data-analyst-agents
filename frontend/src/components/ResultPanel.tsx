import { PipelineResults } from "../types/index.js";

interface Props {
  results: PipelineResults | null;
}

export function ResultPanel({ results }: Props) {
  const report = results?.reporter;
  if (!report) return null;

  const confidenceStyle = {
    high: { bg: "#a8ff3e22", color: "#a8ff3e" },
    medium: { bg: "#ffcc0022", color: "#ffcc00" },
    low: { bg: "#ff444422", color: "#ff4444" },
  }[report.confidence] ?? { bg: "#33333322", color: "#888" };

  const sections = [
    { label: "Key Findings", items: report.keyFindings, color: "#00d4ff" },
    { label: "Recommendations", items: report.recommendations, color: "#a8ff3e" },
    { label: "Next Steps", items: report.nextSteps, color: "#ff6b35" },
    { label: "Patterns", items: results?.analyst?.patterns ?? [], color: "#d4a1ff" },
  ];

  return (
    <div style={{
      background: "rgba(255,255,255,0.02)",
      border: "1px solid #2a2a3a",
      borderRadius: "16px",
      padding: "32px",
      marginTop: "32px",
      animation: "fadeUp 0.6s ease forwards",
    }}>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "22px", color: "#fff", marginBottom: "6px" }}>
        {report.reportTitle || "Analysis Report"}
      </div>

      <div style={{
        display: "inline-block",
        background: confidenceStyle.bg,
        color: confidenceStyle.color,
        borderRadius: "4px",
        padding: "2px 10px",
        fontSize: "11px",
        fontFamily: "'DM Mono', monospace",
        textTransform: "uppercase",
        letterSpacing: "1px",
        marginBottom: "20px",
      }}>
        {report.confidence} confidence
      </div>

      <p style={{
        color: "#aaa",
        fontFamily: "'DM Mono', monospace",
        fontSize: "13px",
        lineHeight: "1.7",
        marginBottom: "28px",
      }}>
        {report.executiveSummary}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {sections.map(({ label, items, color }) =>
          items?.length > 0 ? (
            <div key={label}>
              <div style={{
                color,
                fontFamily: "'DM Mono', monospace",
                fontSize: "11px",
                textTransform: "uppercase",
                letterSpacing: "2px",
                marginBottom: "10px",
              }}>
                {label}
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {items.slice(0, 4).map((item, i) => (
                  <li key={i} style={{
                    display: "flex",
                    gap: "8px",
                    marginBottom: "6px",
                    color: "#bbb",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    lineHeight: "1.5",
                  }}>
                    <span style={{ color, flexShrink: 0 }}>›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
