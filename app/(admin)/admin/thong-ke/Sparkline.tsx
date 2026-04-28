/**
 * Sparkline SVG thuần (không dep recharts) — render N điểm dạng line + fill,
 * tự scale theo max value. Phase 3.7 round 4 (2026-04).
 */

type Point = { date: string; count: number }

export function Sparkline({
  points,
  width = 220,
  height = 48,
  stroke = "#7a4f23",
  fill = "rgba(122, 79, 35, 0.12)",
}: {
  points: Point[]
  width?: number
  height?: number
  stroke?: string
  fill?: string
}) {
  if (points.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-[11px] text-brand-300 italic"
        style={{ width, height }}
      >
        Chưa đủ data
      </div>
    )
  }
  const max = Math.max(1, ...points.map((p) => p.count))
  const stepX = width / Math.max(1, points.length - 1)
  // Padding 2px trên/dưới để stroke không bị crop.
  const usableH = height - 4
  const pathPoints = points.map((p, i) => {
    const x = i * stepX
    const y = 2 + usableH - (p.count / max) * usableH
    return [x, y] as const
  })
  const linePath = pathPoints
    .map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`))
    .join(" ")
  // Fill polygon: line path + xuống đáy + về đầu
  const fillPath = `${linePath} L${pathPoints[pathPoints.length - 1][0]},${height} L0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Biểu đồ ${points.length} ngày, đỉnh ${max}`}
    >
      <path d={fillPath} fill={fill} />
      <path d={linePath} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}
