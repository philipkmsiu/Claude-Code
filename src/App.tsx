import { useMemo, useState } from 'react'
import {
  buildItinerary,
  companions,
  daysBetween,
  defaultSelectedSpotIds,
  destinations,
  hotelStyles,
  hotelsForStyle,
  nightsFromDays,
  seasonKey,
  specialNeedOptions,
  spotTagLabels,
  tripPaces,
  type Companion,
  type DestinationId,
  type HotelStyle,
  type TripPace,
} from './data/germany'
import './App.css'

type Step =
  | 'home'
  | 'destination'
  | 'preferences'
  | 'hotel'
  | 'spots'
  | 'result'

function App() {
  const [step, setStep] = useState<Step>('home')
  const [selectedDestIds, setSelectedDestIds] = useState<DestinationId[]>([])
  const [startDate, setStartDate] = useState('2026-09-10')
  const [endDate, setEndDate] = useState('2026-09-14')
  const [days, setDays] = useState(5)
  const [pace, setPace] = useState<TripPace>('balanced')
  const [companion, setCompanion] = useState<Companion>('couple')
  const [specialNeeds, setSpecialNeeds] = useState<string[]>([
    '喜歡歷史文化',
    '想拍打卡美照',
  ])
  const [hotelStyle, setHotelStyle] = useState<HotelStyle>('value')
  const [hotelNights, setHotelNights] = useState(4)
  const [selectedSpotIds, setSelectedSpotIds] = useState<string[]>([])
  const [planVersion, setPlanVersion] = useState(0)

  const selectedDestinations = useMemo(
    () => destinations.filter((d) => selectedDestIds.includes(d.id)),
    [selectedDestIds],
  )

  const allSpots = useMemo(
    () => selectedDestinations.flatMap((d) => d.spots),
    [selectedDestinations],
  )

  const primary = selectedDestinations[0] ?? null
  const dateDays = daysBetween(startDate, endDate)
  const planDays = Math.min(Math.max(dateDays ?? days, 2), 7)
  const weatherMonth = startDate ? new Date(startDate).getMonth() + 1 : 6
  const weather = primary ? primary.weather[seasonKey(weatherMonth)] : ''
  const hotels = primary ? hotelsForStyle(primary, hotelStyle) : []
  const hotelAreaHint = hotels[0]?.area || primary?.nameZh || '市區'
  const styleLabel = hotelStyles.find((s) => s.id === hotelStyle)?.label ?? ''
  const paceLabel = tripPaces.find((p) => p.id === pace)?.label ?? ''
  const companionLabel = companions.find((c) => c.id === companion)?.label ?? ''

  const itinerary = useMemo(() => {
    void planVersion
    if (!selectedDestinations.length) return []
    return buildItinerary({
      destinations: selectedDestinations,
      selectedSpotIds,
      days: planDays,
      pace,
      companion,
      specialNeeds,
      hotelAreaHint,
    })
  }, [
    selectedDestinations,
    selectedSpotIds,
    planDays,
    pace,
    companion,
    specialNeeds,
    hotelAreaHint,
    planVersion,
  ])

  function toggleDestination(id: DestinationId) {
    setSelectedDestIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
  }

  function applyDateRange(nextStart: string, nextEnd: string) {
    setStartDate(nextStart)
    setEndDate(nextEnd)
    const span = daysBetween(nextStart, nextEnd)
    if (span) {
      const clamped = Math.min(Math.max(span, 2), 7)
      setDays(clamped)
      setHotelNights(nightsFromDays(clamped))
    }
  }

  function goToPreferences() {
    if (!selectedDestIds.length) return
    const dests = destinations.filter((d) => selectedDestIds.includes(d.id))
    const ideal = Math.max(...dests.map((d) => d.recommendedDays.ideal))
    const nextDays = dateDays ?? ideal
    const clamped = Math.min(Math.max(nextDays, 2), 7)
    setDays(clamped)
    setHotelNights(nightsFromDays(clamped))
    setStep('preferences')
  }

  function initSpotsAndContinue() {
    const spots = destinations
      .filter((d) => selectedDestIds.includes(d.id))
      .flatMap((d) => d.spots)
    setSelectedSpotIds(defaultSelectedSpotIds(spots))
    setStep('spots')
  }

  function toggleSpot(id: string) {
    setSelectedSpotIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  function selectMustAndPhoto() {
    setSelectedSpotIds(
      allSpots
        .filter((s) => s.tags.includes('must') || s.tags.includes('photo'))
        .map((s) => s.id),
    )
  }

  function regenerate() {
    setPlanVersion((v) => v + 1)
    setStep('result')
  }

  function reset() {
    setStep('home')
    setSelectedDestIds([])
    setSelectedSpotIds([])
    setPlanVersion(0)
  }

  const stepItems: { id: Step; label: string }[] = [
    { id: 'destination', label: '目的地' },
    { id: 'preferences', label: '旅遊條件' },
    { id: 'hotel', label: '住宿' },
    { id: 'spots', label: '景點' },
    { id: 'result', label: '行程' },
  ]

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
            {stepItems.map((item) => (
              <StepPill key={item.id} active={step === item.id} label={item.label} />
            ))}
          </nav>
        )}
      </header>

      <main>
        {step === 'home' && (
          <section className="hero">
            <div className="hero-copy">
              <p className="eyebrow">對應 Gemini 紅字選項 · 可重跑行程</p>
              <h1 className="hero-brand">Wege</h1>
              <p className="hero-lead">
                先填旅遊條件，再從約 20 個景點（含必去／打卡紅點）勾選想去的，最後依你的選擇重新排每日行程。
              </p>
              <div className="cta-row">
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => setStep('destination')}
                >
                  開始規劃
                </button>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-panel">
                <span>目的地</span>
                <span>日期條件</span>
                <span>景點勾選</span>
                <span>重跑行程</span>
              </div>
            </div>
          </section>
        )}

        {step === 'destination' && (
          <section className="panel-section enter">
            <div className="section-head">
              <h2>選擇目的地（紅字選項）</h2>
              <p>可選 1–2 個；多選時行程會混合兩地景點。目前已選 {selectedDestIds.length} 個。</p>
            </div>
            <div className="dest-grid">
              {destinations.map((dest, index) => {
                const active = selectedDestIds.includes(dest.id)
                return (
                  <button
                    key={dest.id}
                    type="button"
                    className={`dest-card ${active ? 'selected' : ''}`}
                    style={{ animationDelay: `${index * 60}ms` }}
                    onClick={() => toggleDestination(dest.id)}
                  >
                    <span className="dest-de">{dest.nameDe}</span>
                    <strong>{dest.nameZh}</strong>
                    <span className="dest-tag">{dest.tagline}</span>
                    <span className="dest-meta">
                      建議 {dest.recommendedDays.ideal} 天 · {dest.spots.length} 個景點
                    </span>
                  </button>
                )
              })}
            </div>
            <div className="nav-row">
              <button type="button" className="btn ghost" onClick={() => setStep('home')}>
                返回
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={!selectedDestIds.length}
                onClick={goToPreferences}
              >
                下一步：旅遊條件
              </button>
            </div>
          </section>
        )}

        {step === 'preferences' && primary && (
          <section className="panel-section enter">
            <div className="section-head">
              <h2>旅遊條件（紅字選項）</h2>
              <p>
                對應 PDF：天數／日期、旅遊類型、同行者、特殊需求。系統也會依此建議每天幾個景點。
              </p>
            </div>

            <div className="advice-strip">
              <Advice label="最短" value={`${primary.recommendedDays.min} 天`} />
              <Advice
                label="最推"
                value={`${primary.recommendedDays.ideal} 天`}
                emphasize
              />
              <Advice label="充裕" value={`${primary.recommendedDays.max} 天`} />
            </div>

            <div className="preference-grid">
              <div className="field-block">
                <label htmlFor="start">出發日期</label>
                <input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => applyDateRange(e.target.value, endDate)}
                />
              </div>
              <div className="field-block">
                <label htmlFor="end">返回日期</label>
                <input
                  id="end"
                  type="date"
                  value={endDate}
                  onChange={(e) => applyDateRange(startDate, e.target.value)}
                />
              </div>
              <div className="field-block">
                <label htmlFor="days">行程天數（可手動微調）</label>
                <input
                  id="days"
                  type="number"
                  min={2}
                  max={7}
                  value={days}
                  onChange={(e) => {
                    const next = Math.min(Math.max(Number(e.target.value) || 2, 2), 7)
                    setDays(next)
                    setHotelNights(nightsFromDays(next))
                  }}
                />
                <p className="range-value">
                  {planDays} 天 {nightsFromDays(planDays)} 夜
                  {dateDays ? ` · 日期跨度 ${dateDays} 天` : ''}
                </p>
              </div>
            </div>

            <p className="weather-preview strong">{weather}</p>
            <p className="muted-line">{primary.recommendedDays.note}</p>

            <h3 className="subhead">旅遊類型</h3>
            <div className="style-grid">
              {tripPaces.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`style-card ${pace === item.id ? 'selected' : ''}`}
                  onClick={() => setPace(item.id)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </button>
              ))}
            </div>

            <h3 className="subhead">同行者</h3>
            <div className="day-options">
              {companions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`chip ${companion === item.id ? 'selected' : ''}`}
                  onClick={() => setCompanion(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <h3 className="subhead">特殊需求（可多選）</h3>
            <div className="need-grid">
              {specialNeedOptions.map((need) => {
                const active = specialNeeds.includes(need)
                return (
                  <button
                    key={need}
                    type="button"
                    className={`chip ${active ? 'selected' : ''}`}
                    onClick={() =>
                      setSpecialNeeds((prev) =>
                        active ? prev.filter((x) => x !== need) : [...prev, need],
                      )
                    }
                  >
                    {need}
                  </button>
                )
              })}
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

        {step === 'hotel' && primary && (
          <section className="panel-section enter">
            <div className="section-head">
              <h2>住宿偏好</h2>
              <p>選擇風格與住宿晚數；產生行程時會對應推薦飯店。</p>
            </div>

            <div className="field-block">
              <label htmlFor="nights">酒店住宿晚數</label>
              <input
                id="nights"
                type="range"
                min={1}
                max={planDays}
                value={Math.min(hotelNights, planDays)}
                onChange={(e) => setHotelNights(Number(e.target.value))}
              />
              <p className="range-value">
                {Math.min(hotelNights, planDays)} 晚
                <span>
                  （{planDays} 天行程通常住 {nightsFromDays(planDays)} 晚）
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
                onClick={() => setStep('preferences')}
              >
                返回
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={initSpotsAndContinue}
              >
                下一步：挑選景點
              </button>
            </div>
          </section>
        )}

        {step === 'spots' && (
          <section className="panel-section enter">
            <div className="section-head">
              <h2>挑選景點</h2>
              <p>
                已為你建議約 {allSpots.length}{' '}
                個景點。紅色標籤是必去／打卡紅點／熱門；不想去的就取消勾選，確認後再產生行程。
              </p>
            </div>

            <div className="spot-toolbar">
              <span>已選 {selectedSpotIds.length} / {allSpots.length}</span>
              <div className="cta-row">
                <button type="button" className="btn ghost" onClick={selectMustAndPhoto}>
                  只選必去＋打卡
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setSelectedSpotIds(allSpots.map((s) => s.id))}
                >
                  全選
                </button>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setSelectedSpotIds([])}
                >
                  清空
                </button>
              </div>
            </div>

            <div className="spot-grid">
              {allSpots.map((spot) => {
                const active = selectedSpotIds.includes(spot.id)
                const isRed =
                  spot.tags.includes('must') ||
                  spot.tags.includes('photo') ||
                  spot.tags.includes('popular')
                return (
                  <button
                    key={spot.id}
                    type="button"
                    className={`spot-card ${active ? 'selected' : ''} ${isRed ? 'red-spot' : ''}`}
                    onClick={() => toggleSpot(spot.id)}
                  >
                    <div className="spot-top">
                      <strong>{spot.name}</strong>
                      <span className="check">{active ? '已選' : '未選'}</span>
                    </div>
                    <span className="spot-de">{spot.nameDe}</span>
                    <p>{spot.summary}</p>
                    <div className="tag-row">
                      {spot.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`tag ${tag === 'must' || tag === 'photo' || tag === 'popular' ? 'tag-red' : ''}`}
                        >
                          {spotTagLabels[tag]}
                        </span>
                      ))}
                    </div>
                    <small>
                      {spot.area} · 約 {spot.stayHours} 小時
                      {spot.ticket ? ` · ${spot.ticket}` : ''}
                    </small>
                  </button>
                )
              })}
            </div>

            <div className="nav-row sticky-actions">
              <button type="button" className="btn ghost" onClick={() => setStep('hotel')}>
                返回
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={selectedSpotIds.length === 0}
                onClick={regenerate}
              >
                依選擇產生行程
              </button>
            </div>
          </section>
        )}

        {step === 'result' && primary && (
          <section className="result enter">
            <div className="result-hero">
              <p className="eyebrow">
                {selectedDestinations.map((d) => d.nameDe).join(' + ')} · {planDays}{' '}
                天 {Math.min(hotelNights, planDays)} 夜 · {paceLabel} · {companionLabel}
              </p>
              <h2>{selectedDestinations.map((d) => d.nameZh).join('、')}</h2>
              <p className="result-tagline">
                {startDate} → {endDate} · 已排入 {selectedSpotIds.length} 個景點 ·{' '}
                {styleLabel}
              </p>
            </div>

            <div className="result-grid">
              <article className="info-block">
                <h3>當地簡介</h3>
                {selectedDestinations.map((d) => (
                  <p key={d.id}>
                    <strong>{d.nameZh}：</strong>
                    {d.intro}
                  </p>
                ))}
              </article>

              <article className="info-block">
                <h3>天氣與條件</h3>
                <p className="season-note">{primary.bestSeason}</p>
                <p>
                  <strong>天氣參考：</strong>
                  {weather}
                </p>
                <p className="muted">
                  同行 {companionLabel} · 節奏 {paceLabel}
                  {specialNeeds.length ? ` · ${specialNeeds.join('、')}` : ''}
                </p>
              </article>

              <article className="info-block wide">
                <h3>住宿建議 · {styleLabel}</h3>
                <p className="muted">
                  建議住 {Math.min(hotelNights, planDays)} 晚，區域以 {hotelAreaHint}{' '}
                  為主。
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
                <h3>每日行程（依你勾選的景點重排）</h3>
                <p>若要增刪景點，回到上一步勾選後再按「重新產生行程」。</p>
              </div>
              <div className="day-list">
                {itinerary.map((day, index) => (
                  <article
                    key={`${day.theme}-${index}-${planVersion}`}
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
              <button type="button" className="btn ghost" onClick={() => setStep('spots')}>
                改景點選擇
              </button>
              <button type="button" className="btn primary" onClick={regenerate}>
                重新產生行程
              </button>
              <button type="button" className="btn ghost" onClick={reset}>
                從頭開始
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        <span>Wege</span>
        <span>紅字選項 → 景點勾選 → 可重跑行程</span>
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
