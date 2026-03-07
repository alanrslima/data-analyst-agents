interface Props {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  filled?: boolean;
}

export function SparkLine({
  values,
  color = "#00d4ff",
  width = 120,
  height = 32,
  filled = true,
}: Props) {
  if (values.length < 2) {
    return <div style={{ width, height, opacity: 0.2, background: "#333", borderRadius: 4 }} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return [x, y] as [number, number];
  });

  const linePath = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fillPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg width={width} height={height} style={{ overflow: "visible" }}>
      {filled && (
        <path
          d={fillPath}
          fill={`${color}18`}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r="2.5"
        fill={color}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}
