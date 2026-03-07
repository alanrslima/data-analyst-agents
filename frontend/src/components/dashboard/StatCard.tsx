interface Props {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  accent?: boolean;
}

export function StatCard({ label, value, sub, color = "#00d4ff", accent = false }: Props) {
  return (
    <div style={{
      background: accent ? `${color}0d` : "rgba(255,255,255,0.02)",
      border: `1px solid ${accent ? color + "33" : "#1e1e2e"}`,
      borderRadius: "12px",
      padding: "20px 24px",
      transition: "border-color 0.3s",
    }}>
      <div style={{
        fontSize: "10px",
        color: "#444",
        fontFamily: "'DM Mono', monospace",
        textTransform: "uppercase",
        letterSpacing: "2px",
        marginBottom: "10px",
      }}>
        {label}
      </div>
      <div style={{
        fontSize: "28px",
        fontFamily: "'Playfair Display', serif",
        color: accent ? color : "#fff",
        fontWeight: 700,
        lineHeight: 1,
        marginBottom: sub ? "6px" : 0,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "11px", color: "#555", fontFamily: "'DM Mono', monospace" }}>
          {sub}
        </div>
      )}
    </div>
  );
}
