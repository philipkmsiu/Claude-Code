import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { DayPlan, TransportMode, VisualPosterContent } from '../data/types'
import { transportModeLabel } from '../data/travel'

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

const DEFAULT_EAT = [
  { name: '在地特色早餐', daysLabel: '出發日', motif: '🍳' },
  { name: '街頭小吃', daysLabel: '市區日', motif: '🥟' },
  { name: '代表菜晚餐', daysLabel: '重點日', motif: '🍜' },
]

const DEFAULT_DRINK = [
  { name: '當地茶飲', motif: '🍵' },
  { name: '新鮮果汁', motif: '🧃' },
  { name: '溫熱湯品', motif: '🥣' },
]

/** Stage-4 parchment journey poster (sample-planner style) + PNG download. */
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

  const mustEat = visualPoster?.mustEat?.length ? visualPoster.mustEat : DEFAULT_EAT
  const mustDrink = visualPoster?.mustDrink?.length
    ? visualPoster.mustDrink
    : DEFAULT_DRINK
  const travelTips =
    visualPoster?.travelTips?.length
      ? visualPoster.travelTips
      : defaultTips(transportMode)
  const themeLine =
    visualPoster?.themeLine ||
    `${days} 天 ${nights} 夜｜${transportModeLabel(transportMode)}｜舒適慢遊視覺摘要`
  const footerNote =
    visualPoster?.footerNote ||
    '路線示意，實際以天氣、交通與最終確認行程為準。'

  async function downloadPoster() {
    if (!posterRef.current) return
    setExporting(true)
    setExportError('')
    try {
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f4efe4',
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
            仿規劃書插畫海報：蜿蜒道路串起每日站點，兩側是必吃／必喝與旅行小貼士。可下載成一張摘要圖。
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
        <div
          ref={posterRef}
          className="journey-poster"
          data-days={itinerary.length}
        >
          <header className="poster-header">
            <div className="poster-stamp compass" aria-hidden>
              <span>N</span>
            </div>
            <div className="poster-header-main">
              <p className="poster-kicker">KM Travel Planner · Stage 4</p>
              <h2>「{destinationName}」舒適慢遊旅程地圖</h2>
              <p className="poster-subtitle">{themeLine}</p>
              <p className="poster-dates">
                {startLabel} — {endLabel}
              </p>
            </div>
            <div className="poster-stamp go" aria-hidden>
              Let&apos;s go!
            </div>
          </header>

          <div className="poster-body">
            <aside className="poster-side left">
              <h4>必吃美食</h4>
              <ul>
                {mustEat.map((item) => (
                  <li key={item.name}>
                    <span className="motif">{item.motif || '🍽'}</span>
                    <div>
                      <strong>{item.name}</strong>
                      <em>{item.daysLabel}</em>
                    </div>
                  </li>
                ))}
              </ul>
            </aside>

            <div className="poster-path-col">
              <div className="path-rail" aria-hidden />
              {itinerary.map((day, index) => {
                const bullets = dayBullets(day)
                const photo = photoSrcs[index % Math.max(photoSrcs.length, 1)]
                const side = index % 2 === 0 ? 'leftish' : 'rightish'
                return (
                  <article
                    key={`poster-day-${index}`}
                    className={`poster-day ${side}`}
                    style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                  >
                    <div className="day-node">
                      <span>DAY {index + 1}</span>
                    </div>
                    <div className="day-card-poster">
                      <div className="day-card-text">
                        <h5>{day.stayCity || day.stayArea || day.theme}</h5>
                        <p className="day-theme">{day.theme}</p>
                        <ul>
                          {bullets.map((b) => (
                            <li key={b}>{b}</li>
                          ))}
                        </ul>
                      </div>
                      <div
                        className="day-illustration"
                        style={
                          photo
                            ? {
                                backgroundImage: `linear-gradient(180deg, rgba(244,239,228,0.15), rgba(36,59,52,0.35)), url(${photo})`,
                              }
                            : undefined
                        }
                      >
                        <span>{illustrationMotif(day, index)}</span>
                      </div>
                    </div>
                  </article>
                )
              })}
              <div className="poster-finish">
                <div className="finish-plane" aria-hidden>
                  ✈
                </div>
                <div>
                  <strong>機場／返程</strong>
                  <p>謝謝相遇，期待下次！</p>
                </div>
              </div>
            </div>

            <aside className="poster-side right">
              <h4>必喝飲品</h4>
              <ul>
                {mustDrink.map((item) => (
                  <li key={item.name}>
                    <span className="motif">{item.motif || '🥤'}</span>
                    <div>
                      <strong>{item.name}</strong>
                    </div>
                  </li>
                ))}
              </ul>
              <h4 className="tips-title">旅行小貼士</h4>
              <ol className="poster-tips">
                {travelTips.map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ol>
            </aside>
          </div>

          <footer className="poster-footer">
            <div className="mascot" aria-hidden>
              <span className="camel">🐪</span>
              <p>跟著道路走，每天都有驚喜！</p>
            </div>
            <p className="poster-disclaimer">{footerNote}</p>
          </footer>
        </div>
      </div>
    </section>
  )
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
    .filter((s) => s.spotId || !/出發|午餐|晚餐|抵達|回飯店|晚起|前往|包車|自駕|轉乘/.test(s.title))
    .map((s) => s.title)
    .slice(0, 3)
  if (fromSchedule.length) return fromSchedule
  return [day.theme].filter(Boolean)
}

function illustrationMotif(day: DayPlan, index: number): string {
  const text = `${day.theme} ${day.stayCity || ''} ${day.mainPlan || ''}`
  if (/湖|海|泉/.test(text)) return '🏞'
  if (/古城|城|關|寺|廟|窟/.test(text)) return '🏛'
  if (/山|峰|峽谷|高原|公路/.test(text)) return '⛰'
  if (/機場|飛|返程/.test(text)) return '✈'
  if (/休息|自由|洗衣/.test(text)) return '☕'
  const pool = ['🌅', '🏜', '🌾', '🕌', '📸', '🛤']
  return pool[index % pool.length]
}

function defaultTips(mode: TransportMode): string[] {
  const base = [
    '早晚溫差大，薄外套要隨身',
    '日照強，防曬帽子不可少',
    '長車程帶行動電源與零食',
    '尊重當地文化與民族習俗',
    '證件隨身，方便安檢查驗',
    '行程保留彈性，遇天氣可調整',
  ]
  if (mode === 'private_driver') {
    return ['準時與司機會合，行李放後車廂', ...base.slice(0, 5)]
  }
  if (mode === 'self_drive') {
    return ['出發前查路況與加油停車', ...base.slice(0, 5)]
  }
  return ['先備交通卡／一日券，跨區預留轉乘', ...base.slice(0, 5)]
}
