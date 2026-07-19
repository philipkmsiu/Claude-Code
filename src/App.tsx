import { useMemo, useState } from 'react'
import {
  destinations,
  hotelStyles,
  hotelsForStyle,
  pickDays,
  seasonKey,
  type DestinationId,
  type HotelStyle,
} from './data/germany'
import './App.css'

type Step = 'home' | 'destination' | 'duration' | 'hotel' | 'result'

const monthLabels = [
  '1 月',
  '2 月',
  '3 月',
  '4 月',
  '5 月',
  '6 月',
  '7 月',
  '8 月',
  '9 月',
  '10 月',
  '11 月',
  '12 月',
]

function App() {
  const [step, setStep] = useState<Step>('home')
  const [destinationId, setDestinationId] = useState<DestinationId | null>(null)
  const [travelMonth, setTravelMonth] = useState(6)
  const [days, setDays] = useState(4)
  const [hotelStyle, setHotelStyle] = useState<HotelStyle>('value')
  const [hotelNights, setHotelNights] = useState(3)

  const destination = useMemo(
    () => destinations.find((d) => d.id === destinationId) ?? null,
    [destinationId],
  )

  const availableDays = useMemo(() => {
    if (!destination) return []
    return Object.keys(destination.itineraries)
      .map(Number)
      .sort((a, b) => a - b)
  }, [destination])

  const planDays = destination ? pickDays(destination, days) : days
  const hotels = destination ? hotelsForStyle(destination, hotelStyle) : []
  const itinerary = destination?.itineraries[planDays] ?? []
  const weather =
    destination?.weather[seasonKey(travelMonth)] ?? ''
  const styleLabel =
    hotelStyles.find((s) => s.id === hotelStyle)?.label ?? ''

  function selectDestination(id: DestinationId) {
    const dest = destinations.find((d) => d.id === id)!
    setDestinationId(id)
    const ideal = pickDays(dest)
    setDays(ideal)
    setHotelNights(Math.max(ideal - 1, 1))
    setStep('duration')
  }

  function reset() {
    setStep('home')
    setDestinationId(null)
  }

  return (
    <div className="app">
      <div className="atmosphere" aria-hidden="true" />
      <header className="topbar">
        <button type="button" className="brand" onClick={reset}>
          <span className="brand-mark" />
          <span className="brand-text">
            Wege
            <small>德國旅程規劃</small>
          </span>
        </button>
        {step !== 'home' && (
          <nav className="steps" aria-label="規劃步驟">
            <StepPill active={step === 'destination'} label="目的地" />
            <StepPill active={step === 'duration'} label="天數" />
            <StepPill active={step === 'hotel'} label="住宿" />
            <StepPill active={step === 'result'} label="行程" />
          </nav>
        )}
      </header>

      <main>
        {step === 'home' && (
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">Gemini 旅遊規劃邏輯 · 德國版</p>
              <h1 className="hero-brand">Wege</h1>
              <p className="hero-lead">
                先認識地方與天氣，再選住宿風格與天數，最後生成每日行程。
              </p>
              <div className="cta-row">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setStep('destination')}
                >
                  開始規劃
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => {
                    setDestinationId('munich')
                    setDays(5)
                    setHotelNights(4)
                    setHotelStyle('luxuryValue')
                    setTravelMonth(9)
                    setStep('result')
                  }}
                >
                  看慕尼黑範例
                </button>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-panel">
                <span>Berlin</span>
                <span>München</span>
                <span>Köln</span>
                <span>Romantik</span>
              </div>
            </div>
          </section>
        )}

        {step === 'destination' && (
          <section className="panel-section enter">
            <div className="section-head">
              <h2>選擇目的地</h2>
              <p>每個城市都有建議旅遊天數、天氣與住宿風格對應。</p>
            </div>
            <div className="dest-grid">
              {destinations.map((dest, index) => (
                <button
                  key={dest.id}
                  type="button"
                  className="dest-card"
                  style={{ animationDelay: `${index * 60}ms` }}
                  onClick={() => selectDestination(dest.id)}
                >
                  <span className="dest-de">{dest.nameDe}</span>
                  <strong>{dest.nameZh}</strong>
                  <span className="dest-tag">{dest.tagline}</span>
                  <span className="dest-meta">
                    建議 {dest.recommendedDays.ideal} 天
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 'duration' && destination && (
          <section className="panel-section enter">
            <div className="section-head">
              <h2>
                {destination.nameZh} · 要玩幾天？
              </h2>
              <p>{destination.recommendedDays.note}</p>
            </div>

            <div className="advice-strip">
              <Advice
                label="最短"
                value={`${destination.recommendedDays.min} 天`}
              />
              <Advice
                label="最推"
                value={`${destination.recommendedDays.ideal} 天`}
                emphasize
              />
              <Advice
                label="充裕"
                value={`${destination.recommendedDays.max} 天`}
              />
            </div>

            <div className="field-block">
              <label htmlFor="month">預計出發月份（用於天氣建議）</label>
              <select
                id="month"
                value={travelMonth}
                onChange={(e) => setTravelMonth(Number(e.target.value))}
              >
                {monthLabels.map((label, i) => (
                  <option key={label} value={i + 1}>
                    {label}
                  </option>
                ))}
              </select>
              <p className="weather-preview">{weather}</p>
            </div>

            <div className="day-options">
              {availableDays.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`chip ${days === d ? 'selected' : ''}`}
                  onClick={() => {
                    setDays(d)
                    setHotelNights(Math.max(d - 1, 1))
                  }}
                >
                  {d} 天 {Math.max(d - 1, 1)} 夜
                  {d === destination.recommendedDays.ideal ? ' · 推薦' : ''}
                </button>
              ))}
            </div>

            <div className="nav-row">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setStep('destination')}
              >
                返回
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => setStep('hotel')}
              >
                下一步：住宿偏好
              </button>
            </div>
          </section>
        )}

        {step === 'hotel' && destination && (
          <section className="panel-section enter">
            <div className="section-head">
              <h2>住宿怎麼選？</h2>
              <p>
                先決定風格與住宿晚數，系統會對應推薦區域與飯店類型。
              </p>
            </div>

            <div className="field-block">
              <label htmlFor="nights">酒店住宿晚數</label>
              <input
                id="nights"
                type="range"
                min={1}
                max={Math.max(planDays, 1)}
                value={Math.min(hotelNights, planDays)}
                onChange={(e) => setHotelNights(Number(e.target.value))}
              />
              <p className="range-value">
                {Math.min(hotelNights, planDays)} 晚
                <span>
                  （{planDays} 天行程通常住 {Math.max(planDays - 1, 1)} 晚）
                </span>
              </p>
            </div>

            <div className="style-grid">
              {hotelStyles.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`style-card ${hotelStyle === style.id ? 'selected' : ''}`}
                  onClick={() => setHotelStyle(style.id)}
                >
                  <strong>{style.label}</strong>
                  <span>{style.description}</span>
                </button>
              ))}
            </div>

            <div className="nav-row">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setStep('duration')}
              >
                返回
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => setStep('result')}
              >
                生成行程
              </button>
            </div>
          </section>
        )}

        {step === 'result' && destination && (
          <section className="result enter">
            <div className="result-hero">
              <p className="eyebrow">
                {destination.nameDe} · {planDays} 天{' '}
                {Math.min(hotelNights, planDays)} 夜 · {styleLabel}
              </p>
              <h2>{destination.nameZh}</h2>
              <p className="result-tagline">{destination.tagline}</p>
            </div>

            <div className="result-grid">
              <article className="info-block">
                <h3>當地簡介</h3>
                <p>{destination.intro}</p>
                <ul className="highlight-list">
                  {destination.highlights.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </article>

              <article className="info-block">
                <h3>天氣與季節</h3>
                <p className="season-note">{destination.bestSeason}</p>
                <p>
                  <strong>{monthLabels[travelMonth - 1]} 天氣參考：</strong>
                  {weather}
                </p>
                <p className="muted">
                  建議旅遊天數：最少 {destination.recommendedDays.min} 天，理想{' '}
                  {destination.recommendedDays.ideal} 天，充裕可到{' '}
                  {destination.recommendedDays.max} 天。
                </p>
              </article>

              <article className="info-block wide">
                <h3>住宿建議 · {styleLabel}</h3>
                <p className="muted">
                  依你選擇的風格篩選；建議住宿{' '}
                  {Math.min(hotelNights, planDays)} 晚，盡量減少換宿。
                </p>
                <div className="hotel-list">
                  {hotels.map((hotel) => (
                    <div key={hotel.name} className="hotel-item">
                      <div>
                        <strong>{hotel.name}</strong>
                        <span>
                          {hotel.area} · {hotel.pricePerNight}
                        </span>
                      </div>
                      <p>{hotel.highlight}</p>
                      <small>{hotel.nightsHint}</small>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="itinerary">
              <div className="section-head">
                <h3>每日行程</h3>
                <p>依地理位置順路安排，保留彈性與用餐時間。</p>
              </div>
              <div className="day-list">
                {itinerary.map((day, index) => (
                  <article
                    key={`${day.theme}-${index}`}
                    className="day-card"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <header>
                      <span className="day-badge">Day {index + 1}</span>
                      <h4>{day.theme}</h4>
                      <p>住宿區域：{day.stayArea}</p>
                    </header>
                    <ol>
                      {day.schedule.map((item) => (
                        <li key={`${item.time}-${item.title}`}>
                          <time>{item.time}</time>
                          <div>
                            <strong>{item.title}</strong>
                            <span>{item.detail}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                    <footer>
                      <span>預算 {day.budget}</span>
                      <span>{day.tip}</span>
                    </footer>
                  </article>
                ))}
              </div>
            </div>

            <div className="nav-row sticky-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setStep('hotel')}
              >
                調整住宿
              </button>
              <button type="button" className="btn primary" onClick={reset}>
                重新規劃
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span>Wege</span>
        <span>依 Gemini 旅遊規劃五階段精神製作的德國行程小工具</span>
      </footer>
    </div>
  )
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return <span className={`step-pill ${active ? 'active' : ''}`}>{label}</span>
}

function Advice({
  label,
  value,
  emphasize = false,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div className={`advice ${emphasize ? 'emphasize' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default App
