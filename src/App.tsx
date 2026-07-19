import { useMemo, useState } from 'react'
import {
  MAX_TRIP_DAYS,
  MIN_TRIP_DAYS,
  aggregateDayAdvice,
  buildItinerary,
  clampDays,
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
} from './data/travel'
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
  const [startDate, setStartDate] = useState('2026-02-17')
  const [endDate, setEndDate] = useState('2026-02-23')
  const [days, setDays] = useState(7)
  const [daysInput, setDaysInput] = useState('7')
  const [pace, setPace] = useState<TripPace>('balanced')
  const [companion, setCompanion] = useState<Companion>('couple')
  const [specialNeeds, setSpecialNeeds] = useState<string[]>([
    '喜歡歷史文化',
    '想拍打卡美照',
  ])
  const [hotelStyle, setHotelStyle] = useState<HotelStyle>('value')
  const [hotelNights, setHotelNights] = useState(6)
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

  const dayAdvice = useMemo(
    () => aggregateDayAdvice(selectedDestinations),
    [selectedDestinations],
  )

  const primary = selectedDestinations[0] ?? null
  const dateDays = daysBetween(startDate, endDate)
  const planDays = clampDays(days)
  const weatherMonth = startDate ? new Date(startDate).getMonth() + 1 : 2
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

  function setTripDays(next: number) {
    const clamped = clampDays(next)
    setDays(clamped)
    setDaysInput(String(clamped))
    setHotelNights(nightsFromDays(clamped))
  }

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
    if (span) setTripDays(span)
  }

  function goToPreferences() {
    if (!selectedDestIds.length) return
    const advice = aggregateDayAdvice(
      destinations.filter((d) => selectedDestIds.includes(d.id)),
    )
    const span = daysBetween(startDate, endDate)
    setTripDays(span ?? advice.comfortable)
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
    { id: 'preferences', label: '天數條件' },
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
            <small>Gemini 旅遊規劃</small>
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
              <p className="eyebrow">依 Gemini 旅遊規劃 PDF 做成的可互動行程工具</p>
              <h1 className="hero-brand">Wege</h1>
              <p className="hero-lead">
                先選一個地方，看最短／最舒服要幾天；你也可以自己輸入天數（到 {MAX_TRIP_DAYS}{' '}
                天）。再勾景點、產生行程，不滿意就改完重跑。
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
                    setSelectedDestIds(['kansai'])
                    setTripDays(7)
                    setStartDate('2026-02-17')
                    setEndDate('2026-02-23')
                    setPace('balanced')
                    setCompanion('couple')
                    setSpecialNeeds(['喜歡歷史文化', '想拍打卡美照', '想多吃在地美食'])
                    setHotelStyle('luxuryValue')
                    setSelectedSpotIds(
                      defaultSelectedSpotIds(
                        destinations.find((d) => d.id === 'kansai')!.spots,
                      ),
                    )
                    setStep('result')
                    setPlanVersion((v) => v + 1)
                  }}
                >
                  看關西 7 天範例
                </button>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <div className="hero-panel">
                <span>最短天數</span>
                <span>最舒服天數</span>
                <span>自己輸入</span>
                <span>重跑行程</span>
              </div>
            </div>
          </section>
        )}

        {step === 'destination' && (
          <section className="panel-section enter">
            <div className="section-head">
              <h2>先選一個特別想去的地方</h2>
              <p>
                選好地點後，下一步會告訴你最少要幾天、最舒服幾天；也可一次選兩個目的地。
              </p>
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
                    <span className="dest-de">{dest.nameLocal}</span>
                    <strong>{dest.nameZh}</strong>
                    <span className="dest-tag">{dest.tagline}</span>
                    <span className="dest-meta">
                      最少 {dest.recommendedDays.min} 天 · 最舒服{' '}
                      {dest.recommendedDays.comfortable} 天 · 建議最長{' '}
                      {dest.recommendedDays.suggestedLongest} 天
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
                下一步：看建議天數
              </button>
            </div>
          </section>
        )}

        {step === 'preferences' && primary && (
          <section className="panel-section enter">
            <div className="section-head">
              <h2>這個地方建議玩幾天？</h2>
              <p>
                先看建議，再自己輸入。建議最長多半落在 {dayAdvice.suggestedLongest}{' '}
                天左右，但你仍可輸入到 {MAX_TRIP_DAYS} 天（更長也能排，多出來會變彈性日）。
              </p>
            </div>

            <div className="advice-strip">
              <button
                type="button"
                className={`advice clickable ${days === dayAdvice.min ? 'emphasize' : ''}`}
                onClick={() => setTripDays(dayAdvice.min)}
              >
                <span>最少</span>
                <strong>{dayAdvice.min} 天</strong>
                <em>能碰到精華</em>
              </button>
              <button
                type="button"
                className={`advice clickable ${days === dayAdvice.comfortable ? 'emphasize' : ''}`}
                onClick={() => setTripDays(dayAdvice.comfortable)}
              >
                <span>最舒服</span>
                <strong>{dayAdvice.comfortable} 天</strong>
                <em>推薦首選</em>
              </button>
              <button
                type="button"
                className={`advice clickable ${days === dayAdvice.suggestedLongest ? 'emphasize' : ''}`}
                onClick={() => setTripDays(dayAdvice.suggestedLongest)}
              >
                <span>建議最長</span>
                <strong>{dayAdvice.suggestedLongest} 天</strong>
                <em>慢慢玩也不嫌多</em>
              </button>
            </div>

            <p className="muted-line">{dayAdvice.note}</p>

            <div className="day-input-panel">
              <div className="field-block grow">
                <label htmlFor="days">自己輸入天數</label>
                <div className="day-input-row">
                  <button
                    type="button"
                    className="btn ghost icon-btn"
                    onClick={() => setTripDays(days - 1)}
                    aria-label="減少一天"
                  >
                    −
                  </button>
                  <input
                    id="days"
                    type="number"
                    min={MIN_TRIP_DAYS}
                    max={MAX_TRIP_DAYS}
                    value={daysInput}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const raw = e.target.value
                      setDaysInput(raw)
                      if (raw === '') return
                      const parsed = Number(raw)
                      if (!Number.isFinite(parsed)) return
                      // Keep draft text while typing; only store a valid in-range day.
                      if (parsed >= MIN_TRIP_DAYS && parsed <= MAX_TRIP_DAYS) {
                        setDays(parsed)
                        setHotelNights(nightsFromDays(parsed))
                      }
                    }}
                    onBlur={() => {
                      const parsed = Number(daysInput)
                      setTripDays(
                        Number.isFinite(parsed) ? parsed : dayAdvice.comfortable,
                      )
                    }}
                  />
                  <button
                    type="button"
                    className="btn ghost icon-btn"
                    onClick={() => setTripDays(days + 1)}
                    aria-label="增加一天"
                  >
                    +
                  </button>
                  <span className="day-unit">
                    天 / {nightsFromDays(planDays)} 夜
                  </span>
                </div>
                <p className="range-value">
                  可輸入 {MIN_TRIP_DAYS}–{MAX_TRIP_DAYS} 天。超過建議最長也沒問題，多出的日子會排成彈性／購物／再訪日。
                </p>
              </div>

              <div className="quick-days">
                {[dayAdvice.min, dayAdvice.comfortable, dayAdvice.suggestedLongest, 14, 16, MAX_TRIP_DAYS]
                  .filter((value, index, arr) => arr.indexOf(value) === index)
                  .map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`chip ${days === value ? 'selected' : ''}`}
                      onClick={() => setTripDays(value)}
                    >
                      {value} 天
                    </button>
                  ))}
              </div>
            </div>

            <div className="preference-grid">
              <div className="field-block">
                <label htmlFor="start">出發日期（紅字選項）</label>
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
                {dateDays ? (
                  <p className="range-value">日期跨度 {dateDays} 天（可再手動改上面天數）</p>
                ) : null}
              </div>
            </div>

            <p className="weather-preview strong">{weather}</p>

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
              <p>
                你目前規劃 {planDays} 天 {nightsFromDays(planDays)} 夜；可再微調實際入住晚數。
              </p>
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
                  （{planDays} 天通常住 {nightsFromDays(planDays)} 晚）
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
                這裡列出約 {allSpots.length} 個景點。紅色標籤是必去／打卡紅點／熱門；不想去就取消，確認後再依你的天數產生行程。
              </p>
            </div>

            <div className="spot-toolbar">
              <span>
                已選 {selectedSpotIds.length} / {allSpots.length} · 行程 {planDays} 天
              </span>
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
                    <span className="spot-de">{spot.nameLocal}</span>
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
                依選擇產生 {planDays} 天行程
              </button>
            </div>
          </section>
        )}

        {step === 'result' && primary && (
          <section className="result enter">
            <div className="result-hero">
              <p className="eyebrow">
                {selectedDestinations.map((d) => d.nameLocal).join(' + ')} · {planDays}{' '}
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
                <h3>天數與天氣</h3>
                <p className="season-note">
                  最少 {dayAdvice.min} 天 · 最舒服 {dayAdvice.comfortable} 天 · 建議最長{' '}
                  {dayAdvice.suggestedLongest} 天
                </p>
                <p>
                  <strong>你目前選擇：</strong>
                  {planDays} 天 {nightsFromDays(planDays)} 夜
                </p>
                <p>
                  <strong>天氣參考：</strong>
                  {weather}
                </p>
                <p className="muted">
                  {specialNeeds.length ? specialNeeds.join('、') : '無特別需求'}
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
                <h3>每日行程</h3>
                <p>
                  依你勾選的景點與 {planDays}{' '}
                  天重排。若要改天數或景點，回上一步後再重新產生。
                </p>
              </div>
              <div className="day-list">
                {itinerary.map((day, index) => (
                  <article
                    key={`${day.theme}-${index}-${planVersion}`}
                    className="day-card"
                    style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
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
                onClick={() => setStep('preferences')}
              >
                改天數
              </button>
              <button type="button" className="btn ghost" onClick={() => setStep('spots')}>
                改景點
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
        <span>地方建議天數 → 自己輸入 → 勾景點 → 重跑行程</span>
      </footer>
    </div>
  )
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return <span className={`step-pill ${active ? 'active' : ''}`}>{label}</span>
}

export default App
