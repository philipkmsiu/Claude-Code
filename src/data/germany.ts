export type HotelStyle = 'value' | 'luxury' | 'luxuryValue' | 'standard' | 'clean'
export type TripPace = 'relaxed' | 'balanced' | 'packed'
export type Companion = 'solo' | 'couple' | 'family' | 'friends'
export type SpotTag = 'must' | 'photo' | 'popular' | 'culture' | 'nature' | 'food' | 'shopping'

export type DestinationId =
  | 'berlin'
  | 'munich'
  | 'cologne'
  | 'hamburg'
  | 'heidelberg'
  | 'romantic'

export interface ScenicSpot {
  id: string
  name: string
  nameDe: string
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

export interface Destination {
  id: DestinationId
  nameZh: string
  nameDe: string
  tagline: string
  intro: string
  bestSeason: string
  recommendedDays: { min: number; ideal: number; max: number; note: string }
  weather: {
    spring: string
    summer: string
    autumn: string
    winter: string
  }
  hotels: HotelOption[]
  spots: ScenicSpot[]
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

export const tripPaces: { id: TripPace; label: string; description: string; spotsPerDay: number }[] =
  [
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

export const specialNeedOptions = [
  '喜歡歷史文化',
  '想拍打卡美照',
  '避開人潮',
  '想多吃在地美食',
  '需要親子友善',
  '盡量少走路',
  '想安排購物',
  '偏好戶外自然',
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

export const destinations: Destination[] = [
  {
    id: 'berlin',
    nameZh: '柏林',
    nameDe: 'Berlin',
    tagline: '歷史、街頭藝術與當代節奏交會的首都',
    intro:
      '柏林不是靠一座地標撐起旅程，而是用牆、博物館島、啤酒花園與深夜酒吧拼出層次。適合喜歡城市漫遊、設計與近代史的旅人。',
    bestSeason: '5–9 月最舒適；12 月聖誕市集氛圍濃厚',
    recommendedDays: {
      min: 3,
      ideal: 4,
      max: 6,
      note: '三天可走經典軸線；四到五天能加入波茨坦或博物館深度日。',
    },
    weather: {
      spring: '8–16°C，多變有風，建議薄外套與防風層',
      summer: '18–28°C，日照長，適合戶外啤酒花園',
      autumn: '6–15°C，落葉公園很美，偶有細雨',
      winter: '-2–5°C，濕冷為主，聖誕市集熱飲必備',
    },
    hotels: [
      {
        name: 'Hotel Zoo Berlin',
        area: 'Kurfürstendamm',
        nightsHint: '建議住滿全程，減少換宿',
        pricePerNight: '€180–260',
        highlight: '精品復古氛圍，通往西城購物與公園都方便',
        styles: ['luxuryValue', 'luxury'],
      },
      {
        name: 'Motel One Berlin-Alexanderplatz',
        area: 'Alexanderplatz',
        nightsHint: '3–5 晚最划算',
        pricePerNight: '€95–140',
        highlight: '設計感強、地鐵出口旁，性價比穩定',
        styles: ['value', 'standard'],
      },
      {
        name: 'Adina Apartment Hotel Berlin Hackescher Markt',
        area: 'Mitte',
        nightsHint: '4 晚以上可自炊更省',
        pricePerNight: '€140–200',
        highlight: '套房附廚房，清潔評分高、適合中長住',
        styles: ['clean', 'value', 'standard'],
      },
      {
        name: 'Hotel Adlon Kempinski',
        area: 'Unter den Linden',
        nightsHint: '2–3 晚儀式感即可',
        pricePerNight: '€450–700',
        highlight: '正對勃蘭登堡門，經典奢華地標宿',
        styles: ['luxury'],
      },
    ],
    spots: [
      { id: 'ber-brandenburg', name: '勃蘭登堡門', nameDe: 'Brandenburger Tor', area: 'Mitte', stayHours: 1, summary: '德國統一象徵，經典正面取景必拍。', tags: ['must', 'photo', 'popular'], ticket: '免費', bestFor: ['solo', 'couple', 'family', 'friends'] },
      { id: 'ber-reichstag', name: '國會大廈穹頂', nameDe: 'Reichstag', area: 'Mitte', stayHours: 1.5, summary: '需預約登頂，俯瞰柏林軸線。', tags: ['must', 'photo', 'culture'], ticket: '免費（需預約）', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'ber-museum', name: '博物館島', nameDe: 'Museumsinsel', area: 'Mitte', stayHours: 3, summary: '世界遺產博物館群，建議擇 1–2 館。', tags: ['must', 'culture', 'popular'], ticket: '單館約 €12–19', bestFor: ['solo', 'couple', 'family', 'friends'] },
      { id: 'ber-eastside', name: '東邊畫廊', nameDe: 'East Side Gallery', area: 'Friedrichshain', stayHours: 1.5, summary: '最長開放圍牆壁畫段，戶外打卡熱點。', tags: ['must', 'photo', 'popular'], ticket: '免費', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'ber-checkpoint', name: '查理檢查哨', nameDe: 'Checkpoint Charlie', area: 'Mitte', stayHours: 1, summary: '冷戰檢查站地標，周邊展覽豐富。', tags: ['popular', 'culture', 'photo'], ticket: '外觀免費', bestFor: ['solo', 'couple', 'family', 'friends'] },
      { id: 'ber-tv', name: '電視塔', nameDe: 'Fernsehturm', area: 'Alexanderplatz', stayHours: 1.5, summary: '城市制高點，夜景與日落都很強。', tags: ['photo', 'popular'], ticket: '約 €20–25', bestFor: ['couple', 'family', 'friends'] },
      { id: 'ber-tiergarten', name: '蒂爾加滕公園', nameDe: 'Tiergarten', area: 'Tiergarten', stayHours: 2, summary: '城市綠肺，適合放慢節奏散步。', tags: ['nature'], ticket: '免費', bestFor: ['solo', 'couple', 'family'] },
      { id: 'ber-holocaust', name: '猶太人大屠殺紀念碑', nameDe: 'Holocaust Mahnmal', area: 'Mitte', stayHours: 1, summary: '沉重而重要的紀念空間。', tags: ['must', 'culture'], ticket: '免費', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'ber-topography', name: '恐怖地形學博物館', nameDe: 'Topographie des Terrors', area: 'Kreuzberg', stayHours: 2, summary: '納粹與蓋世太保歷史展覽，免費且扎實。', tags: ['culture'], ticket: '免費', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'ber-palace', name: '夏洛滕堡宮', nameDe: 'Schloss Charlottenburg', area: 'Charlottenburg', stayHours: 2.5, summary: '巴洛克宮殿與花園，西城經典。', tags: ['culture', 'photo'], ticket: '約 €12–17', bestFor: ['couple', 'family'] },
      { id: 'ber-kadewe', name: 'KaDeWe 百貨', nameDe: 'KaDeWe', area: 'Schöneberg', stayHours: 2, summary: '美食層與伴手禮一次搞定。', tags: ['shopping', 'food', 'popular'], ticket: '免費入場', bestFor: ['couple', 'family', 'friends'] },
      { id: 'ber-hackescher', name: 'Hackescher Markt 巷弄', nameDe: 'Hackescher Markt', area: 'Mitte', stayHours: 2, summary: '庭院、設計店與咖啡，好逛好拍。', tags: ['photo', 'shopping', 'food'], ticket: '免費', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'ber-tempelhof', name: '滕佩爾霍夫公園', nameDe: 'Tempelhofer Feld', area: 'Neukölln', stayHours: 2, summary: '舊機場跑道變公園，開闊好拍。', tags: ['nature', 'photo'], ticket: '免費', bestFor: ['solo', 'friends', 'family'] },
      { id: 'ber-kreuzberg', name: 'Kreuzberg 街頭美食', nameDe: 'Kreuzberg', area: 'Kreuzberg', stayHours: 2, summary: '多元移民料理與街頭感街區。', tags: ['food', 'popular'], ticket: '餐費自理', bestFor: ['solo', 'friends'] },
      { id: 'ber-potsdam', name: '波茨坦無憂宮', nameDe: 'Sanssouci', area: 'Potsdam', stayHours: 4, summary: '日遊首選，宮殿花園氣勢十足。', tags: ['must', 'photo', 'culture'], ticket: '花園可免 / 宮殿另購', bestFor: ['couple', 'family', 'friends'] },
      { id: 'ber-dome', name: '柏林大教堂', nameDe: 'Berliner Dom', area: 'Mitte', stayHours: 1.5, summary: '博物館島旁穹頂，可登頂看河景。', tags: ['photo', 'culture'], ticket: '約 €10', bestFor: ['couple', 'family'] },
      { id: 'ber-wallmuseum', name: '圍牆紀念館', nameDe: 'Gedenkstätte Berliner Mauer', area: 'Bernauer Str.', stayHours: 1.5, summary: '比檢查哨更完整的圍牆敘事。', tags: ['culture', 'must'], ticket: '免費', bestFor: ['solo', 'couple', 'family'] },
      { id: 'ber-spree', name: '施普雷河遊船', nameDe: 'Spree River Cruise', area: 'Mitte', stayHours: 1.5, summary: '從水面看博物館島與國會區。', tags: ['popular', 'photo'], ticket: '約 €20', bestFor: ['couple', 'family', 'friends'] },
      { id: 'ber-markthalle', name: 'Markthalle Neun', nameDe: 'Markthalle Neun', area: 'Kreuzberg', stayHours: 1.5, summary: '市場與 Street Food Thursday 氛圍。', tags: ['food'], ticket: '餐費自理', bestFor: ['solo', 'friends', 'couple'] },
      { id: 'ber-olympia', name: '奧林匹克體育場外觀', nameDe: 'Olympiastadion', area: 'Westend', stayHours: 1.5, summary: '建築尺度震撼，足球迷加分。', tags: ['photo', 'culture'], ticket: '外觀免費 / 導覽另計', bestFor: ['friends', 'family'] },
    ],
  },
  {
    id: 'munich',
    nameZh: '慕尼黑',
    nameDe: 'München',
    tagline: '巴伐利亞王國氣質，啤酒、皇宮與阿爾卑斯門戶',
    intro:
      '慕尼黑把華麗宮殿、傳統啤酒文化與近郊湖山收進同一個節奏。城市本身適合三到四天；若想加新天鵝堡，理想是五到六天。',
    bestSeason: '5–10 月；9 月底啤酒節熱鬧但擁擠',
    recommendedDays: {
      min: 3,
      ideal: 5,
      max: 7,
      note: '三天走市區；五天可把新天鵝堡一日遊排進去。',
    },
    weather: {
      spring: '7–17°C，早晚涼，英式花園開始轉綠',
      summer: '16–27°C，日照佳，適合湖區與啤酒花園',
      autumn: '5–15°C，楓色與啤酒節交疊',
      winter: '-3–4°C，聖誕市集與室內美術館友好',
    },
    hotels: [
      {
        name: 'Hotel Torbräu',
        area: 'Altstadt',
        nightsHint: '全程不住換最省力',
        pricePerNight: '€160–230',
        highlight: '老城中心，步行可達多數景點',
        styles: ['luxuryValue', 'standard'],
      },
      {
        name: 'Wombats City Hostel Munich',
        area: 'Hauptbahnhof',
        nightsHint: '3–4 晚',
        pricePerNight: '€45–80',
        highlight: '車站旁超高性價比，清潔管理佳',
        styles: ['value', 'clean'],
      },
      {
        name: 'Mandarin Oriental München',
        area: 'Altstadt-Lehel',
        nightsHint: '2–3 晚奢華體驗',
        pricePerNight: '€500–800',
        highlight: '市中心頂級服務與空中酒廊',
        styles: ['luxury'],
      },
      {
        name: 'Holiday Inn Express Munich City West',
        area: 'Westend',
        nightsHint: '4 晚以上穩定選擇',
        pricePerNight: '€110–160',
        highlight: '新淨房型、含早，清潔評分可靠',
        styles: ['clean', 'standard', 'value'],
      },
    ],
    spots: [
      { id: 'muc-marien', name: '瑪麗恩廣場', nameDe: 'Marienplatz', area: 'Altstadt', stayHours: 1.5, summary: '新市政廳與木偶報時，慕尼黑門面。', tags: ['must', 'photo', 'popular'], ticket: '免費', bestFor: ['solo', 'couple', 'family', 'friends'] },
      { id: 'muc-frauen', name: '聖母教堂', nameDe: 'Frauenkirche', area: 'Altstadt', stayHours: 1, summary: '城市天際線象徵，可登塔。', tags: ['photo', 'culture'], ticket: '登塔另計', bestFor: ['solo', 'couple', 'family'] },
      { id: 'muc-viktualien', name: '維克圖阿連市場', nameDe: 'Viktualienmarkt', area: 'Altstadt', stayHours: 1.5, summary: '白腸、啤酒與攤販美食核心。', tags: ['must', 'food', 'popular'], ticket: '餐費自理', bestFor: ['solo', 'couple', 'friends', 'family'] },
      { id: 'muc-residenz', name: ' Residualenz 皇宮', nameDe: 'Residenz', area: 'Altstadt', stayHours: 2.5, summary: '巴伐利亞王室宮殿與寶物廳。', tags: ['must', 'culture'], ticket: '約 €9–15', bestFor: ['couple', 'family', 'friends'] },
      { id: 'muc-nymph', name: '寧芬堡宮', nameDe: 'Schloss Nymphenburg', area: 'Neuhausen', stayHours: 3, summary: '宮殿加花園，半日行程首選。', tags: ['must', 'photo', 'culture'], ticket: '花園免 / 宮殿另購', bestFor: ['couple', 'family'] },
      { id: 'muc-english', name: '英式花園', nameDe: 'Englischer Garten', area: 'Schwabing', stayHours: 2, summary: '見習衝浪與啤酒花園，城市綠洲。', tags: ['nature', 'photo', 'popular'], ticket: '免費', bestFor: ['solo', 'couple', 'friends', 'family'] },
      { id: 'muc-hofbrau', name: 'Hofbräuhaus 啤酒館', nameDe: 'Hofbräuhaus', area: 'Altstadt', stayHours: 1.5, summary: '最經典啤酒體驗，氣氛滿載。', tags: ['food', 'popular', 'must'], ticket: '餐費自理', bestFor: ['friends', 'couple', 'family'] },
      { id: 'muc-neuschwanstein', name: '新天鵝堡', nameDe: 'Neuschwanstein', area: 'Füssen 日遊', stayHours: 8, summary: '童話城堡，務必預訂時段票。', tags: ['must', 'photo', 'popular'], ticket: '約 €21 + 交通', bestFor: ['couple', 'family', 'friends'] },
      { id: 'muc-bmw', name: 'BMW Welt / 博物館', nameDe: 'BMW Welt', area: 'Olympiapark', stayHours: 2, summary: '汽車迷必訪，建築本身也好拍。', tags: ['popular', 'photo'], ticket: 'Welt 免費 / 博物館另計', bestFor: ['friends', 'family', 'solo'] },
      { id: 'muc-pinakothek', name: '老繪畫陳列館', nameDe: 'Alte Pinakothek', area: 'Maxvorstadt', stayHours: 2.5, summary: '歐洲古典繪畫重鎮，雨天優選。', tags: ['culture'], ticket: '約 €7–9', bestFor: ['solo', 'couple'] },
      { id: 'muc-olympia', name: '奧林匹克公園', nameDe: 'Olympiapark', area: 'Olympiapark', stayHours: 2, summary: '1972 建築群與展望台。', tags: ['photo', 'nature'], ticket: '公園免費', bestFor: ['family', 'friends', 'couple'] },
      { id: 'muc-dachau', name: '達豪紀念館', nameDe: 'Dachau', area: '近郊', stayHours: 4, summary: '重要歷史教育行程，氣氛沉重。', tags: ['culture', 'must'], ticket: '免費（導覽另計）', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'muc-asamak', name: '阿薩姆教堂', nameDe: 'Asamkirche', area: 'Altstadt', stayHours: 0.75, summary: '巴洛克華麗小教堂，好拍到驚人。', tags: ['photo', 'culture'], ticket: '免費/樂捐', bestFor: ['couple', 'solo'] },
      { id: 'muc-deutsches', name: '德意志博物館', nameDe: 'Deutsches Museum', area: 'Museumsinsel', stayHours: 3, summary: '科技博物館巨無霸，親子友善。', tags: ['culture', 'popular'], ticket: '約 €15', bestFor: ['family', 'friends'] },
      { id: 'muc-stachus', name: '卡爾斯廣場購物', nameDe: 'Stachus / Kaufinger', area: 'Altstadt', stayHours: 2, summary: '步行街購物與伴手禮。', tags: ['shopping'], ticket: '免費', bestFor: ['couple', 'friends', 'family'] },
      { id: 'muc-isartor', name: '伊薩爾門與河岸', nameDe: 'Isartor / Isar', area: 'Altstadt', stayHours: 1.5, summary: '老城邊緣河岸散步。', tags: ['nature', 'photo'], ticket: '免費', bestFor: ['solo', 'couple'] },
      { id: 'muc-schwabing', name: '施瓦本街區', nameDe: 'Schwabing', area: 'Schwabing', stayHours: 2, summary: '文青咖啡與商店街漫遊。', tags: ['food', 'shopping'], ticket: '免費', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'muc-hellabrunn', name: '地獄布魯恩動物園', nameDe: 'Tierpark Hellabrunn', area: 'Harlaching', stayHours: 3, summary: '親子行程穩定選項。', tags: ['nature', 'popular'], ticket: '約 €15–19', bestFor: ['family'] },
      { id: 'muc-allianz', name: '安聯球場外觀', nameDe: 'Allianz Arena', area: 'Fröttmaning', stayHours: 1.5, summary: '拜仁球迷打卡點。', tags: ['photo', 'popular'], ticket: '外觀免費 / 博物館另計', bestFor: ['friends', 'family'] },
      { id: 'muc-chateau', name: '布倫能堡日遊備案', nameDe: 'Schloss Blutenburg', area: '近郊', stayHours: 3, summary: '較安靜的城堡替代方案。', tags: ['culture', 'photo'], ticket: '視開放而定', bestFor: ['couple', 'solo'] },
    ],
  },
  {
    id: 'cologne',
    nameZh: '科隆與萊茵',
    nameDe: 'Köln & Rhein',
    tagline: '哥德大教堂、萊茵河岸與葡萄酒小鎮節奏',
    intro:
      '科隆適合當萊茵流域基地：白天看大教堂與博物館，再以一日遊串起波昂或葡萄酒小鎮。',
    bestSeason: '4–10 月河岸活動多；12 月聖誕市集很有名',
    recommendedDays: {
      min: 2,
      ideal: 4,
      max: 5,
      note: '兩天看科隆本體；四天可加萊茵河谷一日遊。',
    },
    weather: {
      spring: '8–17°C，河風偏涼',
      summer: '16–27°C，適合遊船',
      autumn: '7–16°C，葡萄收成季氛圍佳',
      winter: '0–6°C，濕冷，市集熱紅酒暖身',
    },
    hotels: [
      {
        name: 'Hotel Mondial am Dom Cologne',
        area: 'Dom / Hauptbahnhof',
        nightsHint: '2–4 晚',
        pricePerNight: '€130–190',
        highlight: '大教堂旁，交通與景點最省力',
        styles: ['standard', 'value', 'luxuryValue'],
      },
      {
        name: '25hours Hotel The Circle',
        area: 'Ehrenfeld 附近',
        nightsHint: '2–3 晚',
        pricePerNight: '€150–220',
        highlight: '設計感強，年輕旅人最愛',
        styles: ['luxuryValue', 'luxury'],
      },
      {
        name: 'Station Hostel Cologne',
        area: '車站周邊',
        nightsHint: '2–3 晚',
        pricePerNight: '€35–70',
        highlight: '預算友好，清潔管理口碑佳',
        styles: ['value', 'clean'],
      },
      {
        name: 'Excelsior Hotel Ernst',
        area: 'Domplatz',
        nightsHint: '1–2 晚奢華',
        pricePerNight: '€350–550',
        highlight: '正對大教堂的經典奢華酒店',
        styles: ['luxury'],
      },
    ],
    spots: [
      { id: 'cgn-dom', name: '科隆大教堂', nameDe: 'Kölner Dom', area: 'Dom', stayHours: 2, summary: '哥德式巨構，可登南塔俯瞰萊茵。', tags: ['must', 'photo', 'popular'], ticket: '教堂免費 / 登塔另計', bestFor: ['solo', 'couple', 'family', 'friends'] },
      { id: 'cgn-oldtown', name: '科隆老城', nameDe: 'Altstadt', area: 'Altstadt', stayHours: 2, summary: '彩色屋與啤酒屋巷弄。', tags: ['must', 'photo', 'food'], ticket: '免費', bestFor: ['couple', 'friends', 'family'] },
      { id: 'cgn-bridge', name: '霍亨索倫橋', nameDe: 'Hohenzollernbrücke', area: 'Rhein', stayHours: 1, summary: '愛情鎖與河景經典取景。', tags: ['photo', 'popular'], ticket: '免費', bestFor: ['couple', 'friends'] },
      { id: 'cgn-choco', name: '巧克力博物館', nameDe: 'Schokoladenmuseum', area: 'Rheinau', stayHours: 2, summary: '親子與甜點控友好。', tags: ['popular', 'food'], ticket: '約 €15', bestFor: ['family', 'couple'] },
      { id: 'cgn-roman', name: '羅馬日耳曼博物館', nameDe: 'Römisch-Germanisches Museum', area: 'Dom', stayHours: 2, summary: '羅馬時期科隆史。', tags: ['culture'], ticket: '約 €6–10', bestFor: ['solo', 'couple'] },
      { id: 'cgn-cruise', name: '萊茵短程遊船', nameDe: 'Rhein Cruise', area: 'Rhein', stayHours: 1.5, summary: '從水面看大教堂天際線。', tags: ['popular', 'photo'], ticket: '約 €15–25', bestFor: ['couple', 'family', 'friends'] },
      { id: 'cgn-belgian', name: '比利時區', nameDe: 'Belgisches Viertel', area: 'Belgisches Viertel', stayHours: 2, summary: '設計店、咖啡與年輕街區。', tags: ['shopping', 'food', 'photo'], ticket: '免費', bestFor: ['solo', 'friends', 'couple'] },
      { id: 'cgn-beer', name: 'Kölsch 啤酒屋巡禮', nameDe: 'Brauhaus', area: 'Altstadt', stayHours: 1.5, summary: '在地啤酒文化必體驗。', tags: ['food', 'must'], ticket: '餐費自理', bestFor: ['friends', 'couple'] },
      { id: 'cgn-ludwig', name: '路德維希博物館', nameDe: 'Museum Ludwig', area: 'Dom', stayHours: 2, summary: '現當代藝術與畢卡索收藏。', tags: ['culture'], ticket: '約 €12', bestFor: ['solo', 'couple'] },
      { id: 'cgn-bonn', name: '波昂半日遊', nameDe: 'Bonn', area: '近郊', stayHours: 4, summary: '舊首都與貝多芬故居氛圍。', tags: ['culture', 'popular'], ticket: '交通另計', bestFor: ['couple', 'friends', 'solo'] },
      { id: 'cgn-rheinvalley', name: '萊茵河谷古堡段', nameDe: 'Rheintal', area: '日遊', stayHours: 8, summary: 'Bacharach / St. Goar 浪漫河段。', tags: ['must', 'photo', 'nature'], ticket: '交通+餐飲', bestFor: ['couple', 'friends', 'family'] },
      { id: 'cgn-4711', name: '4711 香水店', nameDe: '4711', area: 'Glockengasse', stayHours: 0.75, summary: '科隆水經典伴手禮。', tags: ['shopping'], ticket: '免費入場', bestFor: ['couple', 'friends', 'family'] },
      { id: 'cgn-rheinpark', name: '萊茵公園與纜車', nameDe: 'Rheinpark', area: 'Deutz', stayHours: 2, summary: '過河看大教堂正面全景。', tags: ['photo', 'nature'], ticket: '纜車另計', bestFor: ['family', 'couple'] },
      { id: 'cgn-flora', name: '植物園 Flora', nameDe: 'Flora Köln', area: 'Riehl', stayHours: 2, summary: '溫室與花園，節奏放慢。', tags: ['nature'], ticket: '約 €5–8', bestFor: ['couple', 'family', 'solo'] },
      { id: 'cgn-hohenzollern', name: '大教堂珍寶館', nameDe: 'Domschatzkammer', area: 'Dom', stayHours: 1, summary: '宗教藝術與金工細節。', tags: ['culture'], ticket: '約 €6', bestFor: ['solo', 'couple'] },
      { id: 'cgn-hohenz', name: '萊茵河自行車道散步', nameDe: 'Rheinufer', area: 'Rhein', stayHours: 1.5, summary: '黃昏最美的免費行程。', tags: ['nature', 'photo'], ticket: '免費', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'cgn-ehrenfeld', name: 'Ehrenfeld 街頭藝術', nameDe: 'Ehrenfeld', area: 'Ehrenfeld', stayHours: 2, summary: '壁畫與年輕酒吧區。', tags: ['photo', 'food'], ticket: '免費', bestFor: ['solo', 'friends'] },
      { id: 'cgn-phano', name: '當代藝術媒體中心', nameDe: 'Kölnischer Kunstverein 周邊', area: '市中心', stayHours: 1.5, summary: '小型藝文備案。', tags: ['culture'], ticket: '視展覽', bestFor: ['solo', 'couple'] },
      { id: 'cgn-market', name: '農夫市場採買', nameDe: 'Wochenmarkt', area: '各區', stayHours: 1, summary: '乳酪、麵包與水果野餐材料。', tags: ['food'], ticket: '自理', bestFor: ['family', 'couple'] },
      { id: 'cgn-xmas', name: '聖誕市集（季節）', nameDe: 'Weihnachtsmarkt', area: 'Dom / Altstadt', stayHours: 2, summary: '冬季限定熱紅酒氛圍。', tags: ['popular', 'photo', 'food'], ticket: '免費入場', bestFor: ['couple', 'family', 'friends'] },
    ],
  },
  {
    id: 'hamburg',
    nameZh: '漢堡',
    nameDe: 'Hamburg',
    tagline: '港口都會、倉庫城與易北河現代建築',
    intro:
      '漢堡是德國的水上門面：倉庫城磚牆、易北愛樂廳曲線、港口夕陽構成主畫面。',
    bestSeason: '5–9 月港口活動豐富',
    recommendedDays: {
      min: 2,
      ideal: 3,
      max: 4,
      note: '三天剛好：港口、倉庫城、易北愛樂與一條街區漫遊。',
    },
    weather: {
      spring: '7–15°C，海風明顯',
      summer: '15–24°C，最適合港灣散步',
      autumn: '6–14°C，多雲有雨機率',
      winter: '0–5°C，濕冷，室內展演友好',
    },
    hotels: [
      {
        name: 'Henri Hotel Hamburg Downtown',
        area: 'Neustadt',
        nightsHint: '2–3 晚',
        pricePerNight: '€140–200',
        highlight: '設計旅店，步行可達內阿爾斯特湖',
        styles: ['luxuryValue', 'standard'],
      },
      {
        name: 'Generator Hamburg',
        area: '交通便利區',
        nightsHint: '2–3 晚',
        pricePerNight: '€40–85',
        highlight: '年輕高性價比，房間清潔穩定',
        styles: ['value', 'clean'],
      },
      {
        name: 'Fairmont Hotel Vier Jahreszeiten',
        area: 'Binnenalster',
        nightsHint: '1–2 晚',
        pricePerNight: '€400–650',
        highlight: '湖景經典奢華，儀式感滿分',
        styles: ['luxury'],
      },
      {
        name: 'Holiday Inn Hamburg - City Nord',
        area: 'City Nord',
        nightsHint: '3 晚',
        pricePerNight: '€110–160',
        highlight: '新淨商務型，適合清潔優先旅客',
        styles: ['clean', 'standard', 'value'],
      },
    ],
    spots: [
      { id: 'ham-speicher', name: '倉庫城', nameDe: 'Speicherstadt', area: 'HafenCity', stayHours: 2, summary: '世界遺產磚牆水道，必拍紅點。', tags: ['must', 'photo', 'popular'], ticket: '免費外觀', bestFor: ['solo', 'couple', 'family', 'friends'] },
      { id: 'ham-elphi', name: '易北愛樂廳', nameDe: 'Elbphilharmonie', area: 'HafenCity', stayHours: 1.5, summary: '廣場免費，建築曲線是打卡王。', tags: ['must', 'photo', 'popular'], ticket: '廣場免費 / 演出另計', bestFor: ['couple', 'friends', 'family'] },
      { id: 'ham-harbor', name: '港口遊船', nameDe: 'Hafenrundfahrt', area: 'Landungsbrücken', stayHours: 1.5, summary: '理解港口城市最好方式。', tags: ['must', 'popular'], ticket: '約 €18–25', bestFor: ['family', 'couple', 'friends'] },
      { id: 'ham-rathaus', name: '市政廳', nameDe: 'Rathaus', area: 'Rathausmarkt', stayHours: 1.5, summary: '華麗市政建築與廣場。', tags: ['photo', 'culture'], ticket: '外觀免費', bestFor: ['solo', 'couple', 'family'] },
      { id: 'ham-alster', name: '內阿爾斯特湖', nameDe: 'Binnenalster', area: 'Neustadt', stayHours: 1.5, summary: '湖岸散步與天鵝取景。', tags: ['photo', 'nature'], ticket: '免費', bestFor: ['couple', 'solo'] },
      { id: 'ham-stpauli', name: '聖保利街區', nameDe: 'St. Pauli', area: 'St. Pauli', stayHours: 2, summary: '夜生活與港口邊緣氛圍。', tags: ['popular', 'food'], ticket: '免費', bestFor: ['friends', 'solo'] },
      { id: 'ham-mini', name: '微縮景觀世界', nameDe: 'Miniatur Wunderland', area: 'Speicherstadt', stayHours: 2.5, summary: '親子與攝影都愛上的室內點。', tags: ['popular', 'photo', 'must'], ticket: '約 €20', bestFor: ['family', 'friends', 'couple'] },
      { id: 'ham-fish', name: '魚市', nameDe: 'Fischmarkt', area: 'Altona', stayHours: 1.5, summary: '週末早晨限定活力市集。', tags: ['food', 'popular'], ticket: '免費入場', bestFor: ['solo', 'friends', 'family'] },
      { id: 'ham-reeper', name: 'Reeperbahn 夜景', nameDe: 'Reeperbahn', area: 'St. Pauli', stayHours: 1.5, summary: '燈火街道，適合晚間短暫停留。', tags: ['photo', 'popular'], ticket: '免費', bestFor: ['friends', 'couple'] },
      { id: 'ham-kunsthalle', name: '漢堡美術館', nameDe: 'Hamburger Kunsthalle', area: 'Altstadt', stayHours: 2.5, summary: '藝術收藏深厚，雨天備案。', tags: ['culture'], ticket: '約 €14', bestFor: ['solo', 'couple'] },
      { id: 'ham-hafencity', name: 'HafenCity 現代建築', nameDe: 'HafenCity', area: 'HafenCity', stayHours: 2, summary: '新港灣都市設計漫遊。', tags: ['photo', 'culture'], ticket: '免費', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'ham-michel', name: '聖米迦勒教堂', nameDe: 'Michel', area: 'Neustadt', stayHours: 1.5, summary: '漢堡精神象徵，可登塔。', tags: ['photo', 'culture'], ticket: '登塔另計', bestFor: ['couple', 'family'] },
      { id: 'ham-blankenese', name: 'Blankenese 山城階梯', nameDe: 'Blankenese', area: '西郊', stayHours: 3, summary: '階梯聚落與易北河視野。', tags: ['photo', 'nature'], ticket: '免費', bestFor: ['couple', 'solo'] },
      { id: 'ham-chilehaus', name: '智利館', nameDe: 'Chilehaus', area: 'Kontorhaus', stayHours: 0.75, summary: '表現主義磚建築船頭造型。', tags: ['photo', 'culture'], ticket: '免費外觀', bestFor: ['solo', 'couple'] },
      { id: 'ham-planten', name: '植物園與公園', nameDe: 'Planten un Blomen', area: 'St. Pauli 旁', stayHours: 2, summary: '綠地放空與音樂噴泉（季節）。', tags: ['nature'], ticket: '免費', bestFor: ['family', 'couple'] },
      { id: 'ham-shopping', name: 'Jungfernstieg 購物', nameDe: 'Jungfernstieg', area: 'Neustadt', stayHours: 2, summary: '湖畔購物大道。', tags: ['shopping'], ticket: '免費', bestFor: ['couple', 'friends'] },
      { id: 'ham-uebers', name: '易北河隧道老段', nameDe: 'Alter Elbtunnel', area: 'St. Pauli', stayHours: 1, summary: '走入河底的特殊體驗。', tags: ['popular', 'photo'], ticket: '免費', bestFor: ['friends', 'family', 'solo'] },
      { id: 'ham-museum', name: '國際海事博物館', nameDe: 'Internationales Maritimes Museum', area: 'HafenCity', stayHours: 2, summary: '航海史深度館。', tags: ['culture'], ticket: '約 €15', bestFor: ['family', 'solo'] },
      { id: 'ham-schanzen', name: 'Schanzenviertel', nameDe: 'Sternschanze', area: 'Schanze', stayHours: 2, summary: '街頭感咖啡與商店。', tags: ['food', 'shopping'], ticket: '免費', bestFor: ['solo', 'friends'] },
      { id: 'ham-sunset', name: '碼頭日落', nameDe: 'Landungsbrücken Sunset', area: 'Landungsbrücken', stayHours: 1, summary: '港口金色時刻，免費打卡。', tags: ['photo', 'must'], ticket: '免費', bestFor: ['couple', 'friends', 'solo'] },
    ],
  },
  {
    id: 'heidelberg',
    nameZh: '海德堡',
    nameDe: 'Heidelberg',
    tagline: '城堡、老橋與大學城的浪漫縮影',
    intro:
      '海德堡適合放慢：城堡俯瞰內卡河、哲學家步道看日落、老城巷弄喝咖啡。',
    bestSeason: '4–10 月；夏季大學城活力高',
    recommendedDays: {
      min: 2,
      ideal: 3,
      max: 4,
      note: '兩天精華；三天可加哲學家步道與慢食日。',
    },
    weather: {
      spring: '8–18°C，河岸櫻花與新綠',
      summer: '16–28°C，適合步道與戶外座位',
      autumn: '7–16°C，城堡與山丘色調佳',
      winter: '0–6°C，安靜、適合室內咖啡館',
    },
    hotels: [
      {
        name: 'Hotel Anlage',
        area: '車站可達',
        nightsHint: '2–3 晚',
        pricePerNight: '€100–150',
        highlight: '乾淨舒適，性價比高',
        styles: ['value', 'standard', 'clean'],
      },
      {
        name: 'Hotel Europäischer Hof Heidelberg',
        area: '舊城邊緣',
        nightsHint: '2 晚',
        pricePerNight: '€280–420',
        highlight: '經典奢華，服務細緻',
        styles: ['luxury', 'luxuryValue'],
      },
      {
        name: 'Staycity Aparthotels Heidelberg',
        area: '新城',
        nightsHint: '3 晚以上',
        pricePerNight: '€110–170',
        highlight: '公寓式、清潔新，適合想自在一點的旅客',
        styles: ['clean', 'value'],
      },
    ],
    spots: [
      { id: 'hd-castle', name: '海德堡城堡', nameDe: 'Schloss Heidelberg', area: 'Altstadt', stayHours: 2.5, summary: '紅砂巖城堡，城市必去第一名。', tags: ['must', 'photo', 'popular'], ticket: '庭院可體驗 / 套票另計', bestFor: ['solo', 'couple', 'family', 'friends'] },
      { id: 'hd-bridge', name: '老橋', nameDe: 'Alte Brücke', area: 'Altstadt', stayHours: 1, summary: '內卡河經典視角，日落超美。', tags: ['must', 'photo'], ticket: '免費', bestFor: ['couple', 'solo', 'friends'] },
      { id: 'hd-philo', name: '哲學家步道', nameDe: 'Philosophenweg', area: '北岸山丘', stayHours: 2, summary: '俯瞰紅屋頂與城堡的散步道。', tags: ['must', 'photo', 'nature'], ticket: '免費', bestFor: ['couple', 'solo'] },
      { id: 'hd-haupt', name: '主街', nameDe: 'Hauptstraße', area: 'Altstadt', stayHours: 2, summary: '德國最長步行街之一，購物用餐。', tags: ['shopping', 'food', 'popular'], ticket: '免費', bestFor: ['couple', 'friends', 'family'] },
      { id: 'hd-church', name: '聖靈教堂', nameDe: 'Heiliggeistkirche', area: 'Altstadt', stayHours: 1, summary: '市集廣場旁哥德教堂。', tags: ['culture', 'photo'], ticket: '免費/樂捐', bestFor: ['solo', 'couple'] },
      { id: 'hd-uni', name: '大學廣場與學生監獄', nameDe: 'Studentenkarzer', area: 'Altstadt', stayHours: 1.5, summary: '大學城獨特文化點。', tags: ['culture', 'popular'], ticket: '約 €3–5', bestFor: ['friends', 'solo', 'couple'] },
      { id: 'hd-funicular', name: '城堡纜車', nameDe: 'Bergbahn', area: 'Altstadt', stayHours: 1, summary: '省力上山並可續往國王寶座。', tags: ['popular'], ticket: '套票約 €9–15', bestFor: ['family', 'couple'] },
      { id: 'hd-koenig', name: '國王寶座展望', nameDe: 'Königstuhl', area: '山區', stayHours: 2, summary: '更高視野，適合晴天。', tags: ['nature', 'photo'], ticket: '含纜車', bestFor: ['couple', 'friends'] },
      { id: 'hd-neckar', name: '內卡河遊船', nameDe: 'Neckar Cruise', area: '河岸', stayHours: 1.5, summary: '從水面看城堡與老橋。', tags: ['popular', 'photo'], ticket: '約 €12–18', bestFor: ['couple', 'family'] },
      { id: 'hd-market', name: '市集廣場', nameDe: 'Marktplatz', area: 'Altstadt', stayHours: 1, summary: '噴泉、教堂與露天座椅。', tags: ['photo', 'food'], ticket: '免費', bestFor: ['solo', 'couple', 'family'] },
      { id: 'hd-pharmacy', name: '德國藥劑博物館', nameDe: 'Deutsches Apotheken-Museum', area: '城堡內', stayHours: 1, summary: '城堡內意外有趣的專題館。', tags: ['culture'], ticket: '含城堡票', bestFor: ['solo', 'couple', 'family'] },
      { id: 'hd-kiss', name: '學生之吻巧克力店', nameDe: 'Studentenkuss', area: 'Altstadt', stayHours: 0.5, summary: '經典伴手禮與甜點。', tags: ['food', 'shopping'], ticket: '餐費自理', bestFor: ['couple', 'friends', 'family'] },
      { id: 'hd-jesuit', name: '耶穌會教堂', nameDe: 'Jesuitenkirche', area: 'Altstadt', stayHours: 0.75, summary: '巴洛克白淨空間好拍。', tags: ['photo', 'culture'], ticket: '免費', bestFor: ['couple', 'solo'] },
      { id: 'hd-schwetzingen', name: '施韋欽根宮花園', nameDe: 'Schwetzingen', area: '近郊', stayHours: 4, summary: '日遊級花園宮殿。', tags: ['nature', 'culture', 'photo'], ticket: '另計', bestFor: ['couple', 'family'] },
      { id: 'hd-thing', name: 'Thingstätte 露天劇場', nameDe: 'Thingstätte', area: '山區', stayHours: 1.5, summary: '林間遺跡，較少人但特別。', tags: ['culture', 'nature'], ticket: '免費', bestFor: ['solo', 'friends'] },
      { id: 'hd-neuenheim', name: 'Neuenheim 河岸咖啡', nameDe: 'Neuenheim', area: '北岸', stayHours: 1.5, summary: '當地人節奏的咖啡漫遊。', tags: ['food'], ticket: '餐費自理', bestFor: ['solo', 'couple'] },
      { id: 'hd-karls', name: '卡爾門', nameDe: 'Karlstor', area: 'Altstadt', stayHours: 0.5, summary: '老城東門地標。', tags: ['photo'], ticket: '免費', bestFor: ['solo', 'couple'] },
      { id: 'hd-garden', name: '城堡花園散步', nameDe: 'Stückgarten', area: '城堡', stayHours: 1, summary: '城堡邊視野開闊的花園。', tags: ['nature', 'photo'], ticket: '視票種', bestFor: ['couple', 'family'] },
      { id: 'hd-shopping', name: '老城手工藝店', nameDe: 'Craft shops', area: 'Altstadt', stayHours: 1.5, summary: '木藝、明信片與小物。', tags: ['shopping'], ticket: '免費', bestFor: ['friends', 'couple', 'family'] },
      { id: 'hd-sunset', name: '老橋城堡日落組', nameDe: 'Sunset combo', area: 'Altstadt', stayHours: 1, summary: '把老橋與城堡金光一次拍完。', tags: ['photo', 'must'], ticket: '免費', bestFor: ['couple', 'friends', 'solo'] },
    ],
  },
  {
    id: 'romantic',
    nameZh: '浪漫之路',
    nameDe: 'Romantische Straße',
    tagline: '中世紀城牆、童話城堡與巴伐利亞小鎮連線',
    intro:
      '浪漫之路不是單一座城市，而是羅騰堡到新天鵝堡一帶的故事線。建議用一到兩個基地住宿，避免天天換宿。',
    bestSeason: '4–10 月自駕或巴士最舒適',
    recommendedDays: {
      min: 4,
      ideal: 5,
      max: 7,
      note: '四天可抓羅騰堡+富森；五到六天節奏最舒服。',
    },
    weather: {
      spring: '6–16°C，小鎮花季開始',
      summer: '14–26°C，旅遊高峰，建議早出門',
      autumn: '5–15°C，最有童話氛圍',
      winter: '-2–4°C，部分小鎮靜謐，注意交通',
    },
    hotels: [
      {
        name: 'Hotel Eisenhut',
        area: 'Rothenburg ob der Tauber',
        nightsHint: '2 晚羅騰堡',
        pricePerNight: '€160–240',
        highlight: '老城內經典飯店，氛围到位',
        styles: ['luxuryValue', 'standard'],
      },
      {
        name: 'Hotel Hirsch',
        area: 'Füssen',
        nightsHint: '2 晚富森',
        pricePerNight: '€120–180',
        highlight: '新天鵝堡基地，乾淨好評',
        styles: ['clean', 'value', 'standard'],
      },
      {
        name: 'Youth Hostel Rothenburg',
        area: '羅騰堡',
        nightsHint: '1–2 晚',
        pricePerNight: '€35–65',
        highlight: '預算友好，位置不差',
        styles: ['value'],
      },
      {
        name: 'Schlosshotel Lisl',
        area: 'Hohenschwangau',
        nightsHint: '1 晚城堡旁',
        pricePerNight: '€220–350',
        highlight: '近城堡，奢華體驗感強',
        styles: ['luxury', 'luxuryValue'],
      },
    ],
    spots: [
      { id: 'rom-ploenlein', name: '普倫萊恩街角', nameDe: 'Plönlein', area: 'Rothenburg', stayHours: 0.75, summary: '浪漫之路第一打卡紅點。', tags: ['must', 'photo', 'popular'], ticket: '免費', bestFor: ['couple', 'friends', 'family', 'solo'] },
      { id: 'rom-wall', name: '羅騰堡城牆步行', nameDe: 'Stadtmauer', area: 'Rothenburg', stayHours: 1.5, summary: '環城視野，理解中世紀尺度。', tags: ['must', 'photo'], ticket: '免費', bestFor: ['solo', 'couple', 'friends'] },
      { id: 'rom-market', name: '羅騰堡市集廣場', nameDe: 'Marktplatz', area: 'Rothenburg', stayHours: 1, summary: '市政廳塔與噴泉核心。', tags: ['must', 'popular', 'photo'], ticket: '登塔另計', bestFor: ['family', 'couple', 'friends'] },
      { id: 'rom-crime', name: '中世紀犯罪博物館', nameDe: 'Kriminalmuseum', area: 'Rothenburg', stayHours: 1.5, summary: '室內深度點，雨備優選。', tags: ['culture', 'popular'], ticket: '約 €8', bestFor: ['solo', 'friends', 'couple'] },
      { id: 'rom-night', name: '夜巡人導覽', nameDe: 'Night Watchman', area: 'Rothenburg', stayHours: 1, summary: '季節限定，氣氛拔群。', tags: ['popular', 'culture'], ticket: '約 €10', bestFor: ['friends', 'couple', 'family'] },
      { id: 'rom-snowball', name: '雪球酥店', nameDe: 'Schneeballen', area: 'Rothenburg', stayHours: 0.5, summary: '甜點伴手禮，一人一個就夠。', tags: ['food', 'shopping'], ticket: '餐費自理', bestFor: ['family', 'couple', 'friends'] },
      { id: 'rom-dinkels', name: '丁克爾斯比爾', nameDe: 'Dinkelsbühl', area: '中段小鎮', stayHours: 2.5, summary: '相對安靜的半木造老城。', tags: ['photo', 'culture'], ticket: '免費', bestFor: ['couple', 'family', 'solo'] },
      { id: 'rom-nordlingen', name: '諾德林根城牆', nameDe: 'Nördlingen', area: '中段小鎮', stayHours: 2.5, summary: '隕石坑上的圓形古城。', tags: ['photo', 'culture', 'popular'], ticket: '城牆免費', bestFor: ['friends', 'couple', 'solo'] },
      { id: 'rom-neuschwanstein', name: '新天鵝堡', nameDe: 'Neuschwanstein', area: 'Hohenschwangau', stayHours: 4, summary: '童話城堡本尊，務必訂票。', tags: ['must', 'photo', 'popular'], ticket: '約 €21', bestFor: ['couple', 'family', 'friends'] },
      { id: 'rom-hohen', name: '舊天鵝堡', nameDe: 'Hohenschwangau', area: 'Hohenschwangau', stayHours: 2, summary: '路德維希童年城堡，可搭配。', tags: ['culture', 'photo'], ticket: '約 €18', bestFor: ['couple', 'family'] },
      { id: 'rom-mariabridge', name: '馬里亞橋展望', nameDe: 'Marienbrücke', area: '新天鵝堡', stayHours: 0.75, summary: '城堡最經典正面視角。', tags: ['must', 'photo'], ticket: '免費', bestFor: ['couple', 'friends', 'family', 'solo'] },
      { id: 'rom-fuessen', name: '富森老城', nameDe: 'Füssen Altstadt', area: 'Füssen', stayHours: 2, summary: '城堡行程的舒適基地。', tags: ['food', 'shopping', 'photo'], ticket: '免費', bestFor: ['couple', 'family', 'friends'] },
      { id: 'rom-alpsee', name: '阿爾卑斯湖', nameDe: 'Alpsee', area: 'Hohenschwangau', stayHours: 1.5, summary: '城堡下山湖景散步。', tags: ['nature', 'photo'], ticket: '免費', bestFor: ['couple', 'family', 'solo'] },
      { id: 'rom-wies', name: '維斯教堂', nameDe: 'Wieskirche', area: '近郊', stayHours: 1.5, summary: '洛可可世界遺產教堂。', tags: ['culture', 'photo'], ticket: '免費/樂捐', bestFor: ['couple', 'solo'] },
      { id: 'rom-augsburg', name: '奧格斯堡老城', nameDe: 'Augsburg', area: '中段', stayHours: 3, summary: '可作為移動日停留點。', tags: ['culture', 'food'], ticket: '免費', bestFor: ['friends', 'couple'] },
      { id: 'rom-tauber', name: '陶伯河河谷眺望', nameDe: 'Tauber Valley', area: 'Rothenburg', stayHours: 1, summary: '城牆外開闊視野。', tags: ['nature', 'photo'], ticket: '免費', bestFor: ['solo', 'couple'] },
      { id: 'rom-kathe', name: 'Käthe Wohlfahrt 聖誕博物館', nameDe: 'Käthe Wohlfahrt', area: 'Rothenburg', stayHours: 1, summary: '全年聖誕氣氛商店。', tags: ['shopping', 'popular'], ticket: '博物館另計', bestFor: ['family', 'couple'] },
      { id: 'rom-castlepath', name: '城堡花園步道', nameDe: 'Burggarten', area: 'Rothenburg', stayHours: 1, summary: '看老城全景的安靜角落。', tags: ['photo', 'nature'], ticket: '免費', bestFor: ['couple', 'solo'] },
      { id: 'rom-drive', name: '浪漫之路風景段駕駛/巴士', nameDe: 'Scenic stretch', area: '沿線', stayHours: 3, summary: '移動本身就是風景。', tags: ['nature', 'popular'], ticket: '交通費', bestFor: ['couple', 'friends', 'family'] },
      { id: 'rom-forgensee', name: '弗根湖展望', nameDe: 'Forggensee', area: 'Füssen', stayHours: 1.5, summary: '阿爾卑斯前的湖光收尾。', tags: ['nature', 'photo'], ticket: '免費', bestFor: ['couple', 'family', 'solo'] },
    ],
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

export function defaultSelectedSpotIds(spots: ScenicSpot[]): string[] {
  const must = spots.filter((s) => s.tags.includes('must')).map((s) => s.id)
  const photo = spots.filter((s) => s.tags.includes('photo') && !must.includes(s.id)).map((s) => s.id)
  const popular = spots
    .filter((s) => s.tags.includes('popular') && !must.includes(s.id) && !photo.includes(s.id))
    .map((s) => s.id)
  const rest = spots
    .filter((s) => !must.includes(s.id) && !photo.includes(s.id) && !popular.includes(s.id))
    .map((s) => s.id)
  return [...must, ...photo.slice(0, 6), ...popular.slice(0, 4), ...rest].slice(0, 12)
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
    if (s.stayHours >= 6) n += 1
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

export function buildItinerary(options: {
  destinations: Destination[]
  selectedSpotIds: string[]
  days: number
  pace: TripPace
  companion: Companion
  specialNeeds: string[]
  hotelAreaHint: string
}): DayPlan[] {
  const { destinations: dests, selectedSpotIds, days, pace, companion, specialNeeds, hotelAreaHint } =
    options
  const spotsPerDay = tripPaces.find((p) => p.id === pace)?.spotsPerDay ?? 3
  const startHour = specialNeeds.some((n) => n.includes('少走路')) ? 10 : 9

  const allSpots = dests.flatMap((d) => d.spots)
  const selected = sortSpotsForTraveler(
    allSpots.filter((s) => selectedSpotIds.includes(s.id)),
    companion,
    specialNeeds,
  )

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

  // Keep day-trip scale spots on their own day when possible
  const longSpots = selected.filter((s) => s.stayHours >= 6)
  const shortSpots = selected.filter((s) => s.stayHours < 6)

  const areaGroups = [...groupByArea(shortSpots).entries()].sort(
    (a, b) => b[1].length - a[1].length,
  )
  const orderedShort: ScenicSpot[] = []
  for (const [, group] of areaGroups) orderedShort.push(...group)

  const dayBuckets: ScenicSpot[][] = Array.from({ length: days }, () => [])

  // Place long spots first on middle/later days
  longSpots.forEach((spot, idx) => {
    const dayIndex = Math.min(days - 1, Math.max(1, idx + 1))
    dayBuckets[dayIndex].push(spot)
  })

  let cursor = 0
  for (const spot of orderedShort) {
    // find a day with capacity, prefer same-area clustering by scanning
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
      const fallback = dayBuckets.reduce(
        (best, bucket, i) => (bucket.length < dayBuckets[best].length ? i : best),
        0,
      )
      dayBuckets[fallback].push(spot)
    }
  }

  // Ensure first/last days aren't empty if possible
  for (let i = 0; i < days; i++) {
    if (dayBuckets[i].length === 0) {
      const donor = dayBuckets.findIndex((b, j) => j !== i && b.length > 1 && b[0].stayHours < 6)
      if (donor >= 0) dayBuckets[i].push(dayBuckets[donor].pop()!)
    }
  }

  return dayBuckets.map((bucket, index) => {
    const isFirst = index === 0
    const isLast = index === days - 1
    const area = bucket[0]?.area || hotelAreaHint || '市區'
    const themeCore =
      bucket.length === 0
        ? '彈性休息'
        : bucket.some((s) => s.stayHours >= 6)
          ? bucket[0].name
          : `${area} 精華`

    const schedule: ScheduleItem[] = []
    let hour = isFirst ? Math.max(startHour, 10) : startHour
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
        detail: `${spot.summary} 建議停留約 ${spot.stayHours} 小時${spot.ticket ? `｜${spot.ticket}` : ''}。${
          spot.tags.includes('photo') ? ' 記得留打卡時間。' : ''
        }`,
        spotId: spot.id,
      })
      hour += Math.max(1, Math.ceil(spot.stayHours))
    })

    if (isLast) {
      schedule.push({
        time: timeLabel(Math.min(hour, 16)),
        title: '伴手禮 / 前往機場或車站',
        detail: '預留 60–90 分鐘交通緩衝，別排太滿。',
      })
    } else {
      schedule.push({
        time: timeLabel(Math.min(Math.max(hour, 18), 20)),
        title: '晚餐與回飯店',
        detail: `今晚住 ${hotelAreaHint || area}，整理明天路線。`,
      })
    }

    const tickety = bucket.filter((s) => s.ticket && !s.ticket.includes('免費')).length
    const budgetLow = 45 + bucket.length * 15 + tickety * 10
    const budgetHigh = budgetLow + 40 + (pace === 'packed' ? 20 : 0)

    return {
      theme: `${isFirst ? '抵達 · ' : isLast ? '收尾 · ' : ''}${themeCore}`,
      stayArea: hotelAreaHint || area,
      schedule,
      budget: `€${budgetLow}–${budgetHigh} / 人（不含住宿）`,
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

export function nightsFromDays(days: number): number {
  return Math.max(days - 1, 1)
}

export function daysBetween(start: string, end: string): number | null {
  if (!start || !end) return null
  const a = new Date(start)
  const b = new Date(end)
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b < a) return null
  return Math.floor((b.getTime() - a.getTime()) / 86400000) + 1
}
