interface Bar {
  label: string;
  value: number;
  color: string;
}

interface Props {
  bars: Bar[];
  maxValue?: number;
  height?: number;
  showValues?: boolean;
  unit?: string;
}

export function MiniBar({ bars, maxValue, height = 80, showValues = true, unit = "" }: Props) {
  const max = maxValue ?? Math.max(...bars.map((b) => b.value), 1);

  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: `${height + 28}px` }}>
      {bars.map((bar) => {
        const pct = max > 0 ? (bar.value / max) * 100 : 0;
        return (
          <div key={bar.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
            {showValues && (
              <div style={{
                fontSize: "10px",
                color: bar.color,
                fontFamily: "'DM Mono', monospace",
                whiteSpace: "nowrap",
              }}>
                {bar.value > 0 ? `${bar.value}${unit}` : "—"}
              </div>
            )}
            <div style={{
              width: "100%",
              height: `${height}px`,
              display: "flex",
              alignItems: "flex-end",
            }}>
              <div style={{
                width: "100%",
                height: `${pct}%`,
                minHeight: bar.value > 0 ? "2px" : 0,
                background: `linear-gradient(180deg, ${bar.color}, ${bar.color}66)`,
                borderRadius: "3px 3px 0 0",
                transition: "height 0.6s ease",
                boxShadow: `0 0 8px ${bar.color}44`,
              }} />
            </div>
            <div style={{
              fontSize: "9px",
              color: "#444",
              fontFamily: "'DM Mono', monospace",
              textAlign: "center",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}>
              {bar.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
