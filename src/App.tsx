import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MAX_PARTY_SIZE,
  MAX_TRIP_DAYS,
  MIN_PARTY_SIZE,
  MIN_TRIP_DAYS,
  aggregateDayAdvice,
  assessDurationFit,
  buildItinerary,
  clampDays,
  clampPartySize,
  companions,
  createCustomDestination,
  createCustomSpot,
  daysBetween,
  defaultPartySize,
  defaultSelectedSpotIds,
  deriveFitStatus,
  destinationNeedsAiSpots,
  destinations as presetDestinations,
  findKnownDestination,
  fitStatusTitle,
  hotelBookingAdvice,
  hotelStyles,
  hotelsForStyle,
  nightsFromDays,
  parseDestinationNames,
  scenicSpotsFromAi,
  seasonKey,
  specialNeedOptions,
  spotTagLabels,
  trafficArrangementAdvice,
  tripPaces,
  type Companion,
  type Destination,
  type DestinationId,
  type HotelStyle,
  type TripPace,
} from './data/travel'
import { FreeTextField } from './components/FreeTextField'
import {
  recommendDaysWithAi,
  reviewPlanWithAi,
  suggestSpotsWithAi,
  type AiDayRecommendation,
  type AiPlanReview,
} from './lib/aiClient'
import { readClipboardText } from './lib/clipboard'
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
  const [partySize, setPartySize] = useState(2)
  const [partySizeInput, setPartySizeInput] = useState('2')
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
  const [aiDayRec, setAiDayRec] = useState<AiDayRecommendation | null>(null)
  const [aiReview, setAiReview] = useState<AiPlanReview | null>(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiReviewLoading, setAiReviewLoading] = useState(false)
  const [aiSpotsLoading, setAiSpotsLoading] = useState(false)
  const [aiSpotsError, setAiSpotsError] = useState('')
  const [aiSpotsNote, setAiSpotsNote] = useState('')
  const [aiSpotsLoadedKeys, setAiSpotsLoadedKeys] = useState<string[]>([])
  const [aiError, setAiError] = useState('')
  const destComposing = useRef(false)
  const reviewTimer = useRef<number | null>(null)
  const aiSpotsInFlight = useRef(false)
  const aiReviewCache = useRef<{
    key: string
    review: AiPlanReview
  } | null>(null)

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

  const displayAdvice = useMemo(() => {
    if (
      aiDayRec &&
      Number.isFinite(aiDayRec.minDays) &&
      Number.isFinite(aiDayRec.comfortableDays) &&
      Number.isFinite(aiDayRec.suggestedLongestDays)
    ) {
      return {
        min: clampDays(aiDayRec.minDays),
        comfortable: clampDays(aiDayRec.comfortableDays),
        suggestedLongest: clampDays(aiDayRec.suggestedLongestDays),
        note: aiDayRec.reason,
      }
    }
    return dayAdvice
  }, [aiDayRec, dayAdvice])

  const displayFit = useMemo(() => {
    if (!aiReview || !Number.isFinite(aiReview.recommendedDays)) return durationFit
    const status =
      aiReview.status === 'too_packed' ||
      aiReview.status === 'too_light' ||
      aiReview.status === 'balanced'
        ? aiReview.status
        : durationFit.status
    return {
      ...durationFit,
      status,
      recommendedDays: clampDays(aiReview.recommendedDays),
      minDays: clampDays(aiReview.minDays || aiReview.recommendedDays),
      comfortableDays: clampDays(
        aiReview.comfortableDays || aiReview.recommendedDays,
      ),
      title: aiReview.title || durationFit.title,
      message: [aiReview.message, ...(aiReview.adjustments || [])]
        .filter(Boolean)
        .join(' '),
    }
  }, [aiReview, durationFit])

  const styleLabel = hotelStyles.find((s) => s.id === hotelStyle)?.label ?? ''
  const paceLabel = tripPaces.find((p) => p.id === pace)?.label ?? ''
  const companionLabel = companions.find((c) => c.id === companion)?.label ?? ''
  const travelers = clampPartySize(partySize)
  const hotelAdvice = useMemo(() => hotelBookingAdvice(travelers), [travelers])
  const trafficAdvice = useMemo(
    () =>
      trafficArrangementAdvice(travelers, {
        privateDriver: specialNeeds.includes('包司機舒服版'),
      }),
    [travelers, specialNeeds],
  )

  function setTravelers(next: number) {
    const clamped = clampPartySize(next)
    setPartySize(clamped)
    setPartySizeInput(String(clamped))
    setSpecialNeeds((prev) => {
      const withoutGroupTag = prev.filter((need) => need !== '6人小團')
      return clamped === 6 ? [...withoutGroupTag, '6人小團'] : withoutGroupTag
    })
  }

  function chooseCompanion(next: Companion) {
    setCompanion(next)
    setTravelers(defaultPartySize(next))
  }

  const selectedDestKey = selectedDestIds.join('|')
  const selectedSpotKey = selectedSpotIds.join('|')
  const selectedDestNames = selectedDestinations.map((d) => d.nameZh).join(' + ')

  const runAiDayRecommendation = async (
    destName: string,
    options?: { applyDays?: boolean },
  ) => {
    const applyDays = options?.applyDays ?? true
    setAiLoading(true)
    setAiError('')
    try {
      const result = await recommendDaysWithAi({
        destinationName: destName,
        pace,
        companions: companion,
        partySize: travelers,
        specialNeeds,
        heuristic: {
          minDays: dayAdvice.min,
          comfortableDays: dayAdvice.comfortable,
          suggestedLongestDays: dayAdvice.suggestedLongest,
        },
      })
      setAiDayRec(result)
      if (applyDays && Number.isFinite(result.comfortableDays)) {
        setTripDays(result.comfortableDays)
      }
      return result
    } catch (error) {
      setAiDayRec(null)
      setAiError(error instanceof Error ? error.message : 'AI 天數建議失敗')
      return null
    } finally {
      setAiLoading(false)
    }
  }

  useEffect(() => {
    if (step !== 'preferences' || !primary || !selectedDestNames) return
    let cancelled = false
    setAiLoading(true)
    setAiError('')
    void recommendDaysWithAi({
      destinationName: selectedDestNames,
      pace,
      companions: companion,
      partySize: travelers,
      specialNeeds,
      heuristic: {
        minDays: dayAdvice.min,
        comfortableDays: dayAdvice.comfortable,
        suggestedLongestDays: dayAdvice.suggestedLongest,
      },
    })
      .then((result) => {
        if (cancelled) return
        setAiDayRec(result)
        if (Number.isFinite(result.comfortableDays)) {
          setTripDays(result.comfortableDays)
        }
      })
      .catch((error: unknown) => {
        if (cancelled) return
        setAiDayRec(null)
        setAiError(error instanceof Error ? error.message : 'AI 天數建議失敗')
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false)
      })
    return () => {
      cancelled = true
    }
    // Re-run when destination set changes; preferences page entry triggers via step.
  }, [step, selectedDestKey, selectedDestNames])

  const reviewContentKey = [
    selectedDestNames,
    selectedSpotKey,
    pace,
    companion,
    travelers,
    specialNeeds.join('|'),
    durationFit.minDays,
    durationFit.recommendedDays,
    durationFit.comfortableDays,
  ].join('::')

  function withChosenDays(review: AiPlanReview, chosen: number): AiPlanReview {
    const status = deriveFitStatus(
      chosen,
      review.minDays,
      review.recommendedDays,
      review.comfortableDays,
    )
    return {
      ...review,
      status,
      title: fitStatusTitle(status),
    }
  }

  useEffect(() => {
    if ((step !== 'spots' && step !== 'result') || !primary) return

    // Same spots/conditions → reuse absolute day estimate; only status follows chosen days.
    // This stops spots-page "16 days" flipping to result-page "10 days".
    if (aiReviewCache.current?.key === reviewContentKey) {
      setAiReview(withChosenDays(aiReviewCache.current.review, planDays))
      setAiReviewLoading(false)
      return
    }

    if (reviewTimer.current) window.clearTimeout(reviewTimer.current)
    const destinationName = selectedDestNames
    const spotsPayload = selectedSpotObjects.map((s) => ({
      name: s.name,
      stayHours: s.stayHours,
      area: s.area,
    }))
    const heuristic = {
      status: durationFit.status,
      recommendedDays: durationFit.recommendedDays,
      minDays: durationFit.minDays,
      comfortableDays: durationFit.comfortableDays,
    }
    const contentKey = reviewContentKey
    reviewTimer.current = window.setTimeout(() => {
      setAiReviewLoading(true)
      void reviewPlanWithAi({
        destinationName,
        chosenDays: planDays,
        pace,
        companions: companion,
        partySize: travelers,
        specialNeeds,
        spots: spotsPayload,
        heuristic,
      })
        .then((result) => {
          const stabilized = withChosenDays(result, planDays)
          aiReviewCache.current = { key: contentKey, review: result }
          setAiReview(stabilized)
          setAiError('')
        })
        .catch((error: unknown) => {
          setAiReview(null)
          setAiError(error instanceof Error ? error.message : 'AI 行程審核失敗')
        })
        .finally(() => setAiReviewLoading(false))
    }, 600)
    return () => {
      if (reviewTimer.current) window.clearTimeout(reviewTimer.current)
    }
  }, [step, reviewContentKey, planDays, primary?.id])

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

  async function loadAiSpotsForDestinations(force = false) {
    // Force reload works for presets too (Osaka etc.), not only custom templates.
    const targets = force
      ? selectedDestinations
      : selectedDestinations.filter(
          (dest) =>
            destinationNeedsAiSpots(dest) &&
            !aiSpotsLoadedKeys.includes(dest.id),
        )
    if (!targets.length) {
      if (force) {
        setAiSpotsError('目前沒有已選目的地，無法請 AI 推薦景點。')
      }
      return
    }
    if (aiSpotsInFlight.current) {
      if (force) setAiSpotsError('AI 正在載入景點，請稍候再試。')
      return
    }

    aiSpotsInFlight.current = true
    setAiSpotsLoading(true)
    setAiSpotsError('')
    setAiSpotsNote(force ? '正在重新請 AI 推薦真實景點…' : '')
    try {
      const updates: { id: DestinationId; spots: Destination['spots']; intro?: string }[] =
        []
      const notes: string[] = []

      for (const dest of targets) {
        const result = await suggestSpotsWithAi({
          destinationName: dest.nameZh,
          pace,
          companions: companion,
          partySize: travelers,
          specialNeeds,
          days: planDays,
        })
        const aiSpots = scenicSpotsFromAi(dest.nameZh, result.spots)
        if (aiSpots.length < 8) {
          throw new Error(`AI 給 ${dest.nameZh} 的真實景點太少，請再試一次`)
        }
        const userSpots = dest.spots.filter((spot) => spot.id.startsWith('user-spot-'))
        updates.push({
          id: dest.id,
          spots: [...userSpots, ...aiSpots],
          intro: result.intro,
        })
        if (result.intro) notes.push(result.intro)
      }

      setCustomDestinations((prev) => {
        const byId = new Map(prev.map((d) => [d.id, d]))
        for (const update of updates) {
          const existing = byId.get(update.id)
          const base =
            existing ??
            selectedDestinations.find((d) => d.id === update.id) ??
            null
          if (!base) continue
          byId.set(update.id, {
            ...base,
            spots: update.spots,
            intro: update.intro?.trim() || base.intro,
            tagline: update.intro?.trim()
              ? 'AI 已推薦真實景點'
              : base.tagline,
          })
        }
        const orderedIds = [
          ...updates.map((u) => u.id),
          ...prev.map((d) => d.id),
        ]
        const uniqueIds = [...new Set(orderedIds)]
        return uniqueIds
          .map((id) => byId.get(id))
          .filter((d): d is Destination => Boolean(d))
      })

      setAiSpotsLoadedKeys((prev) => [
        ...new Set([...prev, ...updates.map((u) => u.id)]),
      ])
      setAiSpotsNote(notes.filter(Boolean).join(' '))

      const nextSpots = selectedDestinations.map((dest) => {
        const update = updates.find((u) => u.id === dest.id)
        return update ? { ...dest, spots: update.spots } : dest
      })
      const flat = nextSpots.flatMap((d) => d.spots)
      setSelectedSpotIds(defaultSelectedSpotIds(flat, nextSpots[0]))
    } catch (error) {
      setAiSpotsError(error instanceof Error ? error.message : 'AI 景點建議失敗')
    } finally {
      aiSpotsInFlight.current = false
      setAiSpotsLoading(false)
    }
  }

  function initSpotsAndContinue() {
    const dests = selectedDestinations
    const spots = dests.flatMap((d) => d.spots)
    setSelectedSpotIds(defaultSelectedSpotIds(spots, dests[0]))
    setStep('spots')
    void loadAiSpotsForDestinations(false)
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
    setAiSpotsLoadedKeys([])
    setAiSpotsNote('')
    setAiSpotsError('')
    setAiDayRec(null)
    setAiReview(null)
    aiReviewCache.current = null
    setCompanion('couple')
    setPartySize(2)
    setPartySizeInput('2')
  }

  useEffect(() => {
    if (step !== 'spots' && step !== 'hotel' && step !== 'preferences') return
    const pending = selectedDestinations.some(
      (dest) =>
        destinationNeedsAiSpots(dest) && !aiSpotsLoadedKeys.includes(dest.id),
    )
    if (!pending || aiSpotsLoading) return
    void loadAiSpotsForDestinations(false)
    // Intentionally keyed by destination selection + step; loader manages in-flight state.
  }, [step, selectedDestKey])

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
                    setTravelers(6)
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
                if (destComposing.current) return
                addDestinationsFromInput()
              }}
            >
              <label htmlFor="dest-input">目的地（可中文／語音／貼上）</label>
              <FreeTextField
                id="dest-input"
                multiline
                rows={3}
                placeholder={'點這裡後貼上，例如：新疆南北疆舒適慢遊\n也可打中文／用語音輸入'}
                value={destinationInput}
                onValueChange={(value) => {
                  setDestinationInput(value)
                  if (inputError) setInputError('')
                }}
                onCompositionStart={() => {
                  destComposing.current = true
                }}
                onCompositionEnd={() => {
                  destComposing.current = false
                }}
                autoFocus
              />
              <div className="destination-input-row" style={{ marginTop: '0.65rem' }}>
                <button
                  type="button"
                  className="btn ghost"
                  onClick={async () => {
                    let text = (await readClipboardText()).trim()
                    if (!text) {
                      // Fallback when browser blocks clipboard API — prompt accepts paste.
                      text = (window.prompt('請在此貼上目的地（Ctrl/Cmd+V）：', '') || '').trim()
                    }
                    if (text) {
                      setDestinationInput((prev) =>
                        prev.trim() ? `${prev.trim()}\n${text}` : text,
                      )
                      setInputError('')
                      return
                    }
                    setInputError('請直接在上方輸入框按 Ctrl+V（Mac：Cmd+V）或長按選擇貼上')
                  }}
                >
                  從剪貼簿貼上
                </button>
                <button type="submit" className="btn primary">
                  加入目的地
                </button>
              </div>
              <p className="range-value">
                支援中文輸入法、手機語音鍵盤，以及從 Notes／WhatsApp／瀏覽器複製貼上。多個目的地可用逗號、頓號或換行分隔。目前已選 {selectedDestIds.length} 個（最多 3 個）。
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
                AI（Crazyrouter）會先審核目的地再給天數。建議最長多半落在{' '}
                {displayAdvice.suggestedLongest} 天左右，你仍可輸入到 {MAX_TRIP_DAYS} 天。
              </p>
            </div>

            <aside className={`ai-panel ${aiLoading ? 'loading' : aiDayRec ? 'ready' : ''}`}>
              <strong>
                {aiLoading
                  ? 'AI 正在審核行程天數…'
                  : aiDayRec
                    ? 'AI 已審核天數建議'
                    : '等待 AI 審核'}
              </strong>
              {aiError ? <p className="input-error">{aiError}</p> : null}
              {aiDayRec ? (
                <>
                  <p>{aiDayRec.reason}</p>
                  {aiDayRec.warnings?.length ? (
                    <ul className="tips-list">
                      {aiDayRec.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  ) : null}
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() =>
                      primary &&
                      void runAiDayRecommendation(
                        selectedDestinations.map((d) => d.nameZh).join(' + '),
                      )
                    }
                  >
                    重新請 AI 審核
                  </button>
                </>
              ) : null}
            </aside>

            <div className="advice-strip">
              <button
                type="button"
                className={`advice clickable ${days === displayAdvice.min ? 'emphasize' : ''}`}
                onClick={() => setTripDays(displayAdvice.min)}
              >
                <span>最少</span>
                <strong>{displayAdvice.min} 天</strong>
                <em>能碰到精華</em>
              </button>
              <button
                type="button"
                className={`advice clickable ${days === displayAdvice.comfortable ? 'emphasize' : ''}`}
                onClick={() => setTripDays(displayAdvice.comfortable)}
              >
                <span>最舒服</span>
                <strong>{displayAdvice.comfortable} 天</strong>
                <em>AI 推薦</em>
              </button>
              <button
                type="button"
                className={`advice clickable ${days === displayAdvice.suggestedLongest ? 'emphasize' : ''}`}
                onClick={() => setTripDays(displayAdvice.suggestedLongest)}
              >
                <span>建議最長</span>
                <strong>{displayAdvice.suggestedLongest} 天</strong>
                <em>慢慢玩也不嫌多</em>
              </button>
            </div>

            <p className="muted-line">{displayAdvice.note}</p>

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
                        Number.isFinite(parsed) ? parsed : displayAdvice.comfortable,
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
                {[
                  displayAdvice.min,
                  displayAdvice.comfortable,
                  displayAdvice.suggestedLongest,
                  14,
                  16,
                  MAX_TRIP_DAYS,
                ]
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
                  onClick={() => chooseCompanion(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="day-input-panel party-size-panel">
              <div className="field-block grow">
                <label htmlFor="party-size">出行人數（會影響交通與訂房）</label>
                <div className="day-input-row">
                  <button
                    type="button"
                    className="btn ghost icon-btn"
                    onClick={() => setTravelers(travelers - 1)}
                    aria-label="減少一人"
                  >
                    −
                  </button>
                  <input
                    id="party-size"
                    type="number"
                    min={MIN_PARTY_SIZE}
                    max={MAX_PARTY_SIZE}
                    value={partySizeInput}
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => {
                      const raw = e.target.value
                      setPartySizeInput(raw)
                      if (raw === '') return
                      const parsed = Number(raw)
                      if (!Number.isFinite(parsed)) return
                      if (parsed >= MIN_PARTY_SIZE && parsed <= MAX_PARTY_SIZE) {
                        setTravelers(parsed)
                      }
                    }}
                    onBlur={() => {
                      const parsed = Number(partySizeInput)
                      setTravelers(
                        Number.isFinite(parsed)
                          ? parsed
                          : defaultPartySize(companion),
                      )
                    }}
                  />
                  <button
                    type="button"
                    className="btn ghost icon-btn"
                    onClick={() => setTravelers(travelers + 1)}
                    aria-label="增加一人"
                  >
                    +
                  </button>
                  <span className="day-unit">人同行</span>
                </div>
                <p className="range-value">
                  可輸入 {MIN_PARTY_SIZE}–{MAX_PARTY_SIZE} 人。目前建議約{' '}
                  {hotelAdvice.rooms} 間房 · 交通：{trafficAdvice.vehicle}
                </p>
              </div>
              <div className="party-quick-chips">
                {[1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`chip ${travelers === n ? 'selected' : ''}`}
                    onClick={() => setTravelers(n)}
                  >
                    {n} 人
                  </button>
                ))}
              </div>
            </div>

            <aside className="ai-panel ready party-logistics">
              <strong>依 {travelers} 人預估的交通／訂房</strong>
              <p>
                <strong>訂房：</strong>
                {hotelAdvice.note}
              </p>
              <p>
                <strong>交通：</strong>
                {trafficAdvice.mode}（{trafficAdvice.vehicle}）。{trafficAdvice.note}
              </p>
            </aside>

            <h3 className="subhead">特殊需求（可多選）</h3>
            <div className="need-grid">
              {specialNeedOptions.map((need) => {
                const active = specialNeeds.includes(need)
                return (
                  <button
                    key={need}
                    type="button"
                    className={`chip ${active ? 'selected' : ''}`}
                    onClick={() => {
                      if (need === '6人小團') {
                        if (active) {
                          setSpecialNeeds((prev) =>
                            prev.filter((x) => x !== '6人小團'),
                          )
                        } else {
                          setTravelers(6)
                        }
                        return
                      }
                      setSpecialNeeds((prev) =>
                        active ? prev.filter((x) => x !== need) : [...prev, need],
                      )
                    }}
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
                你目前規劃 {planDays} 天 {nightsFromDays(planDays)} 夜 · {travelers}{' '}
                人同行；可再微調實際入住晚數。依人數建議先訂約 {hotelAdvice.rooms} 間房（
                {hotelAdvice.bedding}）。
              </p>
            </div>

            <aside className="ai-panel ready party-logistics">
              <strong>人數對應的訂房／交通</strong>
              <p>
                <strong>訂房：</strong>
                {hotelAdvice.note}
              </p>
              <p>
                <strong>交通：</strong>
                {trafficAdvice.mode} · {trafficAdvice.vehicle}。{trafficAdvice.note}
              </p>
            </aside>

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
                AI 會依目的地推薦真實景點（不是「經典地標」這類空泛分類）。紅色標籤是必去／打卡紅點／熱門；不想去就取消，確認後再依你的天數產生行程。
              </p>
            </div>

            <aside
              className={`ai-panel ${aiSpotsLoading ? 'loading' : aiSpotsError ? '' : allSpots.some((s) => s.id.startsWith('ai-spot-')) || !selectedDestinations.some(destinationNeedsAiSpots) ? 'ready' : ''}`}
            >
              <strong>
                {aiSpotsLoading
                  ? 'AI 正在搜尋此地真實景點…'
                  : aiSpotsError
                    ? 'AI 景點建議暫時失敗'
                    : allSpots.some((s) => s.id.startsWith('ai-spot-'))
                      ? 'AI 已推薦真實景點'
                      : selectedDestinations.some(destinationNeedsAiSpots)
                        ? '準備載入 AI 景點'
                        : '已載入精選景點（仍可請 AI 重薦）'}
              </strong>
              {aiSpotsError ? <p className="input-error">{aiSpotsError}</p> : null}
              {aiSpotsNote && !aiSpotsLoading ? <p>{aiSpotsNote}</p> : null}
              <button
                type="button"
                className="btn ghost"
                disabled={aiSpotsLoading || !selectedDestinations.length}
                onClick={() => {
                  setAiSpotsError('')
                  setAiSpotsLoadedKeys([])
                  // Invalidate day-review cache so new spots get a fresh fit check.
                  aiReviewCache.current = null
                  void loadAiSpotsForDestinations(true)
                }}
              >
                {aiSpotsLoading ? 'AI 載入中…' : '重新請 AI 推薦景點'}
              </button>
            </aside>

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

            <aside className={`ai-panel ${aiReviewLoading ? 'loading' : aiReview ? 'ready' : ''}`}>
              <strong>
                {aiReviewLoading
                  ? 'AI 正在比對天數與景點…'
                  : aiReview
                    ? 'AI 已審核景點／天數搭配'
                    : '選擇景點後，AI 會自動審核'}
              </strong>
              {aiError && step === 'spots' ? (
                <p className="input-error">{aiError}</p>
              ) : null}
              {aiReview && !aiReviewLoading ? (
                <p>
                  {aiReview.message ||
                    `建議正常完成約 ${aiReview.recommendedDays} 天（最少 ${aiReview.minDays} · 舒服 ${aiReview.comfortableDays}）。`}
                </p>
              ) : null}
            </aside>

            <DurationFitPanel
              assessment={displayFit}
              onApplyRecommended={() => setTripDays(displayFit.recommendedDays)}
              onApplyComfortable={() => setTripDays(displayFit.comfortableDays)}
              onApplyMin={() => setTripDays(displayFit.minDays)}
            />

            <form
              className="spot-input-panel"
              onSubmit={(e) => {
                e.preventDefault()
                addCustomSpotToPrimary()
              }}
            >
              <label htmlFor="spot-input">自己加入景點（可中文／語音／貼上）</label>
              <FreeTextField
                id="spot-input"
                multiline
                rows={2}
                placeholder="例如：艾菲爾鐵塔、白色戀人公園（可直接貼上）"
                value={customSpotName}
                onValueChange={setCustomSpotName}
              />
              <div className="destination-input-row" style={{ marginTop: '0.65rem' }}>
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
                <button
                  type="button"
                  className="btn ghost"
                  onClick={async () => {
                    let text = (await readClipboardText()).trim()
                    if (!text) {
                      text = (window.prompt('請在此貼上景點名稱（Ctrl/Cmd+V）：', '') || '').trim()
                    }
                    if (text) {
                      setCustomSpotName(text)
                      setInputError('')
                      return
                    }
                    setInputError('請直接在上方輸入框按 Ctrl+V（Mac：Cmd+V）或長按選擇貼上')
                  }}
                >
                  從剪貼簿貼上
                </button>
                <button type="submit" className="btn primary">
                  加入景點
                </button>
              </div>
              <p className="range-value">左側數字是建議停留小時；加入後會自動勾選並重估天數。</p>
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
                天 {Math.min(hotelNights, planDays)} 夜 · {travelers} 人 · {paceLabel} ·{' '}
                {companionLabel}
              </p>
              <h2>{selectedDestinations.map((d) => d.nameZh).join('、')}</h2>
              <p className="result-tagline">
                {startDate} → {endDate} · 已排入 {selectedSpotIds.length} 個景點 ·{' '}
                {styleLabel} · 約 {hotelAdvice.rooms} 間房
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
                  最少 {displayAdvice.min} 天 · 最舒服 {displayAdvice.comfortable} 天 ·
                  建議最長 {displayAdvice.suggestedLongest} 天
                  {aiDayRec ? '（AI）' : ''}
                </p>
                <p>
                  <strong>你目前選擇：</strong>
                  {planDays} 天 {nightsFromDays(planDays)} 夜
                </p>
                <p>
                  <strong>AI 正常完成建議：</strong>
                  {displayFit.recommendedDays} 天
                  {displayFit.status === 'too_packed'
                    ? '（目前偏趕）'
                    : displayFit.status === 'too_light'
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
                <h3>交通與訂房（依 {travelers} 人）</h3>
                <p>
                  <strong>交通安排：</strong>
                  {trafficAdvice.mode}（{trafficAdvice.vehicle}）。{trafficAdvice.note}
                </p>
                <p>
                  <strong>酒店房間：</strong>
                  {hotelAdvice.note}
                </p>
                <p className="muted">床型建議：{hotelAdvice.bedding}</p>
              </article>

              <article className="info-block wide">
                <h3>
                  {primary.curatedPlans ? '沿線酒店推薦' : `住宿建議 · ${styleLabel}`}
                </h3>
                <p className="muted">
                  {primary.curatedPlans
                    ? `依基地少換宿：西寧 → 嘉峪關 → 敦煌 → 花土溝 → 德令哈 → 青海湖。${travelers} 人請各基地一次訂約 ${hotelAdvice.rooms} 間。`
                    : `建議住 ${Math.min(hotelNights, planDays)} 晚，區域以 ${hotelAreaHint} 為主；${travelers} 人先估 ${hotelAdvice.rooms} 間房。`}
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

            <aside className={`ai-panel ${aiReviewLoading ? 'loading' : aiReview ? 'ready' : ''}`}>
              <strong>
                {aiReviewLoading
                  ? 'AI 正在覆核最終行程…'
                  : aiReview
                    ? 'AI 已覆核最終行程天數'
                    : 'AI 行程覆核'}
              </strong>
              {aiReview ? (
                <p>
                  {aiReview.message ||
                    `正常完成建議 ${aiReview.recommendedDays} 天。`}
                </p>
              ) : null}
            </aside>

            <DurationFitPanel
              assessment={displayFit}
              onApplyRecommended={() => {
                setTripDays(displayFit.recommendedDays)
                setPlanVersion((v) => v + 1)
              }}
              onApplyComfortable={() => {
                setTripDays(displayFit.comfortableDays)
                setPlanVersion((v) => v + 1)
              }}
              onApplyMin={() => {
                setTripDays(displayFit.minDays)
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
