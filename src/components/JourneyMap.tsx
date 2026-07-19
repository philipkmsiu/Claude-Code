import { useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { DayPlan, TransportMode, VisualPosterContent } from '../data/types'
import { inferVisualPoster, transportModeLabel } from '../data/travel'

type Props = {
  destinationName: string
  startLabel: string
  endLabel: string
  days: number
  nights: number
  transportMode: TransportMode
  itinerary: DayPlan[]
  visualPoster?: VisualPosterContent
  photoSrcs?: string[]
}

/** Stage-4 parchment journey poster — closer to sample planning-book art. */
export function JourneyMap({
  destinationName,
  startLabel,
  endLabel,
  days,
  nights,
  transportMode,
  itinerary,
  visualPoster,
  photoSrcs = [],
}: Props) {
  const posterRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const poster = useMemo(() => {
    if (visualPoster?.mustEat?.length) return visualPoster
    return inferVisualPoster({ destinationName, days, nights, transportMode })
  }, [visualPoster, destinationName, days, nights, transportMode])

  const pathGeometry = useMemo(() => buildSerpentinePath(itinerary.length), [itinerary.length])

  async function downloadPoster() {
    if (!posterRef.current) return
    setExporting(true)
    setExportError('')
    try {
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f3ebe0',
      })
      const link = document.createElement('a')
      const safe = destinationName.replace(/\s+/g, '-') || 'journey'
      link.download = `${safe}-旅程地圖.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : '匯出圖片失敗')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="journey-map-section" aria-label="視覺化旅程地圖">
      <div className="section-head journey-map-head">
        <div>
          <h3>階段四 · 視覺化旅遊地圖</h3>
          <p>
            規劃書風格插畫海報：蜿蜒道路、每日站點插畫、必吃／必喝與小貼士。可下載高解析 PNG。
          </p>
        </div>
        <button
          type="button"
          className="btn primary"
          disabled={exporting}
          onClick={() => void downloadPoster()}
        >
          {exporting ? '正在產生圖片…' : '下載旅程地圖 PNG'}
        </button>
      </div>
      {exportError ? <p className="input-error">{exportError}</p> : null}

      <div className="poster-scroll">
        <div ref={posterRef} className="journey-poster deluxe">
          <div className="poster-paper-texture" aria-hidden />

          <header className="poster-header">
            <CompassStamp />
            <div className="poster-header-main">
              <p className="poster-kicker">KM Travel Planner · Stage 4</p>
              <h2>「{destinationName}」舒適慢遊旅程地圖</h2>
              <p className="poster-subtitle">
                {poster.themeLine ||
                  `${days} 天 ${nights} 夜｜${transportModeLabel(transportMode)}｜舒適慢遊視覺摘要`}
              </p>
              <p className="poster-dates">
                {startLabel} — {endLabel}
              </p>
            </div>
            <GoStamp />
          </header>

          <div className="poster-body deluxe-body">
            <aside className="poster-side left watercolor-panel">
              <h4>
                <span className="side-ornament" aria-hidden />
                必吃美食
              </h4>
              <ul className="food-list">
                {poster.mustEat.map((item) => (
                  <li key={item.name}>
                    <FoodIcon label={item.name} motif={item.motif} />
                    <div>
                      <strong>{item.name}</strong>
                      <em>{item.daysLabel}</em>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>

            <div
              className="poster-path-col"
              style={{ minHeight: pathGeometry.height }}
            >
              <svg
                className="serpentine-svg"
                viewBox={`0 0 ${pathGeometry.width} ${pathGeometry.height}`}
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="roadWash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#9a8b72" stopOpacity="0.55" />
                    <stop offset="50%" stopColor="#c4a574" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#6f8f7f" stopOpacity="0.55" />
                  </linearGradient>
                </defs>
                <path
                  d={pathGeometry.d}
                  fill="none"
                  stroke="url(#roadWash)"
                  strokeWidth="18"
                  strokeLinecap="round"
                  opacity="0.22"
                />
                <path
                  d={pathGeometry.d}
                  fill="none"
                  stroke="#7a7264"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray="9 11"
                  opacity="0.75"
                />
              </svg>

              {itinerary.map((day, index) => {
                const point = pathGeometry.points[index]
                const bullets = dayBullets(day)
                const photo = photoSrcs.length
                  ? photoSrcs[index % photoSrcs.length]
                  : undefined
                const align = index % 2 === 0 ? 'card-left' : 'card-right'
                return (
                  <article
                    key={`poster-day-${index}`}
                    className={`poster-day-abs ${align}`}
                    style={{
                      top: point.y,
                      left: point.x,
                    }}
                  >
                    <div className="day-node deluxe-node">
                      <span>DAY</span>
                      <strong>{index + 1}</strong>
                    </div>
                    <div className="day-card-poster deluxe-card">
                      <div className="day-card-text">
                        <h5>{day.stayCity || day.stayArea || day.theme}</h5>
                        <p className="day-theme">{day.theme}</p>
                        <ul>
                          {bullets.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      </div>
                      <DayScene
                        day={day}
                        index={index}
                        photo={photo}
                      />
                    </div>
                  </article>
                )
              })}

              <div
                className="poster-finish deluxe-finish"
                style={{
                  top: pathGeometry.finishY,
                  left: '50%',
                }}
              >
                <AirportMark />
                <div>
                  <strong>機場／返程</strong>
                  <p>謝謝相遇，期待下次！</p>
                </div>
              </div>
            </div>

            <aside className="poster-side right watercolor-panel">
              <h4>
                <span className="side-ornament" aria-hidden />
                必喝飲品
              </h4>
              <ul className="food-list">
                {poster.mustDrink.map((item) => (
                  <li key={item.name}>
                    <FoodIcon label={item.name} motif={item.motif} />
                    <div>
                      <strong>{item.name}</strong>
                    </div>
                  </li>
                ))}
              </ul>
              <h4 className="tips-title">
                <span className="side-ornament" aria-hidden />
                旅行小貼士
              </h4>
              <ol className="poster-tips">
                {poster.travelTips.map((tip, i) => (
                  <li key={tip}>
                    <TipIcon index={i} />
                    <span>{tip}</span>
                  </li>
                ))}
              </ol>
            </aside>
          </div>

          <footer className="poster-footer">
            <div className="mascot deluxe-mascot">
              <CamelMascot />
              <p>跟著道路走，每天都有驚喜！</p>
            </div>
            <p className="poster-disclaimer">
              {poster.footerNote ||
                '路線示意，實際以天氣、交通與最終確認行程為準。'}
            </p>
          </footer>
        </div>
      </div>
    </section>
  )
}

function buildSerpentinePath(dayCount: number) {
  const n = Math.max(dayCount, 1)
  const width = 420
  const top = 36
  const gap = 148
  const height = top + n * gap + 110
  const points = Array.from({ length: n }, (_, i) => {
    const y = top + i * gap
    const wave = Math.sin(i * 0.95) * 58
    const x = width / 2 + wave
    return { x, y }
  })
  const d =
    points.length === 1
      ? `M ${points[0].x} ${points[0].y}`
      : points
          .map((p, i) => {
            if (i === 0) return `M ${p.x} ${p.y}`
            const prev = points[i - 1]
            const cy = (prev.y + p.y) / 2
            return `C ${prev.x} ${cy}, ${p.x} ${cy}, ${p.x} ${p.y}`
          })
          .join(' ')
  return {
    width,
    height,
    d,
    points,
    finishY: top + n * gap + 24,
  }
}

function dayBullets(day: DayPlan): string[] {
  if (day.mainPlan) {
    const parts = day.mainPlan
      .split(/[、，,；;]/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (parts.length) return parts.slice(0, 3)
  }
  const fromSchedule = day.schedule
    .filter(
      (s) =>
        s.spotId ||
        !/出發|午餐|晚餐|抵達|回飯店|晚起|前往|包車|自駕|轉乘/.test(s.title),
    )
    .map((s) => s.title)
    .slice(0, 3)
  if (fromSchedule.length) return fromSchedule
  return [day.theme].filter(Boolean)
}

function DayScene({
  day,
  index,
  photo,
}: {
  day: DayPlan
  index: number
  photo?: string
}) {
  const kind = sceneKind(day)
  return (
    <div
      className={`day-scene scene-${kind}`}
      style={
        photo
          ? {
              backgroundImage: `linear-gradient(165deg, rgba(244,239,228,0.2), rgba(40,55,48,0.45)), url(${photo})`,
            }
          : undefined
      }
    >
      {!photo ? <SceneArt kind={kind} index={index} /> : null}
      {photo ? <span className="scene-caption">{sceneLabel(kind)}</span> : null}
    </div>
  )
}

function sceneKind(day: DayPlan): string {
  const text = `${day.theme} ${day.stayCity || ''} ${day.mainPlan || ''}`
  if (/湖|海|泉|灣/.test(text)) return 'lake'
  if (/古城|城牆|關|寺|廟|窟|宮|博物館/.test(text)) return 'heritage'
  if (/山|峰|峽谷|高原|公路|沙漠|雅丹/.test(text)) return 'landscape'
  if (/機場|飛|返程/.test(text)) return 'travel'
  if (/休息|自由|洗衣|咖啡/.test(text)) return 'rest'
  if (/街|市|夜|美食|吃/.test(text)) return 'street'
  return 'city'
}

function sceneLabel(kind: string): string {
  const map: Record<string, string> = {
    lake: '湖光',
    heritage: '古迹',
    landscape: '山野',
    travel: '移動',
    rest: '休憩',
    street: '市井',
    city: '城市',
  }
  return map[kind] || '風景'
}

function SceneArt({ kind, index }: { kind: string; index: number }) {
  const tones = ['#6f8f7f', '#9a6b3f', '#7a8fa0', '#b08a5a', '#5c7a6e']
  const c = tones[index % tones.length]
  return (
    <svg viewBox="0 0 120 90" className="scene-svg" aria-hidden>
      <defs>
        <linearGradient id={`sky-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3e7d4" />
          <stop offset="100%" stopColor="#d9e4dc" />
        </linearGradient>
      </defs>
      <rect width="120" height="90" fill={`url(#sky-${index})`} rx="10" />
      <ellipse cx="28" cy="22" rx="16" ry="8" fill="#fff8ee" opacity="0.7" />
      <ellipse cx="48" cy="20" rx="12" ry="6" fill="#fff8ee" opacity="0.55" />
      {kind === 'lake' ? (
        <>
          <path d="M0 58 Q40 48 70 58 T120 56 L120 90 L0 90 Z" fill={c} opacity="0.55" />
          <path d="M0 66 Q45 58 80 66 T120 64" fill="none" stroke="#f7f3ea" strokeWidth="1.5" opacity="0.6" />
          <circle cx="88" cy="30" r="10" fill="#e8c97a" opacity="0.7" />
        </>
      ) : kind === 'heritage' ? (
        <>
          <rect x="35" y="34" width="50" height="36" fill={c} opacity="0.75" rx="2" />
          <polygon points="30,34 60,18 90,34" fill={c} />
          <rect x="52" y="48" width="16" height="22" fill="#f3ebe0" opacity="0.85" />
          <circle cx="22" cy="24" r="7" fill="#e8c97a" opacity="0.65" />
        </>
      ) : kind === 'landscape' ? (
        <>
          <path d="M0 70 L28 38 L52 62 L78 28 L120 70 Z" fill={c} opacity="0.7" />
          <path d="M0 78 L40 50 L70 72 L100 44 L120 78 Z" fill="#8a6b4a" opacity="0.35" />
        </>
      ) : kind === 'street' ? (
        <>
          <rect x="18" y="40" width="22" height="30" fill={c} opacity="0.7" />
          <rect x="48" y="32" width="26" height="38" fill="#8a6b4a" opacity="0.55" />
          <rect x="82" y="44" width="20" height="26" fill={c} opacity="0.65" />
          <circle cx="30" cy="70" r="3" fill="#e8c97a" />
          <circle cx="60" cy="70" r="3" fill="#e8c97a" />
        </>
      ) : kind === 'rest' ? (
        <>
          <ellipse cx="60" cy="58" rx="34" ry="12" fill={c} opacity="0.25" />
          <path d="M40 50 Q60 30 80 50" fill="none" stroke={c} strokeWidth="3" />
          <circle cx="60" cy="42" r="8" fill="#e8c97a" opacity="0.8" />
        </>
      ) : kind === 'travel' ? (
        <>
          <path d="M20 55 L70 40 L100 48 L70 52 L55 70 Z" fill={c} opacity="0.75" />
          <circle cx="30" cy="28" r="8" fill="#e8c97a" opacity="0.65" />
        </>
      ) : (
        <>
          <rect x="22" y="36" width="18" height="34" fill={c} opacity="0.65" />
          <rect x="48" y="28" width="22" height="42" fill="#8a6b4a" opacity="0.5" />
          <rect x="78" y="40" width="20" height="30" fill={c} opacity="0.7" />
          <path d="M0 78 Q60 68 120 78" fill="none" stroke="#c4a574" strokeWidth="2" />
        </>
      )}
    </svg>
  )
}

function FoodIcon({ label, motif }: { label: string; motif?: string }) {
  return (
    <span className="food-badge" title={label} aria-hidden>
      <span>{motif || '🍽'}</span>
    </span>
  )
}

function TipIcon({ index }: { index: number }) {
  const icons = ['🧥', '☀️', '🔋', '🙏', '🪪', '💧', '🛤', '🌤']
  return <span className="tip-icon">{icons[index % icons.length]}</span>
}

function CompassStamp() {
  return (
    <div className="poster-stamp compass deluxe-stamp" aria-hidden>
      <svg viewBox="0 0 64 64" width="54" height="54">
        <circle cx="32" cy="32" r="28" fill="none" stroke="#9a6b3f" strokeWidth="2.5" />
        <circle cx="32" cy="32" r="22" fill="rgba(255,255,255,0.35)" stroke="#9a6b3f" strokeWidth="1" />
        <polygon points="32,10 36,32 32,28 28,32" fill="#9a6b3f" />
        <polygon points="32,54 28,32 32,36 36,32" fill="#6f8f7f" />
        <text x="32" y="18" textAnchor="middle" fontSize="8" fill="#9a6b3f" fontWeight="700">
          N
        </text>
      </svg>
    </div>
  )
}

function GoStamp() {
  return (
    <div className="poster-stamp go deluxe-stamp" aria-hidden>
      Let&apos;s go!
    </div>
  )
}

function AirportMark() {
  return (
    <div className="finish-art" aria-hidden>
      <svg viewBox="0 0 64 48" width="52" height="40">
        <rect x="8" y="28" width="10" height="16" fill="#8a6b4a" opacity="0.7" />
        <path d="M22 30 L48 22 L58 26 L48 30 L40 40 Z" fill="#6f8f7f" />
        <circle cx="16" cy="16" r="6" fill="#e8c97a" opacity="0.7" />
      </svg>
    </div>
  )
}

function CamelMascot() {
  return (
    <div className="camel-art" aria-hidden>
      <svg viewBox="0 0 80 64" width="72" height="58">
        <ellipse cx="40" cy="42" rx="22" ry="12" fill="#c4a574" />
        <circle cx="58" cy="28" r="10" fill="#c4a574" />
        <circle cx="62" cy="26" r="1.6" fill="#2c3a34" />
        <path d="M20 40 Q16 22 28 18" fill="none" stroke="#8a6b4a" strokeWidth="3" />
        <path d="M30 30 Q36 16 44 28" fill="#b08a5a" />
        <path d="M44 30 Q50 14 56 28" fill="#b08a5a" />
        <rect x="54" y="18" width="10" height="6" rx="2" fill="#6f8f7f" />
        <circle cx="28" cy="36" r="4" fill="#e8c97a" />
      </svg>
    </div>
  )
}
