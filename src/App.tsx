import { useMemo, useState } from 'react'
import {
  MAX_TRIP_DAYS,
  MIN_TRIP_DAYS,
  aggregateDayAdvice,
  assessDurationFit,
  buildItinerary,
  clampDays,
  companions,
  createCustomDestination,
  createCustomSpot,
  daysBetween,
  defaultSelectedSpotIds,
  destinations as presetDestinations,
  findKnownDestination,
  hotelStyles,
  hotelsForStyle,
  nightsFromDays,
  parseDestinationNames,
  seasonKey,
  specialNeedOptions,
  spotTagLabels,
  tripPaces,
  type Companion,
  type Destination,
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
  const [customDestinations, setCustomDestinations] = useState<Destination[]>([])
  const [destinationInput, setDestinationInput] = useState('')
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
  const [customSpotName, setCustomSpotName] = useState('')
  const [customSpotHours, setCustomSpotHours] = useState(2)
  const [inputError, setInputError] = useState('')

  const catalog = useMemo(() => {
    const overrides = new Map(customDestinations.map((d) => [d.id, d]))
    const presets = presetDestinations.filter((d) => !overrides.has(d.id))
    return [...customDestinations, ...presets]
  }, [customDestinations])

  const selectedDestinations = useMemo(
    () => catalog.filter((d) => selectedDestIds.includes(d.id)),
    [catalog, selectedDestIds],
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
  const hotels = primary
    ? primary.curatedPlans
      ? primary.hotels
      : hotelsForStyle(primary, hotelStyle)
    : []
  const hotelAreaHint = hotels[0]?.area || primary?.nameZh || '市區'
  const budgetSummary = primary?.budgetSummary
  const travelTips = primary?.tips ?? []

  const selectedSpotObjects = useMemo(
    () => allSpots.filter((s) => selectedSpotIds.includes(s.id)),
    [allSpots, selectedSpotIds],
  )

  const durationFit = useMemo(
    () =>
      assessDurationFit({
        spots: selectedSpotObjects,
        chosenDays: planDays,
        pace,
        specialNeeds,
        destination: primary,
      }),
    [selectedSpotObjects, planDays, pace, specialNeeds, primary],
  )
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
      if (prev.length >= 3) return [...prev.slice(1), id]
      return [...prev, id]
    })
  }

  function addDestinationsFromInput() {
    const names = parseDestinationNames(destinationInput)
    if (!names.length) {
      setInputError('請輸入至少一個目的地，例如：巴黎、北海道、青甘大環線')
      return
    }

    const nextCustom: Destination[] = []
    const nextIds: DestinationId[] = [...selectedDestIds]

    for (const name of names) {
      const known = findKnownDestination(name)
      const matchName = (d: Destination) =>
        d.nameZh === name ||
        d.nameLocal.toLowerCase() === name.toLowerCase() ||
        d.nameZh.includes(name) ||
        name.includes(d.nameZh)

      const existingCustom =
        customDestinations.find(matchName) || nextCustom.find(matchName)
      const alreadyInCatalog = catalog.find(matchName)

      if (known) {
        if (!nextIds.includes(known.id)) nextIds.push(known.id)
        continue
      }
      if (existingCustom) {
        if (!nextIds.includes(existingCustom.id)) nextIds.push(existingCustom.id)
        continue
      }
      if (alreadyInCatalog) {
        if (!nextIds.includes(alreadyInCatalog.id)) nextIds.push(alreadyInCatalog.id)
        continue
      }

      const created = createCustomDestination(name)
      nextCustom.push(created)
      nextIds.push(created.id)
    }

    if (nextCustom.length) {
      setCustomDestinations((prev) => [...nextCustom, ...prev])
    }
    setSelectedDestIds(nextIds.slice(-3))
    setDestinationInput('')
    setInputError('')
  }

  function removeCustomDestination(id: DestinationId) {
    setCustomDestinations((prev) => prev.filter((d) => d.id !== id))
    setSelectedDestIds((prev) => prev.filter((x) => x !== id))
  }

  function addCustomSpotToPrimary() {
    if (!primary) return
    const name = customSpotName.trim()
    if (!name) {
      setInputError('請輸入景點名稱')
      return
    }
    const spot = createCustomSpot(primary.nameZh, name, customSpotHours)

    setCustomDestinations((prev) => {
      const existing = prev.find((d) => d.id === primary.id)
      if (existing) {
        return prev.map((d) =>
          d.id === primary.id ? { ...d, spots: [spot, ...d.spots] } : d,
        )
      }
      // Override preset entry with an editable copy (same id).
      return [{ ...primary, spots: [spot, ...primary.spots] }, ...prev]
    })
    setSelectedSpotIds((prev) => [spot.id, ...prev])
    setCustomSpotName('')
    setInputError('')
  }

  function applyDateRange(nextStart: string, nextEnd: string) {
    setStartDate(nextStart)
    setEndDate(nextEnd)
    const span = daysBetween(nextStart, nextEnd)
    if (span) setTripDays(span)
  }

  function goToPreferences() {
    if (!selectedDestIds.length) {
      setInputError('請先輸入或選擇目的地')
      return
    }
    const advice = aggregateDayAdvice(selectedDestinations)
    const span = daysBetween(startDate, endDate)
    setTripDays(span ?? advice.comfortable)
    setInputError('')
    setStep('preferences')
  }

  function initSpotsAndContinue() {
    const dests = selectedDestinations
    const spots = dests.flatMap((d) => d.spots)
    setSelectedSpotIds(defaultSelectedSpotIds(spots, dests[0]))
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
    setCustomDestinations([])
    setDestinationInput('')
    setCustomSpotName('')
    setInputError('')
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
          <img
            className="brand-logo"
            src="/km-logo.svg"
            alt="KM Travel Planner"
            width={40}
            height={40}
          />
          <span className="brand-text">
            KM Travel Planner
            <small>AI 旅遊規劃</small>
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
              <img
                className="hero-logo"
                src="/km-logo.svg"
                alt=""
                width={88}
                height={88}
              />
              <h1 className="hero-brand">
                KM Travel Planner
              </h1>
              <p className="eyebrow">依 AI 旅遊規劃做成的可互動行程工具</p>
              <p className="hero-lead">
                先輸入你想去的目的地，看最短／最舒服要幾天；也可以自己輸入天數（到{' '}
                {MAX_TRIP_DAYS} 天）。再勾景點、產生行程，不滿意就改完重跑。
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
                    const dest = presetDestinations.find((d) => d.id === 'qinggan')!
                    setSelectedDestIds(['qinggan'])
                    setTripDays(14)
                    setStartDate('2026-06-15')
                    setEndDate('2026-06-28')
                    setPace('relaxed')
                    setCompanion('friends')
                    setSpecialNeeds([
                      '想拍打卡美照',
                      '偏好戶外自然',
                      '包司機舒服版',
                      '高原慢適應',
                      '6人小團',
                    ])
                    setHotelStyle('luxuryValue')
                    setSelectedSpotIds(defaultSelectedSpotIds(dest.spots, dest))
                    setStep('result')
                    setPlanVersion((v) => v + 1)
                  }}
                >
                  看青甘 14 日範例
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
              <h2>輸入你想去的地方</h2>
              <p>
                直接打目的地名稱即可（可一次輸入多個，用逗號分隔）。若符合內建行程會自動套用；否則 AI 會為你建立可編輯的行程骨架。
              </p>
            </div>

            <form
              className="destination-input-panel"
              onSubmit={(e) => {
                e.preventDefault()
                addDestinationsFromInput()
              }}
            >
              <label htmlFor="dest-input">目的地</label>
              <div className="destination-input-row">
                <input
                  id="dest-input"
                  type="text"
                  placeholder="例如：巴黎、北海道、青甘大環線、大阪 京都"
                  value={destinationInput}
                  onChange={(e) => {
                    setDestinationInput(e.target.value)
                    if (inputError) setInputError('')
                  }}
                />
                <button type="submit" className="btn primary">
                  加入目的地
                </button>
              </div>
              <p className="range-value">
                支援一次輸入多個：用逗號、頓號或空白分隔。目前已選 {selectedDestIds.length} 個（最多 3 個）。
              </p>
              {inputError && step === 'destination' ? (
                <p className="input-error">{inputError}</p>
              ) : null}
            </form>

            {selectedDestinations.length > 0 && (
              <div className="selected-dest-chips">
                {selectedDestinations.map((dest) => (
                  <span key={dest.id} className="selected-chip">
                    {dest.nameZh}
                    <button
                      type="button"
                      aria-label={`移除 ${dest.nameZh}`}
                      onClick={() => {
                        if (dest.id.startsWith('custom-')) removeCustomDestination(dest.id)
                        else setSelectedDestIds((prev) => prev.filter((id) => id !== dest.id))
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            <h3 className="subhead">或從範例快速選擇</h3>
            <div className="dest-grid">
              {catalog.map((dest, index) => {
                const active = selectedDestIds.includes(dest.id)
                const isCustom = dest.id.startsWith('custom-')
                return (
                  <button
                    key={dest.id}
                    type="button"
                    className={`dest-card ${active ? 'selected' : ''}`}
                    style={{ animationDelay: `${index * 60}ms` }}
                    onClick={() => toggleDestination(dest.id)}
                  >
                    <span className="dest-de">
                      {dest.nameLocal}
                      {isCustom ? ' · 自訂' : ''}
                    </span>
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

            <DurationFitPanel
              assessment={durationFit}
              onApplyRecommended={() => setTripDays(durationFit.recommendedDays)}
              onApplyComfortable={() => setTripDays(durationFit.comfortableDays)}
              onApplyMin={() => setTripDays(durationFit.minDays)}
            />

            <form
              className="spot-input-panel"
              onSubmit={(e) => {
                e.preventDefault()
                addCustomSpotToPrimary()
              }}
            >
              <label htmlFor="spot-input">自己加入景點</label>
              <div className="destination-input-row">
                <input
                  id="spot-input"
                  type="text"
                  placeholder="例如：艾菲爾鐵塔、北海道白色戀人公園"
                  value={customSpotName}
                  onChange={(e) => setCustomSpotName(e.target.value)}
                />
                <input
                  aria-label="停留小時"
                  type="number"
                  min={0.5}
                  max={12}
                  step={0.5}
                  value={customSpotHours}
                  onChange={(e) => setCustomSpotHours(Number(e.target.value) || 2)}
                  className="hours-input"
                />
                <button type="submit" className="btn primary">
                  加入景點
                </button>
              </div>
              <p className="range-value">右側數字是建議停留小時；加入後會自動勾選並重估天數。</p>
              {inputError && step === 'spots' ? (
                <p className="input-error">{inputError}</p>
              ) : null}
            </form>

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
                  <strong>依景點估算正常完成：</strong>
                  {durationFit.recommendedDays} 天
                  {durationFit.status === 'too_packed'
                    ? '（目前偏趕）'
                    : durationFit.status === 'too_light'
                      ? '（目前偏鬆）'
                      : '（搭配剛好）'}
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
                <h3>
                  {primary.curatedPlans ? '沿線酒店推薦' : `住宿建議 · ${styleLabel}`}
                </h3>
                <p className="muted">
                  {primary.curatedPlans
                    ? '依基地少換宿：西寧 → 嘉峪關 → 敦煌 → 花土溝 → 德令哈 → 青海湖。'
                    : `建議住 ${Math.min(hotelNights, planDays)} 晚，區域以 ${hotelAreaHint} 為主。`}
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

              {budgetSummary && (
                <article className="info-block wide">
                  <h3>{budgetSummary.title}</h3>
                  <p className="season-note">{budgetSummary.totalRange}</p>
                  <p>
                    <strong>{budgetSummary.perPerson}</strong>
                  </p>
                  <div className="budget-list">
                    {budgetSummary.lines.map((line) => (
                      <div key={line.item} className="budget-item">
                        <strong>{line.item}</strong>
                        <span>{line.detail}</span>
                        <em>{line.amount}</em>
                      </div>
                    ))}
                  </div>
                </article>
              )}

              {travelTips.length > 0 && (
                <article className="info-block wide">
                  <h3>注意事項</h3>
                  <ul className="tips-list">
                    {travelTips.map((tip) => (
                      <li key={tip}>{tip}</li>
                    ))}
                  </ul>
                </article>
              )}
            </div>

            <DurationFitPanel
              assessment={durationFit}
              onApplyRecommended={() => {
                setTripDays(durationFit.recommendedDays)
                setPlanVersion((v) => v + 1)
              }}
              onApplyComfortable={() => {
                setTripDays(durationFit.comfortableDays)
                setPlanVersion((v) => v + 1)
              }}
              onApplyMin={() => {
                setTripDays(durationFit.minDays)
                setPlanVersion((v) => v + 1)
              }}
            />

            <div className="itinerary">
              <div className="section-head">
                <h3>每日行程</h3>
                <p>
                  {primary.curatedPlans?.[planDays]
                    ? `這是 ${primary.nameZh} 的 ${planDays} 日完整舒服版行程；取消勾選景點後可精簡對應日。`
                    : `依你勾選的景點與 ${planDays} 天重排。若要改天數或景點，回上一步後再重新產生。`}
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
        <span className="footer-brand">
          <img src="/km-logo.svg" alt="" width={22} height={22} />
          KM Travel Planner
        </span>
        <span>地方建議天數 → 自己輸入 → 勾景點 → 重跑行程</span>
      </footer>
    </div>
  )
}

function StepPill({ active, label }: { active: boolean; label: string }) {
  return <span className={`step-pill ${active ? 'active' : ''}`}>{label}</span>
}

function DurationFitPanel({
  assessment,
  onApplyRecommended,
  onApplyComfortable,
  onApplyMin,
}: {
  assessment: ReturnType<typeof assessDurationFit>
  onApplyRecommended: () => void
  onApplyComfortable: () => void
  onApplyMin: () => void
}) {
  if (assessment.status === 'empty') {
    return (
      <aside className="duration-fit empty">
        <strong>{assessment.title}</strong>
        <p>{assessment.message}</p>
      </aside>
    )
  }

  return (
    <aside className={`duration-fit ${assessment.status}`}>
      <div className="duration-fit-head">
        <strong>{assessment.title}</strong>
        <div className="duration-fit-metrics">
          <span>你選 {assessment.chosenDays} 天</span>
          <span>正常完成 {assessment.recommendedDays} 天</span>
          <span>最少 {assessment.minDays} 天</span>
          <span>舒服 {assessment.comfortableDays} 天</span>
        </div>
      </div>
      <p>{assessment.message}</p>
      {assessment.status !== 'balanced' && (
        <div className="cta-row">
          <button type="button" className="btn primary" onClick={onApplyRecommended}>
            改用正常完成 {assessment.recommendedDays} 天
          </button>
          {assessment.status === 'too_packed' && (
            <button type="button" className="btn ghost" onClick={onApplyComfortable}>
              改用舒服 {assessment.comfortableDays} 天
            </button>
          )}
          {assessment.status === 'too_light' && (
            <button type="button" className="btn ghost" onClick={onApplyMin}>
              改用最少 {assessment.minDays} 天
            </button>
          )}
        </div>
      )}
    </aside>
  )
}

export default App
