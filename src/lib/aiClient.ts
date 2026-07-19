export type AiDayRecommendation = {
  source: 'crazyrouter'
  minDays: number
  comfortableDays: number
  suggestedLongestDays: number
  reason: string
  warnings: string[]
}

export type AiPlanReview = {
  source: 'crazyrouter'
  status: 'too_packed' | 'too_light' | 'balanced'
  recommendedDays: number
  minDays: number
  comfortableDays: number
  title: string
  message: string
  adjustments: string[]
}

export type AiSuggestedSpot = {
  name: string
  nameLocal: string
  area: string
  stayHours: number
  summary: string
  nearbyFood?: string
  souvenirs?: string
  tags: string[]
  ticket: string
}

export type AiSuggestedHotel = {
  name: string
  area: string
  nightsHint: string
  pricePerNight: string
  highlight: string
  styles: string[]
}

export type AiPosterDish = {
  name: string
  daysLabel?: string
  motif?: string
}

export type AiPosterDrink = {
  name: string
  motif?: string
}

export type AiSpotSuggestion = {
  source: 'crazyrouter'
  intro: string
  tagline?: string
  background?: string
  memorable?: string[]
  tips?: string[]
  flexDayIdeas?: string[]
  recommendedDays?: {
    min: number
    comfortable: number
    suggestedLongest: number
    note: string
  }
  seasonGuide?: {
    bestMonths: number[]
    worstMonths: number[]
    bestReason: string
    worstReason: string
    note: string
  }
  weather?: {
    spring: string
    summer: string
    autumn: string
    winter: string
  }
  mustEat?: AiPosterDish[]
  mustDrink?: AiPosterDrink[]
  mustBuy?: AiPosterDish[]
  hotels?: AiSuggestedHotel[]
  spots: AiSuggestedSpot[]
}

export type AiSeasonGuide = {
  source: 'crazyrouter'
  bestMonths: number[]
  worstMonths: number[]
  bestReason: string
  worstReason: string
  note: string
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(data.error || `AI request failed (${response.status})`)
  }
  return data
}

export function recommendDaysWithAi(input: {
  destinationName: string
  pace: string
  companions: string
  partySize: number
  specialNeeds: string[]
  heuristic?: {
    minDays: number
    comfortableDays: number
    suggestedLongestDays: number
  }
}): Promise<AiDayRecommendation> {
  return postJson('/api/ai/recommend-days', input)
}

export function reviewPlanWithAi(input: {
  destinationName: string
  chosenDays: number
  pace: string
  companions: string
  partySize: number
  specialNeeds: string[]
  spots: { name: string; stayHours: number; area: string }[]
  heuristic?: {
    status: string
    recommendedDays: number
    minDays: number
    comfortableDays: number
  }
}): Promise<AiPlanReview> {
  return postJson('/api/ai/review-plan', input)
}

export function suggestSpotsWithAi(input: {
  destinationName: string
  pace: string
  companions: string
  partySize: number
  specialNeeds: string[]
  days?: number
}): Promise<AiSpotSuggestion> {
  return postJson('/api/ai/suggest-spots', input)
}

export function seasonGuideWithAi(input: {
  destinationName: string
}): Promise<AiSeasonGuide> {
  return postJson('/api/ai/season-guide', input)
}
