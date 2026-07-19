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

/** One consecutive booking block at the same hotel. */
export interface HotelStayBlock {
  hotelName: string
  area: string
  base: string
  /** 1-based night index in the trip (night after Day N). */
  fromNight: number
  toNight: number
  nights: number
  /** Day numbers (1-based) that sleep at this hotel. */
  dayNumbers: number[]
  reason: string
}

export interface HotelStayPlan {
  preferConsecutive: boolean
  totalNights: number
  changes: number
  blocks: HotelStayBlock[]
  summary: string
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

/** Best / worst travel months for a destination (1–12). */
export interface SeasonGuide {
  bestMonths: number[]
  worstMonths: number[]
  bestReason: string
  worstReason: string
  /** Short overall note; never imply “any month is equally fine”. */
  note: string
}

export interface Destination {
  id: DestinationId
  nameZh: string
  nameLocal: string
  tagline: string
  intro: string
  bestSeason: string
  /** Structured month advice; prefer this over free-text bestSeason in UI. */
  seasonGuide?: SeasonGuide
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
