export type HotelStyle = 'value' | 'luxury' | 'luxuryValue' | 'standard' | 'clean'
export type TripPace = 'relaxed' | 'balanced' | 'packed'
export type Companion = 'solo' | 'couple' | 'family' | 'friends'
export type SpotTag = 'must' | 'photo' | 'popular' | 'culture' | 'nature' | 'food' | 'shopping'

/** Built-in ids plus runtime custom ids like `custom-paris-…`. */
export type DestinationId = string

export interface ScenicSpot {
  id: string
  name: string
  nameLocal: string
  area: string
  stayHours: number
  summary: string
  tags: SpotTag[]
  ticket?: string
  bestFor: Companion[]
}

export interface HotelOption {
  name: string
  area: string
  nightsHint: string
  pricePerNight: string
  highlight: string
  styles: HotelStyle[]
}

export interface ScheduleItem {
  time: string
  title: string
  detail: string
  spotId?: string
}

export interface DayPlan {
  theme: string
  stayArea: string
  schedule: ScheduleItem[]
  budget: string
  tip: string
  spotIds: string[]
}

export interface BudgetSummary {
  title: string
  totalRange: string
  perPerson: string
  lines: { item: string; detail: string; amount: string }[]
}

export interface Destination {
  id: DestinationId
  nameZh: string
  nameLocal: string
  tagline: string
  intro: string
  bestSeason: string
  recommendedDays: {
    min: number
    comfortable: number
    suggestedLongest: number
    note: string
  }
  weather: {
    spring: string
    summer: string
    autumn: string
    winter: string
  }
  hotels: HotelOption[]
  spots: ScenicSpot[]
  flexDayIdeas: string[]
  curatedPlans?: Record<number, DayPlan[]>
  budgetSummary?: BudgetSummary
  tips?: string[]
}
