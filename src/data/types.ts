export type HotelStyle = 'value' | 'luxury' | 'luxuryValue' | 'standard' | 'clean'
export type TripPace = 'relaxed' | 'balanced' | 'packed'
export type Companion = 'solo' | 'couple' | 'family' | 'friends'
export type SpotTag = 'must' | 'photo' | 'popular' | 'culture' | 'nature' | 'food' | 'shopping'
/** How the traveler moves between places each day. */
export type TransportMode = 'private_driver' | 'self_drive' | 'public_transit'

export interface DayRouteLeg {
  from: string
  to: string
  /** Short label e.g. 地鐵轉乘 / 包車直達 / 自駕 */
  modeLabel: string
  /** How to get there / what the route is like */
  summary: string
  durationHint: string
  costHint?: string
}

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
  /** True only when geography allows one hotel for (almost) the whole trip. */
  singleBasePossible: boolean
  /** Distinct overnight bases after consecutive-stay stabilization. */
  distinctBases: string[]
}

export interface ScheduleItem {
  time: string
  title: string
  detail: string
  spotId?: string
}

export interface DayWeather {
  date: string
  label: string
  tempMin: number
  tempMax: number
  /** 0–100 */
  rainChance: number
  rainMm: number
  source: 'forecast' | 'climate'
}

export interface DayPlan {
  theme: string
  stayArea: string
  /** City / base for overnight stay (表：住宿地). */
  stayCity?: string
  /** One-line main arrangement (表：主要安排). */
  mainPlan?: string
  /** Pace / drive note (表：節奏／車程). */
  paceNote?: string
  /** Hotel direction (表：住宿方向). */
  hotelDirection?: string
  /** Day-level transport guidance for the chosen mode. */
  transportSummary?: string
  /** Segment-by-segment how to get between stay / spots. */
  routeLegs?: DayRouteLeg[]
  schedule: ScheduleItem[]
  budget: string
  tip: string
  spotIds: string[]
  weather?: DayWeather
}

export interface BudgetLine {
  item: string
  detail: string
  amount: string
  /** Optional per-person amount for the same line. */
  perPerson?: string
}

export interface BudgetSummary {
  title: string
  totalRange: string
  perPerson: string
  /** e.g. 不含香港來回機票／以人民幣估算 */
  currencyNote?: string
  lines: BudgetLine[]
  optimizeTips?: string[]
}

/** Hotel suggestion row for handbook-style plans. */
export interface HotelGuideRow {
  place: string
  nights: string
  name: string
  pricePerNight: string
  highlight: string
  /** Ask planner for room/bathroom/heater videos before booking. */
  needsMedia?: boolean
}

export interface DestinationPhoto {
  title: string
  caption: string
  src: string
}

/**
 * Planning-book extras (青甘 Excel / 新疆慢遊 doc style):
 * summary, hotel guide, off-mainline, checklist, planner asks, Taobao terms, photos.
 */
export interface TripHandbook {
  /** 行程摘要 bullets */
  summary: string[]
  hotelGuide?: HotelGuideRow[]
  hotelBudgetNotes?: string[]
  /** 需要 planner 提供照片及影片的住宿站 */
  photoStops?: string[]
  /** 包車與 planner 要求 */
  charterRequirements?: string[]
  /** 淘寶 App 建議搜尋字眼 */
  taobaoSearchTerms?: string[]
  /** 向 planner 詢價時要比較的項目 */
  quoteCompareItems?: string[]
  /** 可直接發給淘寶 planner 的詢價文字 */
  inquiryDraft?: string
  /** 暫不列入主線的地方 */
  offMainline?: { name: string; reason: string }[]
  /** 下訂前最後核對清單 */
  bookingChecklist?: string[]
  /** 備註 */
  remarks?: string[]
  /** 目的地／景點參考相片 */
  photos?: DestinationPhoto[]
  /** Stage-4 illustrated journey poster (food / drink / tips sidebands). */
  visualPoster?: VisualPosterContent
}

/** Content for the parchment-style journey summary picture. */
export interface VisualPosterContent {
  /** Short theme line under the title */
  themeLine?: string
  mustEat: { name: string; daysLabel: string; motif?: string }[]
  mustDrink: { name: string; motif?: string }[]
  travelTips: string[]
  footerNote?: string
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
  /** Rich handbook sections for long private-driver trips. */
  handbook?: TripHandbook
}
