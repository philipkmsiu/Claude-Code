export type HotelStyle = 'value' | 'luxury' | 'luxuryValue' | 'standard' | 'clean'

export type DestinationId =
  | 'berlin'
  | 'munich'
  | 'cologne'
  | 'hamburg'
  | 'heidelberg'
  | 'romantic'

export interface HotelOption {
  name: string
  area: string
  nightsHint: string
  pricePerNight: string
  highlight: string
  styles: HotelStyle[]
}

export interface DayPlan {
  theme: string
  stayArea: string
  schedule: { time: string; title: string; detail: string }[]
  budget: string
  tip: string
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
  highlights: string[]
  hotels: HotelOption[]
  itineraries: Record<number, DayPlan[]>
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

export const destinations: Destination[] = [
  {
    id: 'berlin',
    nameZh: '柏林',
    nameDe: 'Berlin',
    tagline: '歷史、街頭藝術與當代節奏交會的首都',
    intro:
      '柏林不是靠一座地標撐起旅程，而是用牆、博物館島、啤酒花園與深夜酒吧拼出層次。適合喜歡城市漫遊、設計與近代史的旅人；節奏可鬆可緊，建議至少留下彈性半日。',
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
    highlights: ['勃蘭登堡門', '博物館島', '東邊畫廊', '查理檢查哨', '蒂爾加滕'],
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
    itineraries: {
      3: [
        {
          theme: '抵達與歷史軸線',
          stayArea: 'Mitte / Alexanderplatz',
          schedule: [
            { time: '10:30', title: '入住與輕食', detail: '放下行李後到 Hackescher Markt 咖啡店補給' },
            { time: '12:30', title: '勃蘭登堡門', detail: '步行至門前廣場拍照，感受統一象徵' },
            { time: '14:00', title: '國會大廈外觀 / 蒂爾加滕', detail: '若已預約可登頂穹頂；否則公園散步' },
            { time: '17:30', title: '博物館島散步', detail: '黃昏光影最適合外觀拍攝' },
            { time: '19:30', title: '晚餐', detail: '嘗試 Currywurst 或現代德菜小酒館' },
          ],
          budget: '€70–110 / 人（不含住宿）',
          tip: '國會大廈穹頂需提前線上預約。',
        },
        {
          theme: '圍牆與當代柏林',
          stayArea: '同前晚住宿',
          schedule: [
            { time: '10:00', title: '東邊畫廊', detail: '沿東側牆段步行，預留 90 分鐘' },
            { time: '12:30', title: '午餐', detail: 'Kreuzberg 土耳其或越南料理' },
            { time: '14:30', title: '查理檢查哨', detail: '了解冷戰檢查站歷史' },
            { time: '16:30', title: 'Checkpoint 周邊街區', detail: '咖啡與設計店漫遊' },
            { time: '19:00', title: '晚餐與夜景', detail: '回 Mitte 享受慢夜生活' },
          ],
          budget: '€65–100 / 人',
          tip: '東邊畫廊戶外為主，雨天改走 Topography of Terror。',
        },
        {
          theme: '藝文收尾與離境',
          stayArea: '退房後寄放行李',
          schedule: [
            { time: '09:30', title: '佩加蒙博物館或新博物館', detail: '擇一深度參觀 2–3 小時' },
            { time: '13:00', title: '午餐', detail: '博物館島附近輕食' },
            { time: '15:00', title: '最後購物', detail: 'Friedrichstraße 或 KaDeWe 選購伴手禮' },
            { time: '17:30', title: '前往機場 / 車站', detail: '預留 60–90 分鐘交通緩衝' },
          ],
          budget: '€55–95 / 人',
          tip: '博物館島建議購買單館票或 Museum Pass。',
        },
      ],
      4: [
        {
          theme: '首都初印象',
          stayArea: 'Mitte',
          schedule: [
            { time: '11:00', title: '抵達入住', detail: '先安頓，再步行探索周邊' },
            { time: '13:00', title: '勃蘭登堡門與菩提樹下大街', detail: '經典軸線步行' },
            { time: '16:00', title: '博物館島外觀', detail: '先熟悉地理，隔日再進館' },
            { time: '19:00', title: '晚餐', detail: '德式豬腳或現代小酒館' },
          ],
          budget: '€60–95 / 人',
          tip: '第一天別排太滿，留時間倒時差。',
        },
        {
          theme: '博物館日',
          stayArea: '同前',
          schedule: [
            { time: '10:00', title: '新博物館 / 舊國家美術館', detail: '擇 1–2 館深度看' },
            { time: '13:30', title: '午餐', detail: '島上或 Hackescher Markt' },
            { time: '15:30', title: '柏林大教堂與河岸', detail: '散步拍照' },
            { time: '19:00', title: '晚餐', detail: 'Prenzlauer Berg 街區用餐' },
          ],
          budget: '€75–120 / 人',
          tip: '熱門票建議開館前到達。',
        },
        {
          theme: '圍牆記憶',
          stayArea: '同前',
          schedule: [
            { time: '10:00', title: '東邊畫廊', detail: '戶外壁畫與歷史解說' },
            { time: '13:00', title: 'Kreuzberg 午餐', detail: '多元移民美食' },
            { time: '15:00', title: '恐怖地形學博物館', detail: '免費、內容扎實' },
            { time: '18:30', title: '晚餐', detail: '回城區放鬆' },
          ],
          budget: '€55–90 / 人',
          tip: '雨天把東邊畫廊與室內館對調。',
        },
        {
          theme: '西城節奏與離境',
          stayArea: '退房',
          schedule: [
            { time: '10:00', title: '蒂爾加滕或動物園區', detail: '綠地放空' },
            { time: '12:30', title: 'KaDeWe 美食層', detail: '伴手禮與輕食一次搞定' },
            { time: '15:30', title: '離境', detail: '機場快線或車站出發' },
          ],
          budget: '€50–85 / 人',
          tip: '若班機晚，可加波茨坦半日。',
        },
      ],
      5: [
        {
          theme: '抵達與經典軸線',
          stayArea: 'Mitte',
          schedule: [
            { time: '11:00', title: '入住', detail: '先安頓行李' },
            { time: '13:00', title: '勃蘭登堡門', detail: '歷史核心步行' },
            { time: '16:00', title: '國會大廈周邊', detail: '預約者可登頂' },
            { time: '19:00', title: '晚餐', detail: 'Mitte 德菜' },
          ],
          budget: '€60–100 / 人',
          tip: '第一天以定位與輕鬆步行為主。',
        },
        {
          theme: '博物館島深潛',
          stayArea: '同前',
          schedule: [
            { time: '10:00', title: '博物館兩館連訪', detail: '預留整天節奏' },
            { time: '18:00', title: '河岸日落', detail: 'Spree 河畔散步' },
            { time: '19:30', title: '晚餐', detail: '精釀啤酒搭配' },
          ],
          budget: '€80–130 / 人',
          tip: '別硬塞三館，兩館剛好。',
        },
        {
          theme: '圍牆與 Kreuzberg',
          stayArea: '同前',
          schedule: [
            { time: '10:00', title: '東邊畫廊', detail: '戶外歷史' },
            { time: '13:00', title: '多元午餐', detail: 'Kreuzberg' },
            { time: '15:30', title: '查理檢查哨', detail: '冷戰敘事' },
            { time: '19:00', title: '晚餐', detail: '街頭感餐廳' },
          ],
          budget: '€60–95 / 人',
          tip: '穿好走鞋，步行距離不短。',
        },
        {
          theme: '波茨坦日遊',
          stayArea: '同前',
          schedule: [
            { time: '09:00', title: '火車前往波茨坦', detail: '約 40 分鐘' },
            { time: '10:30', title: '無憂宮花園', detail: '宮殿與庭園半日' },
            { time: '14:00', title: '舊城午餐', detail: '在地咖啡館' },
            { time: '17:30', title: '返回柏林', detail: '晚上自由' },
          ],
          budget: '€70–110 / 人',
          tip: '宮殿內部票需另購，花園可先漫步。',
        },
        {
          theme: '購物與離境',
          stayArea: '退房',
          schedule: [
            { time: '10:00', title: '最後街區漫遊', detail: '選伴手禮' },
            { time: '13:00', title: '午餐', detail: '機場前最後一餐' },
            { time: '15:30', title: '離境', detail: '預留交通時間' },
          ],
          budget: '€45–80 / 人',
          tip: 'Mustard、巧克力與設計小物是好選擇。',
        },
      ],
    },
  },
  {
    id: 'munich',
    nameZh: '慕尼黑',
    nameDe: 'München',
    tagline: '巴伐利亞王國氣質，啤酒、皇宮與阿爾卑斯門戶',
    intro:
      '慕尼黑把華麗宮殿、傳統啤酒文化與近郊湖山收進同一個節奏。城市本身適合三到四天；若想加新天鵝堡或國王湖，理想是五到六天。',
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
    highlights: ['瑪麗恩廣場', '寧芬堡宮', '英式花園', '新天鵝堡日遊', '維克圖阿連市場'],
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
    itineraries: {
      3: [
        {
          theme: '老城巴伐利亞',
          stayArea: 'Altstadt',
          schedule: [
            { time: '10:30', title: '瑪麗恩廣場', detail: '新市政廳木偶報時' },
            { time: '12:00', title: '聖母教堂與老城步行', detail: '感受巴伐利亞節奏' },
            { time: '13:30', title: '維克圖阿連市場午餐', detail: '白腸、椒鹽麵包、啤酒' },
            { time: '16:00', title: ' Residualenz 皇宮', detail: '擇重點廳堂參觀' },
            { time: '19:00', title: '啤酒館晚餐', detail: 'Hofbräuhaus 或在地小館' },
          ],
          budget: '€70–115 / 人',
          tip: '市場攤位現金較方便。',
        },
        {
          theme: '宮殿與花園',
          stayArea: '同前',
          schedule: [
            { time: '10:00', title: '寧芬堡宮', detail: '宮殿與花園半日' },
            { time: '13:30', title: '午餐', detail: '宮殿附近餐廳' },
            { time: '15:30', title: '英式花園', detail: '見習衝浪者與啤酒花園' },
            { time: '19:00', title: '晚餐', detail: 'Maxvorstadt 現代德菜' },
          ],
          budget: '€65–105 / 人',
          tip: '宮殿花園免費，室內另購票。',
        },
        {
          theme: '美術館或離境緩衝',
          stayArea: '退房',
          schedule: [
            { time: '10:00', title: '老繪畫陳列館', detail: '雨天優選' },
            { time: '13:00', title: '午餐與伴手禮', detail: '巧克力、芥末、啤酒杯' },
            { time: '16:00', title: '離境', detail: 'S-Bahn 往機場約 45 分鐘' },
          ],
          budget: '€50–90 / 人',
          tip: '若想去新天鵝堡，請改選 5 天方案。',
        },
      ],
      5: [
        {
          theme: '抵達慕尼黑',
          stayArea: 'Altstadt',
          schedule: [
            { time: '11:00', title: '入住', detail: '先熟悉老城方位' },
            { time: '13:00', title: '瑪麗恩廣場', detail: '經典開場' },
            { time: '16:00', title: '市場與咖啡', detail: 'Viktualienmarkt' },
            { time: '19:00', title: '啤酒館', detail: '第一晚沉浸式體驗' },
          ],
          budget: '€65–100 / 人',
          tip: '第一天步行即可，不必購日票。',
        },
        {
          theme: '皇宮藝文',
          stayArea: '同前',
          schedule: [
            { time: '10:00', title: 'Residenz', detail: '寶物廳與廳堂' },
            { time: '13:30', title: '午餐', detail: '老城餐廳' },
            { time: '15:30', title: '美術館區', detail: '擇一館參觀' },
            { time: '19:00', title: '晚餐', detail: '輕鬆義式或德菜' },
          ],
          budget: '€75–120 / 人',
          tip: '博物館週一可能休館，出發前確認。',
        },
        {
          theme: '寧芬堡與英式花園',
          stayArea: '同前',
          schedule: [
            { time: '10:00', title: '寧芬堡宮', detail: '半日宮殿' },
            { time: '14:30', title: '英式花園', detail: '散步與啤酒花園' },
            { time: '19:00', title: '晚餐', detail: '回到市區' },
          ],
          budget: '€60–100 / 人',
          tip: '夏天可把野餐當午餐。',
        },
        {
          theme: '新天鵝堡一日遊',
          stayArea: '同前',
          schedule: [
            { time: '07:30', title: '出發 Füssen', detail: '火車或一日遊巴士' },
            { time: '11:00', title: '新天鵝堡', detail: '務必預先訂時段票' },
            { time: '15:30', title: '回程', detail: '傍晚返慕尼黑' },
            { time: '20:00', title: '輕食晚餐', detail: '別安排太重' },
          ],
          budget: '€90–150 / 人',
          tip: '城堡票與交通是當天最大支出。',
        },
        {
          theme: '收尾與離境',
          stayArea: '退房',
          schedule: [
            { time: '10:00', title: '最後購物', detail: '老城伴手禮' },
            { time: '12:30', title: '午餐', detail: '白腸告別' },
            { time: '15:00', title: '離境', detail: '預留機場時間' },
          ],
          budget: '€45–80 / 人',
          tip: 'BMW Welt 適合喜歡汽車的旅客加訪。',
        },
      ],
    },
  },
  {
    id: 'cologne',
    nameZh: '科隆與萊茵',
    nameDe: 'Köln & Rhein',
    tagline: '哥德大教堂、萊茵河岸與葡萄酒小鎮節奏',
    intro:
      '科隆適合當萊茵流域基地：白天看大教堂與博物館，再以一日遊串起波昂、科布倫茨或葡萄酒小鎮。短假期三天夠用，想慢慢坐船看河景就留四到五天。',
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
    highlights: ['科隆大教堂', '老城啤酒屋', '萊茵遊船', '巧克力博物館', '雙子城波昂'],
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
    itineraries: {
      3: [
        {
          theme: '大教堂與老城',
          stayArea: 'Dom',
          schedule: [
            { time: '10:30', title: '科隆大教堂', detail: '可登南塔俯瞰萊茵' },
            { time: '13:00', title: '老城午餐', detail: 'Kölsch 啤酒與 Rheinischer Sauerbraten' },
            { time: '15:00', title: '河岸散步', detail: 'Hohenzollern 橋掛鎖景觀' },
            { time: '18:30', title: '啤酒屋晚餐', detail: '體驗在地侍者文化' },
          ],
          budget: '€60–100 / 人',
          tip: '登塔階梯多，穿舒適鞋。',
        },
        {
          theme: '博物館與河景',
          stayArea: '同前',
          schedule: [
            { time: '10:00', title: '羅馬日耳曼博物館或巧克力博物館', detail: '擇一深入' },
            { time: '13:00', title: '午餐', detail: '河岸餐廳' },
            { time: '15:00', title: '萊茵短程遊船', detail: '看城市天際線' },
            { time: '19:00', title: '晚餐', detail: '比利時區氛圍餐廳' },
          ],
          budget: '€70–110 / 人',
          tip: '遊船季節與班次差異大，當日確認。',
        },
        {
          theme: '波昂半日與離境',
          stayArea: '退房',
          schedule: [
            { time: '09:30', title: '火車往波昂', detail: '約 25 分鐘' },
            { time: '10:30', title: '舊市政廳與貝多芬故居外觀', detail: '輕鬆半日' },
            { time: '14:00', title: '返回科隆離境', detail: '或直接轉車' },
          ],
          budget: '€45–85 / 人',
          tip: '想深度萊茵谷請選 4–5 天。',
        },
      ],
      4: [
        {
          theme: '科隆開場',
          stayArea: 'Dom',
          schedule: [
            { time: '11:00', title: '入住', detail: '先放大教堂' },
            { time: '13:00', title: '老城午餐', detail: 'Kölsch 入門' },
            { time: '15:30', title: '河岸與橋', detail: '黃昏拍照' },
            { time: '19:00', title: '晚餐', detail: '啤酒屋' },
          ],
          budget: '€60–95 / 人',
          tip: '車站與大教堂極近，拖行李很輕鬆。',
        },
        {
          theme: '藝文日',
          stayArea: '同前',
          schedule: [
            { time: '10:00', title: '博物館', detail: '巧克力或當代藝術' },
            { time: '14:00', title: '比利時區', detail: '咖啡與設計店' },
            { time: '19:00', title: '晚餐', detail: '現代菜' },
          ],
          budget: '€65–105 / 人',
          tip: '雨天把遊船改到晴天。',
        },
        {
          theme: '萊茵河谷日遊',
          stayArea: '同前',
          schedule: [
            { time: '08:30', title: '前往 Bacharach / St. Goar', detail: '火車或遊船組合' },
            { time: '11:00', title: '古堡與小鎮', detail: '萊茵浪漫段' },
            { time: '16:30', title: '返回科隆', detail: '晚上休息' },
          ],
          budget: '€80–130 / 人',
          tip: '這天是行程精華，建議預留整天。',
        },
        {
          theme: '離境緩衝',
          stayArea: '退房',
          schedule: [
            { time: '10:00', title: '最後散步', detail: '伴手禮：香水 4711、巧克力' },
            { time: '13:00', title: '離境', detail: '機場或 ICE 轉乘' },
          ],
          budget: '€40–70 / 人',
          tip: '科隆/波昂機場與市區有 S-Bahn 連結。',
        },
      ],
    },
  },
  {
    id: 'hamburg',
    nameZh: '漢堡',
    nameDe: 'Hamburg',
    tagline: '港口都會、倉庫城與易北河現代建築',
    intro:
      '漢堡是德國的水上門面：倉庫城磚牆、易北愛樂廳曲線、港口夕陽構成主畫面。節奏偏都市與設計感，兩到四天都能安排得舒服，不急著塞太多景點。',
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
    highlights: ['倉庫城', '易北愛樂廳', '港口遊船', '市政廳', '聖保利街區'],
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
        area: 'Stadtpark 方向 / 交通便利區',
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
    itineraries: {
      3: [
        {
          theme: '港口第一印象',
          stayArea: 'Neustadt / 市中心',
          schedule: [
            { time: '11:00', title: '入住', detail: '安頓後往內阿爾斯特湖' },
            { time: '13:00', title: '市政廳與舊城', detail: '午餐後步行' },
            { time: '16:00', title: '倉庫城外觀', detail: '磚紅建築群拍照' },
            { time: '19:00', title: '晚餐', detail: '海鮮或現代北德菜' },
          ],
          budget: '€70–110 / 人',
          tip: '倉庫城夜間燈光很美。',
        },
        {
          theme: '易北與港灣',
          stayArea: '同前',
          schedule: [
            { time: '10:00', title: '港口遊船', detail: '理解城市水系結構' },
            { time: '12:30', title: '午餐', detail: '魚市或碼頭區' },
            { time: '14:30', title: '易北愛樂廳廣場', detail: '廣場免費，演奏廳需票' },
            { time: '17:30', title: '聖保利漫遊', detail: '傍晚氛圍剛好' },
            { time: '19:30', title: '晚餐', detail: 'Reeperbahn 周邊選擇多' },
          ],
          budget: '€75–120 / 人',
          tip: '愛樂廳導覽票建議提前訂。',
        },
        {
          theme: '設計與離境',
          stayArea: '退房',
          schedule: [
            { time: '10:00', title: '小型美術館或設計店', detail: '依天氣彈性' },
            { time: '12:30', title: '最後午餐', detail: '伴手禮可買茶與巧克力' },
            { time: '15:00', title: '離境', detail: '機場 S-Bahn 約 25 分鐘' },
          ],
          budget: '€45–80 / 人',
          tip: '雨天把遊船改室內展。',
        },
      ],
    },
  },
  {
    id: 'heidelberg',
    nameZh: '海德堡',
    nameDe: 'Heidelberg',
    tagline: '城堡、老橋與大學城的浪漫縮影',
    intro:
      '海德堡適合放慢：城堡俯瞰內卡河、哲學家步道看日落、老城巷弄喝咖啡。兩到三天最甜；也可與法蘭克福進出港搭配成短假期。',
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
    highlights: ['海德堡城堡', '老橋', '哲學家步道', '主街購物', '學生監獄'],
    hotels: [
      {
        name: 'Hotel Anlage',
        area: 'Bahnstadt / 車站可達',
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
    itineraries: {
      2: [
        {
          theme: '城堡與老城',
          stayArea: 'Altstadt',
          schedule: [
            { time: '10:30', title: '海德堡城堡', detail: '纜車或步行上山' },
            { time: '13:30', title: '老城午餐', detail: '主街餐廳' },
            { time: '15:30', title: '老橋與河岸', detail: '經典取景' },
            { time: '18:30', title: '晚餐', detail: '大學城酒館' },
          ],
          budget: '€60–95 / 人',
          tip: '城堡庭院可先免費感受視野。',
        },
        {
          theme: '哲學家步道與離境',
          stayArea: '退房',
          schedule: [
            { time: '09:30', title: '哲學家步道', detail: '俯瞰紅屋頂與城堡' },
            { time: '12:30', title: '午餐', detail: '最後一次老城漫遊' },
            { time: '15:00', title: '前往法蘭克福機場', detail: '火車約 1 小時' },
          ],
          budget: '€45–75 / 人',
          tip: '步道晴天最值得。',
        },
      ],
      3: [
        {
          theme: '抵達海德堡',
          stayArea: 'Altstadt',
          schedule: [
            { time: '12:00', title: '入住', detail: '午後老城漫步' },
            { time: '14:00', title: '主街與教堂', detail: '認識尺度' },
            { time: '17:00', title: '老橋日落', detail: '黃金時段拍照' },
            { time: '19:00', title: '晚餐', detail: '慢食' },
          ],
          budget: '€55–90 / 人',
          tip: '第一天不急著上城堡。',
        },
        {
          theme: '城堡全日感',
          stayArea: '同前',
          schedule: [
            { time: '10:00', title: '城堡', detail: '展區與藥劑博物館' },
            { time: '13:30', title: '午餐', detail: '山上或回老城' },
            { time: '16:00', title: '學生監獄 / 大學廣場', detail: '輕鬆文化點' },
            { time: '19:00', title: '晚餐', detail: '葡萄酒搭配' },
          ],
          budget: '€65–105 / 人',
          tip: '週末城堡較擠，早到更好。',
        },
        {
          theme: '步道與離境',
          stayArea: '退房',
          schedule: [
            { time: '09:00', title: '哲學家步道', detail: '晨光最乾淨' },
            { time: '12:00', title: '午餐', detail: '伴手禮：學生之吻巧克力' },
            { time: '14:30', title: '離境', detail: '轉法蘭克福' },
          ],
          budget: '€40–70 / 人',
          tip: '可與萊茵或黑森林行程串聯。',
        },
      ],
    },
  },
  {
    id: 'romantic',
    nameZh: '浪漫之路',
    nameDe: 'Romantische Straße',
    tagline: '中世紀城牆、童話城堡與巴伐利亞小鎮連線',
    intro:
      '浪漫之路不是單一座城市，而是羅騰堡、諾德林根到新天鵝堡一帶的故事線。適合喜歡老城牆、半木造屋與城堡的旅人；建議用一到兩個基地住宿，避免天天換宿。',
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
    highlights: ['羅騰堡', '諾德林根', '新天鵝堡', '富森', '丁克爾斯比爾'],
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
    itineraries: {
      4: [
        {
          theme: '進入羅騰堡',
          stayArea: 'Rothenburg',
          schedule: [
            { time: '12:00', title: '抵達入住', detail: '建議住城牆內' },
            { time: '14:00', title: '市集廣場與市政廳塔', detail: '建立方位' },
            { time: '16:30', title: '城牆步行', detail: '環城視野' },
            { time: '19:00', title: '晚餐', detail: 'Schneeballen 甜點可當飯後' },
          ],
          budget: '€55–90 / 人',
          tip: '日落後老城更安靜好拍。',
        },
        {
          theme: '羅騰堡深度',
          stayArea: 'Rothenburg',
          schedule: [
            { time: '09:30', title: '中世紀犯罪博物館', detail: '室內備案也好' },
            { time: '12:30', title: '午餐', detail: '老城餐廳' },
            { time: '14:30', title: 'Plönlein 街角', detail: '經典明信片取景' },
            { time: '19:30', title: '夜巡（季節限定）', detail: '若有場次值得參加' },
          ],
          budget: '€60–95 / 人',
          tip: '白天遊客多，早晚才是精華。',
        },
        {
          theme: '南下富森',
          stayArea: 'Füssen',
          schedule: [
            { time: '09:00', title: '前往富森', detail: '火車/自駕，預留交通日' },
            { time: '14:00', title: '富森老城', detail: '安頓後輕鬆走走' },
            { time: '17:30', title: '湖區散步', detail: '為明天城堡暖身' },
            { time: '19:00', title: '晚餐', detail: '早點休息' },
          ],
          budget: '€50–85 / 人（不含長程交通）',
          tip: '這天以移動為主，別塞景點。',
        },
        {
          theme: '新天鵝堡與收尾',
          stayArea: '退房或再住一晚',
          schedule: [
            { time: '08:30', title: '新天鵝堡', detail: '預訂時段票' },
            { time: '12:30', title: '午餐', detail: 'Hohenschwangau 區' },
            { time: '14:30', title: '舊天鵝堡外觀或回程', detail: '依體力選擇' },
          ],
          budget: '€70–120 / 人',
          tip: '城堡內禁拍，外觀馬里亞橋是經典視角。',
        },
      ],
      5: [
        {
          theme: '羅騰堡抵達',
          stayArea: 'Rothenburg',
          schedule: [
            { time: '12:00', title: '入住', detail: '午後入城' },
            { time: '14:00', title: '市集與城牆', detail: '慢節奏開場' },
            { time: '19:00', title: '晚餐', detail: '老城' },
          ],
          budget: '€50–85 / 人',
          tip: '住兩晚比一天閃現值得。',
        },
        {
          theme: '羅騰堡全日',
          stayArea: 'Rothenburg',
          schedule: [
            { time: '09:30', title: '經典街景', detail: 'Plönlein、商店街' },
            { time: '13:00', title: '午餐', detail: '地區料理' },
            { time: '15:00', title: '博物館', detail: '雨備方案' },
            { time: '19:30', title: '夜巡', detail: '季節有開再參加' },
          ],
          budget: '€60–95 / 人',
          tip: '雪球酥很甜，一人一個就夠。',
        },
        {
          theme: '小鎮連線',
          stayArea: '往富森移動或中途住',
          schedule: [
            { time: '09:00', title: '丁克爾斯比爾或諾德林根', detail: '擇一停留 2–3 小時' },
            { time: '15:00', title: '續行富森', detail: '傍晚抵達' },
            { time: '19:00', title: '晚餐', detail: '早休息' },
          ],
          budget: '€55–90 / 人',
          tip: '自駕最自由；大眾運輸需精算班次。',
        },
        {
          theme: '城堡日',
          stayArea: 'Füssen',
          schedule: [
            { time: '08:30', title: '新天鵝堡', detail: '重點行程' },
            { time: '13:00', title: '午餐', detail: '城堡山下' },
            { time: '15:00', title: '阿爾卑斯湖', detail: '若體力允許' },
            { time: '19:00', title: '慶祝晚餐', detail: '收束浪漫之路' },
          ],
          budget: '€75–125 / 人',
          tip: '票務與交通是成敗關鍵。',
        },
        {
          theme: '緩衝離境',
          stayArea: '退房',
          schedule: [
            { time: '09:30', title: '富森老城', detail: '最後散步' },
            { time: '12:00', title: '前往慕尼黑/機場', detail: '預留充足時間' },
          ],
          budget: '€35–60 / 人',
          tip: '回慕尼黑再飛出最常見。',
        },
      ],
    },
  },
]

export function pickDays(dest: Destination, requested?: number): number {
  if (requested && dest.itineraries[requested]) return requested
  if (dest.itineraries[dest.recommendedDays.ideal]) return dest.recommendedDays.ideal
  const available = Object.keys(dest.itineraries)
    .map(Number)
    .sort((a, b) => a - b)
  return available[0]
}

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
