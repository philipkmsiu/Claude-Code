export type {
  BudgetSummary,
  Companion,
  DayPlan,
  DayRouteLeg,
  Destination,
  DestinationId,
  DestinationPhoto,
  HotelGuideRow,
  HotelOption,
  HotelStayBlock,
  HotelStayPlan,
  HotelStyle,
  ScheduleItem,
  ScenicSpot,
  SeasonGuide,
  SpotTag,
  TransportMode,
  TripHandbook,
  TripPace,
  VisualPosterContent,
} from './types'

import type {
  BudgetSummary,
  Companion,
  DayPlan,
  DayRouteLeg,
  Destination,
  HotelOption,
  HotelStayPlan,
  HotelStyle,
  ScheduleItem,
  ScenicSpot,
  SeasonGuide,
  SpotTag,
  TransportMode,
  TripPace,
  VisualPosterContent,
} from './types'
import { qingganDestination } from './qinggan'
import { xinjiangDestination } from './xinjiang'

/** Hard ceiling for manual day input — long trips (e.g. 新疆 29 日) are allowed. */
export const MAX_TRIP_DAYS = 32
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
  if (/青甘|翡翠湖|艾肯泉|茫崖|敦煌.*環線|環線.*敦煌/.test(name)) {
    return qingganDestination
  }
  if (/新疆|南北疆|喀納斯|禾木|喀什|帕米爾|賽里木/.test(name)) {
    return xinjiangDestination
  }
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

export function isLongHaulDestination(name: string): boolean {
  return /新疆|南北疆|青甘|大環線|環線|帕米爾|自駕公路|西藏.*線|川藏|滇藏/.test(name)
}

/** Infer trip length from destination wording (環線 / 南北疆 / 慢遊 etc.). */
export function inferCustomTripProfile(name: string): {
  recommendedDays: Destination['recommendedDays']
  tagline: string
  intro: string
  background: string
  memorable: string[]
  bestSeason: string
  seasonGuide: SeasonGuide
  spots: ScenicSpot[]
  tips: string[]
  flexDayIdeas: string[]
} {
  const text = name.trim()
  const seasonGuide = inferSeasonGuide(text)
  const slow = /慢遊|舒適|深度|悠閒|放慢/.test(text)
  const loop =
    /環線|南北疆|北疆.*南疆|南疆.*北疆|大環線|自駕|公路/.test(text) ||
    (/新疆/.test(text) && /南北|環/.test(text))
  const xinjiang = /新疆|北疆|南疆|喀納斯|喀什|伊犁|帕米爾/.test(text)
  const multiCity = /[＋+及與和／/]/.test(text) || (text.match(/[市縣州島]/g)?.length ?? 0) >= 2
  const paris = /巴黎|Paris/i.test(text)

  // Single Chinese historic cities: keep advice in a realistic city-break range.
  if (/西安|西京|兵馬俑/.test(text) && !loop) {
    return {
      recommendedDays: {
        min: 3,
        comfortable: slow ? 6 : 5,
        suggestedLongest: 8,
        note: `${text}：市區＋兵馬俑／華山通常 4–6 天即可；想慢遊可到 7–8 天，不必拉成兩週以上。`,
      },
      tagline: '古都城市遊・天數保持務實',
      intro: `${text} 以古城、博物館與近郊日遊為主。系統會避免把城市遊估成超長環線；若勾選過多景點，請刪減或小幅加天，而不是直接拉到 20 天。`,
      background:
        '西安是周秦漢唐等十三朝古都，也是絲綢之路的起點城市。城牆、碑林、大雁塔與兵馬俑，把「帝國都城」與「地下軍團」濃縮在可步行、可日遊的尺度裡。',
      memorable: [
        '兵馬俑地下軍團的震撼尺度',
        '騎行或步行西安城牆看日落',
        '回民街的泡饃、烤肉與夜色',
        '華山長空棧道與蒼龍嶺的記憶點',
      ],
      bestSeason: `最適合 ${formatMonthsZh(seasonGuide.bestMonths)}；最不建議 ${formatMonthsZh(seasonGuide.worstMonths)}`,
      seasonGuide,
      spots: spotsFromSeeds(text, cityTemplateSeeds(text)),
      flexDayIdeas: ['華山全日日遊', '回民街美食夜遊', '雨備博物館日'],
      tips: [
        '兵馬俑建議一早到達；華山請獨立留一整天。',
        '若系統提示天數不夠，優先取消較遠或重複的點，而不是盲目加到 20 天。',
      ],
    }
  }

  if (paris) {
    return {
      recommendedDays: {
        min: 4,
        comfortable: slow ? 7 : 6,
        suggestedLongest: 10,
        note: `${text}：市區精華約 4–6 天；想慢逛美術館與近郊，7–10 天更舒服。`,
      },
      tagline: '藝術之都・博物館與街角生活',
      intro: `${text} 以博物館、塞納河與街區漫遊為主。別把每天排滿打卡；留時間坐咖啡館，行程會更好記。`,
      background:
        '巴黎是法國首都，也是近代藝術、時尚與城市規劃的重要舞台。從聖母院、羅浮宮到艾菲爾鐵塔，城市本身就像一座可步行的大型博物館。',
      memorable: [
        '塞納河黃昏與橋上的風',
        '羅浮宮或奧賽待上一整個半天',
        '蒙馬特石階與白聖殿俯瞰',
        '街角咖啡館裡「什麼都不急」的下午',
      ],
      bestSeason: `最適合 ${formatMonthsZh(seasonGuide.bestMonths)}；最不建議 ${formatMonthsZh(seasonGuide.worstMonths)}`,
      seasonGuide,
      spots: spotsFromSeeds(text, cityTemplateSeeds(text)),
      flexDayIdeas: ['凡爾賽宮日遊', '蒙馬特慢遊日', '雨備博物館日'],
      tips: [
        '熱門館需預約時段；星期一／二部分場館休館請先查。',
        '地鐵＋步行最有效率；把同一區景點排在同一天。',
      ],
    }
  }

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
      background:
        '新疆古稱西域，絲路東西交流在此匯聚：北疆是森林草原與高山湖泊，南疆是綠洲古城與帕米爾高原。走南北疆，等於同時讀「自然史詩」與「人文長卷」。',
      memorable: [
        '喀納斯／禾木秋色與木屋煙火',
        '賽里木湖的純淨藍色',
        '喀什老城與巴扎的氣味、音樂',
        '帕米爾高原的雪山盤山路',
      ],
      bestSeason: `最適合 ${formatMonthsZh(seasonGuide.bestMonths)}；最不建議 ${formatMonthsZh(seasonGuide.worstMonths)}`,
      seasonGuide,
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
      background:
        '新疆幅員遼闊，單邊深度遊已能感受到西域的尺度：草原、雪山、綠洲與市集交錯。重點不是「去很多點」，而是讓風景有時間進記憶。',
      memorable: [
        '長公路兩旁不斷變換的地形色帶',
        '夜裡星空與溫差很大的體感',
        '羊肉、抓飯與奶茶的味道記憶',
        '某一站突然安靜下來的湖邊或山谷',
      ],
      bestSeason: `最適合 ${formatMonthsZh(seasonGuide.bestMonths)}；最不建議 ${formatMonthsZh(seasonGuide.worstMonths)}`,
      seasonGuide,
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
      background: `${text} 偏公路／環線型旅行：風景與移動本身就是主菜。這類路線往往串起不同地形與聚落，適合用較長天數換取舒適與彈性。`,
      memorable: [
        '車窗外連續變換的地貌',
        '某一個不意停下的觀景點',
        '換宿前最後一眼的晚霞',
        '和同伴分享的長途聊天與歌單',
      ],
      bestSeason: `最適合 ${formatMonthsZh(seasonGuide.bestMonths)}；最不建議 ${formatMonthsZh(seasonGuide.worstMonths)}`,
      seasonGuide,
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
      background: `${text} 適合用稍長天數慢慢認識：多留街區、食物與日常節奏，比塞滿打卡清單更容易帶走完整印象。`,
      memorable: [
        '某一條會想再走一次的街',
        '一頓意外好吃的在地餐',
        '傍晚光線最好的拍照時刻',
        '沒排進行程、卻最記得的小角落',
      ],
      bestSeason: `最適合 ${formatMonthsZh(seasonGuide.bestMonths)}；最不建議 ${formatMonthsZh(seasonGuide.worstMonths)}`,
      seasonGuide,
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
    background: `${text} 的魅力，通常藏在地標之外的日常：街道尺度、食物氣味、人們的節奏。先抓幾天精華，再依興趣加深，會比一次排滿更記得住。`,
    memorable: [
      '第一眼的城市天際線或老城入口',
      '一頓代表當地味道的餐',
      '夜裡最有氣氛的那條街',
      '離開前想再拍一次的畫面',
    ],
    bestSeason: `最適合 ${formatMonthsZh(seasonGuide.bestMonths)}；最不建議 ${formatMonthsZh(seasonGuide.worstMonths)}`,
    seasonGuide,
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
    let hours =
      Number.isFinite(stayHours) && stayHours > 0
        ? Math.min(10, Math.max(1, stayHours))
        : 2
    // Full-day excursions must occupy their own day in packing / fit math.
    if (/華山|黃山|張家界|峨眉|日遊|一日遊/.test(name)) {
      hours = Math.max(hours, 7)
    }
    spots.push({
      id: `ai-spot-${slugifyDestination(place)}-${stamp}-${index + 1}`,
      name,
      nameLocal: item.nameLocal?.trim() || name,
      area: item.area?.trim() || '市區',
      stayHours: hours,
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
    background: profile.background,
    memorable: profile.memorable,
    bestSeason: profile.bestSeason,
    seasonGuide: profile.seasonGuide,
    recommendedDays: profile.recommendedDays,
    weather: {
      spring: `較佳參考：${formatMonthsZh(profile.seasonGuide.bestMonths)} 前後`,
      summer: profile.seasonGuide.worstMonths.some((m) => m >= 6 && m <= 8)
        ? `盛夏可能較差：${profile.seasonGuide.worstReason}`
        : '請出發前查當地氣溫與降雨',
      autumn: `較佳參考：${formatMonthsZh(profile.seasonGuide.bestMonths)} 前後`,
      winter: profile.seasonGuide.worstMonths.some((m) => m === 12 || m <= 2)
        ? `嚴冬可能較差：${profile.seasonGuide.worstReason}`
        : '請出發前查當地氣溫與降雨',
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

type BudgetRegion = 'china' | 'japan' | 'europe' | 'default'

function budgetRegion(destinationName: string): BudgetRegion {
  const name = destinationName.trim()
  if (
    /日本|東京|大阪|京都|北海道|關西|沖繩|Japan|Tokyo|Osaka|Kyoto/i.test(name)
  ) {
    return 'japan'
  }
  if (
    /法國|巴黎|義大利|德國|西班牙|歐洲|France|Paris|Italy|Germany|Europe/i.test(
      name,
    )
  ) {
    return 'europe'
  }
  if (
    /中國|大陸|西安|北京|上海|成都|重慶|杭州|桂林|雲南|西藏|新疆|青甘|敦煌|青海|甘肅|西北|華山|兵馬俑|China|Xi.?an/i.test(
      name,
    )
  ) {
    return 'china'
  }
  return 'default'
}

function fmtMoney(currency: string, n: number): string {
  const rounded = Math.round(n / 100) * 100
  return `${currency} ${rounded.toLocaleString('en-US')}`
}

function rangeMoney(currency: string, low: number, high: number): string {
  return `${fmtMoney(currency, low)}–${fmtMoney(currency, high).replace(`${currency} `, '')}`
}

/**
 * Always-available trip budget: hotel, transport, meals, tickets, misc, total + per person.
 * Used for every journey (not only Qinggan / Xinjiang handbooks).
 */
export function estimateTripBudget(options: {
  destinationName: string
  days: number
  nights: number
  partySize: number
  rooms: number
  transportMode: TransportMode
  hotelStyle: HotelStyle
}): BudgetSummary {
  const days = clampDays(options.days)
  const nights = Math.max(nightsFromDays(days), options.nights || 0)
  const party = clampPartySize(options.partySize)
  const rooms = Math.max(1, options.rooms || hotelBookingAdvice(party).rooms)
  const region = budgetRegion(options.destinationName)
  const longHaul = /新疆|南北疆|青甘|環線|公路|帕米爾/.test(options.destinationName)

  const styleMul =
    options.hotelStyle === 'luxury'
      ? 1.7
      : options.hotelStyle === 'luxuryValue'
        ? 1.35
        : options.hotelStyle === 'value' || options.hotelStyle === 'clean'
          ? 0.85
          : 1

  let currency = 'RMB'
  let hotelNight = 650
  let mealDay = 220
  let ticketDay = 120
  let transitDay = 80
  let driverDay = 900
  let selfDriveDay = 450
  let miscBase = 800

  if (region === 'japan') {
    currency = 'JPY'
    hotelNight = 18000
    mealDay = 6000
    ticketDay = 2500
    transitDay = 2000
    driverDay = 45000
    selfDriveDay = 12000
    miscBase = 15000
  } else if (region === 'europe') {
    currency = 'EUR'
    hotelNight = 160
    mealDay = 55
    ticketDay = 30
    transitDay = 20
    driverDay = 350
    selfDriveDay = 90
    miscBase = 200
  } else if (region === 'default') {
    currency = 'HKD'
    hotelNight = 900
    mealDay = 280
    ticketDay = 150
    transitDay = 100
    driverDay = 1200
    selfDriveDay = 600
    miscBase = 1000
  }

  if (region === 'china' && longHaul) {
    hotelNight = 900
    driverDay = 1200
    ticketDay = 160
    mealDay = 250
  }

  hotelNight = Math.round(hotelNight * styleMul)

  const hotelLow = hotelNight * 0.85 * nights * rooms
  const hotelHigh = hotelNight * 1.25 * nights * rooms

  let transportLabel = '大眾運輸／短程計程車'
  let transportDetail = '交通卡、單程票、短程計程車緩衝'
  let transportLow = transitDay * days * party
  let transportHigh = transitDay * 1.4 * days * party

  if (options.transportMode === 'private_driver') {
    transportLabel = '包車＋司機'
    transportDetail = longHaul
      ? `${days} 日商務車／高原或長線司機（油費過路視報價）`
      : `${days} 日專車接送（含市區及近郊景點）`
    transportLow = driverDay * days * (party >= 5 ? 1.15 : 1)
    transportHigh = driverDay * 1.35 * days * (party >= 5 ? 1.2 : 1)
  } else if (options.transportMode === 'self_drive') {
    transportLabel = '租車／自駕'
    transportDetail = `${days} 日租車＋油費＋停車／過路預留`
    transportLow = selfDriveDay * days
    transportHigh = selfDriveDay * 1.4 * days
  }

  const mealLow = mealDay * 0.85 * days * party
  const mealHigh = mealDay * 1.25 * days * party
  const ticketLow = ticketDay * 0.7 * days * party
  const ticketHigh = ticketDay * 1.3 * days * party
  const miscLow = miscBase + party * 150
  const miscHigh = miscBase * 1.8 + party * 280

  const totalLow = hotelLow + transportLow + mealLow + ticketLow + miscLow
  const totalHigh = hotelHigh + transportHigh + mealHigh + ticketHigh + miscHigh

  const perLow = totalLow / party
  const perHigh = totalHigh / party

  return {
    title: `${options.destinationName}・${party} 人・${days} 天 ${nights} 夜預算估算`,
    totalRange: `總預算約 ${rangeMoney(currency, totalLow, totalHigh)}`,
    perPerson: `人均約 ${rangeMoney(currency, perLow, perHigh)}`,
    currencyNote: `依目前選擇（${transportModeLabel(options.transportMode)}／住宿風格）估算；不含出發地國際機票。實際以當季報價為準。`,
    lines: [
      {
        item: '酒店住宿',
        detail: `${nights} 晚 × 約 ${rooms} 間房`,
        amount: rangeMoney(currency, hotelLow, hotelHigh),
        perPerson: rangeMoney(currency, hotelLow / party, hotelHigh / party),
      },
      {
        item: transportLabel,
        detail: transportDetail,
        amount: rangeMoney(currency, transportLow, transportHigh),
        perPerson: rangeMoney(currency, transportLow / party, transportHigh / party),
      },
      {
        item: '餐飲',
        detail: `約 ${days} 日餐費（含特色餐預留）`,
        amount: rangeMoney(currency, mealLow, mealHigh),
        perPerson: rangeMoney(currency, mealLow / party, mealHigh / party),
      },
      {
        item: '門票／活動',
        detail: '景點門票、區間車、體驗預留',
        amount: rangeMoney(currency, ticketLow, ticketHigh),
        perPerson: rangeMoney(currency, ticketLow / party, ticketHigh / party),
      },
      {
        item: '保險／雜費',
        detail: '保險、小費、飲料、臨時購物緩衝',
        amount: rangeMoney(currency, miscLow, miscHigh),
        perPerson: rangeMoney(currency, miscLow / party, miscHigh / party),
      },
    ],
    optimizeTips: [
      '酒店與包車建議比價 2–3 間／車隊，並確認取消條款。',
      '旺季景區房與司機價波動大，請按最終日期鎖價。',
      options.transportMode === 'public_transit'
        ? '可再加交通卡／一日券，通常比全程計程車更省。'
        : '詢價時確認油費、過路、停車、司機食宿是否全包。',
    ],
  }
}

export const transportModes: {
  id: TransportMode
  label: string
  description: string
  easeNote: string
}[] = [
  {
    id: 'private_driver',
    label: '包司機',
    description: '專車接送，景點間免轉乘，行程最輕鬆。',
    easeNote: '最省事：行李、長輩、分散景點都適合。',
  },
  {
    id: 'self_drive',
    label: '自駕',
    description: '自己開車，路線靈活，需留意停車與路況。',
    easeNote: '自由度高，但要自己找路、加油與停車。',
  },
  {
    id: 'public_transit',
    label: '大眾運輸',
    description: '地鐵／火車／巴士為主，每日標示怎麼去、路線感覺。',
    easeNote: '省錢好逛市區；跨區會多轉乘，App 查班次很重要。',
  },
]

export function transportModeLabel(mode: TransportMode): string {
  return transportModes.find((item) => item.id === mode)?.label ?? mode
}

/** Placeholder examples for the custom-spot input — always match the current destination. */
export function spotInputExamples(destinationName: string): string {
  const name = destinationName.trim()
  if (!name) return '例如：兵馬俑、回民街（可直接貼上）'
  if (/青甘|敦煌|翡翠湖|青海湖|嘉峪關/.test(name)) {
    return '例如：莫高窟、翡翠湖、艾肯泉（可直接貼上）'
  }
  if (/新疆|南北疆|喀納斯|禾木|喀什|賽里木/.test(name)) {
    return '例如：喀納斯三灣、禾木村、賽里木湖（可直接貼上）'
  }
  if (/西安|西京|兵馬俑/.test(name)) {
    return '例如：兵馬俑、回民街、大唐不夜城（可直接貼上）'
  }
  if (/北京|故宮|長城/.test(name)) {
    return '例如：故宮、長城、頤和園（可直接貼上）'
  }
  if (/上海|外灘/.test(name)) {
    return '例如：外灘、豫園、迪士尼（可直接貼上）'
  }
  if (/成都|重慶|寬窄|洪崖洞/.test(name)) {
    return '例如：寬窄巷子、大熊貓基地、洪崖洞（可直接貼上）'
  }
  if (/關西|大阪|京都|奈良/.test(name)) {
    return '例如：伏見稻荷、道頓堀、清水寺（可直接貼上）'
  }
  if (/北海道|札幌|小樽/.test(name)) {
    return '例如：小樽運河、白色戀人公園、富良野（可直接貼上）'
  }
  if (/巴黎|法國|France|Paris/i.test(name)) {
    return '例如：艾菲爾鐵塔、羅浮宮、蒙馬特（可直接貼上）'
  }
  if (/東京|Japan|日本/.test(name) && !/關西|大阪|京都/.test(name)) {
    return '例如：淺草寺、渋谷、團隊Lab（可直接貼上）'
  }
  // Generic: use the destination name so China trips never show France examples.
  return `例如：${name}經典地標、${name}老城／夜市（可直接貼上）`
}

/** Destination-aware Stage-4 poster side content when handbook has none. */
export function inferVisualPoster(options: {
  destinationName: string
  days: number
  nights: number
  transportMode: TransportMode
}): VisualPosterContent {
  const { destinationName, days, nights, transportMode } = options
  const name = destinationName.trim()
  const themeLine = `${days} 天 ${nights} 夜｜${transportModeLabel(transportMode)}｜舒適慢遊視覺摘要`

  if (/西安|西京|兵馬俑/.test(name)) {
    return {
      themeLine,
      mustEat: [
        { name: '肉夾饃', daysLabel: '市區日', motif: '🥪' },
        { name: '涼皮／Biángbiáng 麵', daysLabel: 'DAY 1–3', motif: '🍜' },
        { name: '羊肉泡饃', daysLabel: '重點日', motif: '🍲' },
        { name: '胡辣湯＋灌湯包', daysLabel: '出發日早餐', motif: '🥟' },
        { name: '回民街小吃', daysLabel: '夜遊', motif: '🍢' },
      ],
      mustDrink: [
        { name: '冰峰汽水', motif: '🥤' },
        { name: '酸梅湯', motif: '🧃' },
        { name: '蓋碗茶', motif: '🍵' },
      ],
      travelTips: [
        transportMode === 'private_driver'
          ? '準時與司機會合，景區可先下車再會合'
          : '城牆段可步行／租車，跨區預留計程車時間',
        '兵馬俑建議一早到達，避開旅行團高峰',
        '回民街人多，貴重物品貼身',
        '春季溫差大，薄外套＋防曬並用',
        '博物館／遺址票務請提前網上預約',
        '行程留半日彈性，適量就好',
      ],
      footerNote: '路線示意；西安景點可能因預約或活動調整開放時間。',
    }
  }

  if (/中國|大陸|北京|上海|成都|重慶|杭州|桂林|雲南|西藏|西北/.test(name)) {
    return {
      themeLine,
      mustEat: [
        { name: '在地代表性早餐', daysLabel: '出發日', motif: '🍳' },
        { name: '街頭小吃拼盤', daysLabel: '市區日', motif: '🍢' },
        { name: '當地名菜晚餐', daysLabel: '重點日', motif: '🍜' },
      ],
      mustDrink: [
        { name: '熱茶／蓋碗茶', motif: '🍵' },
        { name: '新鮮果汁', motif: '🧃' },
        { name: '當地特色飲品', motif: '🥤' },
      ],
      travelTips: [
        '證件隨身，方便安檢與購票',
        '熱門景點提前預約門票',
        '早晚溫差大時帶薄外套',
        '尊重當地習俗與拍攝規定',
        '長移動日預留緩衝時間',
        '行程保留彈性，遇天氣可調整',
      ],
      footerNote: '路線示意，實際以天氣、交通與最終確認行程為準。',
    }
  }

  return {
    themeLine,
    mustEat: [
      { name: '在地特色早餐', daysLabel: '出發日', motif: '🍳' },
      { name: '街頭小吃', daysLabel: '市區日', motif: '🥟' },
      { name: '代表菜晚餐', daysLabel: '重點日', motif: '🍜' },
    ],
    mustDrink: [
      { name: '當地茶飲', motif: '🍵' },
      { name: '新鮮果汁', motif: '🧃' },
      { name: '溫熱湯品', motif: '🥣' },
    ],
    travelTips: [
      transportMode === 'private_driver'
        ? '準時與司機會合，行李放後車廂最省事'
        : transportMode === 'self_drive'
          ? '出發前查路況與停車'
          : '先備交通卡，跨區預留轉乘時間',
      '早晚溫差大，薄外套要隨身',
      '日照強時做好防曬',
      '長車程帶行動電源與零食',
      '尊重當地文化與拍攝規定',
      '行程保留彈性，遇天氣可調整',
    ],
    footerNote: '路線示意，實際以天氣、交通與最終確認行程為準。',
  }
}

/** Traffic / vehicle arrangement from traveler count + chosen transport mode. */
export function trafficArrangementAdvice(
  partySize: number,
  options?: { privateDriver?: boolean; transportMode?: TransportMode },
): {
  mode: string
  vehicle: string
  note: string
  transportMode: TransportMode
} {
  const size = clampPartySize(partySize)
  const transportMode: TransportMode =
    options?.transportMode ||
    (options?.privateDriver || size >= 5 ? 'private_driver' : 'public_transit')

  if (transportMode === 'public_transit') {
    return {
      transportMode,
      mode: size <= 4 ? '電車＋巴士＋短程計程車' : '大眾運輸為主（大團體較辛苦）',
      vehicle: '交通卡／一日券／單程票',
      note:
        size >= 5
          ? `${size} 人走大眾運輸可行，但集合與轉乘較花時間；每日會標示區域間怎麼去。`
          : '每日會標示景點間建議搭乘方式、轉乘感與大約時間；建議下載 Google Maps 或當地換乘 App。',
    }
  }

  if (transportMode === 'self_drive') {
    if (size <= 4) {
      return {
        transportMode,
        mode: '自駕（轎車／休旅）',
        vehicle: '五～七人座租車',
        note: '每日標示自駕路段與停車提醒；山路／環線請預留緩衝，並確認駕照與保險。',
      }
    }
    if (size <= 6) {
      return {
        transportMode,
        mode: '自駕 MPV',
        vehicle: '七～八人座',
        note: '人多行李多時選 MPV；每日路線會偏「少換停車點、同區串連」。',
      }
    }
    return {
      transportMode,
      mode: '自駕車隊或改包車',
      vehicle: size <= 9 ? '兩輛七人座' : '中巴（較建議改包司機）',
      note: `${size} 人自駕協調成本高；若不想開兩台車，建議改包司機。`,
    }
  }

  // private_driver
  if (size <= 2) {
    return {
      transportMode,
      mode: '包車／專車',
      vehicle: '五人座轎車',
      note: '包車最輕鬆：每日由司機依景點順序接送，幾乎不用研究轉乘。',
    }
  }
  if (size <= 4) {
    return {
      transportMode,
      mode: '包車舒服版',
      vehicle: '五～七人座（含行李）',
      note: '3–4 人很適合一輛包車；行程表會以「司機接送」為主，少標轉乘細節。',
    }
  }
  if (size <= 6) {
    return {
      transportMode,
      mode: '小團包車／MPV',
      vehicle: '七～八人座 MPV（含司機）',
      note: '5–6 人建議固定一輛 MPV，比分兩台計程車好管。',
    }
  }
  if (size <= 9) {
    return {
      transportMode,
      mode: '九人座包車或兩車並行',
      vehicle: '九人座商務車／兩輛七人座',
      note: '7–9 人以九人座或兩車為主；每日仍以司機接送說明為主。',
    }
  }
  return {
    transportMode,
    mode: '中巴／小型旅遊車',
    vehicle: '15–20 人座中巴（視行李）',
    note: `${size} 人建議中巴統一接送；酒店可談團體價與相鄰房型。`,
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
  xinjiangDestination,
  {
    id: 'kansai',
    nameZh: '關西（大阪＋京都）',
    nameLocal: '関西',
    tagline: '對應 AI 行程範例：城市活力 × 古都氛圍',
    intro:
      '大阪負責吃與節奏，京都負責歷史與打卡；中間可加奈良或神戶。這是 PDF 實際範例的核心組合，適合第一次去日本關西的旅人。',
    background:
      '關西是日本歷史與庶民文化交會之處：京都長期作為古都，神社佛閣與四季景色深厚；大阪則以商人城市聞名，吃喝與街頭活力特別強。兩城互補，是第一次去日本最容易愛上的組合。',
    memorable: [
      '伏見稻荷的千本鳥居像一道朱紅色隧道，走進去會有種「怎麼還沒走完」的快樂迷路感。',
      '道頓堀夜晚招牌與蒸汽一起冒，章魚燒剛出爐時，整條橋都像在開派對。',
      '清水寺舞台外的山景與二年坂石階，是京都最有「啊，我真的來日本了」的畫面之一。',
      '黑門市場早餐可以一路串吃：海鮮、串炸、玉子燒，肚子飽了行程才正式開始。',
    ],
    bestSeason: '最適合 3–5 月、10–11 月；最不建議 7–8 月',
    seasonGuide: {
      bestMonths: [3, 4, 5, 10, 11],
      worstMonths: [7, 8],
      bestReason: '春秋氣溫舒適，櫻花或紅葉景色最佳，步行與拍照體驗最好。',
      worstReason: '盛夏炎熱潮濕，戶外體感差，排隊與中暑風險高。',
      note: '關西可冬天去，但舒適度與景色仍明顯不如春秋；不是全年同等適合。',
    },
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
    background:
      '大阪古稱「天下廚房」，商人文化讓這座城市把吃看得很認真：章魚燒、串炸、旋轉壽司都是日常。霓虹、橋與河道構成關西最有節奏感的夜景，也是主題樂園與購物的便利基地。',
    memorable: [
      '站在道頓堀橋上咬一口熱騰騰章魚燒，霓虹與人聲會告訴你：大阪的重點從來都是「開心吃」。',
      '通天閣與新世界帶着復古庶民味，串炸配啤酒，比任何網美店都更像本地日常。',
      '大阪城天守與護城河很有「天下人」氣勢，晴天拍起來金閃閃，陰天則多了點歷史沉感。',
      '環球影城玩到腿軟的那種疲憊很甜：排隊抱怨完，出園又會說「下次還要來」。',
    ],
    bestSeason: '最適合 3–5 月、10–11 月；最不建議 7–8 月',
    seasonGuide: {
      bestMonths: [3, 4, 5, 10, 11],
      worstMonths: [7, 8],
      bestReason: '氣溫舒服，適合整天走路吃逛；春秋體感明顯優於盛夏。',
      worstReason: '盛夏高溫潮濕，戶外與排隊都很累，樂園日更辛苦。',
      note: '大阪全年都去得了，但 7–8 月舒適度最差，請優先避開。',
    },
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
    background:
      '京都曾是日本千年古都，神社佛閣、町家巷弄與茶道文化層層疊疊。真正動人的不只是名寺，還有早晚光影裡安靜的小路，以及季節把整座城市重新上色的方式。',
    memorable: [
      '金閣寺倒影在鏡湖的那一瞬間很安靜，人再多，也還是會忍不住停半秒。',
      '祇園黄昏的石燈與巷弄最有氣氛，若碰巧瞥見和服身影，整晚都會記得。',
      '嵐山竹林的綠光會沙沙作響，早到的人會覺得自己走進了另一個季節。',
      '宇治抹茶的苦香留在舌尖，配和果子坐下休息，比趕下一間寺更京都。',
    ],
    bestSeason: '最適合 3–4 月、11 月；最不建議 7–8 月',
    seasonGuide: {
      bestMonths: [3, 4, 11],
      worstMonths: [7, 8],
      bestReason: '櫻花或紅葉最美，氣溫適合長時間步行寺院與巷弄。',
      worstReason: '盛夏寺院區悶熱，體感差且容易中暑；景色也相對平淡。',
      note: '京都強項是季節景色，絕非每月同等美麗；盛夏請謹慎。',
    },
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
    background:
      '東京是江戶以來不斷疊加的巨型都會：淺草保留老東京氣息，澀谷與新宿是當代都市節奏，六本木與上野則打開藝文面向。每個駅圏幾乎都是一座小城市，值得分區慢慢認識。',
    memorable: [
      '澀谷十字路口人潮同時湧出時，會覺得整座城市都在跳同一支舞——第一次見總是會愣住。',
      '淺草雷門與仲見世的香火、人形燒氣味混在一起，是東京最「觀光卻仍動人」的入口。',
      'teamLab 的光與水讓人失去時間感，從裡面走出來，現實街道會顯得特別安靜。',
      '深夜便利店買飯團與熱茶，是東京旅最老實的幸福感：便宜、溫暖、明天還能繼續走。',
    ],
    bestSeason: '最適合 3–5 月、10–11 月；最不建議 7–8 月',
    seasonGuide: {
      bestMonths: [3, 4, 5, 10, 11],
      worstMonths: [7, 8],
      bestReason: '氣溫宜人，適合長距離步行與近郊日遊（鎌倉／箱根）。',
      worstReason: '盛夏炎熱潮濕，主題樂園與戶外排隊體感最差。',
      note: '東京能全年去，但春秋明顯更舒服；不要當成每月一樣適合。',
    },
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
    background:
      '台北是台灣的政治與文化中心，也把山、河、夜市與博物館擠進很短的通勤距離。從故宮到象山、從老街到文創園區，城市尺度親切，卻能同時給你深度與輕鬆。',
    memorable: [
      '夜市裡胡椒餅剛出爐時，胡椒香會先打在臉上——那味道比任何文案都更台北。',
      '象山步道回望 101 的構圖經典到俗氣，可親自走到時，還是會想再按一次快門。',
      '九份山城燈火在霧氣裡亮起，像把時光調回老電影，梯坎與茶館特別適合慢慢晃。',
      '一頓蛋餅豆漿開啟的早晨，會讓整趟行程突然變得很生活，也很放鬆。',
    ],
    bestSeason: '最適合 10–4 月；最不建議 6–8 月',
    seasonGuide: {
      bestMonths: [10, 11, 12, 1, 2, 3, 4],
      worstMonths: [6, 7, 8],
      bestReason: '秋冬到初春較乾爽，夜市、步道與近郊行程體感最好。',
      worstReason: '盛夏悶熱、午後雷雨多，長時間戶外很累。',
      note: '台北沒有「每月一樣舒服」；盛夏明顯是較差選擇。',
    },
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
    background:
      '首爾是朝鮮王朝五百年的都城，也是當代韓流的舞台。景福宮與北村韓屋訴說舊日秩序，弘大、明洞與聖水則是流行與設計的前線——古今並存，是這座城市最迷人的張力。',
    memorable: [
      '穿韓服走在景福宮石道上，儀式感會自己冒出來；拍完照也不想立刻換回牛仔褲。',
      '北村巷弄忽而轉出城市俯瞰，古今疊在同一眼裡，是首爾最迷人的地方。',
      '一鍋起司火鍋或烤五花肉的熱氣，能把白天走路的疲倦瞬間融化。',
      '深夜便利店燈火與韓屋暖窗並存，讓人覺得這座城市既流行、又仍然有溫度。',
    ],
    bestSeason: '最適合 4–6 月、9–11 月；最不建議 12–2 月',
    seasonGuide: {
      bestMonths: [4, 5, 6, 9, 10, 11],
      worstMonths: [12, 1, 2],
      bestReason: '春秋氣溫適合宮殿、韓屋與逛街，白天日照也較友善。',
      worstReason: '嚴冬常低於冰點，戶外體感差，行程節奏易被寒冷影響。',
      note: '首爾可冬遊看雪，但舒適度遠不如春秋；不是全年同等推薦。',
    },
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

const MONTH_LABELS = [
  '1 月',
  '2 月',
  '3 月',
  '4 月',
  '5 月',
  '6 月',
  '7 月',
  '8 月',
  '9 月',
  '10 月',
  '11 月',
  '12 月',
]

export function formatMonthsZh(months: number[]): string {
  const unique = [...new Set(months)]
    .filter((m) => m >= 1 && m <= 12)
    .sort((a, b) => a - b)
  if (!unique.length) return '—'
  return unique.map((m) => MONTH_LABELS[m - 1]).join('、')
}

export function assessTripMonth(
  guide: SeasonGuide,
  month: number,
): 'best' | 'fair' | 'worst' {
  if (guide.worstMonths.includes(month)) return 'worst'
  if (guide.bestMonths.includes(month)) return 'best'
  return 'fair'
}

/** Heuristic season guide when AI / curated data is unavailable. */
export function inferSeasonGuide(name: string): SeasonGuide {
  const text = name.trim()
  if (/新疆|北疆|南疆|喀納斯|伊犁|帕米爾|青甘|青海|甘肅|西藏|高原|川西/.test(text)) {
    return {
      bestMonths: [6, 7, 8, 9],
      worstMonths: [12, 1, 2, 3],
      bestReason: '暖季路況與景區開放較穩，湖色／草原可看，長線移動也較安全。',
      worstReason: '嚴寒、大雪與封路風險高，部分景區／公路關閉，不適合長線環線。',
      note: '西北／高原長線絕非全年皆宜；請以夏秋為主。',
    }
  }
  if (/北海道|札幌|富良野|小樽/.test(text)) {
    return {
      bestMonths: [6, 7, 8, 9, 1, 2],
      worstMonths: [11, 3],
      bestReason: '夏季涼爽避暑與花田；冬季雪景／滑雪條件佳。',
      worstReason: '初冬與融雪期天氣不穩，景色與交通都較尷尬。',
      note: '北海道夏冬各有強項，但不是每個月都同樣好逛。',
    }
  }
  if (/沖縄|沖繩|峇里|普吉|長灘|塞班|馬爾地夫|新加坡|曼谷|清邁/.test(text)) {
    return {
      bestMonths: [11, 12, 1, 2, 3, 4],
      worstMonths: [6, 7, 8, 9],
      bestReason: '乾季或相對少雨，海邊與戶外行程較穩。',
      worstReason: '雨季／颱風季濕熱，戶外與跳島易受影響。',
      note: '熱帶／海島目的地仍有明顯雨乾季差異。',
    }
  }
  if (/日本|東京|大阪|京都|關西|九州|名古屋|富山|金澤|名古屋/.test(text)) {
    return {
      bestMonths: [3, 4, 5, 10, 11],
      worstMonths: [7, 8],
      bestReason: '氣溫舒服，櫻花或紅葉景觀佳，步行與拍照體驗最好。',
      worstReason: '盛夏炎熱潮濕，戶外體感差，部分景點人潮與中暑風險高。',
      note: '日本多數城市春秋最佳；盛夏明顯較差，並非全年同等適合。',
    }
  }
  if (/台北|臺灣|台灣|高雄|台中/.test(text)) {
    return {
      bestMonths: [10, 11, 12, 1, 2, 3, 4],
      worstMonths: [6, 7, 8],
      bestReason: '秋冬到初春較乾爽舒適，適合走路逛夜市與近郊。',
      worstReason: '盛夏悶熱、午後雷雨多，長時間戶外較辛苦。',
      note: '台北可全年前往，但舒適度仍差很多，盛夏明顯較差。',
    }
  }
  if (/首爾|釜山|韓國|濟州/.test(text)) {
    return {
      bestMonths: [4, 5, 6, 9, 10, 11],
      worstMonths: [12, 1, 2],
      bestReason: '春秋氣溫宜人，市區步行與逛街最舒服。',
      worstReason: '嚴冬極冷（常低於冰點），戶外體感差，行程節奏易被天氣影響。',
      note: '首爾可冬遊，但舒適度遠不如春秋；不是每月同等推薦。',
    }
  }
  if (/歐洲|巴黎|倫敦|羅馬|瑞士|北歐/.test(text)) {
    return {
      bestMonths: [5, 6, 7, 8, 9],
      worstMonths: [11, 12, 1, 2],
      bestReason: '日照長、戶外與景點開放時間較友善。',
      worstReason: '冬天天短濕冷，部分山地／小鎮活動受限。',
      note: '多數歐洲城市夏季較好逛；冬季需接受天短與寒冷。',
    }
  }
  return {
    bestMonths: [4, 5, 6, 9, 10],
    worstMonths: [7, 8, 1],
    bestReason: '氣溫與日照通常較平衡，適合觀光步行。',
    worstReason: '不是極端月也常遇上過熱、過冷或雨季，體驗會打折。',
    note: '幾乎沒有「十二個月都一樣適合」的目的地；請依最佳／最差月份安排。',
  }
}

export function getSeasonGuide(destination: Destination): SeasonGuide {
  return destination.seasonGuide ?? inferSeasonGuide(destination.nameZh)
}

export function seasonGuideFromAi(payload: {
  bestMonths?: number[]
  worstMonths?: number[]
  bestReason?: string
  worstReason?: string
  note?: string
}): SeasonGuide | null {
  const bestMonths = (payload.bestMonths || [])
    .map(Number)
    .filter((m) => m >= 1 && m <= 12)
  const worstMonths = (payload.worstMonths || [])
    .map(Number)
    .filter((m) => m >= 1 && m <= 12)
  if (bestMonths.length < 1 || worstMonths.length < 1) return null
  return {
    bestMonths: [...new Set(bestMonths)].sort((a, b) => a - b),
    worstMonths: [...new Set(worstMonths)].sort((a, b) => a - b),
    bestReason: payload.bestReason?.trim() || '氣候與活動條件較佳。',
    worstReason: payload.worstReason?.trim() || '天氣或交通限制較多。',
    note:
      payload.note?.trim() ||
      '請依最佳／最差月份安排；不要假設全年都同樣適合。',
  }
}

export function clampDays(value: number): number {
  if (!Number.isFinite(value)) return MIN_TRIP_DAYS
  return Math.min(Math.max(Math.round(value), MIN_TRIP_DAYS), MAX_TRIP_DAYS)
}

export function nightsFromDays(days: number): number {
  return Math.max(clampDays(days) - 1, 1)
}

const KNOWN_HOTEL_CITIES = [
  '西寧',
  '嘉峪關',
  '敦煌',
  '花土溝',
  '德令哈',
  '青海湖',
  '蘭州',
  '張掖',
  '西安',
  '烏魯木齊',
  '喀什',
  '禾木',
  '喀納斯',
  '賽里木湖',
  '大阪',
  '京都',
  '東京',
  '奈良',
  '神戶',
  '台北',
  '巴黎',
  '首爾',
]

/** Collapse spot areas into a hotel base city/region. */
export function hotelAreaBase(area: string): string {
  const raw = (area || '').trim() || '市區'
  // Prefer a known city token anywhere in the label (handles 嘉峪關（同上，不換宿）).
  for (const city of KNOWN_HOTEL_CITIES) {
    if (raw.includes(city)) return city
  }
  const cleaned = raw
    .replace(/（.*?）|\(.*?\)/g, '')
    .replace(/同上.*$/g, '')
    .replace(/優質.*$|新建.*$|湖景.*$|國際.*$|索菲特.*$|喜來登.*$/g, '')
    .trim()
  const parts = cleaned.split(/[・／/·\|｜]/).map((p) => p.trim()).filter(Boolean)
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
  // stayCity first (cleaner), then stayArea labels like「敦煌（同上）」.
  if (day.stayCity) return hotelAreaBase(day.stayCity)
  return hotelAreaBase(day.stayArea)
}

function hotelMatchesBase(hotel: HotelOption, base: string): boolean {
  const hotelBase = hotelAreaBase(hotel.area)
  if (!base || !hotelBase) return false
  if (hotelBase === base || hotel.area.includes(base) || base.includes(hotelBase)) {
    return true
  }
  const cluster = sharedHotelClusterId(base)
  return Boolean(cluster && sharedHotelClusterId(hotelBase) === cluster)
}

function pickHotelForBase(
  hotels: HotelOption[],
  base: string,
  preferredHotelName?: string,
): HotelOption {
  // Preferred hotel only wins when it actually belongs to this overnight base.
  // Never force 嘉峪關 hotel onto 敦煌／西寧 nights.
  if (preferredHotelName) {
    const preferred = hotels.find((h) => h.name === preferredHotelName)
    if (preferred && hotelMatchesBase(preferred, base)) return preferred
  }
  const scored = hotels.map((hotel) => {
    const hotelBase = hotelAreaBase(hotel.area)
    let score = 0
    if (hotelMatchesBase(hotel, base)) score += 8
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

  const distinctBases = [...new Set(stabilized.filter(Boolean))]
  // One hotel for the whole trip only when overnight bases collapse to a single
  // city/cluster (e.g. Osaka day-trips). Qinggan / Xinjiang multi-city = false.
  const singleBasePossible = distinctBases.length <= 1

  const preferredName = singleBasePossible
    ? options.preferredHotelName
    : // Multi-base trips: preferred hotel only seeds matching city blocks.
      options.preferredHotelName

  const blocks: HotelStayPlan['blocks'] = []
  let start = 0
  while (start < stabilized.length) {
    let end = start
    while (end + 1 < stabilized.length && stabilized[end + 1] === stabilized[start]) {
      end += 1
    }
    const base = stabilized[start]
    const hotel = pickHotelForBase(hotels, base, preferredName)
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
      ? `全程可連住同一間：${blocks[0]?.hotelName || '基地旅店'}（${nights} 晚）。`
      : singleBasePossible
        ? `同都會圈可連住為主：共 ${blocks.length} 段、換宿 ${changes} 次。`
        : `這是多城市行程，無法全程住同一間酒店。已在各停留城市盡量連住：共 ${blocks.length} 段、換宿 ${changes} 次。`
    : `依每日區域安排住宿，共 ${blocks.length} 段。`

  return {
    preferConsecutive,
    totalNights: nights,
    changes,
    blocks,
    summary,
    singleBasePossible,
    distinctBases,
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
    return enrichDayPlanRow({
      ...day,
      stayArea: stayLabel,
      stayCity: block.base || hotelAreaBase(block.area),
      hotelDirection: `${block.hotelName}（${block.area}）${block.nights >= 2 ? '・連住' : ''}`,
      schedule,
      tip:
        block.nights >= 2
          ? `${day.tip}（${block.reason}）`
          : day.tip,
    })
  })
}

export function daysBetween(start: string, end: string): number | null {
  if (!start || !end) return null
  const a = new Date(`${start}T12:00:00`)
  const b = new Date(`${end}T12:00:00`)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return null
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1
}

/** Format a Date as local YYYY-MM-DD. */
export function toIsoDateLocal(date: Date): string {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

/** Earliest allowed departure: the day after planning (not today / not past). */
export function earliestStartDate(now: Date = new Date()): string {
  const d = new Date(now)
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + 1)
  return toIsoDateLocal(d)
}

/** Clamp a start date so it is never earlier than tomorrow. */
export function clampStartDate(iso: string, now: Date = new Date()): string {
  const min = earliestStartDate(now)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return min
  return iso < min ? min : iso
}

/** End date inclusive: start + (days - 1). */
export function endDateFromStart(start: string, days: number): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return start
  const d = new Date(`${start}T12:00:00`)
  if (Number.isNaN(d.getTime())) return start
  d.setDate(d.getDate() + Math.max(clampDays(days) - 1, 0))
  return toIsoDateLocal(d)
}

export function formatDateZh(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso
  const d = new Date(`${iso}T12:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  const weekdays = ['日', '一', '二', '三', '四', '五', '六']
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日（周${weekdays[d.getDay()]}）`
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
  const photo = spots
    .filter((s) => s.tags.includes('photo') && !must.includes(s.id))
    .map((s) => s.id)
  const popular = spots
    .filter(
      (s) => s.tags.includes('popular') && !must.includes(s.id) && !photo.includes(s.id),
    )
    .map((s) => s.id)
  // Keep city defaults modest so fit advice stays in a realistic 4–8 day range.
  const cap = isLongHaulDestination(dest?.nameZh || '') ? 14 : 8
  return [...must, ...photo.slice(0, 4), ...popular.slice(0, 3)].slice(0, cap)
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
  // Treat mountain / full-day names as long trips even if AI under-states hours.
  const longTrips = selected.filter(
    (s) => s.stayHours >= 6 || /華山|日遊|一日遊|環湖|沙漠/.test(s.name),
  )
  const shortSpots = selected.filter((s) => !longTrips.includes(s))
  // Collapse micro-areas (e.g. 西安・鐘樓 / 西安城牆內) so city trips don't explode.
  const areas = new Set(
    selected.map((s) => hotelAreaBase(s.area) || s.area.split(/[・·/／]/)[0] || s.area),
  )
  const areaCount = areas.size
  const longHaul = isLongHaulDestination(dest?.nameZh || dest?.nameLocal || '')

  // Each long day-trip roughly occupies a full day.
  const longTripDays = longTrips.length
  // Short spots packed by daily capacity (hours + count).
  const shortByHours = Math.ceil(
    shortSpots.reduce((sum, s) => sum + s.stayHours, 0) / hoursPerDay,
  )
  const shortByCount = Math.ceil(shortSpots.length / spotsPerDay)
  const shortDays = Math.max(shortByHours, shortByCount, shortSpots.length ? 1 : 0)

  // City trips: at most 1–2 transit buffers. Long-haul can use more.
  const rawTransit = Math.max(0, areaCount - 1)
  const transitBuffers = longHaul
    ? rawTransit
    : Math.min(2, Math.ceil(rawTransit * 0.35))
  const photoHeavy = selected.filter((s) => s.tags.includes('photo')).length
  const photoBuffer =
    photoHeavy >= 8 || specialNeeds.some((n) => n.includes('打卡')) ? 1 : 0
  const altitudeBuffer = specialNeeds.some((n) => n.includes('高原')) ? 1 : 0
  const arrivalDeparture = 1 // arrival or soft start

  let minDays = clampDays(longTripDays + shortDays + Math.ceil(transitBuffers * 0.5))
  let recommendedDays = clampDays(
    longTripDays + shortDays + transitBuffers + arrivalDeparture + photoBuffer,
  )
  let comfortableDays = clampDays(
    recommendedDays + 1 + altitudeBuffer + (pace === 'relaxed' ? 1 : 0),
  )

  // Hard ceiling for ordinary city breaks (西安／大阪／台北…).
  if (!longHaul) {
    minDays = clampDays(Math.min(minDays, 7))
    recommendedDays = clampDays(Math.min(recommendedDays, 9))
    comfortableDays = clampDays(Math.min(comfortableDays, 11))
  }

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
      title: longHaul
        ? '景點偏多，天數可能不夠'
        : '景點偏多：可加天或刪減景點（城市遊不必拉到 20 天）',
      message: longHaul
        ? `你選了 ${selected.length} 個景點（約 ${hoursLabel}，${areaLabel}${longLabel}）。以「${tripPaces.find((p) => p.id === pace)?.label ?? '平衡'}」節奏，正常完成大約需要 ${recommendedDays} 天（最少 ${minDays} 天，舒服可到 ${comfortableDays} 天）。現在的 ${chosenDays} 天會偏趕，建議加長天數或減少景點。`
        : `你選了 ${selected.length} 個景點（約 ${hoursLabel}，${areaLabel}${longLabel}）。城市遊正常完成約 ${recommendedDays} 天即可（最少 ${minDays}、舒服 ${comfortableDays}）；不必拉到兩週以上。現在 ${chosenDays} 天偏趕時，優先取消較遠／重複景點，或小幅加到 ${recommendedDays} 天。`,
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
      message: `以目前 ${selected.length} 個景點估算，正常完成約 ${recommendedDays} 天就夠（舒服版 ${comfortableDays} 天）。你選了 ${chosenDays} 天，多出來的日子會分散成全程更鬆的休息／慢遊日（不會全部堆在最後）；也可以再加景點，或把天數調回建議值。`,
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

/**
 * Shrink a long curated route (e.g. Xinjiang 29 → 18) by dropping spare
 * rest/buffer days first, then evenly sampling content — never invent a
 * trailing block of empty Urumqi laundry days.
 */
export function compressCuratedPlan(plan: DayPlan[], targetDays: number): DayPlan[] {
  const target = clampDays(targetDays)
  if (!plan.length) return plan
  if (plan.length <= target) return plan.map((d) => ({ ...d }))

  const isRestDay = (day: DayPlan) =>
    /休息|彈性|自由日|備用|緩衝|完整休息|洗衣|補眠/.test(
      `${day.theme} ${day.mainPlan || ''}`,
    ) && !/飛|→|返程|抵達|環湖|三灣|古城|峽谷|公路|魔鬼|五彩|帕米爾|石頭城/.test(day.theme)

  const indexed = plan.map((day, index) => ({ day, index }))
  const mustKeep = new Set<number>([0, plan.length - 1])
  const highlightScore = (day: DayPlan) => {
    let score = day.spotIds.length * 5
    if (/慢遊|環湖|三灣|古城|峽谷|帕米爾|魔鬼|五彩|天池|公路→/.test(day.theme))
      score += 30
    if (/飛|→/.test(day.theme) && !/公路|帕米爾|五彩|魔鬼/.test(day.theme))
      score -= 10
    if (isRestDay(day)) score -= 50
    return score
  }
  // Keep the strongest day per major base (prefer lake/old-town days over transfers).
  const bestByBase = new Map<string, { index: number; score: number }>()
  for (const { day, index } of indexed) {
    if (index === 0 || index === plan.length - 1 || isRestDay(day)) continue
    const base = hotelAreaBase(day.stayCity || day.stayArea)
    if (!base || base === '返程') continue
    const score = highlightScore(day)
    const prev = bestByBase.get(base)
    if (!prev || score > prev.score) bestByBase.set(base, { index, score })
  }
  for (const { index } of bestByBase.values()) mustKeep.add(index)

  let kept = indexed.map((row) => row.index)
  // 1) Drop pure rest/buffer days first (never first/last).
  const restIdx = kept.filter((i) => !mustKeep.has(i) && isRestDay(plan[i]))
  for (const i of restIdx) {
    if (kept.length <= target) break
    kept = kept.filter((x) => x !== i)
  }

  // 2) Still too long: drop lower-priority content (prefer dropping second
  //    free/light days and transfer-only duplicates).
  while (kept.length > target) {
    let dropAt = -1
    let worstScore = Infinity
    for (const i of kept) {
      if (mustKeep.has(i)) continue
      const day = plan[i]
      let score = 50
      if (isRestDay(day)) score -= 40
      if (/飛|→/.test(day.theme) && day.spotIds.length <= 1) score -= 8
      if (/慢遊|環湖|三灣|古城|峽谷|帕米爾|魔鬼|五彩|天池/.test(day.theme)) score += 25
      if (day.spotIds.length >= 2) score += 10
      if (day.dayStory && day.dayStory.length > 40) score += 5
      // Prefer dropping days near the end of a same-city block (extra Urumqi nights).
      const prev = kept[kept.indexOf(i) - 1]
      const next = kept[kept.indexOf(i) + 1]
      const base = hotelAreaBase(day.stayCity || day.stayArea)
      if (
        prev != null &&
        next != null &&
        hotelAreaBase(plan[prev].stayCity || plan[prev].stayArea) === base &&
        hotelAreaBase(plan[next].stayCity || plan[next].stayArea) === base
      ) {
        score -= 15
      }
      if (score < worstScore) {
        worstScore = score
        dropAt = i
      }
    }
    if (dropAt < 0) break
    kept = kept.filter((x) => x !== dropAt)
  }

  // 3) If still over (all remaining are must-keep), evenly sample.
  if (kept.length > target) {
    const inner = kept.filter((i) => i !== 0 && i !== plan.length - 1)
    const keepInner = Math.max(0, target - 2)
    const sampled: number[] = []
    for (let k = 0; k < keepInner; k += 1) {
      const pos = Math.round((k * (inner.length - 1)) / Math.max(keepInner - 1, 1))
      sampled.push(inner[pos])
    }
    kept = [0, ...[...new Set(sampled)].sort((a, b) => a - b), plan.length - 1]
  }

  return kept.map((i) => ({ ...plan[i] }))
}

function isCuratedRestDay(day: DayPlan): boolean {
  return (
    /休息|彈性|自由日|備用|緩衝|完整休息|洗衣|補眠/.test(
      `${day.theme} ${day.mainPlan || ''}`,
    ) &&
    !/飛|→|返程|抵達|環湖|三灣|古城|峽谷|公路|魔鬼|五彩|帕米爾|石頭城/.test(
      day.theme,
    )
  )
}

function makeFlexRestDay(options: {
  stayArea: string
  stayCity: string
  flexIdea: string
  hotelDirection?: string
  isFirst?: boolean
  isLast?: boolean
}): DayPlan {
  const stay = options.stayArea
  const city = options.stayCity || hotelAreaBase(stay)
  return enrichDayPlanRow({
    theme: '慢遊休息日・恢復體力',
    stayArea: stay,
    stayCity: city,
    mainPlan: `休息日：散步、咖啡、${options.flexIdea}，不新增長途景點。`,
    dayStory: `把多餘天數攤進整段旅程：今天放慢，可以「${options.flexIdea}」、補眠或處理洗衣，讓前後幾天的移動與景點都更舒服。`,
    paceNote: '不趕行程；休息日穿插在旅程中，而不是全部堆在最後。',
    hotelDirection: options.hotelDirection || stay,
    schedule: [
      {
        time: '10:00',
        title: '晚起／自由早餐',
        detail: '刻意放慢的一天，不是旅程結束後的空白日。',
      },
      {
        time: '12:00',
        title: options.flexIdea,
        detail: '可重遊附近喜歡的角落、逛街或發呆，不排新的長途景點。',
      },
      {
        time: '15:30',
        title: '咖啡或輕活動',
        detail: '幫前後幾天留體力。',
      },
      {
        time: '19:00',
        title: '晚餐與回飯店',
        detail: `住 ${stay}`,
      },
    ],
    budget: '通常低於觀光日',
    tip: '多餘天數已分散成全程更鬆的節奏；若想更緊湊，可縮短總天數。',
    spotIds: [],
  })
}

/**
 * Lengthen a curated route by weaving rest days through the trip
 * (after heavy / transfer days), never as a trailing rest block.
 */
export function expandCuratedPlan(
  plan: DayPlan[],
  targetDays: number,
  flexIdeas: string[] = [],
): DayPlan[] {
  const target = clampDays(targetDays)
  if (!plan.length) return plan
  if (plan.length >= target) return compressCuratedPlan(plan, target)

  const ideas = flexIdeas.length ? flexIdeas : ['街區慢遊與咖啡']
  const result = plan.map((d) => ({ ...d }))
  let extra = target - result.length
  let ideaIdx = 0

  const wantsRestAfter = (day: DayPlan, index: number) => {
    if (index === result.length - 1) return false
    if (isCuratedRestDay(day)) return false
    if (isCuratedRestDay(result[index + 1])) return false
    return /飛|→|公路|環湖|三灣|峽谷|帕米爾|魔鬼|五彩|全日|長途|抵達/.test(
      `${day.theme} ${day.paceNote || ''}`,
    )
  }

  // Pass 1: after heavy / transfer days
  let i = 0
  while (extra > 0 && i < result.length - 1) {
    if (wantsRestAfter(result[i], i)) {
      const stayArea = result[i].stayArea
      const stayCity = result[i].stayCity || hotelAreaBase(stayArea)
      result.splice(
        i + 1,
        0,
        makeFlexRestDay({
          stayArea,
          stayCity,
          flexIdea: ideas[ideaIdx % ideas.length],
          hotelDirection: result[i].hotelDirection || stayArea,
        }),
      )
      ideaIdx += 1
      extra -= 1
      i += 2
      continue
    }
    i += 1
  }

  // Pass 2: evenly among remaining gaps (still avoid last slot only)
  while (extra > 0) {
    const gaps: number[] = []
    for (let idx = 0; idx < result.length - 1; idx += 1) {
      if (isCuratedRestDay(result[idx])) continue
      if (isCuratedRestDay(result[idx + 1])) continue
      gaps.push(idx)
    }
    if (!gaps.length) {
      // Last resort: insert before the final day, still not after it.
      const at = Math.max(0, result.length - 1)
      const prev = result[Math.max(0, at - 1)]
      result.splice(
        at,
        0,
        makeFlexRestDay({
          stayArea: prev.stayArea,
          stayCity: prev.stayCity || hotelAreaBase(prev.stayArea),
          flexIdea: ideas[ideaIdx % ideas.length],
          hotelDirection: prev.hotelDirection || prev.stayArea,
        }),
      )
      ideaIdx += 1
      extra -= 1
      continue
    }
    // Pick gap that maximizes distance from other rest days
    let bestGap = gaps[0]
    let bestScore = -1
    for (const g of gaps) {
      let dist = 99
      for (let j = 0; j < result.length; j += 1) {
        if (!isCuratedRestDay(result[j])) continue
        dist = Math.min(dist, Math.abs(j - g), Math.abs(j - (g + 1)))
      }
      if (dist > bestScore) {
        bestScore = dist
        bestGap = g
      }
    }
    const anchor = result[bestGap]
    result.splice(
      bestGap + 1,
      0,
      makeFlexRestDay({
        stayArea: anchor.stayArea,
        stayCity: anchor.stayCity || hotelAreaBase(anchor.stayArea),
        flexIdea: ideas[ideaIdx % ideas.length],
        hotelDirection: anchor.hotelDirection || anchor.stayArea,
      }),
    )
    ideaIdx += 1
    extra -= 1
  }

  return result.slice(0, target)
}

/**
 * Spread content-day spot buckets across `targetDays` so spare days become
 * interleaved rests, not a block of empty days at the end.
 */
export function spreadContentAcrossDays<T>(
  contentBuckets: T[],
  targetDays: number,
): (T | null)[] {
  const target = Math.max(contentBuckets.length, targetDays)
  if (!contentBuckets.length) {
    return Array.from({ length: targetDays }, () => null)
  }
  if (contentBuckets.length >= targetDays) {
    return contentBuckets.slice(0, targetDays).map((b) => b)
  }

  const out: (T | null)[] = Array.from({ length: targetDays }, () => null)
  const n = contentBuckets.length
  // Keep first/last content near trip start/end; space the middle evenly.
  for (let c = 0; c < n; c += 1) {
    const slot =
      n === 1
        ? 0
        : Math.round((c * (targetDays - 1)) / (n - 1))
    // Resolve collisions by shifting forward, then backward.
    let place = slot
    while (place < targetDays && out[place] !== null) place += 1
    if (place >= targetDays) {
      place = slot
      while (place >= 0 && out[place] !== null) place -= 1
    }
    if (place < 0) {
      place = out.findIndex((x) => x === null)
    }
    if (place >= 0) out[place] = contentBuckets[c]
  }
  return out
}

function applySpotFilterToCurated(
  plan: DayPlan[],
  selectedSpotIds: string[],
): DayPlan[] {
  // No selection yet → keep the curated route intact.
  if (!selectedSpotIds.length) return plan
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

/** How many spots are typically needed so most days have real destinations. */
export function spotsNeededForDays(days: number, pace: TripPace): number {
  const spotsPerDay = tripPaces.find((p) => p.id === pace)?.spotsPerDay ?? 3
  const contentDays = Math.max(1, clampDays(days) - 1) // allow 1 rest day
  return Math.max(spotsPerDay, contentDays * Math.max(2, spotsPerDay - 1))
}

/** Top up selected spots from the destination pool so long trips aren't empty. */
export function ensureSpotsForDays(options: {
  selectedSpotIds: string[]
  allSpots: ScenicSpot[]
  days: number
  pace: TripPace
  companion: Companion
  specialNeeds: string[]
}): string[] {
  const needed = spotsNeededForDays(options.days, options.pace)
  if (options.selectedSpotIds.length >= needed) return options.selectedSpotIds
  const selected = new Set(options.selectedSpotIds)
  const extras = sortSpotsForTraveler(
    options.allSpots.filter((spot) => !selected.has(spot.id)),
    options.companion,
    options.specialNeeds,
  )
  const next = [...options.selectedSpotIds]
  for (const spot of extras) {
    if (next.length >= needed) break
    next.push(spot.id)
  }
  return next
}

function placeSpotInBuckets(
  dayBuckets: ScenicSpot[][],
  spot: ScenicSpot,
  spotsPerDay: number,
  preferEmpty: boolean,
) {
  if (preferEmpty) {
    const empty = dayBuckets.findIndex((b) => b.length === 0)
    if (empty >= 0) {
      dayBuckets[empty].push(spot)
      return
    }
  }
  let best = -1
  let bestScore = Number.POSITIVE_INFINITY
  dayBuckets.forEach((bucket, index) => {
    const usedHours = bucket.reduce((sum, s) => sum + s.stayHours, 0)
    const countLimit = bucket.some((s) => s.stayHours >= 6) ? 1 : spotsPerDay
    if (bucket.length >= countLimit) return
    if (usedHours + spot.stayHours > spotsPerDay * 2.8) return
    const score = bucket.length * 10 + usedHours
    if (score < bestScore) {
      bestScore = score
      best = index
    }
  })
  if (best >= 0) dayBuckets[best].push(spot)
  else {
    const lightest = dayBuckets.reduce(
      (bestIdx, bucket, i) =>
        bucket.length < dayBuckets[bestIdx].length ? i : bestIdx,
      0,
    )
    dayBuckets[lightest].push(spot)
  }
}

function buildRouteLeg(
  from: string,
  to: string,
  mode: TransportMode,
  sameArea: boolean,
): DayRouteLeg {
  if (mode === 'private_driver') {
    return {
      from,
      to,
      modeLabel: '包車直達',
      summary: sameArea
        ? `司機在「${from}」一帶接送至「${to}」，免轉乘、可放行李。`
        : `包車由「${from}」前往「${to}」；司機會依當日順序順路安排，你只要準時上車。`,
      durationHint: sameArea ? '約 15–30 分鐘' : '約 40–90 分鐘（視距離）',
      costHint: '含在當日包車費',
    }
  }
  if (mode === 'self_drive') {
    return {
      from,
      to,
      modeLabel: '自駕',
      summary: sameArea
        ? `自駕於「${from}」一帶前往「${to}」；優先使用景點／商場停車場，避開窄巷。`
        : `自駕由「${from}」開往「${to}」：依主要幹道前進，出發前查路況與收費站；抵達先確認停車位再入園。`,
      durationHint: sameArea ? '約 15–35 分鐘' : '約 45–120 分鐘',
      costHint: '油費／過路費／停車另計',
    }
  }
  return {
    from,
    to,
    modeLabel: sameArea ? '步行／短程公交' : '地鐵／列車／巴士轉乘',
    summary: sameArea
      ? `在「${from}」區域內步行或短程公交前往「${to}」；同區移動通常最輕鬆。`
      : `從「${from}」到「${to}」：先走到最近車站／公車站 → 搭主要幹線 → 於轉乘站換線／換車 → 出站後短程步行或計程車到門口。建議用 Google Maps 或當地換乘 App 查即時班次。`,
    durationHint: sameArea ? '約 10–25 分鐘' : '約 35–75 分鐘（含轉乘）',
    costHint: sameArea ? '單程票或交通卡' : '建議交通卡／一日券',
  }
}

function dayTransportSummary(
  mode: TransportMode,
  legs: DayRouteLeg[],
  stayCity: string,
): string {
  if (!legs.length) {
    if (mode === 'private_driver') return `今日以包車在 ${stayCity} 一帶活動，司機隨行程接送。`
    if (mode === 'self_drive') return `今日自駕活動於 ${stayCity} 一帶；注意停車與回飯店路線。`
    return `今日以大眾運輸在 ${stayCity} 一帶移動；同區可步行或短程公交。`
  }
  const cross = legs.filter((leg) => leg.modeLabel.includes('轉乘') || leg.durationHint.includes('40') || leg.durationHint.includes('45')).length
  if (mode === 'private_driver') {
    return `包司機：今日 ${legs.length} 段接送，幾乎免轉乘；重點是準時上車與告知司機下一站。`
  }
  if (mode === 'self_drive') {
    return `自駕：今日約 ${legs.length} 段車程；盡量同區停車、少挪車${cross ? '，跨區路段請預留緩衝' : ''}。`
  }
  return `大眾運輸：今日約 ${legs.length} 段移動${cross ? '，含跨區轉乘' : '，多為同區短程'}；請依下方路線說明與即時 App 前往。`
}

/** Attach mode-aware daily routes and inject transit/drive steps into the schedule. */
export function applyTransportToItinerary(
  days: DayPlan[],
  options: {
    transportMode: TransportMode
    hotelAreaHint: string
    spots: ScenicSpot[]
  },
): DayPlan[] {
  const { transportMode, hotelAreaHint, spots } = options
  const byId = new Map(spots.map((s) => [s.id, s]))

  return days.map((day, index) => {
    const isFirst = index === 0
    const isLast = index === days.length - 1
    const stay = day.stayCity || hotelAreaBase(day.stayArea || hotelAreaHint)
    const daySpots = day.spotIds
      .map((id) => byId.get(id))
      .filter((s): s is ScenicSpot => Boolean(s))

    const points: { name: string; area: string }[] = []
    if (isFirst) {
      points.push({ name: '機場／車站抵達點', area: stay })
    } else {
      points.push({ name: `${stay} 住宿`, area: stay })
    }
    for (const spot of daySpots) {
      points.push({ name: spot.name, area: spot.area || stay })
    }
    if (isLast) {
      points.push({ name: '機場／車站返程', area: stay })
    } else if (daySpots.length) {
      points.push({ name: `${stay} 住宿`, area: stay })
    }

    const legs: DayRouteLeg[] = []
    for (let i = 0; i < points.length - 1; i += 1) {
      const from = points[i]
      const to = points[i + 1]
      if (from.name === to.name) continue
      const sameArea =
        hotelAreaBase(from.area) === hotelAreaBase(to.area) ||
        from.area.includes(to.area) ||
        to.area.includes(from.area)
      legs.push(buildRouteLeg(from.name, to.name, transportMode, sameArea))
    }

    const transportSummary = dayTransportSummary(transportMode, legs, stay)
    const schedule = injectTransportIntoSchedule(day.schedule, legs, transportMode)

    const modePace =
      transportMode === 'private_driver'
        ? '包車接送為主'
        : transportMode === 'self_drive'
          ? '自駕路段見下方'
          : '大眾運輸路線見下方'

    return enrichDayPlanRow({
      ...day,
      schedule,
      routeLegs: legs,
      transportSummary,
      paceNote: day.paceNote?.includes(modePace)
        ? day.paceNote
        : `${modePace}；${day.paceNote || ''}`.replace(/；+$/, ''),
    })
  })
}

function injectTransportIntoSchedule(
  schedule: ScheduleItem[],
  legs: DayRouteLeg[],
  mode: TransportMode,
): ScheduleItem[] {
  if (!schedule.length || !legs.length) return schedule

  const legByTo = new Map(legs.map((leg) => [leg.to, leg]))
  const next: ScheduleItem[] = []

  for (const item of schedule) {
    const leg = item.spotId ? legByTo.get(item.title) : undefined
    if (leg) {
      next.push({
        time: item.time,
        title:
          mode === 'private_driver'
            ? `包車前往 ${item.title}`
            : mode === 'self_drive'
              ? `自駕前往 ${item.title}`
              : `轉乘前往 ${item.title}`,
        detail: `${leg.modeLabel}｜${leg.summary} 約需 ${leg.durationHint}${
          leg.costHint ? `｜${leg.costHint}` : ''
        }`,
      })
      next.push({
        ...item,
        detail: `${item.detail}（抵達後開始遊覽）`,
      })
      continue
    }
    next.push(item)
  }

  const returnLeg = [...legs]
    .reverse()
    .find((leg) => /住宿|返程|機場/.test(leg.to))
  if (returnLeg && next.length) {
    const lastIdx = next.length - 1
    const last = next[lastIdx]
    if (/晚餐|回飯店|伴手禮|機場/.test(last.title) && !last.detail.includes('回程：')) {
      next[lastIdx] = {
        ...last,
        detail: `${last.detail}｜回程：${returnLeg.modeLabel}，${returnLeg.summary}（${returnLeg.durationHint}）`,
      }
    }
  }

  return next
}

export function buildItinerary(options: {
  destinations: Destination[]
  selectedSpotIds: string[]
  days: number
  pace: TripPace
  companion: Companion
  specialNeeds: string[]
  hotelAreaHint: string
  transportMode?: TransportMode
}): DayPlan[] {
  const requestedDays = clampDays(options.days)
  const {
    destinations: dests,
    selectedSpotIds,
    pace,
    companion,
    specialNeeds,
    hotelAreaHint,
    transportMode = specialNeeds.includes('包司機舒服版')
      ? 'private_driver'
      : 'public_transit',
  } = options

  const allSpots = dests.flatMap((d) => d.spots)

  // Prefer a handcrafted plan (e.g. 青甘 14 日 / 新疆 29 日) when available.
  // Shorter → compress highlights; longer → weave rest days through the journey.
  if (dests.length === 1 && dests[0].curatedPlans) {
    const exact = dests[0].curatedPlans[requestedDays]
    if (exact?.length) {
      const base = applySpotFilterToCurated(exact, selectedSpotIds).map((day) =>
        enrichDayPlanRow(day),
      )
      return applyTransportToItinerary(base, {
        transportMode,
        hotelAreaHint,
        spots: allSpots,
      })
    }

    const allCuratedLens = Object.keys(dests[0].curatedPlans)
      .map(Number)
      .sort((a, b) => a - b)
    const longer = allCuratedLens.filter((n) => n >= requestedDays)
    const shorter = allCuratedLens.filter((n) => n < requestedDays)
    const sourceLen = longer[0] ?? shorter[shorter.length - 1]
    const source = sourceLen ? dests[0].curatedPlans[sourceLen] : null
    if (source?.length) {
      const flexed =
        source.length >= requestedDays
          ? compressCuratedPlan(source, requestedDays)
          : expandCuratedPlan(
              source,
              requestedDays,
              dests[0].flexDayIdeas || [],
            )
      const base = applySpotFilterToCurated(flexed, selectedSpotIds).map((day) =>
        enrichDayPlanRow(day),
      )
      return applyTransportToItinerary(base, {
        transportMode,
        hotelAreaHint,
        spots: allSpots,
      })
    }
  }

  const spotsPerDay = tripPaces.find((p) => p.id === pace)?.spotsPerDay ?? 3
  const lateStart = specialNeeds.some((n) => n.includes('十點'))
  const startHour = lateStart || specialNeeds.some((n) => n.includes('少走路')) ? 10 : 9

  const selectedIds = ensureSpotsForDays({
    selectedSpotIds,
    allSpots,
    days: requestedDays,
    pace,
    companion,
    specialNeeds,
  })
  const selected = sortSpotsForTraveler(
    allSpots.filter((s) => selectedIds.includes(s.id)),
    companion,
    specialNeeds,
  )
  const flexIdeas = dests.flatMap((d) => d.flexDayIdeas)

  if (!selected.length) {
    return Array.from({ length: Math.min(requestedDays, 3) }, (_, i) =>
      enrichDayPlanRow({
        theme: `Day ${i + 1} · 自由活動`,
        stayArea: hotelAreaHint || dests[0]?.nameZh || '市區',
        stayCity: hotelAreaBase(hotelAreaHint || dests[0]?.nameZh || '市區'),
        mainPlan: '尚未選擇景點，請先勾選真實景點。',
        paceNote: '先完成景點選擇再排節奏。',
        hotelDirection: hotelAreaHint || dests[0]?.nameZh || '市區',
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
      }),
    )
  }

  // Always honour the user's chosen length. Extra days become interleaved
  // rest/flex days across the journey — never a trailing rest-only block.
  const days = requestedDays

  const longSpots = selected.filter((s) => s.stayHours >= 6)
  const shortSpots = selected.filter((s) => s.stayHours < 6)
  const areaGroups = [...groupByArea(shortSpots).entries()].sort(
    (a, b) => b[1].length - a[1].length,
  )
  const orderedShort: ScenicSpot[] = []
  for (const [, group] of areaGroups) orderedShort.push(...group)

  // Pack spots into a compact content calendar first…
  const contentDayEstimate = Math.min(
    days,
    Math.max(
      2,
      longSpots.length + Math.ceil(Math.max(orderedShort.length, 1) / spotsPerDay),
      Math.ceil(selected.length / Math.max(spotsPerDay, 1)),
    ),
  )
  const contentBuckets: ScenicSpot[][] = Array.from(
    { length: contentDayEstimate },
    () => [],
  )

  longSpots.forEach((spot, idx) => {
    const dayIndex = Math.min(contentDayEstimate - 1, Math.max(0, idx))
    if (contentBuckets[dayIndex].length === 0) contentBuckets[dayIndex].push(spot)
    else placeSpotInBuckets(contentBuckets, spot, spotsPerDay, true)
  })

  let cursor = 0
  for (const spot of orderedShort) {
    let placed = false
    for (let offset = 0; offset < contentDayEstimate; offset++) {
      const i = (cursor + offset) % contentDayEstimate
      const bucket = contentBuckets[i]
      const usedHours = bucket.reduce((sum, s) => sum + s.stayHours, 0)
      const countLimit = bucket.some((s) => s.stayHours >= 6) ? 1 : spotsPerDay
      if (bucket.length < countLimit && usedHours + spot.stayHours <= spotsPerDay * 2.8) {
        bucket.push(spot)
        cursor = (i + (bucket.length >= countLimit ? 1 : 0)) % contentDayEstimate
        placed = true
        break
      }
    }
    if (!placed) placeSpotInBuckets(contentBuckets, spot, spotsPerDay, true)
  }

  const usedIds = new Set(contentBuckets.flat().map((s) => s.id))
  const filler = sortSpotsForTraveler(
    allSpots.filter((s) => !usedIds.has(s.id)),
    companion,
    specialNeeds,
  )
  for (const spot of filler) {
    const empty = contentBuckets.findIndex((b) => b.length === 0)
    if (empty < 0) break
    contentBuckets[empty].push(spot)
    usedIds.add(spot.id)
  }

  const packedContent = contentBuckets.filter((b) => b.length > 0)
  // …then spread those content days across the full trip length.
  const spreadBuckets = spreadContentAcrossDays(packedContent, days)

  const plannedDays = spreadBuckets.map((bucket, index) => {
    const isFirst = index === 0
    const isLast = index === spreadBuckets.length - 1
    const flexIdea = flexIdeas[index % Math.max(flexIdeas.length, 1)] || '街區慢遊與咖啡'
    // Rest days inherit the previous content day's area so lodging stays coherent.
    let inheritArea = hotelAreaHint || '市區'
    for (let j = index; j >= 0; j -= 1) {
      const prev = spreadBuckets[j]
      if (prev && prev.length) {
        inheritArea = hotelAreaHint || prev[0].area || inheritArea
        break
      }
    }
    if (!bucket || !bucket.length) {
      for (let j = index; j < spreadBuckets.length; j += 1) {
        const next = spreadBuckets[j]
        if (next && next.length) {
          inheritArea = hotelAreaHint || next[0].area || inheritArea
          break
        }
      }
    }
    const area = bucket?.[0]?.area || inheritArea
    const themeCore =
      !bucket || bucket.length === 0
        ? `慢遊休息日・恢復體力`
        : bucket.some((s) => s.stayHours >= 6)
          ? bucket[0].name
          : `${area} 精華`

    const schedule: ScheduleItem[] = []
    let hour = isFirst ? Math.max(startHour, 10) : startHour

    if (!bucket || bucket.length === 0) {
      return makeFlexRestDay({
        stayArea: hotelAreaHint || area,
        stayCity: hotelAreaBase(hotelAreaHint || area),
        flexIdea,
        hotelDirection: hotelAreaHint || area,
        isFirst,
        isLast,
      })
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

    const theme = `${isFirst ? '抵達 · ' : isLast ? '收尾 · ' : ''}${themeCore}`
    const dayStory = bucket
      .map((s) => s.summary)
      .filter((s) => s && s.length > 12)
      .slice(0, 2)
      .join('')
    return enrichDayPlanRow({
      theme,
      stayArea: hotelAreaHint || area,
      stayCity: hotelAreaBase(area),
      mainPlan: buildMainPlan(bucket, theme, false),
      dayStory:
        dayStory ||
        `${bucket.map((s) => s.name).join('、')}是這天的主角；慢慢看、慢慢吃，比趕打卡名單更值得記住。`,
      paceNote: buildPaceNote(bucket, pace, isFirst, isLast),
      hotelDirection: hotelAreaHint || area,
      schedule,
      budget: `當日約 ${budgetLow}–${budgetHigh} 單位（不含住宿，幣別依目的地）`,
      tip: buildDayTip(bucket, specialNeeds, pace),
      spotIds: bucket.map((s) => s.id),
    })
  })

  const withMoves = plannedDays.map((day, index, arr) => {
    if (index === 0) return day
    const prev = arr[index - 1]
    if ((day.stayCity || '') === (prev.stayCity || '')) return day
    return {
      ...day,
      paceNote: `轉住 ${day.stayCity}；${day.paceNote || ''}`.trim(),
      mainPlan:
        day.mainPlan && !day.mainPlan.includes('→')
          ? `${prev.stayCity} → ${day.stayCity}；${day.mainPlan}`
          : day.mainPlan,
    }
  })

  return applyTransportToItinerary(withMoves, {
    transportMode,
    hotelAreaHint,
    spots: allSpots,
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

function buildPaceNote(
  bucket: ScenicSpot[],
  pace: TripPace,
  isFirst: boolean,
  isLast: boolean,
): string {
  if (!bucket.length) return '不趕行程；保留休息與彈性。'
  const hours = bucket.reduce((sum, s) => sum + s.stayHours, 0)
  const long = bucket.some((s) => s.stayHours >= 6)
  if (isFirst) return '抵達日偏鬆；先入住再出门。'
  if (isLast) return '收尾日預留交通緩衝。'
  if (long) return `含全日級行程，車程／活動約 ${Math.round(hours)} 小時；中途宜休息。`
  if (pace === 'relaxed') return `慢遊節奏，重點約 ${bucket.length} 站，下午可回飯店。`
  if (pace === 'packed') return `行程較滿（約 ${bucket.length} 站），盡量同區串連。`
  return `平衡節奏，約 ${bucket.length} 個重點；單段車程盡量控制。`
}

function buildMainPlan(bucket: ScenicSpot[], theme: string, isRest: boolean): string {
  if (isRest) return '休息日：散步、咖啡、洗衣或補眠，不新增長途景點。'
  if (!bucket.length) return theme
  return bucket.map((s) => s.name).join('、')
}

/** Ensure day rows have table fields (住宿地／主要安排／節奏／住宿方向). */
export function enrichDayPlanRow(day: DayPlan, hotelFallback?: string): DayPlan {
  const stayCity = day.stayCity || hotelAreaBase(day.stayArea)
  const titles = day.schedule
    .filter((item) => item.spotId || (!/出發|午餐|晚餐|抵達|回飯店|晚起/.test(item.title)))
    .map((item) => item.title)
  const mainPlan =
    day.mainPlan ||
    (day.spotIds.length
      ? titles.filter(Boolean).slice(0, 4).join('、') || day.theme
      : day.theme.includes('休息')
        ? '休息日：不排新增長途景點。'
        : day.theme)
  return {
    ...day,
    stayCity,
    mainPlan,
    paceNote: day.paceNote || day.tip || '按當日節奏安排',
    hotelDirection: day.hotelDirection || hotelFallback || day.stayArea,
  }
}
