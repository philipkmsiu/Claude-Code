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
  tags: string[]
  ticket: string
}

export type AiSpotSuggestion = {
  source: 'crazyrouter'
  intro: string
  spots: AiSuggestedSpot[]
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
  specialNeeds: string[]
  days?: number
}): Promise<AiSpotSuggestion> {
  return postJson('/api/ai/suggest-spots', input)
}
