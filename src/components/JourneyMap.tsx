import type { DayPlan, TransportMode } from '../data/types'
import { transportModeLabel } from '../data/travel'

type Props = {
  destinationName: string
  startLabel: string
  endLabel: string
  days: number
  nights: number
  transportMode: TransportMode
  itinerary: DayPlan[]
}

/** Stage-4 style illustrated journey map (SVG adventure path). */
export function JourneyMap({
  destinationName,
  startLabel,
  endLabel,
  days,
  nights,
  transportMode,
  itinerary,
}: Props) {
  const stops = itinerary.slice(0, 14)
  const count = Math.max(stops.length, 1)
  const width = 960
  const height = 520
  const padX = 70
  const padY = 90
  const usableW = width - padX * 2
  const usableH = height - padY * 2 - 40

  const points = stops.map((_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1)
    const x = padX + usableW * t
    const wave = Math.sin(t * Math.PI * 2.2) * (usableH * 0.28)
    const y = padY + usableH * 0.5 + wave
    return { x, y }
  })

  const pathD =
    points.length === 1
      ? `M ${points[0].x} ${points[0].y}`
      : points
          .map((p, i) => {
            if (i === 0) return `M ${p.x} ${p.y}`
            const prev = points[i - 1]
            const cx1 = prev.x + (p.x - prev.x) * 0.4
            const cy1 = prev.y
            const cx2 = prev.x + (p.x - prev.x) * 0.6
            const cy2 = p.y
            return `C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p.x} ${p.y}`
          })
          .join(' ')

  const foods = itinerary
    .flatMap((d) => d.schedule)
    .filter((s) => /餐|美食|咖啡/.test(s.title) || /餐|美食/.test(s.detail))
    .map((s) => s.title)
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .slice(0, 6)

  const tips =
    transportMode === 'private_driver'
      ? ['準時與司機會合', '行李放後車廂最省事', '長距離日可請司機安排休息站']
      : transportMode === 'self_drive'
        ? ['出發前查路況與加油', '景點優先找停車場', '山路預留白天通行時間']
        : ['先買交通卡／一日券', '跨區預留轉乘時間', '即時班次用 Maps／換乘 App']

  return (
    <section className="journey-map-section" aria-label="視覺化旅程地圖">
      <div className="section-head">
        <h3>階段四 · 視覺化旅遊地圖</h3>
        <p>
          插畫風格旅程地圖：沿著蜿蜒道路一天一天前進。交通模式：
          {transportModeLabel(transportMode)}。
        </p>
      </div>

      <div className="journey-map-frame">
        <svg
          className="journey-map-svg"
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label={`${destinationName} ${days} 天旅程地圖`}
        >
          <defs>
            <linearGradient id="roadGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#7a9e8e" />
              <stop offset="50%" stopColor="#c4a574" />
              <stop offset="100%" stopColor="#8a6b4a" />
            </linearGradient>
            <linearGradient id="mapPaper" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f3efe6" />
              <stop offset="100%" stopColor="#e4ebe4" />
            </linearGradient>
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width={width} height={height} fill="url(#mapPaper)" rx="18" />

          {/* Decorative side motifs */}
          <circle cx="48" cy="70" r="18" fill="#d8c4a4" opacity="0.55" />
          <circle cx="900" cy="80" r="22" fill="#b7c9be" opacity="0.5" />
          <path
            d="M40 420 q30 -40 60 0 t60 0"
            fill="none"
            stroke="#9bb3a6"
            strokeWidth="2"
            opacity="0.45"
          />
          <path
            d="M820 430 q25 -35 50 0 t50 0"
            fill="none"
            stroke="#c4a574"
            strokeWidth="2"
            opacity="0.4"
          />

          <text
            x={width / 2}
            y="42"
            textAnchor="middle"
            className="map-title"
            fill="#243b34"
            fontSize="26"
            fontFamily="Georgia, 'Noto Serif TC', serif"
            fontWeight="700"
          >
            {destinationName} · 旅程地圖
          </text>
          <text
            x={width / 2}
            y="68"
            textAnchor="middle"
            fill="#5c6f67"
            fontSize="13"
            fontFamily="system-ui, sans-serif"
          >
            {startLabel} → {endLabel} · {days} 天 {nights} 夜 ·{' '}
            {transportModeLabel(transportMode)}
          </text>

          {/* Winding road */}
          <path
            d={pathD}
            fill="none"
            stroke="url(#roadGrad)"
            strokeWidth="14"
            strokeLinecap="round"
            opacity="0.35"
          />
          <path
            d={pathD}
            fill="none"
            stroke="url(#roadGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="10 8"
            filter="url(#softGlow)"
          />

          {/* Airport markers */}
          <g>
            <circle cx={padX - 18} cy={points[0]?.y ?? height / 2} r="10" fill="#4a7a6e" />
            <text
              x={padX - 18}
              y={(points[0]?.y ?? height / 2) + 28}
              textAnchor="middle"
              fill="#243b34"
              fontSize="11"
            >
              起飛
            </text>
          </g>
          <g>
            <circle
              cx={width - padX + 18}
              cy={points[points.length - 1]?.y ?? height / 2}
              r="10"
              fill="#8a6b4a"
            />
            <text
              x={width - padX + 18}
              y={(points[points.length - 1]?.y ?? height / 2) + 28}
              textAnchor="middle"
              fill="#243b34"
              fontSize="11"
            >
              返程
            </text>
          </g>

          {points.map((p, i) => {
            const day = stops[i]
            const spotLabel =
              day.mainPlan?.split('、')[0] ||
              day.schedule.find((s) => s.spotId)?.title ||
              day.theme
            const tone = ['#4a7a6e', '#8a6b4a', '#6b7c8a', '#a67c52', '#5c7a6e'][i % 5]
            const labelY = i % 2 === 0 ? p.y - 38 : p.y + 46
            return (
              <g key={`day-${i}`} className="map-stop">
                <circle cx={p.x} cy={p.y} r="22" fill="#f7f3ea" stroke={tone} strokeWidth="3" />
                <circle cx={p.x} cy={p.y} r="14" fill={tone} opacity="0.9" />
                <text
                  x={p.x}
                  y={p.y + 4}
                  textAnchor="middle"
                  fill="#f7f3ea"
                  fontSize="10"
                  fontWeight="700"
                >
                  D{i + 1}
                </text>
                <text
                  x={p.x}
                  y={labelY}
                  textAnchor="middle"
                  fill="#243b34"
                  fontSize="11"
                  fontWeight="600"
                >
                  DAY {i + 1}
                </text>
                <text
                  x={p.x}
                  y={labelY + 16}
                  textAnchor="middle"
                  fill="#5c6f67"
                  fontSize="10"
                >
                  {truncate(spotLabel, 10)}
                </text>
              </g>
            )
          })}

          {/* Side info bands */}
          <g>
            <text x="36" y="110" fill="#243b34" fontSize="12" fontWeight="700">
              必吃／補給
            </text>
            {(foods.length ? foods : ['在地早餐', '街區小吃', '特色晚餐']).map((food, i) => (
              <text key={food} x="36" y={130 + i * 18} fill="#5c6f67" fontSize="11">
                · {truncate(food, 12)}
              </text>
            ))}
          </g>
          <g>
            <text x={width - 200} y="110" fill="#243b34" fontSize="12" fontWeight="700">
              旅行小貼士
            </text>
            {tips.map((tip, i) => (
              <text key={tip} x={width - 200} y={130 + i * 18} fill="#5c6f67" fontSize="11">
                · {tip}
              </text>
            ))}
          </g>
        </svg>
      </div>
    </section>
  )
}

function truncate(text: string, max: number): string {
  const t = text.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}
