import { useEffect, useMemo, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { DayPlan, TransportMode, VisualPosterContent } from '../data/types'
import {
  inferVisualPoster,
  isGenericPosterFood,
  mergePosterFoodFromItinerary,
  transportModeLabel,
} from '../data/travel'
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
    const inferred = inferVisualPoster({
      destinationName,
      days,
      nights,
      transportMode,
    })
    const handbookFoodIsGeneric = isGenericPosterFood(visualPoster?.mustEat)
    const merged = !visualPoster?.mustEat?.length
      ? inferred
      : {
          ...inferred,
          ...visualPoster,
          // Never let handbook/generic placeholders hide real local dishes.
          mustEat: handbookFoodIsGeneric ? inferred.mustEat : visualPoster.mustEat,
          mustDrink:
            visualPoster.mustDrink?.length &&
            !visualPoster.mustDrink.every((d) =>
              /當地茶飲|新鮮果汁|溫熱湯品/.test(d.name),
            )
              ? visualPoster.mustDrink
              : inferred.mustDrink,
          mustBuy:
            visualPoster.mustBuy && visualPoster.mustBuy.length
              ? visualPoster.mustBuy
              : inferred.mustBuy,
        }
    return mergePosterFoodFromItinerary(merged, itinerary)
  }, [visualPoster, destinationName, days, nights, transportMode, itinerary])

  const pathGeometry = useMemo(
    () =>
      buildSerpentinePath(itinerary.length, {
        style: edition === 'scrapbook' ? 'scrapbook' : 'photo',
      }),
    [itinerary.length, edition],
  )

  const itineraryPhotoKey = itinerary
    .map((day) => `${day.theme}|${day.mainPlan || ''}|${day.stayCity || ''}|${day.spotIds.join(',')}`)
    .join('||')

  useEffect(() => {
    let cancelled = false
    setPhotosLoading(true)
    void resolveDayPhotos(
      itinerary.map((day) => {
        const fromSpots = day.schedule
          .filter((item) => item.spotId)
          .map((item) => item.title.trim())
        const fromTitles = day.schedule
          .map((item) => item.title.trim())
          .filter(
            (title) =>
              title &&
              !/住宿|機場|返程|出發|午餐|晚餐|手信|轉乘|抵達|入住|自由|咖啡|散步|伴手禮/.test(
                title,
              ),
          )
          .map((title) => title.replace(/^轉乘前往\s*/, '').trim())
        return {
          stayCity: day.stayCity || day.stayArea,
          theme: day.theme,
          mainPlan: day.mainPlan,
          spotNames: [...fromSpots, ...fromTitles],
        }
      }),
      destinationName,
    )
      .then((rows) => {
        if (cancelled) return
        // Prefer unique URLs from the resolver; keep soft reuse rather than blank slots.
        const used = new Set<string>()
        const merged = rows.map((url) => {
          if (!url) return null
          used.add(url)
          return url
        })
        // Fill remaining gaps with unused handbook shots (each at most once).
        if (photoSrcs.length) {
          const unusedLocal = photoSrcs.filter((src) => !used.has(src))
          let localIdx = 0
          for (let i = 0; i < merged.length; i += 1) {
            if (merged[i] || localIdx >= unusedLocal.length) continue
            const next = unusedLocal[localIdx]
            localIdx += 1
            used.add(next)
            merged[i] = next
          }
        }
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
            兩個完全不同的版本：<strong>相片版</strong>用真實景點照片；
            <strong>插畫海報版</strong>照 Gemini 旅程地圖 sample——手繪水彩、S
            形路線、每日獨特插畫圓（絕不用相片）。可分別下載 PNG。
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
              {poster.mustBuy && poster.mustBuy.length > 0 ? (
                <>
                  <h4 className="side-subhead">
                    <span className="side-ornament" aria-hidden />
                    特色手信
                  </h4>
                  <ul className="food-list gift-list">
                    {poster.mustBuy.map((item) => (
                      <li key={item.name}>
                        <FoodIcon
                          label={item.name}
                          motif={item.motif || '🎁'}
                          scrapbook={edition === 'scrapbook'}
                        />
                        <div>
                          <strong>{item.name}</strong>
                          <em>{item.daysLabel}</em>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              ) : null}
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
                      <div
                        className={`scrapbook-node gemini-layout ${
                          point.x < pathGeometry.width / 2 ? 'caption-right' : 'caption-left'
                        }`}
                      >
                        <div className="scrapbook-art-stack">
                          <div
                            className="scrapbook-ring illustrated"
                            style={{
                              ['--ring-accent' as string]: pathGeometry.segmentColors[index],
                            }}
                          >
                            {/* Pure hand-drawn watercolor — never photographs. */}
                            <GeminiDayArt day={day} index={index} />
                          </div>
                          <div className="day-node deluxe-node scrapbook-badge">
                            <span>DAY</span>
                            <strong>{index + 1}</strong>
                          </div>
                        </div>
                        <div className="scrapbook-caption">
                          <h5>{day.stayCity || day.stayArea || day.theme}</h5>
                          <p className="scrapbook-highlights-label">重點景區</p>
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

function buildSerpentinePath(
  dayCount: number,
  options?: { style?: 'photo' | 'scrapbook'; gap?: number },
) {
  const scrapbook = options?.style === 'scrapbook'
  const n = Math.max(dayCount, 1)
  // Gemini sample: wide S-curve that uses the full middle canvas (not a thin vertical ribbon).
  const width = scrapbook ? 640 : 420
  const gap = options?.gap ?? (scrapbook ? 168 : 148)
  const top = scrapbook ? 36 : 40
  const height = top + n * gap + 130
  const amplitude = scrapbook ? width * 0.32 : 62
  const segmentColors = [
    '#5b8fa8',
    '#6f8f7f',
    '#c4a574',
    '#c17a5a',
    '#8a5a6a',
    '#7a9e8e',
  ]

  const points = Array.from({ length: n }, (_, i) => {
    const y = top + i * gap
    // Hard left / right zigzag (sample planner map), softened with a slight sine.
    const side = i % 2 === 0 ? -1 : 1
    const x = width / 2 + side * amplitude * (scrapbook ? 0.92 : 0.55) + Math.sin(i * 0.7) * 10
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
            // Wide horizontal sweep between alternating sides.
            const bulge = scrapbook ? (p.x + prev.x) / 2 : prev.x
            return `C ${bulge} ${cy}, ${bulge} ${cy}, ${p.x} ${p.y}`
          })
          .join(' ')
  return {
    width,
    height,
    d,
    points,
    finishY: top + n * gap + 28,
    segmentColors: Array.from({ length: n }, (_, i) => segmentColors[i % segmentColors.length]),
  }
}

function dayBullets(day: DayPlan): string[] {
  // Prefer 1–2 sentence lore over choppy keyword fragments.
  if (day.dayStory?.trim()) {
    const sentences = day.dayStory
      .split(/(?<=[。！？!?])/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (sentences.length) return sentences.slice(0, 2)
    return [day.dayStory.trim()]
  }
  const richDetail = day.schedule
    .map((s) => s.detail)
    .find((d) => d && d.length > 18 && !/住宿方向/.test(d))
  if (richDetail) {
    return richDetail
      .split(/[｜|]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 10)
      .slice(0, 2)
  }
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

type LandmarkMotif =
  | 'wall'
  | 'pagoda'
  | 'terracotta'
  | 'mountain'
  | 'mosque'
  | 'lake'
  | 'museum'
  | 'street'
  | 'plane'
  | 'garden'
  | 'default'

/** Hand-painted watercolor plates (Gemini scrapbook sample style — not photos). */
const WATERCOLOR_PLATE: Record<LandmarkMotif, string> = {
  wall: '/poster/watercolor-wall.png',
  pagoda: '/poster/watercolor-pagoda.png',
  terracotta: '/poster/watercolor-terracotta.png',
  mountain: '/poster/watercolor-mountain.png',
  mosque: '/poster/watercolor-street.png',
  lake: '/poster/watercolor-lake.png',
  museum: '/poster/watercolor-museum.png',
  street: '/poster/watercolor-street.png',
  plane: '/poster/watercolor-travel.png',
  garden: '/poster/watercolor-garden.png',
  default: '/poster/watercolor-garden.png',
}

/** Gemini sample: painted circular plate matched to the day's landmark. Never real photos. */
function GeminiDayArt({ day, index }: { day: DayPlan; index: number }) {
  const motif = landmarkMotif(day)
  const src = WATERCOLOR_PLATE[motif]
  // Same motif on multiple days still gets a distinct crop / wash.
  const positions = [
    '50% 45%',
    '42% 40%',
    '58% 48%',
    '46% 52%',
    '54% 38%',
    '48% 55%',
    '60% 42%',
    '40% 50%',
  ]
  const washes = [
    'saturate(0.92) contrast(0.96) brightness(1.03)',
    'saturate(0.88) contrast(0.94) brightness(1.05) hue-rotate(-6deg)',
    'saturate(0.95) contrast(0.97) brightness(1.02) hue-rotate(8deg)',
    'saturate(0.9) contrast(0.95) brightness(1.04) sepia(0.08)',
  ]

  return (
    <div className="day-scene circular gemini-art painted-plate" aria-hidden>
      <img
        className="gemini-plate-img"
        src={src}
        alt=""
        draggable={false}
        style={{
          objectPosition: positions[index % positions.length],
          filter: washes[index % washes.length],
        }}
      />
      <span className="gemini-plate-label">{motifLabel(motif)}</span>
    </div>
  )
}

function landmarkMotif(day: DayPlan): LandmarkMotif {
  const text = `${day.theme} ${day.stayCity || ''} ${day.mainPlan || ''} ${day.schedule
    .map((s) => s.title)
    .join(' ')}`
  if (/兵馬俑|秦俑|terracotta/i.test(text)) return 'terracotta'
  if (/華山|登山|峰|山岳|秦嶺/.test(text)) return 'mountain'
  if (/雁塔|塔|pagoda/i.test(text)) return 'pagoda'
  if (/城牆|古城|關城|鼓樓|鐘樓/.test(text)) return 'wall'
  if (/清真|回民|清真寺|mosque/i.test(text)) return 'mosque'
  if (/湖|海|泉|灣|護城河/.test(text)) return 'lake'
  if (/博物館|博物院|碑林|美術館/.test(text)) return 'museum'
  if (/芙蓉|園|公園|園林/.test(text)) return 'garden'
  if (/機場|飛|返程/.test(text)) return 'plane'
  if (/街|市|夜|美食|吃/.test(text)) return 'street'
  return 'default'
}

function motifLabel(motif: LandmarkMotif): string {
  const map: Record<LandmarkMotif, string> = {
    wall: '城垣',
    pagoda: '古塔',
    terracotta: '俑陣',
    mountain: '山脊',
    mosque: '坊巷',
    lake: '湖光',
    museum: '文博',
    street: '市井',
    plane: '啟程',
    garden: '園林',
    default: '風景',
  }
  return map[motif]
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
  const [failed, setFailed] = useState(false)
  const showPhoto = Boolean(photo) && !failed
  return (
    <div className={`day-scene scene-${kind}`}>
      {showPhoto ? (
        <img
          className="day-scene-img"
          src={photo}
          alt={day.stayCity || day.theme}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <SceneArt kind={kind} index={index} />
      )}
      {showPhoto ? <span className="scene-caption">{sceneLabel(kind)}</span> : null}
    </div>
  )
}

function sceneKind(day: DayPlan): string {
  const motif = landmarkMotif(day)
  if (motif === 'lake' || motif === 'garden') return 'lake'
  if (
    motif === 'wall' ||
    motif === 'pagoda' ||
    motif === 'terracotta' ||
    motif === 'mosque' ||
    motif === 'museum'
  ) {
    return 'heritage'
  }
  if (motif === 'mountain') return 'landscape'
  if (motif === 'plane') return 'travel'
  if (motif === 'street') return 'street'
  const text = `${day.theme} ${day.stayCity || ''} ${day.mainPlan || ''}`
  if (/休息|自由|洗衣|咖啡/.test(text)) return 'rest'
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
    <div className={`camel-art painted ${small ? 'small' : ''}`} aria-hidden>
      <img
        src="/poster/poster-mascot-camel.png"
        alt=""
        draggable={false}
        width={small ? 44 : 88}
        height={small ? 44 : 88}
      />
    </div>
  )
}
