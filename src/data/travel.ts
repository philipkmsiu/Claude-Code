export type {
  BudgetSummary,
  Companion,
  DayPlan,
  Destination,
  DestinationId,
  HotelOption,
  HotelStayBlock,
  HotelStayPlan,
  HotelStyle,
  ScheduleItem,
  ScenicSpot,
  SpotTag,
  TripPace,
} from './types'

import type {
  Companion,
  DayPlan,
  Destination,
  HotelOption,
  HotelStayPlan,
  HotelStyle,
  ScheduleItem,
  ScenicSpot,
  SpotTag,
  TripPace,
} from './types'
import { qingganDestination } from './qinggan'

/** Hard ceiling for manual day input — long trips are allowed. */
export const MAX_TRIP_DAYS = 21
export const MIN_TRIP_DAYS = 2

function slugifyDestination(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      // Keep CJK (incl. extensions) + latin + digits for custom ids.
      .replace(/[^\w\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff-]+/gi, '')
      .slice(0, 40) || 'place'
  )
}

/** Split free text into one or more destination names (typing / voice / paste). */
export function parseDestinationNames(raw: string): string[] {
  return raw
    .replace(/\r/g, '\n')
    .split(/[,，、/;；|｜\t\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function findKnownDestination(name: string): Destination | undefined {
  const key = name.trim().toLowerCase()
  if (!key) return undefined
  return destinations.find((d) => {
    const candidates = [d.id, d.nameZh, d.nameLocal, d.tagline]
    return candidates.some((c) => c.toLowerCase().includes(key) || key.includes(c.toLowerCase()))
  })
}

type SpotSeed = {
  name: string
  tags: SpotTag[]
  hours: number
  area: string
  summary: string
}

function spotsFromSeeds(place: string, seeds: SpotSeed[]): ScenicSpot[] {
  return seeds.map((item, index) => ({
    id: `custom-spot-${slugifyDestination(place)}-${index + 1}`,
    name: item.name,
    nameLocal: place,
    area: item.area,
    stayHours: item.hours,
    summary: item.summary,
    tags: item.tags,
    ticket: '視當地而定',
    bestFor: ['solo', 'couple', 'family', 'friends'] as Companion[],
  }))
}

function cityTemplateSeeds(place: string): SpotSeed[] {
  return [
    { name: `${place}經典地標`, tags: ['must', 'photo', 'popular'], hours: 2.5, area: '市中心', summary: '最代表性的必去地標，建議留拍照時間。' },
    { name: `${place}老城／歷史區`, tags: ['must', 'culture', 'photo'], hours: 3, area: '老城', summary: '歷史街区漫遊，感受在地氛圍。' },
    { name: `${place}觀景／打卡點`, tags: ['photo', 'popular'], hours: 2, area: '觀景', summary: '熱門打卡紅點，日出或日落更佳。' },
    { name: `${place}在地美食區`, tags: ['food', 'popular'], hours: 2, area: '美食', summary: '市場或美食街，安排一頓代表菜。' },
    { name: `${place}博物館／藝文`, tags: ['culture'], hours: 2.5, area: '藝文', summary: '雨備或深度文化日首選。' },
    { name: `${place}公園／自然`, tags: ['nature', 'photo'], hours: 2, area: '綠地', summary: '放慢節奏的戶外時間。' },
    { name: `${place}購物街`, tags: ['shopping'], hours: 2, area: '購物', summary: '伴手禮與逛街半日。' },
    { name: `${place}夜景`, tags: ['photo', 'popular'], hours: 1.5, area: '夜景', summary: '晚上燈光與天際線。' },
    { name: `${place}近郊日遊`, tags: ['must', 'nature', 'popular'], hours: 7, area: '近郊日遊', summary: '全日級近郊行程，需預留整天。' },
    { name: `${place}隱藏巷弄`, tags: ['photo', 'food'], hours: 2, area: '巷弄', summary: '較少人潮的本地感路線。' },
    { name: `${place}咖啡／甜點`, tags: ['food'], hours: 1.5, area: '咖啡', summary: '休息補充，適合穿插行程。' },
    { name: `${place}特色體驗`, tags: ['popular', 'culture'], hours: 3, area: '體驗', summary: '手作、導覽或在地活動。' },
    { name: `${place}市集`, tags: ['food', 'shopping', 'popular'], hours: 2, area: '市集', summary: '週末或晨間市集氣氛。' },
    { name: `${place}河岸／海濱`, tags: ['nature', 'photo'], hours: 2, area: '水岸', summary: '散步與拍照的水岸路線。' },
    { name: `${place}宗教建築`, tags: ['culture', 'photo'], hours: 1.5, area: '文化', summary: '教堂、寺廟或神社類景點。' },
    { name: `${place}自由彈性點`, tags: ['popular'], hours: 2, area: '彈性', summary: '可依當天體力替換的備案點。' },
    { name: `${place}第二地標`, tags: ['must', 'photo'], hours: 2, area: '市中心', summary: '另一個高辨識度必去點。' },
    { name: `${place}展望台`, tags: ['photo', 'popular'], hours: 1.5, area: '展望', summary: '城市制高點或觀景層。' },
    { name: `${place}親子／室內備案`, tags: ['popular'], hours: 3, area: '室內', summary: '下雨或需休息時的室內選項。' },
    { name: `${place}機場／車站周邊`, tags: ['shopping', 'food'], hours: 1.5, area: '交通節點', summary: '抵達或離開日可安排的輕行程。' },
  ]
}

function xinjiangTemplateSeeds(): SpotSeed[] {
  return [
    { name: '烏魯木齊抵達適應', tags: ['must'], hours: 4, area: '烏魯木齊', summary: '飛抵後休息適應，不要趕路。' },
    { name: '天山天池', tags: ['nature', 'photo', 'popular'], hours: 6, area: '北疆・天池', summary: '北疆開場經典湖景。' },
    { name: '喀納斯湖', tags: ['must', 'nature', 'photo', 'popular'], hours: 8, area: '北疆・阿勒泰', summary: '北疆核心，建議至少留足一日。' },
    { name: '禾木村', tags: ['must', 'photo', 'nature'], hours: 8, area: '北疆・阿勒泰', summary: '晨霧與村落，慢遊必排。' },
    { name: '白哈巴／邊陲風光', tags: ['photo', 'nature'], hours: 6, area: '北疆・阿勒泰', summary: '可與喀納斯連線。' },
    { name: '魔鬼城／烏爾禾', tags: ['photo', 'nature', 'popular'], hours: 5, area: '北疆・準噶爾', summary: '雅丹地貌打卡。' },
    { name: '賽里木湖', tags: ['must', 'photo', 'nature', 'popular'], hours: 7, area: '北疆・博爾塔拉', summary: '大西洋最後一滴眼淚，環湖要留時間。' },
    { name: '那拉提／空中草原', tags: ['must', 'nature', 'photo'], hours: 7, area: '北疆・伊犁', summary: '草原慢遊，適合舒服版。' },
    { name: '伊寧／六星街', tags: ['culture', 'food', 'photo'], hours: 4, area: '北疆・伊犁', summary: '休整、美食與城市氣息。' },
    { name: '獨庫公路段（季節限定）', tags: ['must', 'photo', 'nature', 'popular'], hours: 9, area: '南北疆過渡', summary: '開通季才走；是長線精華，需整天。' },
    { name: '巴音布魯克', tags: ['nature', 'photo'], hours: 7, area: '北疆・巴州', summary: '九曲十八彎日落。' },
    { name: '庫車／天山神秘大峽谷', tags: ['nature', 'photo', 'culture'], hours: 6, area: '南疆・阿克蘇', summary: '南北疆銜接常見停留。' },
    { name: '喀什古城', tags: ['must', 'culture', 'photo', 'popular'], hours: 6, area: '南疆・喀什', summary: '南疆人文核心，建議住至少兩晚。' },
    { name: '香妃園／艾提尕爾清真寺', tags: ['culture', 'photo'], hours: 3, area: '南疆・喀什', summary: '古城文化半日。' },
    { name: '帕米爾高原／白沙湖', tags: ['must', 'nature', 'photo', 'popular'], hours: 9, area: '南疆・塔什庫爾幹', summary: '高原長途日，務必慢適應。' },
    { name: '卡拉庫里湖', tags: ['photo', 'nature', 'must'], hours: 6, area: '南疆・塔什庫爾幹', summary: '雪山倒影經典。' },
    { name: '和田玉都／夜市', tags: ['food', 'shopping', 'culture'], hours: 4, area: '南疆・和田', summary: '南疆東返可停。' },
    { name: '沙漠公路／塔里木', tags: ['nature', 'photo'], hours: 8, area: '南疆・沙漠', summary: '長距離移動日，景觀獨特。' },
    { name: '吐魯番葡萄溝／火焰山', tags: ['must', 'photo', 'popular'], hours: 6, area: '東疆・吐魯番', summary: '回烏魯木齊前常見收尾。' },
    { name: '彈性休息／補拍日', tags: ['popular'], hours: 4, area: '彈性', summary: '慢遊必留的恢復日。' },
  ]
}

/** Infer trip length from destination wording (環線 / 南北疆 / 慢遊 etc.). */
export function inferCustomTripProfile(name: string): {
  recommendedDays: Destination['recommendedDays']
  tagline: string
  intro: string
  bestSeason: string
  spots: ScenicSpot[]
  tips: string[]
  flexDayIdeas: string[]
} {
  const text = name.trim()
  const slow = /慢遊|舒適|深度|悠閒|放慢/.test(text)
  const loop =
    /環線|南北疆|北疆.*南疆|南疆.*北疆|大環線|自駕|公路/.test(text) ||
    (/新疆/.test(text) && /南北|環/.test(text))
  const xinjiang = /新疆|北疆|南疆|喀納斯|喀什|伊犁|帕米爾/.test(text)
  const multiCity = /[＋+及與和／/]/.test(text) || (text.match(/[市縣州島]/g)?.length ?? 0) >= 2

  if (xinjiang && (loop || /南北疆/.test(text) || ( /北疆/.test(text) && /南疆/.test(text) ))) {
    const comfortable = slow ? 18 : 16
    return {
      recommendedDays: {
        min: 12,
        comfortable,
        suggestedLongest: 21,
        note: `${text}：南北疆合起來是長線。最少約 12 天（偏趕）；舒適慢遊建議 ${comfortable} 天；想更鬆可到 21 天。`,
      },
      tagline: '長線公路行程・南北疆需要較多天數',
      intro: `${text} 屬於新疆長線慢遊：北疆自然（喀納斯、賽里木、伊犁）與南疆人文／高原（喀什、帕米爾）距離都很遠，不適合用一般城市遊的 3–5 天去估。`,
      bestSeason: '多數路段 6–9 月較合適；獨庫等季節性公路需確認開通',
      spots: spotsFromSeeds(text, xinjiangTemplateSeeds()),
      flexDayIdeas: [
        '北疆多留一天看天氣',
        '喀什古城再住一晚',
        '高原適應休息日',
        '吐魯番收尾彈性日',
      ],
      tips: [
        '南北疆舒適慢遊通常是兩週以上，不是短假期行程。',
        '長距離包車／自駕為主，每天車程要控管，別排太滿。',
        '高原與溫差大：防曬、薄羽絨、潤唇膏都要帶。',
        '可在景點步驟刪減不想去的點，AI 會重估正常完成天數。',
      ],
    }
  }

  if (xinjiang) {
    return {
      recommendedDays: {
        min: 7,
        comfortable: slow ? 12 : 10,
        suggestedLongest: 16,
        note: `${text}：只玩北疆或南疆單邊，舒服大約 10–12 天；若之後要南北疆都去，請再加長。`,
      },
      tagline: '新疆長線・天數要比一般城市多',
      intro: `${text} 在新疆，景點之間車程長。系統已提高建議天數；若你其實要南北疆都去，請在名稱加上「南北疆」以便給出更長建議。`,
      bestSeason: '6–9 月為主，視北疆或南疆而定',
      spots: spotsFromSeeds(text, xinjiangTemplateSeeds().slice(0, 14)),
      flexDayIdeas: ['天氣備案日', '古城慢遊日', '長途後休息日'],
      tips: [
        '新疆單邊深度也很少低於一週。',
        '確認熱門景點門票與區間車。',
      ],
    }
  }

  if (loop || /自駕|公路旅行|房車/.test(text)) {
    return {
      recommendedDays: {
        min: 8,
        comfortable: slow ? 14 : 12,
        suggestedLongest: 18,
        note: `${text}：環線／公路長線，建議至少 8 天，舒服約 ${slow ? 14 : 12} 天。`,
      },
      tagline: '公路／環線行程・建議拉長天數',
      intro: `${text} 看起來是長線移動型行程，系統已用較長天數去建議，並帶入多個區域型景點骨架。`,
      bestSeason: '請依路況與季節查詢',
      spots: spotsFromSeeds(text, cityTemplateSeeds(text)),
      flexDayIdeas: ['趕路緩衝日', '天氣備案日', '重點景區多留一晚'],
      tips: ['長線行程請預留彈性日，避免天天長途。'],
    }
  }

  if (multiCity || slow) {
    return {
      recommendedDays: {
        min: 5,
        comfortable: slow ? 9 : 7,
        suggestedLongest: 14,
        note: `${text}：多地或慢遊節奏，舒服大約 ${slow ? 9 : 7} 天，可拉到 14 天。`,
      },
      tagline: '多地／慢遊・天數略長',
      intro: `${text} 由你自行加入。因名稱像多地或慢遊，建議天數已略為提高。`,
      bestSeason: '請依當地氣候選擇',
      spots: spotsFromSeeds(text, cityTemplateSeeds(text)),
      flexDayIdeas: [`${text}再訪最愛街区`, `${text}購物日`, `${text}雨備日`],
      tips: ['可再新增你真正想去的景點，讓天數估算更準。'],
    }
  }

  return {
    recommendedDays: {
      min: 3,
      comfortable: 5,
      suggestedLongest: 12,
      note: `${text}：先以 3–5 天打底；勾選景點後 AI 會再重估。`,
    },
    tagline: '你輸入的目的地・AI 會依景點量建議天數',
    intro: `${text} 由你自行加入。系統已先帶入常見行程骨架，你可刪減或再新增景點。`,
    bestSeason: '請依當地氣候選擇；旺季建議提早訂房與熱門票',
    spots: spotsFromSeeds(text, cityTemplateSeeds(text)),
    flexDayIdeas: [
      `${text}再訪最愛街区`,
      `${text}購物與伴手禮日`,
      `${text}雨備室內日`,
      `${text}近郊加點日`,
    ],
    tips: [
      '這是你自行輸入的目的地：請再確認交通與最佳季節。',
      '可在景點步驟新增你真正想去的景點名稱。',
    ],
  }
}

const GENERIC_SPOT_NAME =
  /經典地標|老城／歷史區|觀景／打卡點|在地美食區|博物館／藝文|公園／自然|購物街|近郊日遊|隱藏巷弄|咖啡／甜點|特色體驗|自由彈性點|第二地標|展望台|親子／室內備案|機場／車站周邊/

/** True when spots still look like category templates, not real places. */
export function destinationNeedsAiSpots(destination: Destination): boolean {
  if (destination.spots.some((spot) => spot.id.startsWith('ai-spot-'))) return false
  if (!destination.spots.length) return true
  if (destination.id.startsWith('custom-')) return true
  const genericCount = destination.spots.filter(
    (spot) =>
      spot.id.startsWith('custom-spot-') ||
      GENERIC_SPOT_NAME.test(spot.name) ||
      spot.name.startsWith(`${destination.nameZh}經典`) ||
      spot.name.startsWith(`${destination.nameZh}老城`) ||
      spot.name.startsWith(`${destination.nameZh}觀景`),
  ).length
  return genericCount >= Math.min(6, destination.spots.length)
}

const ALLOWED_SPOT_TAGS: SpotTag[] = [
  'must',
  'photo',
  'popular',
  'culture',
  'nature',
  'food',
  'shopping',
]

/** Map Crazyrouter spot suggestions onto ScenicSpot records. */
export function scenicSpotsFromAi(
  place: string,
  suggestions: {
    name: string
    nameLocal?: string
    area?: string
    stayHours?: number
    summary?: string
    tags?: string[]
    ticket?: string
  }[],
): ScenicSpot[] {
  const stamp = Date.now().toString(36)
  const spots: ScenicSpot[] = []
  suggestions.forEach((item, index) => {
    const name = item.name?.trim()
    if (!name || GENERIC_SPOT_NAME.test(name)) return
    const tags = (item.tags || []).filter((tag): tag is SpotTag =>
      ALLOWED_SPOT_TAGS.includes(tag as SpotTag),
    )
    const stayHours = Number(item.stayHours)
    spots.push({
      id: `ai-spot-${slugifyDestination(place)}-${stamp}-${index + 1}`,
      name,
      nameLocal: item.nameLocal?.trim() || name,
      area: item.area?.trim() || '市區',
      stayHours:
        Number.isFinite(stayHours) && stayHours > 0
          ? Math.min(10, Math.max(1, stayHours))
          : 2,
      summary: item.summary?.trim() || `${name}：值得安排的在地行程。`,
      tags: tags.length ? tags : (['popular'] as SpotTag[]),
      ticket: item.ticket?.trim() || '視當地而定',
      bestFor: ['solo', 'couple', 'family', 'friends'] as Companion[],
    })
  })
  return spots
}

/** Build a plannable destination from a user-typed place name. */
export function createCustomDestination(rawName: string): Destination {
  const name = rawName.trim()
  const id = `custom-${slugifyDestination(name)}-${Date.now().toString(36)}`
  const profile = inferCustomTripProfile(name)

  return {
    id,
    nameZh: name,
    nameLocal: name,
    tagline: profile.tagline,
    intro: profile.intro,
    bestSeason: profile.bestSeason,
    recommendedDays: profile.recommendedDays,
    weather: {
      spring: '請出發前查當地氣溫與降雨',
      summer: '請出發前查當地氣溫與降雨',
      autumn: '請出發前查當地氣溫與降雨',
      winter: '請出發前查當地氣溫與降雨',
    },
    hotels: [
      {
        name: `${name}沿線高性價比旅店`,
        area: '主要基地城市',
        nightsHint: '分段連住，減少換宿',
        pricePerNight: '視淡旺季',
        highlight: '長線行程建議分北疆／南疆等基地住',
        styles: ['value', 'standard', 'clean'],
      },
      {
        name: `${name}景區度假酒店`,
        area: '重點景區',
        nightsHint: '2–3 晚儀式感',
        pricePerNight: '中高檔',
        highlight: '重點區可升級住宿提升舒適度',
        styles: ['luxury', 'luxuryValue'],
      },
      {
        name: `${name}清掃評分高旅宿`,
        area: '過渡城市',
        nightsHint: '趕路日 overnight',
        pricePerNight: '中價',
        highlight: '清潔優先，適合長途中途休息',
        styles: ['clean', 'value', 'standard'],
      },
    ],
    spots: profile.spots,
    flexDayIdeas: profile.flexDayIdeas,
    tips: profile.tips,
  }
}

export function createCustomSpot(
  placeName: string,
  spotName: string,
  stayHours = 2,
): ScenicSpot {
  const name = spotName.trim()
  return {
    id: `user-spot-${slugifyDestination(name)}-${Date.now().toString(36)}`,
    name,
    nameLocal: name,
    area: placeName,
    stayHours: Math.min(Math.max(stayHours, 0.5), 12),
    summary: `你新增的景點：${name}`,
    tags: ['must', 'popular'],
    ticket: '視當地而定',
    bestFor: ['solo', 'couple', 'family', 'friends'],
  }
}

export const hotelStyles: {
  id: HotelStyle
  label: string
  description: string
}[] = [
  {
    id: 'value',
    label: '高性價比',
    description: '位置方便、評價穩定，把預算留給景點與美食',
  },
  {
    id: 'luxury',
    label: '奢華',
    description: '五星體驗、精品設計、管家式服務',
  },
  {
    id: 'luxuryValue',
    label: '奢華 × 高性價比',
    description: '精品質感但不過度溢價，週末特價可鎖定',
  },
  {
    id: 'standard',
    label: '普通舒適',
    description: '乾淨商務旅宿或中價位連鎖，穩定好睡',
  },
  {
    id: 'clean',
    label: '清潔優先',
    description: '以衛生評分與房型新舊為第一考量',
  },
]

export const tripPaces: {
  id: TripPace
  label: string
  description: string
  spotsPerDay: number
}[] = [
  { id: 'relaxed', label: '輕鬆', description: '每天 2 個重點，多留咖啡與散步', spotsPerDay: 2 },
  { id: 'balanced', label: '平衡', description: '每天約 3 個景點，體驗與休息兼顧', spotsPerDay: 3 },
  { id: 'packed', label: '緊湊', description: '每天 4 個景點，想看盡量看', spotsPerDay: 4 },
]

export const companions: { id: Companion; label: string }[] = [
  { id: 'solo', label: '獨旅' },
  { id: 'couple', label: '情侶' },
  { id: 'family', label: '家庭' },
  { id: 'friends', label: '朋友' },
]

/** Hard bounds for traveler count input (affects rooms + transport). */
export const MIN_PARTY_SIZE = 1
export const MAX_PARTY_SIZE = 20

export function clampPartySize(value: number): number {
  if (!Number.isFinite(value)) return 2
  return Math.min(MAX_PARTY_SIZE, Math.max(MIN_PARTY_SIZE, Math.round(value)))
}

export function defaultPartySize(companion: Companion): number {
  switch (companion) {
    case 'solo':
      return 1
    case 'couple':
      return 2
    case 'family':
      return 4
    case 'friends':
      return 4
    default:
      return 2
  }
}

/** Hotel room / bedding guidance from traveler count. */
export function hotelBookingAdvice(partySize: number): {
  rooms: number
  bedding: string
  note: string
} {
  const size = clampPartySize(partySize)
  if (size === 1) {
    return {
      rooms: 1,
      bedding: '單人房或一張雙人床',
      note: '訂 1 間房即可；可選單人房或一張雙人床。',
    }
  }
  if (size === 2) {
    return {
      rooms: 1,
      bedding: '一張雙人床或兩張單人床',
      note: '訂 1 間雙人房；下訂時註明床型偏好。',
    }
  }
  if (size === 3) {
    return {
      rooms: 2,
      bedding: '建議 2 間（或 1 間三人房／加床）',
      note: '三人較難保證一間三人房，建議先問清楚可否加床，否則訂 2 間較穩。',
    }
  }
  const rooms = Math.ceil(size / 2)
  return {
    rooms,
    bedding: `約 ${rooms} 間雙人房（可依家庭改親子房）`,
    note: `${size} 人建議先估 ${rooms} 間房；有小孩可改親子房或要求連通房。`,
  }
}

/** Traffic / vehicle arrangement from traveler count. */
export function trafficArrangementAdvice(
  partySize: number,
  options?: { privateDriver?: boolean },
): {
  mode: string
  vehicle: string
  note: string
} {
  const size = clampPartySize(partySize)
  const privateDriver = Boolean(options?.privateDriver)

  if (size <= 2) {
    return {
      mode: privateDriver ? '包車／專車' : '電車＋計程車為主',
      vehicle: privateDriver ? '五人座轎車' : '大眾運輸／計程車',
      note: privateDriver
        ? '1–2 人包車最靈活，景區間可省轉乘時間。'
        : '人數少時大眾運輸通常最省事；景區接駁可搭配計程車。',
    }
  }
  if (size <= 4) {
    return {
      mode: privateDriver ? '包車舒服版' : '電車＋計程車／租車',
      vehicle: '五～七人座（含行李）',
      note: privateDriver
        ? '3–4 人很適合一輛包車，行李與行程節奏都較穩。'
        : '4 人以內仍可用電車；若景點分散或有長輩，建議改包車／租車。',
    }
  }
  if (size <= 6) {
    return {
      mode: '小團包車／MPV',
      vehicle: '七～八人座 MPV（含司機）',
      note: '5–6 人建議固定一輛 MPV 或小巴，比分兩台計程車好管，酒店也可集中訂 3 間房。',
    }
  }
  if (size <= 9) {
    return {
      mode: '九人座包車或兩車並行',
      vehicle: '九人座商務車／兩輛七人座',
      note: '7–9 人交通以九人座或兩車為主，訂房請一次訂齊並要求同樓層。',
    }
  }
  return {
    mode: '中巴／小型旅遊車',
    vehicle: '15–20 人座中巴（視行李）',
    note: `${size} 人建議中巴統一接送，酒店可談團體價與相鄰房型。`,
  }
}

export const specialNeedOptions = [
  '喜歡歷史文化',
  '想拍打卡美照',
  '避開人潮',
  '想多吃在地美食',
  '需要親子友善',
  '盡量少走路',
  '想安排購物',
  '偏好戶外自然',
  '每天十點後出門',
  '包司機舒服版',
  '高原慢適應',
  '6人小團',
]

export const spotTagLabels: Record<SpotTag, string> = {
  must: '必去',
  photo: '打卡紅點',
  popular: '熱門',
  culture: '文化',
  nature: '自然',
  food: '美食',
  shopping: '購物',
}

const kansaiSpots: ScenicSpot[] = [
  { id: 'osa-dotonbori', name: '道頓堀', nameLocal: '道頓堀', area: '大阪・難波', stayHours: 2, summary: '霓虹與美食的大阪門面，夜晚最華麗。', tags: ['must', 'photo', 'popular', 'food'], ticket: '免費', bestFor: ['solo', 'couple', 'friends', 'family'] },
  { id: 'osa-shinsaibashi', name: '心齋橋商店街', nameLocal: '心斎橋', area: '大阪・難波', stayHours: 2, summary: '購物主軸，藥妝與潮流品牌集中。', tags: ['shopping', 'popular'], ticket: '免費', bestFor: ['couple', 'friends', 'family'] },
  { id: 'osa-osakacastle', name: '大阪城', nameLocal: '大阪城', area: '大阪・大阪城', stayHours: 2.5, summary: '天守閣與公園，經典必去。', tags: ['must', 'photo', 'culture'], ticket: '天守閣約 ¥600', bestFor: ['solo', 'couple', 'family', 'friends'] },
  { id: 'osa-umeda', name: '梅田空中庭園', nameLocal: '空中庭園展望台', area: '大阪・梅田', stayHours: 1.5, summary: '懸空展望台，夜景打卡紅點。', tags: ['photo', 'popular'], ticket: '約 ¥2000', bestFor: ['couple', 'friends'] },
  { id: 'osa-kuromon', name: '黑門市場', nameLocal: '黒門市場', area: '大阪・難波', stayHours: 1.5, summary: '海鮮與串炸朝食好去處。', tags: ['food', 'popular'], ticket: '餐費自理', bestFor: ['solo', 'couple', 'friends'] },
  { id: 'osa-shinsekai', name: '新世界・通天閣', nameLocal: '新世界・通天閣', area: '大阪・新世界', stayHours: 2, summary: '復古街区与串炸文化。', tags: ['photo', 'food', 'popular'], ticket: '通天閣另計', bestFor: ['friends', 'couple', 'solo'] },
  { id: 'osa-universal', name: '環球影城', nameLocal: 'USJ', area: '大阪・此花', stayHours: 9, summary: '主題樂園全日遊，需提早入場。', tags: ['must', 'popular'], ticket: '一日券另計', bestFor: ['family', 'friends', 'couple'] },
  { id: 'osa-kaiyukan', name: '海遊館', nameLocal: '海遊館', area: '大阪・港區', stayHours: 3, summary: '巨型水族箱，親子友善。', tags: ['popular', 'nature'], ticket: '約 ¥2700', bestFor: ['family', 'couple'] },
  { id: 'osa-namba-yasaka', name: '難波八阪神社', nameLocal: '難波八阪神社', area: '大阪・難波', stayHours: 0.75, summary: '獅子頭舞台，超好拍。', tags: ['photo', 'culture'], ticket: '免費', bestFor: ['couple', 'friends', 'solo'] },
  { id: 'osa-teamlab', name: 'teamLab 大阪', nameLocal: 'teamLab', area: '大阪', stayHours: 2, summary: '數位藝術沉浸展，需預約。', tags: ['photo', 'popular'], ticket: '視場次', bestFor: ['couple', 'friends', 'family'] },
  { id: 'kyo-fushimi', name: '伏見稻荷大社', nameLocal: '伏見稲荷大社', area: '京都・伏見', stayHours: 2.5, summary: '千本鳥居，關西第一打卡紅點。', tags: ['must', 'photo', 'popular', 'culture'], ticket: '免費', bestFor: ['solo', 'couple', 'friends', 'family'] },
  { id: 'kyo-kiyomizu', name: '清水寺', nameLocal: '清水寺', area: '京都・東山', stayHours: 2, summary: '舞台眺望与二年坂三年坂。', tags: ['must', 'photo', 'culture'], ticket: '約 ¥400', bestFor: ['solo', 'couple', 'family', 'friends'] },
  { id: 'kyo-gion', name: '祇園・花見小路', nameLocal: '祇園', area: '京都・祇園', stayHours: 2, summary: '黄昏最美，可能巧遇舞妓氛围。', tags: ['must', 'photo', 'culture'], ticket: '免費', bestFor: ['couple', 'solo', 'friends'] },
  { id: 'kyo-arashiyama', name: '嵐山竹林', nameLocal: '竹林の道', area: '京都・嵐山', stayHours: 3, summary: '竹林、渡月橋，建議早到避人潮。', tags: ['must', 'photo', 'nature'], ticket: '竹林免費', bestFor: ['couple', 'family', 'friends'] },
  { id: 'kyo-kinkaku', name: '金閣寺', nameLocal: '金閣寺', area: '京都・北區', stayHours: 1.5, summary: '镜湖映金阁，经典必去。', tags: ['must', 'photo', 'culture'], ticket: '約 ¥500', bestFor: ['solo', 'couple', 'family', 'friends'] },
  { id: 'kyo-nishiki', name: '錦市場', nameLocal: '錦市場', area: '京都・河原町', stayHours: 1.5, summary: '京都廚房，小吃巡礼。', tags: ['food', 'popular'], ticket: '餐費自理', bestFor: ['solo', 'couple', 'friends'] },
  { id: 'kyo-philosopher', name: '哲學之道', nameLocal: '哲学の道', area: '京都・左京', stayHours: 2, summary: '櫻花季最美散步道。', tags: ['nature', 'photo'], ticket: '免費', bestFor: ['couple', 'solo'] },
  { id: 'kyo-nijocastle', name: '二条城', nameLocal: '二条城', area: '京都・中京', stayHours: 2, summary: '德川屋敷与夜莺廊下。', tags: ['culture', 'popular'], ticket: '約 ¥800', bestFor: ['couple', 'family', 'friends'] },
  { id: 'kyo-kimono', name: '和服體驗', nameLocal: '着物体験', area: '京都・東山', stayHours: 3, summary: '穿和服走二年坂，照片超值。', tags: ['photo', 'popular'], ticket: '視套裝', bestFor: ['couple', 'friends'] },
  { id: 'kyo-ujitea', name: '宇治半日茶體驗', nameLocal: '宇治', area: '京都・宇治', stayHours: 4, summary: '抹茶與平等院，適合加天數時安排。', tags: ['food', 'culture', 'photo'], ticket: '交通+體驗另計', bestFor: ['couple', 'friends', 'solo'] },
  { id: 'nara-park', name: '奈良公園與鹿', nameLocal: '奈良公園', area: '奈良日遊', stayHours: 5, summary: '餵鹿、東大寺，關西超值日遊。', tags: ['must', 'photo', 'nature'], ticket: '公園免費', bestFor: ['family', 'couple', 'friends'] },
  { id: 'kobe-harbor', name: '神戶港與牛排', nameLocal: '神戸', area: '神戶日遊', stayHours: 6, summary: '港都風景與神戶牛晚餐。', tags: ['food', 'photo', 'popular'], ticket: '餐費較高', bestFor: ['couple', 'friends'] },
]

export const destinations: Destination[] = [
  qingganDestination,
  {
    id: 'kansai',
    nameZh: '關西（大阪＋京都）',
    nameLocal: '関西',
    tagline: '對應 AI 行程範例：城市活力 × 古都氛圍',
    intro:
      '大阪負責吃與節奏，京都負責歷史與打卡；中間可加奈良或神戶。這是 PDF 實際範例的核心組合，適合第一次去日本關西的旅人。',
    bestSeason: '3–5 月櫻花、10–11 月紅葉；夏天熱、冬天可抓梅花季',
    recommendedDays: {
      min: 5,
      comfortable: 7,
      suggestedLongest: 12,
      note: '最少 5 天能各碰一點；7 天最舒服（大阪約 4、京都約 3）。想慢慢逛、加奈良／神戶／宇治，12 天很值得；再長也能繼續加深度日。',
    },
    weather: {
      spring: '10–20°C，櫻花季人多，早晚涼',
      summer: '24–34°C，悶熱，備陽傘與室內行程',
      autumn: '12–22°C，紅葉季漂亮',
      winter: '3–10°C，乾冷，梅花與溫暖食堂友善',
    },
    hotels: [
      {
        name: '難波／心齋橋商務旅店',
        area: '大阪・難波',
        nightsHint: '大阪段建議連住',
        pricePerNight: '¥12,000–20,000',
        highlight: '吃喝購物最省交通',
        styles: ['value', 'standard', 'clean'],
      },
      {
        name: '京都駅或河原町飯店',
        area: '京都・京都駅／河原町',
        nightsHint: '京都段連住，少換宿',
        pricePerNight: '¥14,000–28,000',
        highlight: '交通節點清楚，適合行李托運日',
        styles: ['standard', 'value', 'luxuryValue'],
      },
      {
        name: '祇園町家／精品旅宿',
        area: '京都・祇園',
        nightsHint: '1–3 晚儀式感',
        pricePerNight: '¥35,000–70,000',
        highlight: '氛圍佳，適合情侶',
        styles: ['luxury', 'luxuryValue'],
      },
      {
        name: '清潔評分高的公寓式飯店',
        area: '大阪・本町或京都・四条',
        nightsHint: '長住 5 晚以上更划算',
        pricePerNight: '¥15,000–25,000',
        highlight: '有廚房、打掃頻率高',
        styles: ['clean', 'value'],
      },
    ],
    spots: kansaiSpots,
    flexDayIdeas: [
      '藥妝與伴手禮專攻日',
      '溫泉／超級錢湯放空日',
      '咖啡廳與市集慢遊日',
      '雨備：美術館＋地下街',
      '再訪最愛街区的彈性日',
    ],
  },
  {
    id: 'osaka',
    nameZh: '大阪',
    nameLocal: '大阪',
    tagline: '美食、霓虹與主題樂園的關西門戶',
    intro:
      '如果你這次主要想吃、購物、玩樂園，大阪可以當單一目的地。經典市區 3–4 天就很飽；加 USJ 或日遊會再拉長。',
    bestSeason: '3–5 月、10–11 月較舒服',
    recommendedDays: {
      min: 3,
      comfortable: 4,
      suggestedLongest: 8,
      note: '3 天走經典；4 天最舒服。有 USJ、日遊奈良／神戶，可拉到 6–8 天；更長也能當基地慢住。',
    },
    weather: {
      spring: '10–20°C',
      summer: '25–35°C，很熱',
      autumn: '12–22°C',
      winter: '3–10°C',
    },
    hotels: [
      {
        name: '難波駅徒步圈旅店',
        area: '難波',
        nightsHint: '全程建議連住',
        pricePerNight: '¥11,000–18,000',
        highlight: '夜生活與美食最方便',
        styles: ['value', 'standard'],
      },
      {
        name: '梅田高端飯店',
        area: '梅田',
        nightsHint: '2–4 晚',
        pricePerNight: '¥25,000–50,000',
        highlight: '交通與百貨便利',
        styles: ['luxury', 'luxuryValue'],
      },
      {
        name: '新淨膠囊／商務旅館',
        area: '本町',
        nightsHint: '3 晚以上',
        pricePerNight: '¥6,000–12,000',
        highlight: '清潔與性價比取向',
        styles: ['clean', 'value'],
      },
    ],
    spots: kansaiSpots.filter((s) => s.area.startsWith('大阪') || s.id === 'nara-park' || s.id === 'kobe-harbor'),
    flexDayIdeas: ['黑門再訪＋下午百貨', '堺筋購物日', '灣區放空日'],
  },
  {
    id: 'kyoto',
    nameZh: '京都',
    nameLocal: '京都',
    tagline: '神社佛閣、巷弄與季節風景',
    intro:
      '京都適合把節奏放慢。寺廟神社密度高，別排太滿；多留拍照與抹茶時間會更享受。',
    bestSeason: '櫻花與紅葉季最美，也最擠',
    recommendedDays: {
      min: 3,
      comfortable: 5,
      suggestedLongest: 10,
      note: '3 天只能抓經典；5 天最舒服。想加宇治、美山、貴船，10 天仍不夠緊也沒關係。',
    },
    weather: {
      spring: '8–18°C',
      summer: '23–34°C，寺院區很熱',
      autumn: '10–20°C',
      winter: '1–8°C',
    },
    hotels: [
      {
        name: '京都駅前飯店',
        area: '京都駅',
        nightsHint: '全程連住最省事',
        pricePerNight: '¥13,000–22,000',
        highlight: '行李與巴士都方便',
        styles: ['standard', 'value', 'clean'],
      },
      {
        name: '祇園／東山町家',
        area: '祇園',
        nightsHint: '2–4 晚',
        pricePerNight: '¥30,000–60,000',
        highlight: '氛圍與步行友善',
        styles: ['luxury', 'luxuryValue'],
      },
    ],
    spots: kansaiSpots.filter((s) => s.area.startsWith('京都') || s.id === 'nara-park'),
    flexDayIdeas: ['貴船／鞍馬山一日', '美山茅草屋日遊', '抹茶甜點專攻日'],
  },
  {
    id: 'tokyo',
    nameZh: '東京',
    nameLocal: '東京',
    tagline: '巨大都會：街頭、博物館與主題樂園',
    intro:
      '東京可以玩很深。第一次去，先抓 2–3 個區域深挖比全市奔波更好；天數拉長就能把迪士尼、鎌倉、箱根加進來。',
    bestSeason: '3–5 月、10–11 月',
    recommendedDays: {
      min: 4,
      comfortable: 6,
      suggestedLongest: 12,
      note: '4 天入門；6 天最舒服。要含迪士尼／箱根／鎌倉，12 天合理；16 天也能繼續住不同區域。',
    },
    weather: {
      spring: '10–20°C',
      summer: '24–33°C',
      autumn: '12–22°C',
      winter: '3–11°C',
    },
    hotels: [
      {
        name: '新宿或澀谷商務旅店',
        area: '新宿／澀谷',
        nightsHint: '建議當基地連住',
        pricePerNight: '¥14,000–25,000',
        highlight: '轉乘方便',
        styles: ['value', 'standard'],
      },
      {
        name: '銀座奢華酒店',
        area: '銀座',
        nightsHint: '2–3 晚',
        pricePerNight: '¥50,000–100,000',
        highlight: '購物與服務頂配',
        styles: ['luxury'],
      },
      {
        name: '淺草清潔公寓',
        area: '淺草',
        nightsHint: '長住友善',
        pricePerNight: '¥12,000–20,000',
        highlight: '下町氛圍、打掃評分高',
        styles: ['clean', 'value', 'luxuryValue'],
      },
    ],
    spots: [
      { id: 'tyo-sensoji', name: '淺草寺', nameLocal: '浅草寺', area: '淺草', stayHours: 2, summary: '雷門與仲見世，經典必去。', tags: ['must', 'photo', 'popular'], ticket: '免費', bestFor: ['solo', 'couple', 'family', 'friends'] },
      { id: 'tyo-skytree', name: '晴空塔', nameLocal: 'スカイツリー', area: '押上', stayHours: 2, summary: '制高點夜景。', tags: ['photo', 'popular'], ticket: '展望票另計', bestFor: ['couple', 'family'] },
      { id: 'tyo-shibuya', name: '澀谷十字路口', nameLocal: '渋谷スクランブル', area: '澀谷', stayHours: 1.5, summary: '都市節奏代表畫面。', tags: ['must', 'photo', 'popular'], ticket: '免費', bestFor: ['solo', 'friends', 'couple'] },
      { id: 'tyo-meiji', name: '明治神宮', nameLocal: '明治神宮', area: '原宿', stayHours: 1.5, summary: '都市裡的森林神社。', tags: ['culture', 'nature'], ticket: '免費', bestFor: ['solo', 'couple', 'family'] },
      { id: 'tyo-harajuku', name: '原宿竹下通', nameLocal: '竹下通り', area: '原宿', stayHours: 1.5, summary: '潮流小物與甜點。', tags: ['shopping', 'popular'], ticket: '免費', bestFor: ['friends', 'couple'] },
      { id: 'tyo-shinjuku', name: '新宿摩天樓與歌舞伎町', nameLocal: '新宿', area: '新宿', stayHours: 2.5, summary: '白天都廳、晚上霓虹。', tags: ['photo', 'popular'], ticket: '都廳免費', bestFor: ['solo', 'friends', 'couple'] },
      { id: 'tyo-teamlab', name: 'teamLab Planets', nameLocal: 'チームラボ', area: '豐洲', stayHours: 2.5, summary: '需預約的沉浸式打卡。', tags: ['photo', 'must', 'popular'], ticket: '需預約', bestFor: ['couple', 'friends', 'family'] },
      { id: 'tyo-ginza', name: '銀座購物', nameLocal: '銀座', area: '銀座', stayHours: 2.5, summary: '百貨與排隊美食。', tags: ['shopping', 'food'], ticket: '免費', bestFor: ['couple', 'friends'] },
      { id: 'tyo-akihabara', name: '秋葉原', nameLocal: '秋葉原', area: '秋葉原', stayHours: 2, summary: '動漫電器文化圈。', tags: ['shopping', 'popular'], ticket: '免費', bestFor: ['solo', 'friends'] },
      { id: 'tyo-ueno', name: '上野公園與博物館', nameLocal: '上野', area: '上野', stayHours: 3, summary: '博物館日或櫻花季。', tags: ['culture', 'nature'], ticket: '視場館', bestFor: ['family', 'solo', 'couple'] },
      { id: 'tyo-tsukiji', name: '築地場外', nameLocal: '築地場外', area: '築地', stayHours: 1.5, summary: '海鮮早餐聖地。', tags: ['food', 'must'], ticket: '餐費自理', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'tyo-disney', name: '東京迪士尼／海洋', nameLocal: 'ディズニー', area: '舞濱', stayHours: 10, summary: '樂園全日，建議獨立一天。', tags: ['must', 'popular'], ticket: '一日券', bestFor: ['family', 'couple', 'friends'] },
      { id: 'tyo-odaiba', name: '台場海濱', nameLocal: 'お台場', area: '台場', stayHours: 3, summary: '彩虹橋與商場。', tags: ['photo', 'shopping'], ticket: '免費', bestFor: ['family', 'friends'] },
      { id: 'tyo-kamakura', name: '鎌倉日遊', nameLocal: '鎌倉', area: '日遊', stayHours: 7, summary: '大海與神社，適合加天數。', tags: ['nature', 'culture', 'photo'], ticket: '交通另計', bestFor: ['couple', 'friends', 'solo'] },
      { id: 'tyo-hakone', name: '箱根溫泉日遊', nameLocal: '箱根', area: '日遊', stayHours: 9, summary: '溫泉與山水，舒適行程加分。', tags: ['nature', 'must'], ticket: '交通周遊券建議', bestFor: ['couple', 'family'] },
      { id: 'tyo-shimokita', name: '下北澤', nameLocal: '下北沢', area: '下北澤', stayHours: 2, summary: '古著與咖啡巷弄。', tags: ['shopping', 'food'], ticket: '免費', bestFor: ['solo', 'friends'] },
      { id: 'tyo-roppongi', name: '六本木藝文', nameLocal: '六本木', area: '六本木', stayHours: 2.5, summary: '博物館與夜景。', tags: ['culture', 'photo'], ticket: '視展覽', bestFor: ['couple', 'solo'] },
      { id: 'tyo-imperial', name: '皇居外苑', nameLocal: '皇居外苑', area: '千代田', stayHours: 1.5, summary: '散步與廣場。', tags: ['nature'], ticket: '免費', bestFor: ['solo', 'couple', 'family'] },
      { id: 'tyo-gotokuji', name: '豪德寺招財貓', nameLocal: '豪徳寺', area: '世田谷', stayHours: 1.5, summary: '招財貓牆超好拍。', tags: ['photo', 'culture'], ticket: '免費/樂捐', bestFor: ['couple', 'friends', 'solo'] },
      { id: 'tyo-toyosu', name: '豐洲市場', nameLocal: '豊洲市場', area: '豐洲', stayHours: 2, summary: '較新的市場朝食選擇。', tags: ['food'], ticket: '餐費自理', bestFor: ['solo', 'couple', 'family'] },
    ],
    flexDayIdeas: ['另一個主題樂園日', '橫濱日遊', '區民食堂與公園慢日', '再訪最愛咖啡街'],
  },
  {
    id: 'taipei',
    nameZh: '台北',
    nameLocal: '臺北',
    tagline: '夜市、博物館與近郊山水',
    intro:
      '台北很適合當短假或長住基地：市區密度高，天數拉長就能加九份、北投、淡水或宜蘭。',
    bestSeason: '10–4 月較舒適；夏天炎熱多雨',
    recommendedDays: {
      min: 3,
      comfortable: 5,
      suggestedLongest: 10,
      note: '3 天市區精華；5 天最舒服。加九份／北投／日遊，10 天仍可很鬆；16 天也能當數位遊牧式慢旅行。',
    },
    weather: {
      spring: '18–26°C，偶雨',
      summer: '26–34°C，悶熱午後雷雨',
      autumn: '20–28°C，舒服',
      winter: '12–20°C，濕冷',
    },
    hotels: [
      {
        name: '台北車站或中山旅店',
        area: '北車／中山',
        nightsHint: '連住最方便',
        pricePerNight: 'NT$2,500–4,500',
        highlight: '轉乘與美食方便',
        styles: ['value', 'standard', 'clean'],
      },
      {
        name: '台北101 周邊精品酒店',
        area: '信義',
        nightsHint: '2–4 晚',
        pricePerNight: 'NT$6,000–12,000',
        highlight: '景觀與購物',
        styles: ['luxury', 'luxuryValue'],
      },
    ],
    spots: [
      { id: 'tpe-101', name: '台北101', nameLocal: '台北101', area: '信義', stayHours: 2, summary: '城市地標，展望或商場都可。', tags: ['must', 'photo', 'popular'], ticket: '展望另計', bestFor: ['couple', 'family', 'friends'] },
      { id: 'tpe-palace', name: '故宮博物院', nameLocal: '國立故宮博物院', area: '士林', stayHours: 3, summary: '文化深度第一站。', tags: ['must', 'culture'], ticket: '約 NT$350', bestFor: ['solo', 'couple', 'family'] },
      { id: 'tpe-shilin', name: '士林夜市', nameLocal: '士林夜市', area: '士林', stayHours: 2, summary: '夜市入門代表。', tags: ['food', 'popular'], ticket: '餐費自理', bestFor: ['friends', 'family', 'couple'] },
      { id: 'tpe-jiufen', name: '九份老街', nameLocal: '九份', area: '日遊', stayHours: 5, summary: '山城燈火，經典日遊。', tags: ['must', 'photo', 'popular'], ticket: '交通另計', bestFor: ['couple', 'friends', 'family'] },
      { id: 'tpe-beitou', name: '北投溫泉', nameLocal: '北投', area: '北投', stayHours: 3, summary: '泡湯放空日。', tags: ['nature', 'popular'], ticket: '視湯屋', bestFor: ['couple', 'family'] },
      { id: 'tpe-danshui', name: '淡水河岸', nameLocal: '淡水', area: '淡水', stayHours: 3, summary: '夕陽與老街。', tags: ['photo', 'food'], ticket: '免費', bestFor: ['couple', 'friends', 'family'] },
      { id: 'tpe-longshan', name: '龍山館與剝皮寮', nameLocal: '龍山寺', area: '萬華', stayHours: 2, summary: '老台北巷弄。', tags: ['culture', 'photo'], ticket: '免費', bestFor: ['solo', 'couple'] },
      { id: 'tpe-elephant', name: '象山步道', nameLocal: '象山', area: '信義', stayHours: 2, summary: '101 景觀打卡紅點。', tags: ['photo', 'nature', 'must'], ticket: '免費', bestFor: ['couple', 'friends', 'solo'] },
      { id: 'tpe-dihua', name: '迪化街', nameLocal: '迪化街', area: '大同', stayHours: 2, summary: '年貨與選物。', tags: ['shopping', 'culture'], ticket: '免費', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'tpe-raohe', name: '饒河夜市', nameLocal: '饒河街夜市', area: '松山', stayHours: 1.5, summary: '較好逛的夜市之一。', tags: ['food', 'popular'], ticket: '餐費自理', bestFor: ['friends', 'couple'] },
      { id: 'tpe-maokong', name: '貓空纜車', nameLocal: '貓空', area: '文山', stayHours: 3, summary: '茶園與夜景。', tags: ['nature', 'photo'], ticket: '纜車另計', bestFor: ['couple', 'family'] },
      { id: 'tpe-chihung', name: '赤峰街咖啡巷', nameLocal: '赤峰街', area: '中山', stayHours: 2, summary: '選物與咖啡漫遊。', tags: ['food', 'shopping'], ticket: '餐費自理', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'tpe-yangming', name: '陽明山', nameLocal: '陽明山', area: '日遊', stayHours: 5, summary: '花季或火山地形。', tags: ['nature'], ticket: '交通另計', bestFor: ['family', 'couple'] },
      { id: 'tpe-pingxi', name: '平溪放天燈', nameLocal: '平溪', area: '日遊', stayHours: 5, summary: '天燈體驗，建議假日。', tags: ['photo', 'popular'], ticket: '天燈費用另計', bestFor: ['couple', 'friends', 'family'] },
      { id: 'tpe-songshan', name: '松山文創', nameLocal: '松山文創園區', area: '信義', stayHours: 2, summary: '文創與展覽。', tags: ['culture', 'shopping'], ticket: '視展覽', bestFor: ['solo', 'friends', 'couple'] },
      { id: 'tpe-ximenting', name: '西門町', nameLocal: '西門町', area: '萬華', stayHours: 2, summary: '年輕人街頭與藥妝。', tags: ['shopping', 'popular'], ticket: '免費', bestFor: ['friends', 'solo'] },
      { id: 'tpe-national', name: '中正紀念堂', nameLocal: '中正紀念堂', area: '中正', stayHours: 1.5, summary: '廣場與建築好拍。', tags: ['photo', 'culture'], ticket: '免費', bestFor: ['family', 'couple'] },
      { id: 'tpe-yeliu', name: '野柳／北海岸', nameLocal: '野柳', area: '日遊', stayHours: 6, summary: '奇岩海岸，適合加天數。', tags: ['nature', 'photo'], ticket: '園區票另計', bestFor: ['family', 'couple', 'friends'] },
      { id: 'tpe-breakfast', name: '台北早餐巡禮', nameLocal: '早餐店', area: '各區', stayHours: 1.5, summary: '蛋餅豆漿是本地日常。', tags: ['food'], ticket: '餐費自理', bestFor: ['solo', 'friends', 'couple'] },
      { id: 'tpe-hotspot', name: '網美咖啡與老屋', nameLocal: '老屋咖啡', area: '大安／中山', stayHours: 2, summary: '打卡與休息日首選。', tags: ['photo', 'food'], ticket: '餐費自理', bestFor: ['couple', 'friends', 'solo'] },
    ],
    flexDayIdeas: ['宜蘭日遊', '書店與唱片行日', '再戰第二個夜市', '雨天百貨＋按摩'],
  },
  {
    id: 'seoul',
    nameZh: '首爾',
    nameLocal: '서울',
    tagline: '宮殿、韓屋、逛街與韓食',
    intro:
      '首爾市區緊湊，3–4 天能抓到感覺；拉長天數就能加華川、水原或更深度的街區生活。',
    bestSeason: '4–6 月、9–11 月',
    recommendedDays: {
      min: 3,
      comfortable: 5,
      suggestedLongest: 10,
      note: '3 天經典；5 天最舒服。想慢慢逛街吃遍各區，10 天很剛好；再長也可加近郊。',
    },
    weather: {
      spring: '8–18°C',
      summer: '22–31°C',
      autumn: '10–20°C',
      winter: '-6–3°C，很冷',
    },
    hotels: [
      {
        name: '明洞或弘大旅店',
        area: '明洞／弘大',
        nightsHint: '連住',
        pricePerNight: '₩90,000–160,000',
        highlight: '逛街與地鐵方便',
        styles: ['value', 'standard'],
      },
      {
        name: '北村精品韓屋旅宿',
        area: '北村',
        nightsHint: '1–2 晚體驗',
        pricePerNight: '₩200,000–400,000',
        highlight: '氛圍與照片價值高',
        styles: ['luxury', 'luxuryValue'],
      },
      {
        name: '清潔公寓式酒店',
        area: '東大門',
        nightsHint: '長住友善',
        pricePerNight: '₩100,000–180,000',
        highlight: '打掃與空間佳',
        styles: ['clean', 'value'],
      },
    ],
    spots: [
      { id: 'sel-gyeongbok', name: '景福宮', nameLocal: '경복궁', area: '鐘路', stayHours: 2.5, summary: '首爾第一宮殿，可配韓服。', tags: ['must', 'photo', 'culture'], ticket: '約 ₩3000', bestFor: ['couple', 'family', 'friends', 'solo'] },
      { id: 'sel-bukchon', name: '北村韓屋村', nameLocal: '북촌', area: '鐘路', stayHours: 2, summary: '韓屋巷弄打卡紅點。', tags: ['must', 'photo', 'popular'], ticket: '免費', bestFor: ['couple', 'friends', 'solo'] },
      { id: 'sel-myeongdong', name: '明洞購物', nameLocal: '명동', area: '明洞', stayHours: 2.5, summary: '藥妝與街頭美食。', tags: ['shopping', 'food', 'popular'], ticket: '免費', bestFor: ['friends', 'couple', 'family'] },
      { id: 'sel-hongdae', name: '弘大', nameLocal: '홍대', area: '弘大', stayHours: 2.5, summary: '年輕街頭、酒吧與選物。', tags: ['shopping', 'food', 'popular'], ticket: '免費', bestFor: ['friends', 'solo', 'couple'] },
      { id: 'sel-dongdaemun', name: '東大門設計廣場', nameLocal: 'DDP', area: '東大門', stayHours: 2, summary: '建築與夜景。', tags: ['photo', 'shopping'], ticket: '免費', bestFor: ['couple', 'friends'] },
      { id: 'sel-namsan', name: '南山塔', nameLocal: 'N서울타워', area: '南山', stayHours: 2, summary: '夜景戀鎖經典。', tags: ['must', 'photo', 'popular'], ticket: '展望另計', bestFor: ['couple', 'friends'] },
      { id: 'sel-insadong', name: '仁寺洞', nameLocal: '인사동', area: '鐘路', stayHours: 2, summary: '傳統小物與茶館。', tags: ['culture', 'shopping'], ticket: '免費', bestFor: ['solo', 'couple', 'family'] },
      { id: 'sel-market', name: '廣藏市場', nameLocal: '광장시장', area: '鐘路', stayHours: 1.5, summary: '韭菜煎餅與肉粽小吃。', tags: ['food', 'must'], ticket: '餐費自理', bestFor: ['solo', 'friends', 'couple'] },
      { id: 'sel-gangnam', name: '江南星街', nameLocal: '강남', area: '江南', stayHours: 2, summary: '現代首爾節奏。', tags: ['shopping', 'photo'], ticket: '免費', bestFor: ['friends', 'couple'] },
      { id: 'sel-hanriver', name: '漢江公園野餐', nameLocal: '한강공원', area: '漢江', stayHours: 2, summary: '夕陽與便利店野餐。', tags: ['nature', 'photo'], ticket: '免費', bestFor: ['friends', 'couple', 'solo'] },
      { id: 'sel-ikseon', name: '益善洞韓屋街', nameLocal: '익선동', area: '鐘路', stayHours: 2, summary: '咖啡與選物超好拍。', tags: ['photo', 'food', 'popular'], ticket: '免費', bestFor: ['couple', 'friends'] },
      { id: 'sel-lotte', name: '樂天世界樂園或塔', nameLocal: '롯데월드', area: '蠶室', stayHours: 6, summary: '親子或室內雨備。', tags: ['popular'], ticket: '樂園票另計', bestFor: ['family', 'friends', 'couple'] },
      { id: 'sel-dmz', name: 'DMZ 一日遊', nameLocal: 'DMZ', area: '日遊', stayHours: 8, summary: '需護照與團，適合加天數。', tags: ['culture'], ticket: '團費另計', bestFor: ['solo', 'friends', 'couple'] },
      { id: 'sel-suwon', name: '水原華城', nameLocal: '수원화성', area: '日遊', stayHours: 6, summary: '世界遺產古城牆。', tags: ['culture', 'photo'], ticket: '交通另計', bestFor: ['couple', 'family', 'solo'] },
      { id: 'sel-starfield', name: '星空圖書館', nameLocal: '별마당도서관', area: '江南', stayHours: 1, summary: '室內打卡紅點。', tags: ['photo', 'popular'], ticket: '免費', bestFor: ['couple', 'friends', 'solo'] },
      { id: 'sel-hongdaeart', name: '壁畫與街頭表演', nameLocal: '홍대거리', area: '弘大', stayHours: 1.5, summary: '週末傍晚最熱鬧。', tags: ['photo', 'popular'], ticket: '免費', bestFor: ['friends', 'solo'] },
      { id: 'sel-spa', name: '汗蒸幕體驗', nameLocal: '찜질방', area: '各區', stayHours: 3, summary: '長途旅途的恢復日。', tags: ['popular'], ticket: '約 ₩10000 起', bestFor: ['friends', 'solo', 'couple'] },
      { id: 'sel-cafe', name: '安國／三清洞咖啡', nameLocal: '삼청동', area: '鐘路', stayHours: 2, summary: '宮殿周邊慢節奏。', tags: ['food', 'photo'], ticket: '餐費自理', bestFor: ['couple', 'solo'] },
      { id: 'sel-seongsu', name: '聖水洞咖啡工廠區', nameLocal: '성수', area: '聖水', stayHours: 2.5, summary: '工業風拍照與咖啡。', tags: ['photo', 'food', 'shopping'], ticket: '免費', bestFor: ['friends', 'couple', 'solo'] },
      { id: 'sel-night', name: '首爾夜景巴士或漢江夜', nameLocal: '야경', area: '市中心', stayHours: 2, summary: '收尾用的浪漫時段。', tags: ['photo', 'popular'], ticket: '視選擇', bestFor: ['couple', 'friends'] },
    ],
    flexDayIdeas: ['另一條逛街軸線', '韓食課程半天', '近郊滑雪季行程', 'SPA＋購物恢復日'],
  },
]

export function hotelsForStyle(dest: Destination, style: HotelStyle): HotelOption[] {
  const matched = dest.hotels.filter((h) => h.styles.includes(style))
  return matched.length ? matched : dest.hotels
}

export function seasonKey(month: number): keyof Destination['weather'] {
  if (month >= 3 && month <= 5) return 'spring'
  if (month >= 6 && month <= 8) return 'summer'
  if (month >= 9 && month <= 11) return 'autumn'
  return 'winter'
}

export function clampDays(value: number): number {
  if (!Number.isFinite(value)) return MIN_TRIP_DAYS
  return Math.min(Math.max(Math.round(value), MIN_TRIP_DAYS), MAX_TRIP_DAYS)
}

export function nightsFromDays(days: number): number {
  return Math.max(clampDays(days) - 1, 1)
}

/** Collapse spot areas into a hotel base city/region. */
export function hotelAreaBase(area: string): string {
  const raw = (area || '').trim() || '市區'
  const parts = raw.split(/[・／/·\|｜]/).map((p) => p.trim()).filter(Boolean)
  if (!parts.length) return '市區'
  // 北疆・阿勒泰 → keep both; 大阪・難波 → 大阪
  if (/^[東西南北]?疆|青藏|青甘|華[北東]|關[東西]/.test(parts[0]) && parts[1]) {
    return `${parts[0]}・${parts[1]}`
  }
  return parts[0]
}

/** Bases that can share one hotel with day trips (avoid unnecessary moves). */
const SHARED_HOTEL_CLUSTERS: string[][] = [
  ['大阪', '奈良', '神戶', '神戸', '京都'],
  ['東京', '橫濱', '横浜', '鎌倉', '箱根'],
  ['台北', '新北', '基隆', '桃園'],
  ['首爾', '京畿', '仁川'],
]

function sharedHotelClusterId(base: string): string | null {
  const hit = SHARED_HOTEL_CLUSTERS.find((cluster) =>
    cluster.some((token) => base.includes(token) || token.includes(base)),
  )
  return hit ? hit[0] : null
}

function dayPreferredBase(day: DayPlan): string {
  if (day.spotIds?.length && day.stayArea) {
    // Prefer majority of schedule spot areas when present in theme/stay
  }
  return hotelAreaBase(day.stayArea)
}

function pickHotelForBase(
  hotels: HotelOption[],
  base: string,
  preferredHotelName?: string,
): HotelOption {
  if (preferredHotelName) {
    const preferred = hotels.find((h) => h.name === preferredHotelName)
    if (preferred) return preferred
  }
  const scored = hotels.map((hotel) => {
    const hotelBase = hotelAreaBase(hotel.area)
    let score = 0
    if (hotelBase === base || hotel.area.includes(base) || base.includes(hotelBase)) {
      score += 8
    }
    const cluster = sharedHotelClusterId(base)
    if (cluster && sharedHotelClusterId(hotelBase) === cluster) score += 5
    if (/市中心|市區|梅田|難波|車站|基地/.test(hotel.area)) score += 1
    if (/連住|少換宿|全程/.test(hotel.nightsHint)) score += 2
    return { hotel, score }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.hotel ?? hotels[0] ?? {
    name: `${base}連住旅店`,
    area: base,
    nightsHint: '建議連住',
    pricePerNight: '視淡旺季',
    highlight: '以少換宿為原則的基地住宿',
    styles: ['standard'],
  }
}

/**
 * Plan hotel nights to prefer consecutive stays at the same hotel when geography allows.
 * Day-trips inside the same metro cluster keep the previous hotel instead of changing.
 */
export function buildHotelStayPlan(options: {
  itinerary: DayPlan[]
  hotels: HotelOption[]
  totalNights: number
  preferConsecutive?: boolean
  preferredHotelName?: string
}): HotelStayPlan {
  const preferConsecutive = options.preferConsecutive !== false
  const nights = Math.max(1, options.totalNights)
  const days = options.itinerary
  const hotels = options.hotels.length
    ? options.hotels
    : [
        {
          name: '行程基地旅店',
          area: '市區',
          nightsHint: '建議連住',
          pricePerNight: '視淡旺季',
          highlight: '少換宿優先',
          styles: ['standard' as HotelStyle],
        },
      ]

  // One sleep night after each day except typically the last departure day.
  // Map night i (1..nights) → day i's preferred base (day index i-1).
  const nightBases: string[] = []
  for (let n = 1; n <= nights; n++) {
    const day = days[Math.min(n - 1, Math.max(days.length - 1, 0))]
    nightBases.push(day ? dayPreferredBase(day) : '市區')
  }

  // Stabilize bases: day-trips inside a metro cluster keep the dominant hotel base.
  let stabilized = [...nightBases]
  if (preferConsecutive && stabilized.length) {
    const counts = new Map<string, number>()
    for (const base of stabilized) {
      const key = sharedHotelClusterId(base) || base
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    let dominantKey = stabilized[0]
    let dominantCount = 0
    for (const [key, count] of counts) {
      if (count > dominantCount) {
        dominantKey = key
        dominantCount = count
      }
    }

    // If one cluster/base covers most nights, keep that hotel for short outliers.
    if (dominantCount >= Math.ceil(stabilized.length * 0.5)) {
      const dominantHotelBase =
        SHARED_HOTEL_CLUSTERS.find((c) => c[0] === dominantKey)?.[0] ||
        stabilized.find((b) => (sharedHotelClusterId(b) || b) === dominantKey) ||
        dominantKey

      stabilized = stabilized.map((base, index) => {
        const key = sharedHotelClusterId(base) || base
        if (key === dominantKey) return dominantHotelBase
        // Single-night outlier between same-base nights → keep previous hotel
        const prev = stabilized[index - 1]
        const next = stabilized[index + 1]
        if (
          prev &&
          next &&
          (sharedHotelClusterId(prev) || prev) === dominantKey &&
          (sharedHotelClusterId(next) || next) === dominantKey
        ) {
          return dominantHotelBase
        }
        // Short trips (≤8 nights): prefer one hotel whenever cluster-compatible
        if (
          nights <= 8 &&
          SHARED_HOTEL_CLUSTERS.some(
            (cluster) =>
              cluster.some((t) => base.includes(t)) &&
              cluster.some((t) => dominantHotelBase.includes(t)),
          )
        ) {
          return dominantHotelBase
        }
        return base
      })
    }

    // Merge adjacent identical bases already; also collapse 1-night flickers
    for (let i = 1; i < stabilized.length - 1; i++) {
      if (
        stabilized[i] !== stabilized[i - 1] &&
        stabilized[i - 1] === stabilized[i + 1]
      ) {
        stabilized[i] = stabilized[i - 1]
      }
    }
  }

  const blocks: HotelStayPlan['blocks'] = []
  let start = 0
  while (start < stabilized.length) {
    let end = start
    while (end + 1 < stabilized.length && stabilized[end + 1] === stabilized[start]) {
      end += 1
    }
    const base = stabilized[start]
    const hotel = pickHotelForBase(hotels, base, options.preferredHotelName)
    const fromNight = start + 1
    const toNight = end + 1
    const blockNights = toNight - fromNight + 1
    const dayNumbers = Array.from({ length: blockNights }, (_, i) => fromNight + i)
    blocks.push({
      hotelName: hotel.name,
      area: hotel.area,
      base,
      fromNight,
      toNight,
      nights: blockNights,
      dayNumbers,
      reason:
        blockNights >= 2
          ? `第 ${fromNight}–${toNight} 晚連住 ${hotel.name}（${base}），減少換宿`
          : `第 ${fromNight} 晚住 ${hotel.name}（${base}）`,
    })
    start = end + 1
  }

  const changes = Math.max(0, blocks.length - 1)
  const summary = preferConsecutive
    ? changes === 0
      ? `全程建議連住同一間：${blocks[0]?.hotelName || '基地旅店'}（${nights} 晚），避免頻繁換宿。`
      : `已盡量連住：共 ${blocks.length} 段住宿、換宿 ${changes} 次（能日歸就不換酒店）。`
    : `依每日區域安排住宿，共 ${blocks.length} 段。`

  return {
    preferConsecutive,
    totalNights: nights,
    changes,
    blocks,
    summary,
  }
}

/** Rewrite itinerary stay labels to follow the consecutive hotel plan. */
export function applyHotelStayPlan(
  itinerary: DayPlan[],
  plan: HotelStayPlan,
): DayPlan[] {
  if (!itinerary.length || !plan.blocks.length) return itinerary
  return itinerary.map((day, index) => {
    const dayNumber = index + 1
    const nightIndex = Math.min(dayNumber, plan.totalNights)
    const block =
      plan.blocks.find(
        (b) => nightIndex >= b.fromNight && nightIndex <= b.toNight,
      ) || plan.blocks[plan.blocks.length - 1]
    const stayLabel = `${block.hotelName}（${block.area}）`
    const consecutiveNote = block.nights >= 2 ? '・連住中' : ''
    const schedule = day.schedule.map((item) => {
      const text = `${item.title} ${item.detail}`
      if (!/回飯店|入住|住宿|今晚住|建議住/.test(text)) return item
      return {
        ...item,
        detail: `今晚住 ${stayLabel}${consecutiveNote}`,
      }
    })
    return {
      ...day,
      stayArea: stayLabel,
      schedule,
      tip:
        block.nights >= 2
          ? `${day.tip}（${block.reason}）`
          : day.tip,
    }
  })
}

export function daysBetween(start: string, end: string): number | null {
  if (!start || !end) return null
  const a = new Date(start)
  const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return null
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1
}

export function aggregateDayAdvice(dests: Destination[]) {
  if (!dests.length) {
    return { min: 3, comfortable: 5, suggestedLongest: 12, note: '' }
  }
  return {
    min: Math.max(...dests.map((d) => d.recommendedDays.min)),
    comfortable: Math.max(...dests.map((d) => d.recommendedDays.comfortable)),
    suggestedLongest: Math.max(...dests.map((d) => d.recommendedDays.suggestedLongest)),
    note: dests.map((d) => `${d.nameZh}：${d.recommendedDays.note}`).join(' '),
  }
}

export function defaultSelectedSpotIds(
  spots: ScenicSpot[],
  dest?: Destination,
): string[] {
  // Curated routes (like 青甘 14 日) should start with the full intended set.
  if (dest?.curatedPlans) return spots.map((s) => s.id)

  const must = spots.filter((s) => s.tags.includes('must')).map((s) => s.id)
  const photo = spots.filter((s) => s.tags.includes('photo') && !must.includes(s.id)).map((s) => s.id)
  const popular = spots
    .filter((s) => s.tags.includes('popular') && !must.includes(s.id) && !photo.includes(s.id))
    .map((s) => s.id)
  return [...must, ...photo.slice(0, 6), ...popular.slice(0, 4)].slice(0, 14)
}

export type DurationFitStatus = 'too_packed' | 'too_light' | 'balanced' | 'empty'

/** Compare chosen days against an absolute min / normal / comfortable estimate. */
export function deriveFitStatus(
  chosenDays: number,
  minDays: number,
  recommendedDays: number,
  comfortableDays: number,
): Exclude<DurationFitStatus, 'empty'> {
  const chosen = clampDays(chosenDays)
  const recommended = clampDays(Math.max(recommendedDays, minDays))
  const comfortable = clampDays(Math.max(comfortableDays, recommended))
  const lightThreshold = Math.max(recommended + 2, comfortable)
  if (chosen < recommended) return 'too_packed'
  if (chosen > lightThreshold) return 'too_light'
  return 'balanced'
}

export function fitStatusTitle(status: Exclude<DurationFitStatus, 'empty'>): string {
  if (status === 'too_packed') return '行程過於緊湊，建議延長天數'
  if (status === 'too_light') return '行程天數偏多，可適度縮短'
  return '天數與景點搭配合理'
}

export interface DurationAssessment {
  status: DurationFitStatus
  chosenDays: number
  /** Tight but doable length for the selected spots. */
  minDays: number
  /** Normal / recommended completion duration. */
  recommendedDays: number
  /** Comfortable length with rest / photo buffer. */
  comfortableDays: number
  totalSpotHours: number
  longTripCount: number
  areaCount: number
  title: string
  message: string
}

/**
 * Compare the user's chosen trip length with how long the selected spots
 * normally take to complete at the chosen pace.
 */
export function assessDurationFit(options: {
  spots: ScenicSpot[]
  chosenDays: number
  pace: TripPace
  specialNeeds?: string[]
  destination?: Destination | null
}): DurationAssessment {
  const chosenDays = clampDays(options.chosenDays)
  const selected = options.spots
  const pace = options.pace
  const specialNeeds = options.specialNeeds ?? []
  const dest = options.destination

  if (!selected.length) {
    return {
      status: 'empty',
      chosenDays,
      minDays: dest?.recommendedDays.min ?? MIN_TRIP_DAYS,
      recommendedDays: dest?.recommendedDays.comfortable ?? chosenDays,
      comfortableDays: dest?.recommendedDays.suggestedLongest ?? chosenDays,
      totalSpotHours: 0,
      longTripCount: 0,
      areaCount: 0,
      title: '尚未選擇景點',
      message: '先勾選想去的景點，系統會估算正常完成需要幾天。',
    }
  }

  const hoursPerDay =
    pace === 'packed' ? 9 : pace === 'relaxed' ? 5.5 : 7
  const spotsPerDay =
    tripPaces.find((p) => p.id === pace)?.spotsPerDay ?? 3

  const totalSpotHours = selected.reduce((sum, s) => sum + s.stayHours, 0)
  const longTrips = selected.filter((s) => s.stayHours >= 6)
  const shortSpots = selected.filter((s) => s.stayHours < 6)
  const areas = new Set(selected.map((s) => s.area))
  const areaCount = areas.size

  // Each long day-trip roughly occupies a full day.
  const longTripDays = longTrips.length
  // Short spots packed by daily capacity (hours + count).
  const shortByHours = Math.ceil(
    shortSpots.reduce((sum, s) => sum + s.stayHours, 0) / hoursPerDay,
  )
  const shortByCount = Math.ceil(shortSpots.length / spotsPerDay)
  const shortDays = Math.max(shortByHours, shortByCount, shortSpots.length ? 1 : 0)

  // Moving between many areas / bases needs transit or buffer days.
  const transitBuffers = Math.max(0, areaCount - 1)
  const photoHeavy = selected.filter((s) => s.tags.includes('photo')).length
  const photoBuffer = photoHeavy >= 5 || specialNeeds.some((n) => n.includes('打卡')) ? 1 : 0
  const altitudeBuffer = specialNeeds.some((n) => n.includes('高原')) ? 1 : 0
  const arrivalDeparture = 1 // arrival or soft start

  let minDays = clampDays(longTripDays + shortDays + Math.ceil(transitBuffers * 0.5))
  let recommendedDays = clampDays(
    longTripDays + shortDays + transitBuffers + arrivalDeparture + photoBuffer,
  )
  let comfortableDays = clampDays(
    recommendedDays + 1 + altitudeBuffer + (pace === 'relaxed' ? 1 : 0),
  )

  // If destination has a curated plan near this spot load, prefer its advice.
  if (dest?.curatedPlans) {
    const curatedLengths = Object.keys(dest.curatedPlans)
      .map(Number)
      .sort((a, b) => a - b)
    const fullSelectRatio = selected.length / Math.max(dest.spots.length, 1)
    if (fullSelectRatio >= 0.75 && curatedLengths.length) {
      const curated = curatedLengths[0]
      minDays = clampDays(Math.min(minDays, dest.recommendedDays.min))
      recommendedDays = clampDays(Math.max(recommendedDays, dest.recommendedDays.comfortable))
      comfortableDays = clampDays(
        Math.max(comfortableDays, dest.recommendedDays.suggestedLongest, curated),
      )
      // Selecting almost all curated spots → normal completion is the comfortable length.
      if (fullSelectRatio >= 0.9) {
        recommendedDays = dest.recommendedDays.comfortable
        minDays = dest.recommendedDays.min
        comfortableDays = dest.recommendedDays.suggestedLongest
      }
    } else if (fullSelectRatio < 0.5) {
      // Heavily trimmed curated route can finish sooner.
      recommendedDays = clampDays(Math.min(recommendedDays, dest.recommendedDays.comfortable - 2))
      comfortableDays = clampDays(Math.min(comfortableDays, dest.recommendedDays.comfortable))
      minDays = clampDays(Math.min(minDays, recommendedDays - 1))
    }
  }

  // Ensure ordering min <= recommended <= comfortable
  recommendedDays = clampDays(Math.max(recommendedDays, minDays))
  comfortableDays = clampDays(Math.max(comfortableDays, recommendedDays))

  const packedThreshold = recommendedDays
  const lightThreshold = Math.max(recommendedDays + 2, comfortableDays)

  let status: DurationFitStatus = 'balanced'
  if (chosenDays < packedThreshold) status = 'too_packed'
  else if (chosenDays > lightThreshold) status = 'too_light'

  const hoursLabel = `${Math.round(totalSpotHours)} 小時景點量`
  const areaLabel = `${areaCount} 個區域`
  const longLabel = longTripDays ? `、${longTripDays} 個全日級行程` : ''

  if (status === 'too_packed') {
    return {
      status,
      chosenDays,
      minDays,
      recommendedDays,
      comfortableDays,
      totalSpotHours,
      longTripCount: longTripDays,
      areaCount,
      title: '景點偏多，天數可能不夠',
      message: `你選了 ${selected.length} 個景點（約 ${hoursLabel}，${areaLabel}${longLabel}）。以「${tripPaces.find((p) => p.id === pace)?.label ?? '平衡'}」節奏，正常完成大約需要 ${recommendedDays} 天（最少 ${minDays} 天，舒服可到 ${comfortableDays} 天）。現在的 ${chosenDays} 天會偏趕，建議加長天數或減少景點。`,
    }
  }

  if (status === 'too_light') {
    return {
      status,
      chosenDays,
      minDays,
      recommendedDays,
      comfortableDays,
      totalSpotHours,
      longTripCount: longTripDays,
      areaCount,
      title: '天數偏多，景點相對不足',
      message: `以目前 ${selected.length} 個景點估算，正常完成約 ${recommendedDays} 天就夠（舒服版 ${comfortableDays} 天）。你選了 ${chosenDays} 天，多出來的日子會變成彈性／休息日；也可以再加景點，或把天數調回建議值。`,
    }
  }

  return {
    status,
    chosenDays,
    minDays,
    recommendedDays,
    comfortableDays,
    totalSpotHours,
    longTripCount: longTripDays,
    areaCount,
    title: '天數與景點搭配剛好',
    message: `目前 ${chosenDays} 天可以正常完成這 ${selected.length} 個景點（約 ${hoursLabel}，${areaLabel}${longLabel}）。建議完成天數 ${recommendedDays} 天；想更鬆可留到 ${comfortableDays} 天。`,
  }
}

function sortSpotsForTraveler(
  spots: ScenicSpot[],
  companion: Companion,
  specialNeeds: string[],
): ScenicSpot[] {
  const wantsPhoto = specialNeeds.some((n) => n.includes('打卡'))
  const wantsCulture = specialNeeds.some((n) => n.includes('歷史'))
  const wantsFood = specialNeeds.some((n) => n.includes('美食'))
  const wantsNature = specialNeeds.some((n) => n.includes('自然'))
  const wantsShopping = specialNeeds.some((n) => n.includes('購物'))
  const avoidCrowd = specialNeeds.some((n) => n.includes('人潮'))

  return [...spots].sort((a, b) => score(b) - score(a))

  function score(s: ScenicSpot): number {
    let n = 0
    if (s.tags.includes('must')) n += 8
    if (s.tags.includes('photo')) n += wantsPhoto ? 6 : 3
    if (s.tags.includes('popular')) n += avoidCrowd ? -2 : 2
    if (s.tags.includes('culture') && wantsCulture) n += 4
    if (s.tags.includes('food') && wantsFood) n += 4
    if (s.tags.includes('nature') && wantsNature) n += 4
    if (s.tags.includes('shopping') && wantsShopping) n += 3
    if (s.bestFor.includes(companion)) n += 2
    return n
  }
}

function groupByArea(spots: ScenicSpot[]): Map<string, ScenicSpot[]> {
  const map = new Map<string, ScenicSpot[]>()
  for (const spot of spots) {
    const list = map.get(spot.area) ?? []
    list.push(spot)
    map.set(spot.area, list)
  }
  return map
}

function timeLabel(hour: number, minute = 0): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function applySpotFilterToCurated(
  plan: DayPlan[],
  selectedSpotIds: string[],
): DayPlan[] {
  const selected = new Set(selectedSpotIds)
  return plan.map((day) => {
    const keptSpots = day.spotIds.filter((id) => selected.has(id))
    // Transit / rest days may have no selectable highlights — keep them.
    if (!day.spotIds.length || keptSpots.length > 0) {
      return {
        ...day,
        schedule: day.schedule.filter(
          (item) => !item.spotId || selected.has(item.spotId),
        ),
        spotIds: keptSpots,
      }
    }
    return {
      ...day,
      theme: `${day.theme}（已依你的景點選擇精簡）`,
      schedule: [
        {
          time: '10:00',
          title: '彈性調整日',
          detail: '這天原定景點已被取消勾選，可改休息、補拍或請司機調整順路點。',
        },
        ...day.schedule.filter((item) => !item.spotId),
      ],
      tip: '回到景點步驟重新勾選，或維持彈性日也沒問題。',
      spotIds: [],
    }
  })
}

export function buildItinerary(options: {
  destinations: Destination[]
  selectedSpotIds: string[]
  days: number
  pace: TripPace
  companion: Companion
  specialNeeds: string[]
  hotelAreaHint: string
}): DayPlan[] {
  const days = clampDays(options.days)
  const { destinations: dests, selectedSpotIds, pace, companion, specialNeeds, hotelAreaHint } =
    options

  // Prefer a handcrafted plan (e.g. 青甘大環線 14 日) when available.
  if (dests.length === 1) {
    const curated = dests[0].curatedPlans?.[days]
    if (curated?.length) {
      return applySpotFilterToCurated(curated, selectedSpotIds)
    }
  }

  const spotsPerDay = tripPaces.find((p) => p.id === pace)?.spotsPerDay ?? 3
  const lateStart = specialNeeds.some((n) => n.includes('十點'))
  const startHour = lateStart || specialNeeds.some((n) => n.includes('少走路')) ? 10 : 9

  const allSpots = dests.flatMap((d) => d.spots)
  const selected = sortSpotsForTraveler(
    allSpots.filter((s) => selectedSpotIds.includes(s.id)),
    companion,
    specialNeeds,
  )
  const flexIdeas = dests.flatMap((d) => d.flexDayIdeas)

  if (!selected.length) {
    return Array.from({ length: days }, (_, i) => ({
      theme: `Day ${i + 1} · 自由活動`,
      stayArea: hotelAreaHint || dests[0]?.nameZh || '市區',
      schedule: [
        {
          time: '10:00',
          title: '尚未選擇景點',
          detail: '請回到景點步驟勾選想去的地方，再重新產生行程。',
        },
      ],
      budget: '視當日安排',
      tip: '至少選擇 2–3 個景點，行程會更完整。',
      spotIds: [],
    }))
  }

  const longSpots = selected.filter((s) => s.stayHours >= 6)
  const shortSpots = selected.filter((s) => s.stayHours < 6)
  const areaGroups = [...groupByArea(shortSpots).entries()].sort(
    (a, b) => b[1].length - a[1].length,
  )
  const orderedShort: ScenicSpot[] = []
  for (const [, group] of areaGroups) orderedShort.push(...group)

  const dayBuckets: ScenicSpot[][] = Array.from({ length: days }, () => [])

  longSpots.forEach((spot, idx) => {
    const dayIndex = Math.min(days - 1, Math.max(1, idx + 1))
    if (dayBuckets[dayIndex].length === 0) dayBuckets[dayIndex].push(spot)
    else {
      const empty = dayBuckets.findIndex((b) => b.length === 0)
      if (empty >= 0) dayBuckets[empty].push(spot)
      else dayBuckets[dayIndex].push(spot)
    }
  })

  let cursor = 0
  for (const spot of orderedShort) {
    let placed = false
    for (let offset = 0; offset < days; offset++) {
      const i = (cursor + offset) % days
      const bucket = dayBuckets[i]
      const usedHours = bucket.reduce((sum, s) => sum + s.stayHours, 0)
      const countLimit = bucket.some((s) => s.stayHours >= 6) ? 1 : spotsPerDay
      if (bucket.length < countLimit && usedHours + spot.stayHours <= spotsPerDay * 2.8) {
        bucket.push(spot)
        cursor = (i + (bucket.length >= countLimit ? 1 : 0)) % days
        placed = true
        break
      }
    }
    if (!placed) {
      // Prefer empty days first (long trips), else lightest day
      const empty = dayBuckets.findIndex((b) => b.length === 0)
      const fallback =
        empty >= 0
          ? empty
          : dayBuckets.reduce(
              (best, bucket, i) => (bucket.length < dayBuckets[best].length ? i : best),
              0,
            )
      dayBuckets[fallback].push(spot)
    }
  }

  return dayBuckets.map((bucket, index) => {
    const isFirst = index === 0
    const isLast = index === days - 1
    const flexIdea = flexIdeas[index % Math.max(flexIdeas.length, 1)] || '街區慢遊與咖啡'
    const area = bucket[0]?.area || hotelAreaHint || '市區'
    const themeCore =
      bucket.length === 0
        ? `彈性日・${flexIdea}`
        : bucket.some((s) => s.stayHours >= 6)
          ? bucket[0].name
          : `${area} 精華`

    const schedule: ScheduleItem[] = []
    let hour = isFirst ? Math.max(startHour, 10) : startHour

    if (bucket.length === 0) {
      schedule.push(
        {
          time: timeLabel(hour),
          title: '晚起／自由早餐',
          detail: '天數較長時保留空白日，避免旅遊疲勞。',
        },
        {
          time: timeLabel(hour + 2),
          title: flexIdea,
          detail: '可臨時決定；也可把前幾天沒排進去的想去之處補上。',
        },
        {
          time: timeLabel(15),
          title: '咖啡或購物',
          detail: specialNeeds.includes('想安排購物')
            ? '今天很適合藥妝／伴手禮補貨。'
            : '放慢，幫後面幾天留體力。',
        },
        {
          time: timeLabel(19),
          title: '晚餐與回飯店',
          detail: `住 ${hotelAreaHint || area}`,
        },
      )
      return {
        theme: themeCore,
        stayArea: hotelAreaHint || area,
        schedule,
        budget: '€/¥/NT$ 視當日消費，通常低於觀光日',
        tip: '長行程的空白日不是浪費，是讓整體更舒適。',
        spotIds: [],
      }
    }

    if (isFirst) {
      schedule.push({
        time: timeLabel(Math.max(9, hour - 1)),
        title: '抵達 / 入住安頓',
        detail: `建議住在 ${hotelAreaHint || area}，先放行李再出門。`,
      })
    } else {
      schedule.push({
        time: timeLabel(hour),
        title: '出發',
        detail: specialNeeds.includes('避開人潮')
          ? '稍早出門，熱門點比較好拍。'
          : lateStart
            ? '依你的習慣，十點後再出發。'
            : '吃完早餐後依路線前往第一站。',
      })
      hour += 1
    }

    bucket.forEach((spot, spotIndex) => {
      if (spotIndex === 1 || (spotIndex === 0 && hour >= 12 && hour <= 13)) {
        schedule.push({
          time: timeLabel(Math.min(hour, 13)),
          title: '午餐',
          detail: specialNeeds.includes('想多吃在地美食')
            ? '優先選在地小館，避開純觀光菜單。'
            : `在 ${spot.area} 附近用餐，再續行程。`,
        })
        hour = Math.max(hour, 13) + 1
      }

      schedule.push({
        time: timeLabel(Math.min(hour, 18)),
        title: spot.name,
        detail: `${spot.summary} 建議停留約 ${spot.stayHours} 小時${
          spot.ticket ? `｜${spot.ticket}` : ''
        }.${spot.tags.includes('photo') ? ' 記得留打卡時間。' : ''}`,
        spotId: spot.id,
      })
      hour += Math.max(1, Math.ceil(Math.min(spot.stayHours, 4)))
    })

    if (isLast) {
      schedule.push({
        time: timeLabel(Math.min(hour, 16)),
        title: '伴手禮 / 前往機場或車站',
        detail: '預留 60–90 分鐘交通緩衝。',
      })
    } else {
      schedule.push({
        time: timeLabel(Math.min(Math.max(hour, 18), 20)),
        title: '晚餐與回飯店',
        detail: `今晚住 ${hotelAreaHint || area}。`,
      })
    }

    const tickety = bucket.filter((s) => s.ticket && !s.ticket.includes('免費')).length
    const budgetLow = 40 + bucket.length * 12 + tickety * 8
    const budgetHigh = budgetLow + 45 + (pace === 'packed' ? 20 : 0)

    return {
      theme: `${isFirst ? '抵達 · ' : isLast ? '收尾 · ' : ''}${themeCore}`,
      stayArea: hotelAreaHint || area,
      schedule,
      budget: `當日約 ${budgetLow}–${budgetHigh} 單位（不含住宿，幣別依目的地）`,
      tip: buildDayTip(bucket, specialNeeds, pace),
      spotIds: bucket.map((s) => s.id),
    }
  })
}

function buildDayTip(bucket: ScenicSpot[], specialNeeds: string[], pace: TripPace): string {
  if (!bucket.length) return '這天可當雨備或購物彈性日。'
  if (bucket.some((s) => s.stayHours >= 6)) return '長程日遊：交通與門票請前一晚確認。'
  if (specialNeeds.includes('避開人潮')) return '熱門點盡量開館就到，午后改逛巷弄。'
  if (pace === 'relaxed') return '今天偏鬆，景點間可插入咖啡時間。'
  if (bucket.every((s) => s.area === bucket[0].area)) return '同區域串連，減少交通折返。'
  return '已依區域盡量順路；若太趕可刪掉最後一站。'
}
