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
  endDateFromStart,
  ensureSpotsForDays,
  findKnownDestination,
  fitStatusTitle,
  applyHotelStayPlan,
  assessTripMonth,
  buildHotelStayPlan,
  formatDateZh,
  formatMonthsZh,
  getSeasonGuide,
  hotelBookingAdvice,
  hotelStyles,
  hotelsForStyle,
  nightsFromDays,
  parseDestinationNames,
  scenicSpotsFromAi,
  seasonGuideFromAi,
  seasonKey,
  specialNeedOptions,
  spotTagLabels,
  trafficArrangementAdvice,
  transportModeLabel,
  transportModes,
  tripPaces,
  spotInputExamples,
  estimateTripBudget,
  isLongHaulDestination,
  type Companion,
  type Destination,
  type DestinationId,
  type HotelStyle,
  type SeasonGuide,
  type TransportMode,
  type TripPace,
} from './data/travel'
import { FreeTextField } from './components/FreeTextField'
import { JourneyMap } from './components/JourneyMap'
import { TripHandbookPanel } from './components/TripHandbook'
import {
  recommendDaysWithAi,
  reviewPlanWithAi,
  seasonGuideWithAi,
  suggestSpotsWithAi,
  type AiDayRecommendation,
  type AiPlanReview,
} from './lib/aiClient'
import { readClipboardText } from './lib/clipboard'
import { formatWeatherLine, loadDayWeather } from './lib/weather'
import type { DayWeather } from './data/types'
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
  const [transportMode, setTransportMode] = useState<TransportMode>('public_transit')
  const [hotelStyle, setHotelStyle] = useState<HotelStyle>('value')
  const [hotelNights, setHotelNights] = useState(6)
  const [preferConsecutiveStays, setPreferConsecutiveStays] = useState(true)
  const [preferredHotelName, setPreferredHotelName] = useState('')
  const [dayWeather, setDayWeather] = useState<(DayWeather | null)[]>([])
  const [weatherLoading, setWeatherLoading] = useState(false)
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
  const planDays = clampDays(days)
  const computedEndDate = endDateFromStart(startDate, planDays)
  const dateDays = daysBetween(startDate, computedEndDate)
  const weatherMonth = startDate ? new Date(`${startDate}T12:00:00`).getMonth() + 1 : 2
  const weather = primary ? primary.weather[seasonKey(weatherMonth)] : ''
  const seasonGuide = primary ? getSeasonGuide(primary) : null
  const monthFit = seasonGuide
    ? assessTripMonth(seasonGuide, weatherMonth)
    : 'fair'

  // Keep stored end date aligned with start + duration.
  useEffect(() => {
    if (!startDate || !planDays) return
    const nextEnd = endDateFromStart(startDate, planDays)
    if (nextEnd !== endDate) setEndDate(nextEnd)
  }, [startDate, planDays, endDate])
  const hotels = primary
    ? primary.curatedPlans
      ? primary.hotels
      : hotelsForStyle(primary, hotelStyle)
    : []
  const hotelAreaHint = hotels[0]?.area || primary?.nameZh || '市區'
  const travelTips = primary?.tips ?? []
  const tripHandbook = primary?.handbook

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
    const longHaul = isLongHaulDestination(
      selectedDestinations.map((d) => d.nameZh).join(' ') || primary?.nameZh || '',
    )
    let recommendedDays = clampDays(aiReview.recommendedDays)
    let minDays = clampDays(aiReview.minDays || aiReview.recommendedDays)
    let comfortableDays = clampDays(
      aiReview.comfortableDays || aiReview.recommendedDays,
    )
    // Never let AI turn a city break into a 21-day expedition.
    if (!longHaul) {
      minDays = Math.min(minDays, 7)
      recommendedDays = Math.min(Math.max(recommendedDays, minDays), 9)
      comfortableDays = Math.min(Math.max(comfortableDays, recommendedDays), 11)
    }
    const rawMessage = [aiReview.message, ...(aiReview.adjustments || [])]
      .filter(Boolean)
      .join(' ')
    // Replace leftover AI prose that still claims 15–21 day city expeditions.
    const message = !longHaul
      ? sanitizeCityDayMessage(rawMessage, {
          chosenDays: planDays,
          minDays,
          recommendedDays,
          comfortableDays,
        }) || durationFit.message
      : rawMessage || durationFit.message

    return {
      ...durationFit,
      status:
        planDays < recommendedDays
          ? 'too_packed'
          : planDays > Math.max(recommendedDays + 2, comfortableDays)
            ? 'too_light'
            : status === 'too_packed' && planDays >= recommendedDays
              ? 'balanced'
              : status,
      recommendedDays,
      minDays,
      comfortableDays,
      title:
        !longHaul && planDays < recommendedDays
          ? '景點偏多：可加天或刪減景點（城市遊不必拉到 20 天）'
          : !longHaul && /21|20\s*天/.test(aiReview.title || '')
            ? durationFit.title
            : aiReview.title || durationFit.title,
      message,
    }
  }, [aiReview, durationFit, selectedDestinations, primary?.nameZh, planDays])

  const styleLabel = hotelStyles.find((s) => s.id === hotelStyle)?.label ?? ''
  const paceLabel = tripPaces.find((p) => p.id === pace)?.label ?? ''
  const companionLabel = companions.find((c) => c.id === companion)?.label ?? ''
  const travelers = clampPartySize(partySize)
  const hotelAdvice = useMemo(() => hotelBookingAdvice(travelers), [travelers])
  const trafficAdvice = useMemo(
    () =>
      trafficArrangementAdvice(travelers, {
        transportMode,
        privateDriver: transportMode === 'private_driver',
      }),
    [travelers, transportMode],
  )

  const liveBudget = useMemo(() => {
    if (!primary) return null
    return estimateTripBudget({
      destinationName: selectedDestinations.map((d) => d.nameZh).join('、') || primary.nameZh,
      days: planDays,
      nights: nightsFromDays(planDays),
      partySize: travelers,
      rooms: hotelAdvice.rooms,
      transportMode,
      hotelStyle,
    })
  }, [
    primary,
    selectedDestinations,
    planDays,
    travelers,
    hotelAdvice.rooms,
    transportMode,
    hotelStyle,
  ])

  /** Prefer live estimate so hotel/travel/total always match current choices; keep handbook budget as reference. */
  const budgetSummary = liveBudget
  const handbookBudget = primary?.budgetSummary

  function chooseTransportMode(next: TransportMode) {
    setTransportMode(next)
    setSpecialNeeds((prev) => {
      const withoutDriver = prev.filter((need) => need !== '包司機舒服版')
      return next === 'private_driver' ? [...withoutDriver, '包司機舒服版'] : withoutDriver
    })
  }

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

    // Refresh month suitability (especially for custom destinations).
    void Promise.all(
      selectedDestinations.map(async (dest) => {
        try {
          const result = await seasonGuideWithAi({ destinationName: dest.nameZh })
          const guide = seasonGuideFromAi(result)
          return guide ? { id: dest.id, guide } : null
        } catch {
          return null
        }
      }),
    ).then((updates) => {
      if (cancelled) return
      const valid = updates.filter(
        (item): item is { id: DestinationId; guide: SeasonGuide } => Boolean(item),
      )
      if (!valid.length) return
      setCustomDestinations((prev) => {
        const byId = new Map(prev.map((d) => [d.id, d]))
        for (const { id, guide } of valid) {
          const existing = byId.get(id)
          const base =
            existing ?? selectedDestinations.find((d) => d.id === id) ?? null
          if (!base) continue
          byId.set(id, {
            ...base,
            seasonGuide: guide,
            bestSeason: `最適合 ${formatMonthsZh(guide.bestMonths)}；最不建議 ${formatMonthsZh(guide.worstMonths)}`,
          })
        }
        const ordered = [
          ...valid.map((u) => u.id),
          ...prev.map((d) => d.id),
        ]
        return [...new Set(ordered)]
          .map((id) => byId.get(id))
          .filter((d): d is Destination => Boolean(d))
      })
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

  const rawItinerary = useMemo(() => {
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
      transportMode,
    })
  }, [
    selectedDestinations,
    selectedSpotIds,
    planDays,
    pace,
    companion,
    specialNeeds,
    hotelAreaHint,
    transportMode,
    planVersion,
  ])

  const stayNights = Math.min(hotelNights, nightsFromDays(planDays))

  const hotelStayPlan = useMemo(
    () =>
      buildHotelStayPlan({
        itinerary: rawItinerary,
        hotels,
        totalNights: stayNights,
        preferConsecutive: preferConsecutiveStays,
        preferredHotelName: preferredHotelName || undefined,
      }),
    [
      rawItinerary,
      hotels,
      stayNights,
      preferConsecutiveStays,
      preferredHotelName,
    ],
  )

  const itinerary = useMemo(
    () => applyHotelStayPlan(rawItinerary, hotelStayPlan),
    [rawItinerary, hotelStayPlan],
  )

  const hollowDayCount = useMemo(
    () => itinerary.filter((day) => !day.spotIds.length).length,
    [itinerary],
  )
  const daysTrimmed = itinerary.length > 0 && itinerary.length < planDays

  const datedItinerary = useMemo(() => {
    return itinerary.map((day, index) => {
      const date = new Date(`${startDate}T12:00:00`)
      if (!Number.isNaN(date.getTime())) date.setDate(date.getDate() + index)
      const dateLabel = Number.isNaN(date.getTime())
        ? `第 ${index + 1} 日`
        : `${date.getMonth() + 1} 月 ${date.getDate()} 日`
      return {
        ...day,
        dateLabel,
        weather: dayWeather[index] ?? day.weather,
      }
    })
  }, [itinerary, startDate, dayWeather])

  useEffect(() => {
    if (step !== 'result' || !datedItinerary.length || !startDate) return
    let cancelled = false
    setWeatherLoading(true)
    void loadDayWeather({
      startDate,
      places: datedItinerary.map(
        (day) => day.stayCity || day.stayArea || primary?.nameZh || '',
      ),
    })
      .then((rows) => {
        if (!cancelled) setDayWeather(rows)
      })
      .finally(() => {
        if (!cancelled) setWeatherLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [
    step,
    startDate,
    itinerary.map((d) => d.stayCity || d.stayArea).join('|'),
    primary?.nameZh,
  ])

  function setTripDays(next: number) {
    const clamped = clampDays(next)
    setDays(clamped)
    setDaysInput(String(clamped))
    setHotelNights(nightsFromDays(clamped))
    if (startDate) setEndDate(endDateFromStart(startDate, clamped))
  }

  function setJourneyStart(nextStart: string) {
    setStartDate(nextStart)
    if (nextStart) setEndDate(endDateFromStart(nextStart, planDays))
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
    // If user edits return date, duration follows the inclusive span.
    const span = daysBetween(nextStart, nextEnd)
    setStartDate(nextStart)
    if (span) {
      setTripDays(span)
    } else {
      setEndDate(endDateFromStart(nextStart, planDays))
    }
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
      const initial = defaultSelectedSpotIds(flat, nextSpots[0])
      setSelectedSpotIds(
        ensureSpotsForDays({
          selectedSpotIds: initial,
          allSpots: flat,
          days: planDays,
          pace,
          companion,
          specialNeeds,
        }),
      )
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
    const initial = defaultSelectedSpotIds(spots, dests[0])
    setSelectedSpotIds(
      ensureSpotsForDays({
        selectedSpotIds: initial,
        allSpots: spots,
        days: planDays,
        pace,
        companion,
        specialNeeds,
      }),
    )
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
    const pool = selectedDestinations.flatMap((d) => d.spots)
    const toppedUp = ensureSpotsForDays({
      selectedSpotIds,
      allSpots: pool,
      days: planDays,
      pace,
      companion,
      specialNeeds,
    })
    if (toppedUp.length !== selectedSpotIds.length) {
      setSelectedSpotIds(toppedUp)
    }
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
    setTransportMode('public_transit')
    setPreferConsecutiveStays(true)
    setPreferredHotelName('')
    setDayWeather([])
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
                    <span className="dest-meta">
                      最佳 {formatMonthsZh(getSeasonGuide(dest).bestMonths)} · 避開{' '}
                      {formatMonthsZh(getSeasonGuide(dest).worstMonths)}
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

            <JourneyWindow
              startDate={startDate}
              endDate={computedEndDate}
              days={planDays}
              nights={nightsFromDays(planDays)}
            />

            <div className="preference-grid">
              <div className="field-block">
                <label htmlFor="start">出發／開始日期</label>
                <input
                  id="start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setJourneyStart(e.target.value)}
                />
              </div>
              <div className="field-block">
                <label htmlFor="end">結束／返回日期（由天數自動計算）</label>
                <input
                  id="end"
                  type="date"
                  value={computedEndDate}
                  onChange={(e) => applyDateRange(startDate, e.target.value)}
                />
                <p className="range-value">
                  行程 {planDays} 天 {nightsFromDays(planDays)} 夜
                  {dateDays ? `・含首尾共 ${dateDays} 個日曆日` : ''}
                </p>
              </div>
            </div>

            <p className="weather-preview strong">{weather}</p>

            {seasonGuide ? (
              <SeasonGuidePanel
                guide={seasonGuide}
                travelMonth={weatherMonth}
                monthFit={monthFit}
              />
            ) : null}

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

            <h3 className="subhead">交通方式</h3>
            <p className="muted-line">
              包司機最輕鬆；自駕最自由；大眾運輸則會標示每日怎麼去、路線感覺如何。
            </p>
            <div className="style-grid transport-grid">
              {transportModes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`style-card ${transportMode === item.id ? 'selected' : ''}`}
                  onClick={() => chooseTransportMode(item.id)}
                >
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                  <em className="transport-ease">{item.easeNote}</em>
                </button>
              ))}
            </div>

            <aside className="ai-panel ready party-logistics">
              <strong>
                依 {travelers} 人 · {transportModeLabel(transportMode)} 的交通／訂房
              </strong>
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
                      if (need === '包司機舒服版') {
                        chooseTransportMode(active ? 'public_transit' : 'private_driver')
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
                人同行。可選風格與主酒店；系統會在可行時安排連住，避免頻繁換宿。
              </p>
            </div>

            <JourneyWindow
              startDate={startDate}
              endDate={computedEndDate}
              days={planDays}
              nights={nightsFromDays(planDays)}
            />

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
                max={Math.max(1, nightsFromDays(planDays))}
                value={stayNights}
                onChange={(e) => setHotelNights(Number(e.target.value))}
              />
              <p className="range-value">
                {stayNights} 晚
                <span>
                  （{planDays} 天通常住 {nightsFromDays(planDays)} 晚）
                </span>
              </p>
            </div>

            <h3 className="subhead">換宿策略</h3>
            <div className="day-options">
              <button
                type="button"
                className={`chip ${preferConsecutiveStays ? 'selected' : ''}`}
                onClick={() => setPreferConsecutiveStays(true)}
              >
                盡量連住、少換宿
              </button>
              <button
                type="button"
                className={`chip ${!preferConsecutiveStays ? 'selected' : ''}`}
                onClick={() => setPreferConsecutiveStays(false)}
              >
                依每日區域彈性換宿
              </button>
            </div>
            <p className="muted-line">
              {preferConsecutiveStays
                ? '同都會圈的日遊（如大阪＋奈良＋神戶）會盡量住同一間，能日歸就不換酒店。'
                : '較貼近每日景點區域，換宿可能較多。'}
            </p>

            <h3 className="subhead">住宿風格</h3>
            <div className="style-grid">
              {hotelStyles.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  className={`style-card ${hotelStyle === style.id ? 'selected' : ''}`}
                  onClick={() => {
                    setHotelStyle(style.id)
                    setPreferredHotelName('')
                  }}
                >
                  <strong>{style.label}</strong>
                  <span>{style.description}</span>
                </button>
              ))}
            </div>

            <h3 className="subhead">選擇主酒店（可選）</h3>
            <p className="muted-line">
              點選後會優先用這間做連住基地；長線多基地行程仍可能分段住宿。
            </p>
            <div className="hotel-pick-grid">
              {hotels.map((hotel) => {
                const active = preferredHotelName === hotel.name
                return (
                  <button
                    key={hotel.name}
                    type="button"
                    className={`hotel-pick ${active ? 'selected' : ''}`}
                    onClick={() =>
                      setPreferredHotelName((prev) =>
                        prev === hotel.name ? '' : hotel.name,
                      )
                    }
                  >
                    <strong>{hotel.name}</strong>
                    <span>
                      {hotel.area} · {hotel.pricePerNight}
                    </span>
                    <em>{hotel.highlight}</em>
                    <small>{hotel.nightsHint}</small>
                  </button>
                )
              })}
            </div>

            <aside className={`ai-panel ${hotelStayPlan.changes === 0 ? 'ready' : ''}`}>
              <strong>
                {preferConsecutiveStays
                  ? hotelStayPlan.changes === 0
                    ? '連住方案：全程同一酒店'
                    : `連住方案：${hotelStayPlan.blocks.length} 段・換宿 ${hotelStayPlan.changes} 次`
                  : '彈性換宿方案'}
              </strong>
              <p>{hotelStayPlan.summary}</p>
              <ul className="tips-list">
                {hotelStayPlan.blocks.map((block) => (
                  <li key={`${block.hotelName}-${block.fromNight}`}>
                    {block.nights >= 2
                      ? `第 ${block.fromNight}–${block.toNight} 晚連住 ${block.hotelName}（${block.nights} 晚・${block.area}）`
                      : `第 ${block.fromNight} 晚住 ${block.hotelName}（${block.area}）`}
                  </li>
                ))}
              </ul>
            </aside>

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

            <JourneyWindow
              startDate={startDate}
              endDate={computedEndDate}
              days={planDays}
              nights={nightsFromDays(planDays)}
            />

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
                placeholder={spotInputExamples(
                  primary?.nameZh ||
                    selectedDestinations.map((d) => d.nameZh).join('、') ||
                    '',
                )}
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
                {selectedDestinations.map((d) => d.nameLocal).join(' + ')} ·{' '}
                {itinerary.length || planDays} 天實際行程 · {travelers} 人 ·{' '}
                {transportModeLabel(transportMode)} · {paceLabel} · {companionLabel}
              </p>
              <h2>{selectedDestinations.map((d) => d.nameZh).join('、')}</h2>
              <p className="result-tagline">
                出發 {formatDateZh(startDate)} → 結束 {formatDateZh(computedEndDate)} · 共{' '}
                {planDays} 天 {nightsFromDays(planDays)} 夜 · 已排入{' '}
                {itinerary.reduce((n, d) => n + d.spotIds.length, 0)} 個真實景點 ·{' '}
                {styleLabel} · 約 {hotelAdvice.rooms} 間房
              </p>
              <div className="cta-row" style={{ marginTop: '0.85rem' }}>
                <a className="btn ghost" href="#trip-budget">
                  查看預算明細
                </a>
                <a className="btn primary" href="#stage-4-poster">
                  查看階段四 · 旅程海報（相片／插畫）
                </a>
              </div>
            </div>

            <JourneyWindow
              startDate={startDate}
              endDate={computedEndDate}
              days={planDays}
              nights={nightsFromDays(planDays)}
            />

            {(daysTrimmed || hollowDayCount > 0) && (
              <aside className="ai-panel ready">
                <strong>
                  {daysTrimmed
                    ? `已依真實景點排成 ${itinerary.length} 天（你選了 ${planDays} 天）`
                    : `行程含 ${hollowDayCount} 個休息日`}
                </strong>
                <p>
                  {daysTrimmed
                    ? '多出來的天數會變成沒有目的地的空白日，所以系統已自動收斂天數，並優先填入真實景點。'
                    : '休息日用於恢復體力；若你希望每天都有景點，請回景點步驟多勾選，或縮短天數。'}
                </p>
                {daysTrimmed ? (
                  <button
                    type="button"
                    className="btn ghost"
                    onClick={() => {
                      setTripDays(itinerary.length)
                      setPlanVersion((v) => v + 1)
                    }}
                  >
                    同步天數為 {itinerary.length} 天
                  </button>
                ) : null}
              </aside>
            )}

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
                  <strong>出發：</strong>
                  {formatDateZh(startDate)}
                </p>
                <p>
                  <strong>結束：</strong>
                  {formatDateZh(computedEndDate)}
                </p>
                <p>
                  <strong>行程長度：</strong>
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
                  <strong>出發月天氣：</strong>
                  {weather}
                </p>
                <p className="muted">
                  {specialNeeds.length ? specialNeeds.join('、') : '無特別需求'}
                </p>
              </article>

              {seasonGuide ? (
                <article className="info-block wide">
                  <SeasonGuidePanel
                    guide={seasonGuide}
                    travelMonth={weatherMonth}
                    monthFit={monthFit}
                  />
                </article>
              ) : null}

              <article className="info-block wide">
                <h3>交通與訂房（依 {travelers} 人 · {transportModeLabel(transportMode)}）</h3>
                <p>
                  <strong>交通模式：</strong>
                  {transportModeLabel(transportMode)} — {trafficAdvice.mode}（
                  {trafficAdvice.vehicle}）。{trafficAdvice.note}
                </p>
                <p>
                  <strong>每日怎麼去：</strong>
                  {transportMode === 'public_transit'
                    ? '下方每日行程會標示轉乘路線、大約時間與交通卡建議。'
                    : transportMode === 'self_drive'
                      ? '下方每日行程會標示自駕路段、車程感與停車提醒。'
                      : '包司機模式下以接送為主，較少轉乘細節，重點是會合與當日順序。'}
                </p>
                <p>
                  <strong>酒店房間：</strong>
                  {hotelAdvice.note}
                </p>
                <p className="muted">床型建議：{hotelAdvice.bedding}</p>
              </article>

              <article className="info-block wide">
                <h3>連住住宿安排 · {styleLabel}</h3>
                <p>{hotelStayPlan.summary}</p>
                <p className="muted">
                  {travelers} 人先估每段 {hotelAdvice.rooms} 間房
                  {preferConsecutiveStays
                    ? '；已優先安排連續晚數住同一酒店。'
                    : '；目前為彈性換宿。'}
                </p>
                <ul className="tips-list stay-plan-list">
                  {hotelStayPlan.blocks.map((block) => (
                    <li key={`${block.hotelName}-${block.fromNight}`}>
                      <strong>
                        {block.nights >= 2
                          ? `第 ${block.fromNight}–${block.toNight} 晚連住`
                          : `第 ${block.fromNight} 晚`}
                      </strong>
                      {` ${block.hotelName} · ${block.area}（${block.nights} 晚）`}
                    </li>
                  ))}
                </ul>
                <div className="hotel-list">
                  {hotels.map((hotel) => (
                    <div
                      key={hotel.name}
                      className={`hotel-item ${
                        hotelStayPlan.blocks.some((b) => b.hotelName === hotel.name)
                          ? 'in-plan'
                          : ''
                      }`}
                    >
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

              {budgetSummary ? (
                <article className="info-block wide budget-block" id="trip-budget">
                  <h3>行程預算（酒店／交通／餐飲／總額）</h3>
                  <p className="season-note">{budgetSummary.totalRange}</p>
                  <p>
                    <strong>{budgetSummary.perPerson}</strong>
                  </p>
                  {budgetSummary.currencyNote ? (
                    <p className="muted">{budgetSummary.currencyNote}</p>
                  ) : null}
                  <div className="budget-list">
                    {budgetSummary.lines.map((line) => (
                      <div key={line.item} className="budget-item">
                        <strong>{line.item}</strong>
                        <span>{line.detail}</span>
                        <em>
                          {line.amount}
                          {line.perPerson ? `｜人均 ${line.perPerson}` : ''}
                        </em>
                      </div>
                    ))}
                  </div>
                  {budgetSummary.optimizeTips?.length ? (
                    <ul className="tips-list">
                      {budgetSummary.optimizeTips.map((tip) => (
                        <li key={tip}>{tip}</li>
                      ))}
                    </ul>
                  ) : null}
                  {handbookBudget ? (
                    <div className="handbook-budget-ref">
                      <strong>規劃書參考預算（{handbookBudget.title}）</strong>
                      <p>
                        {handbookBudget.totalRange} · {handbookBudget.perPerson}
                      </p>
                    </div>
                  ) : null}
                </article>
              ) : null}

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

            {tripHandbook ? (
              <TripHandbookPanel
                handbook={tripHandbook}
                destinationName={primary?.nameZh || ''}
              />
            ) : null}

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
                <h3>每日行程總表</h3>
                <p>
                  仿照完整規劃書格式：每日列出住宿地、主要安排、節奏／車程、住宿方向，並附天氣與降雨機率
                  {weatherLoading ? '（天氣載入中…）' : ''}。
                  {dayWeather.some((w) => w?.source === 'climate')
                    ? ' 出發日較遠時，天氣顯示往年同期參考。'
                    : ''}
                </p>
              </div>

              <div className="plan-table-wrap">
                <table className="plan-table">
                  <thead>
                    <tr>
                      <th>日次</th>
                      <th>日期</th>
                      <th>住宿地</th>
                      <th>主要安排</th>
                      <th>節奏／車程</th>
                      <th>住宿方向</th>
                      <th>天氣／降雨</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datedItinerary.map((day, index) => (
                      <tr key={`row-${index}-${planVersion}`}>
                        <td>第 {index + 1} 日</td>
                        <td>{day.dateLabel}</td>
                        <td>{day.stayCity || day.stayArea}</td>
                        <td>{day.mainPlan || day.theme}</td>
                        <td>{day.paceNote || day.tip}</td>
                        <td>{day.hotelDirection || day.stayArea}</td>
                        <td>{formatWeatherLine(day.weather)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="section-head" style={{ marginTop: '1.4rem' }}>
                <h3>每日詳細時段</h3>
                <p>
                  {primary.curatedPlans?.[planDays]
                    ? `這是 ${primary.nameZh} 的 ${planDays} 日完整舒服版行程；取消勾選景點後可精簡對應日。`
                    : `目前實際排出 ${itinerary.length} 天，其中 ${itinerary.length - hollowDayCount} 天有真實景點。`}
                </p>
              </div>
              <div className="day-list">
                {datedItinerary.map((day, index) => (
                  <article
                    key={`${day.theme}-${index}-${planVersion}`}
                    className="day-card"
                    style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
                  >
                    <header>
                      <span className="day-badge">Day {index + 1}</span>
                      <h4>
                        {day.dateLabel} · {day.theme}
                      </h4>
                      <p>
                        住宿地：{day.stayCity || day.stayArea} ｜{' '}
                        {day.hotelDirection || day.stayArea}
                      </p>
                      <p className="day-weather-line">
                        {formatWeatherLine(day.weather)}
                      </p>
                    </header>
                    <p className="day-meta-line">
                      <strong>主要安排：</strong>
                      {day.mainPlan || day.theme}
                    </p>
                    <p className="day-meta-line">
                      <strong>節奏／車程：</strong>
                      {day.paceNote || day.tip}
                    </p>
                    {day.transportSummary ? (
                      <p className="day-meta-line">
                        <strong>當日交通：</strong>
                        {day.transportSummary}
                      </p>
                    ) : null}
                    {day.routeLegs && day.routeLegs.length > 0 ? (
                      <div className="route-legs">
                        <strong>怎麼去／路線感覺</strong>
                        <ul>
                          {day.routeLegs.map((leg) => (
                            <li key={`${leg.from}-${leg.to}-${leg.modeLabel}`}>
                              <em>{leg.modeLabel}</em>
                              <span>
                                {leg.from} → {leg.to}
                              </span>
                              <p>
                                {leg.summary}（{leg.durationHint}
                                {leg.costHint ? ` · ${leg.costHint}` : ''}）
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
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

            <JourneyMap
              destinationName={selectedDestinations.map((d) => d.nameZh).join('、')}
              startLabel={formatDateZh(startDate)}
              endLabel={formatDateZh(computedEndDate)}
              days={itinerary.length || planDays}
              nights={nightsFromDays(itinerary.length || planDays)}
              transportMode={transportMode}
              itinerary={datedItinerary}
              visualPoster={tripHandbook?.visualPoster}
              photoSrcs={
                tripHandbook?.photos?.map((p) => p.src) ||
                selectedDestinations.flatMap((d) =>
                  (d.handbook?.photos || []).map((p) => p.src),
                )
              }
            />

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

function JourneyWindow({
  startDate,
  endDate,
  days,
  nights,
}: {
  startDate: string
  endDate: string
  days: number
  nights: number
}) {
  return (
    <aside className="journey-window">
      <strong>行程日期總覽</strong>
      <div className="journey-window-grid">
        <div>
          <span>開始日期</span>
          <em>{formatDateZh(startDate)}</em>
        </div>
        <div>
          <span>行程天數</span>
          <em>
            {days} 天 {nights} 夜
          </em>
        </div>
        <div>
          <span>結束日期</span>
          <em>{formatDateZh(endDate)}</em>
        </div>
      </div>
      <p>
        {formatDateZh(startDate)} 出發，行程 {days} 天，於 {formatDateZh(endDate)} 結束。
      </p>
    </aside>
  )
}

function SeasonGuidePanel({
  guide,
  travelMonth,
  monthFit,
}: {
  guide: SeasonGuide
  travelMonth: number
  monthFit: 'best' | 'fair' | 'worst'
}) {
  return (
    <aside className={`season-guide-panel ${monthFit}`}>
      <strong>最適合／最不建議月份</strong>
      <p className="muted-line">{guide.note}</p>
      <div className="season-guide-grid">
        <div className="season-guide-card best">
          <span>最適合</span>
          <strong>{formatMonthsZh(guide.bestMonths)}</strong>
          <p>{guide.bestReason}</p>
        </div>
        <div className="season-guide-card worst">
          <span>最不建議</span>
          <strong>{formatMonthsZh(guide.worstMonths)}</strong>
          <p>{guide.worstReason}</p>
        </div>
      </div>
      <p className={`month-fit-line ${monthFit}`}>
        你目前出發月是 {travelMonth} 月：
        {monthFit === 'best'
          ? '落在較佳月份。'
          : monthFit === 'worst'
            ? '落在較不建議月份，建議改期或調整行程節奏。'
            : '不算最佳也未必最差，請留意當月天氣與人潮。'}
      </p>
    </aside>
  )
}

/** Strip AI prose that still claims absurd multi-week city trips after we capped the numbers. */
function sanitizeCityDayMessage(
  raw: string,
  days: {
    chosenDays: number
    minDays: number
    recommendedDays: number
    comfortableDays: number
  },
): string {
  if (!raw.trim()) return ''
  const claimsLongExpedition = /1[2-9]\s*天|2[0-9]\s*天|兩週|三週|二十/.test(raw)
  if (!claimsLongExpedition) {
    return raw
      .replace(/理想安排[為是]?\s*\d+\s*天/g, `理想安排為 ${days.recommendedDays} 天`)
      .replace(/最少[約]?\s*\d+\s*天/g, `最少約 ${days.minDays} 天`)
  }
  return `城市深度遊不必拉成遠征：以目前景點量，正常完成約 ${days.recommendedDays} 天（最少 ${days.minDays}、舒服 ${days.comfortableDays}）。你現在選 ${days.chosenDays} 天時，優先刪遠程／重複景點，或小幅加到 ${days.recommendedDays} 天即可——不必拉到 20 天以上。`
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
