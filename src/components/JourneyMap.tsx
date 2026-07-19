import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { DayPlan, TransportMode, VisualPosterContent } from '../data/types'
import { inferVisualPoster, transportModeLabel } from '../data/travel'
import { resolveDayPhotos } from '../lib/placePhotos'

type Edition = 'photo' | 'scrapbook'

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

/**
 * Stage 4 — two editions for every journey:
 * 1) 相片版：real destination photos on the path
 * 2) 插畫海報版：watercolor scrapbook poster (sample-planner style)
 */
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
  const [edition, setEdition] = useState<Edition>('scrapbook')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [dayPhotos, setDayPhotos] = useState<(string | null)[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)

  const poster = useMemo(() => {
    if (visualPoster?.mustEat?.length) return visualPoster
    return inferVisualPoster({ destinationName, days, nights, transportMode })
  }, [visualPoster, destinationName, days, nights, transportMode])

  const pathGeometry = useMemo(
    () => buildSerpentinePath(itinerary.length, edition === 'scrapbook' ? 168 : 148),
    [itinerary.length, edition],
  )

  const itineraryPhotoKey = itinerary
    .map((day) => `${day.theme}|${day.mainPlan || ''}|${day.stayCity || ''}|${day.spotIds.join(',')}`)
    .join('||')

  useEffect(() => {
    let cancelled = false
    setPhotosLoading(true)
    void resolveDayPhotos(
      itinerary.map((day) => ({
        stayCity: day.stayCity || day.stayArea,
        theme: day.theme,
        mainPlan: day.mainPlan,
        spotNames: [
          ...(day.mainPlan ? day.mainPlan.split(/[、，,；;]/).map((s) => s.trim()) : []),
          ...day.schedule.map((item) => item.title),
        ],
      })),
      destinationName,
    )
      .then((rows) => {
        if (cancelled) return
        // Live landmark photos first; handbook gallery as fallback.
        const merged = rows.map((url, index) => {
          if (url) return url
          if (photoSrcs.length) return photoSrcs[index % photoSrcs.length]
          return null
        })
        setDayPhotos(merged)
      })
      .finally(() => {
        if (!cancelled) setPhotosLoading(false)
      })
    return () => {
      cancelled = true
    }
    // itineraryPhotoKey captures day content changes without unstable array identity.
  }, [destinationName, itineraryPhotoKey, photoSrcs.join('|')])

  const hasPhotos = dayPhotos.some(Boolean)

  async function downloadPoster() {
    if (!posterRef.current) return
    setExporting(true)
    setExportError('')
    try {
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: edition === 'scrapbook' ? '#f6efe4' : '#f3ebe0',
      })
      const link = document.createElement('a')
      const safe = destinationName.replace(/\s+/g, '-') || 'journey'
      const suffix = edition === 'photo' ? '相片版' : '插畫海報版'
      link.download = `${safe}-旅程地圖-${suffix}.png`
      link.href = dataUrl
      link.click()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : '匯出圖片失敗')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section
      id="stage-4-poster"
      className="journey-map-section"
      aria-label="視覺化旅程地圖"
    >
      <div className="section-head journey-map-head">
        <div>
          <h3>階段四 · 視覺化旅遊地圖</h3>
          <p>
            兩個完全不同的版本：<strong>相片版</strong>用每日不重複的真實景點照片；
            <strong>插畫海報版</strong>是 Gemini 規劃書那種手繪水彩風（不用相片）。可分別下載 PNG。
          </p>
        </div>
        <div className="edition-actions">
          <div className="edition-toggle" role="tablist" aria-label="海報版本">
            <button
              type="button"
              role="tab"
              aria-selected={edition === 'photo'}
              className={`chip ${edition === 'photo' ? 'selected' : ''}`}
              onClick={() => setEdition('photo')}
            >
              相片版
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={edition === 'scrapbook'}
              className={`chip ${edition === 'scrapbook' ? 'selected' : ''}`}
              onClick={() => setEdition('scrapbook')}
            >
              插畫海報版
            </button>
          </div>
          <button
            type="button"
            className="btn primary"
            disabled={exporting}
            onClick={() => void downloadPoster()}
          >
            {exporting
              ? '正在產生圖片…'
              : `下載${edition === 'photo' ? '相片版' : '插畫海報版'} PNG`}
          </button>
        </div>
      </div>
      {exportError ? <p className="input-error">{exportError}</p> : null}
      {photosLoading ? (
        <p className="muted-line photo-fallback-note">正在載入每日景點相片…</p>
      ) : null}
      {!photosLoading && !hasPhotos ? (
        <p className="muted-line photo-fallback-note">
          暫時未能取得景點相片，會先用插畫場景；請確認已用 `npm run dev` 啟動（相片代理需要開發伺服器）。
        </p>
      ) : null}

      <div className="poster-scroll">
        <div
          ref={posterRef}
          className={`journey-poster deluxe ${edition === 'scrapbook' ? 'scrapbook' : 'photo-edition'}`}
        >
          <div className="poster-paper-texture" aria-hidden />
          {edition === 'scrapbook' ? <div className="washi-strip top" aria-hidden /> : null}

          <header className="poster-header">
            <CompassStamp />
            <div className="poster-header-main">
              <p className="poster-kicker">
                KM Travel Planner · Stage 4 ·{' '}
                {edition === 'photo' ? '相片版' : '插畫海報版'}
              </p>
              <h2>「{destinationName}」舒適慢遊旅程地圖</h2>
              <p className="poster-subtitle">
                {poster.themeLine ||
                  `${days} 天 ${nights} 夜｜${transportModeLabel(transportMode)}｜舒適慢遊視覺摘要`}
              </p>
              <p className="poster-dates">
                {startLabel} — {endLabel}
              </p>
            </div>
            {edition === 'scrapbook' ? (
              <DestinationStamp name={destinationName} />
            ) : (
              <GoStamp />
            )}
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
                    <FoodIcon label={item.name} motif={item.motif} scrapbook={edition === 'scrapbook'} />
                    <div>
                      <strong>{item.name}</strong>
                      <em>{item.daysLabel}</em>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="poster-path-col" style={{ minHeight: pathGeometry.height }}>
              <svg
                className="serpentine-svg"
                viewBox={`0 0 ${pathGeometry.width} ${pathGeometry.height}`}
                preserveAspectRatio="none"
                aria-hidden
              >
                <defs>
                  <linearGradient id="roadWashMulti" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b8fa8" />
                    <stop offset="25%" stopColor="#6f8f7f" />
                    <stop offset="50%" stopColor="#c4a574" />
                    <stop offset="75%" stopColor="#c17a5a" />
                    <stop offset="100%" stopColor="#8a5a6a" />
                  </linearGradient>
                </defs>
                <path
                  d={pathGeometry.d}
                  fill="none"
                  stroke={edition === 'scrapbook' ? 'url(#roadWashMulti)' : '#9a8b72'}
                  strokeWidth={edition === 'scrapbook' ? 16 : 14}
                  strokeLinecap="round"
                  opacity={edition === 'scrapbook' ? 0.35 : 0.22}
                />
                <path
                  d={pathGeometry.d}
                  fill="none"
                  stroke={edition === 'scrapbook' ? '#5c5348' : '#7a7264'}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeDasharray={edition === 'scrapbook' ? '7 10' : '9 11'}
                  opacity="0.8"
                />
              </svg>

              {itinerary.map((day, index) => {
                const point = pathGeometry.points[index]
                const bullets = dayBullets(day)
                const photo = dayPhotos[index] || undefined
                const align = index % 2 === 0 ? 'card-left' : 'card-right'
                const foodMotif =
                  edition === 'scrapbook' && index % 3 === 1
                    ? poster.mustEat[index % poster.mustEat.length]?.motif
                    : undefined

                return (
                  <article
                    key={`poster-day-${index}-${edition}`}
                    className={`poster-day-abs ${align} ${edition}`}
                    style={{ top: point.y, left: point.x }}
                  >
                    {foodMotif ? (
                      <span className="path-food-chip" aria-hidden>
                        {foodMotif}
                      </span>
                    ) : null}

                    {edition === 'scrapbook' ? (
                      <div className="scrapbook-node">
                        <div className="scrapbook-ring illustrated">
                          {/* Illustration edition never uses photos — unique hand-drawn scenes only. */}
                          <GeminiDayArt day={day} index={index} />
                        </div>
                        <div className="day-node deluxe-node scrapbook-badge">
                          <span>DAY</span>
                          <strong>{index + 1}</strong>
                        </div>
                        <div className="scrapbook-caption">
                          <h5>{day.stayCity || day.stayArea || day.theme}</h5>
                          <ul>
                            {bullets.map((b) => (
                              <li key={b}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="day-node deluxe-node">
                          <span>DAY</span>
                          <strong>{index + 1}</strong>
                        </div>
                        <div className="day-card-poster deluxe-card photo-card">
                          <div className="day-card-text">
                            <h5>{day.stayCity || day.stayArea || day.theme}</h5>
                            <p className="day-theme">{day.theme}</p>
                            <ul>
                              {bullets.map((b) => (
                                <li key={b}>{b}</li>
                              ))}
                            </ul>
                          </div>
                          <DayScene day={day} index={index} photo={photo} />
                        </div>
                      </>
                    )}
                  </article>
                )
              })}

              <div
                className="poster-finish deluxe-finish"
                style={{ top: pathGeometry.finishY, left: '50%' }}
              >
                <AirportMark />
                <div>
                  <strong>終點：機場／返程</strong>
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
                    <FoodIcon label={item.name} motif={item.motif} scrapbook={edition === 'scrapbook'} />
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
            {edition === 'scrapbook' ? (
              <div className="thanks-frame">
                <strong>謝謝相遇</strong>
                <span>期待下次再見</span>
              </div>
            ) : null}
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

function buildSerpentinePath(dayCount: number, gap = 148) {
  const n = Math.max(dayCount, 1)
  const width = 420
  const top = 40
  const height = top + n * gap + 120
  const points = Array.from({ length: n }, (_, i) => {
    const y = top + i * gap
    const wave = Math.sin(i * 0.95) * 62
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
  return { width, height, d, points, finishY: top + n * gap + 28 }
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

/** Gemini-style unique watercolor scene — never a photograph. */
function GeminiDayArt({ day, index }: { day: DayPlan; index: number }) {
  const kind = sceneKind(day)
  const palette = [
    ['#7ea896', '#d9b27c', '#f3e7d4'],
    ['#c17a5a', '#e8c97a', '#efe4d0'],
    ['#6b8fa8', '#9bb7a5', '#f0e8d8'],
    ['#8a6b4a', '#c4a574', '#f7f1e6'],
    ['#5c7a6e', '#b08a5a', '#e7efe9'],
    ['#9a6b3f', '#7a9e8e', '#f3ebe0'],
  ][index % 6]
  const [a, b, paper] = palette
  const variant = index % 3

  return (
    <div className="day-scene circular gemini-art" aria-hidden>
      <svg viewBox="0 0 120 120" className="scene-svg">
        <defs>
          <radialGradient id={`paper-${index}`} cx="40%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fffaf2" />
            <stop offset="100%" stopColor={paper} />
          </radialGradient>
          <filter id={`paint-${index}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
          </filter>
        </defs>
        <circle cx="60" cy="60" r="58" fill={`url(#paper-${index})`} />
        <g filter={`url(#paint-${index})`}>
          <ellipse cx="30" cy="28" rx="14" ry="7" fill="#fff8ee" opacity="0.75" />
          <circle cx="92" cy="26" r="9" fill="#e8c97a" opacity="0.55" />
          {kind === 'lake' ? (
            <>
              <path
                d={
                  variant === 0
                    ? 'M8 78 Q40 58 70 76 T114 74 L114 112 L8 112 Z'
                    : 'M6 82 Q50 62 90 80 T116 78 L116 112 L6 112 Z'
                }
                fill={a}
                opacity="0.7"
              />
              <path d="M10 86 Q55 72 100 86" fill="none" stroke="#fff8ee" strokeWidth="1.6" opacity="0.55" />
              <path d="M20 54 Q40 40 55 55" fill={b} opacity="0.55" />
            </>
          ) : kind === 'heritage' ? (
            <>
              <rect x="34" y="48" width="52" height="38" rx="2" fill={a} opacity="0.78" />
              <polygon
                points={variant === 1 ? '28,48 60,22 92,48' : '30,50 60,26 90,50'}
                fill={b}
              />
              <rect x="52" y="62" width="16" height="24" fill="#f7f1e6" opacity="0.9" />
              <rect x="40" y="56" width="8" height="8" fill="#f7f1e6" opacity="0.55" />
              <rect x="72" y="56" width="8" height="8" fill="#f7f1e6" opacity="0.55" />
            </>
          ) : kind === 'landscape' ? (
            <>
              <path
                d={
                  variant === 2
                    ? 'M4 92 L28 40 L48 70 L72 28 L96 66 L116 42 L116 112 L4 112 Z'
                    : 'M2 96 L34 44 L58 78 L82 32 L116 88 L116 112 L2 112 Z'
                }
                fill={a}
                opacity="0.75"
              />
              <path d="M2 100 L50 62 L84 90 L116 70 L116 112 L2 112 Z" fill={b} opacity="0.4" />
            </>
          ) : kind === 'street' ? (
            <>
              <rect x="16" y="50" width="24" height="36" fill={a} opacity="0.7" />
              <rect x="46" y="40" width="28" height="46" fill={b} opacity="0.65" />
              <rect x="80" y="54" width="22" height="32" fill={a} opacity="0.75" />
              <circle cx="28" cy="92" r="3" fill="#e8c97a" />
              <circle cx="60" cy="92" r="3" fill="#e8c97a" />
              <circle cx="90" cy="92" r="3" fill="#e8c97a" />
            </>
          ) : kind === 'rest' ? (
            <>
              <ellipse cx="60" cy="78" rx="36" ry="14" fill={a} opacity="0.28" />
              <path d="M38 66 Q60 40 82 66" fill="none" stroke={b} strokeWidth="4" />
              <circle cx="60" cy="54" r="10" fill="#e8c97a" opacity="0.85" />
            </>
          ) : kind === 'travel' ? (
            <>
              <path d="M18 70 L72 48 L102 58 L72 66 L54 90 Z" fill={a} opacity="0.8" />
              <rect x="20" y="78" width="14" height="18" fill={b} opacity="0.65" />
            </>
          ) : (
            <>
              <rect x="20" y="46" width="20" height="40" fill={a} opacity="0.7" />
              <rect x="48" y="36" width="24" height="50" fill={b} opacity="0.6" />
              <rect x="80" y="50" width="20" height="36" fill={a} opacity="0.75" />
              <path d="M8 96 Q60 84 112 96" fill="none" stroke={b} strokeWidth="2.2" />
            </>
          )}
        </g>
        <text
          x="60"
          y="112"
          textAnchor="middle"
          fontSize="8"
          fill="#5c6b63"
          fontFamily="Georgia, serif"
        >
          {sceneLabel(kind)}
        </text>
      </svg>
    </div>
  )
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
    <div className={`day-scene scene-${kind}`}>
      {photo ? (
        <img
          className="day-scene-img"
          src={photo}
          alt={day.stayCity || day.theme}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : (
        <SceneArt kind={kind} index={index} />
      )}
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
  const tones = ['#6f8f7f', '#9a6b3f', '#7a8fa0', '#b08a5a', '#5c7a6e', '#c17a5a']
  const c = tones[index % tones.length]
  return (
    <svg viewBox="0 0 120 90" className="scene-svg" aria-hidden>
      <defs>
        <linearGradient id={`sky-${index}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f3e7d4" />
          <stop offset="100%" stopColor="#d9e4dc" />
        </linearGradient>
        <filter id={`wash-${index}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" />
        </filter>
      </defs>
      <rect width="120" height="90" fill={`url(#sky-${index})`} rx="10" />
      <ellipse cx="28" cy="22" rx="16" ry="8" fill="#fff8ee" opacity="0.7" />
      <g filter={`url(#wash-${index})`} opacity="0.95">
        {kind === 'lake' ? (
          <>
            <path d="M0 58 Q40 48 70 58 T120 56 L120 90 L0 90 Z" fill={c} opacity="0.55" />
            <circle cx="88" cy="30" r="10" fill="#e8c97a" opacity="0.7" />
          </>
        ) : kind === 'heritage' ? (
          <>
            <rect x="35" y="34" width="50" height="36" fill={c} opacity="0.75" rx="2" />
            <polygon points="30,34 60,18 90,34" fill={c} />
            <rect x="52" y="48" width="16" height="22" fill="#f3ebe0" opacity="0.85" />
          </>
        ) : kind === 'landscape' ? (
          <path d="M0 70 L28 38 L52 62 L78 28 L120 70 Z" fill={c} opacity="0.7" />
        ) : kind === 'street' ? (
          <>
            <rect x="18" y="40" width="22" height="30" fill={c} opacity="0.7" />
            <rect x="48" y="32" width="26" height="38" fill="#8a6b4a" opacity="0.55" />
            <rect x="82" y="44" width="20" height="26" fill={c} opacity="0.65" />
          </>
        ) : kind === 'rest' ? (
          <>
            <ellipse cx="60" cy="58" rx="34" ry="12" fill={c} opacity="0.25" />
            <circle cx="60" cy="42" r="8" fill="#e8c97a" opacity="0.8" />
          </>
        ) : kind === 'travel' ? (
          <path d="M20 55 L70 40 L100 48 L70 52 L55 70 Z" fill={c} opacity="0.75" />
        ) : (
          <>
            <rect x="22" y="36" width="18" height="34" fill={c} opacity="0.65" />
            <rect x="48" y="28" width="22" height="42" fill="#8a6b4a" opacity="0.5" />
            <rect x="78" y="40" width="20" height="30" fill={c} opacity="0.7" />
          </>
        )}
      </g>
    </svg>
  )
}

function FoodIcon({
  label,
  motif,
  scrapbook,
}: {
  label: string
  motif?: string
  scrapbook?: boolean
}) {
  return (
    <span className={`food-badge ${scrapbook ? 'scrapbook-food' : ''}`} title={label} aria-hidden>
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

function DestinationStamp({ name }: { name: string }) {
  const short = name.length > 6 ? name.slice(0, 6) : name
  return (
    <div className="dest-postage" aria-hidden>
      <div className="postage-inner">
        <CamelMascot small />
        <strong>{short}</strong>
        <em>TRAVEL</em>
      </div>
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

function CamelMascot({ small = false }: { small?: boolean }) {
  return (
    <div className={`camel-art ${small ? 'small' : ''}`} aria-hidden>
      <svg viewBox="0 0 80 64" width={small ? 40 : 72} height={small ? 32 : 58}>
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
