/**
 * Common multi-region travel routes for country-scale destinations.
 *
 * When users type a country (英國 / 法國 / 瑞士…), the planner must propose
 * classic overnight cities and circuits — not only the capital and day-trips.
 * Full coverage of important scenes often needs two weeks or more.
 */

import type { Companion, HotelOption, HotelStyle, ScenicSpot, SpotTag } from './types.js'

export type CommonRouteId = 'uk' | 'france' | 'switzerland' | 'germany'

export type CommonRouteOption = {
  id: string
  nameZh: string
  summary: string
  cities: string[]
  /** Comfortable length for this circuit. */
  comfortableDays: number
  /** Upper bound when covering most must-sees at a relaxed pace. */
  longestDays: number
}

export type CommonRouteRegion = {
  id: CommonRouteId
  labelZh: string
  /** Match country-scale wording (not a single city break). */
  match: RegExp
  /** If the typed name is clearly one city, skip country expansion. */
  cityOnly?: RegExp
  tagline: string
  intro: string
  background: string
  memorable: string[]
  tips: string[]
  flexDayIdeas: string[]
  recommendedDays: {
    min: number
    comfortable: number
    suggestedLongest: number
    note: string
  }
  /** Classic circuits offered to users / AI as planning skeletons. */
  routeOptions: CommonRouteOption[]
  /** Overnight base cities in a sensible travel order. */
  travelOrder: string[]
  hotels: HotelOption[]
  spotSeeds: CommonSpotSeed[]
}

export type CommonSpotSeed = {
  name: string
  tags: SpotTag[]
  hours: number
  area: string
  summary: string
  nearbyFood?: string
  souvenirs?: string
  shoppingOutlet?: string
}

const hotelStyles = (styles: HotelStyle[]): HotelStyle[] => styles

export const COMMON_ROUTE_REGIONS: CommonRouteRegion[] = [
  {
    id: 'uk',
    labelZh: '英國',
    match:
      /英國|UK\b|United Kingdom|Britain|Great Britain|不列顛|英格蘭|蘇格蘭|愛爾蘭|Ireland|Scotland|Wales|威爾斯|北愛爾蘭/i,
    cityOnly:
      /^(倫敦|London|愛丁堡|Edinburgh|約克|York|巴斯|Bath|牛津|Oxford|劍橋|Cambridge|都柏林|Dublin|卡地夫|Cardiff|曼徹斯特|Manchester|利物浦|Liverpool|布萊頓|Brighton|格拉斯哥|Glasgow)$/i,
    tagline: '英格蘭・蘇格蘭・愛爾蘭的經典串線',
    intro:
      '英國／愛爾蘭並不是「倫敦＋近郊」而已。常見路線會把英格蘭（倫敦、巴斯／巨石陣、約克）、蘇格蘭（愛丁堡、高地）與可選的愛爾蘭（都柏林／巨人堤）串成 overnight 基地，重要景點走完往往需要兩週以上。',
    background:
      '不列顛群島由英格蘭、蘇格蘭、威爾斯與愛爾蘭島組成，歷史上是凱爾特、盎格魯－撒克遜與維多利亞工業文明的交會處。倫敦是帝國與現代都會的門面，巴斯與巨石陣保存羅馬與史前層理，約克與愛丁堡留下中世紀城牆與王室記憶，高地與愛爾蘭西岸則以海灣、懸崖與綠意寫出另一種英國節奏。用火車／短程航班換宿，才能真正走出「首都一日遊」的尺度。',
    memorable: [
      '從大本鐘走到泰晤士河暮色，倫敦把帝國與現代疊在同一條河岸。',
      '巴斯溫泉石與巨石陣的風，讓英格蘭鄉野比明信片更安靜、更古老。',
      '愛丁堡城堡俯瞰老城石巷，風笛與威士忌氣味會跟著你走下皇家英里。',
      '蘇格蘭高地的湖光與羊群，常常比任何博物館更記得住。',
      '若跨海到愛爾蘭：都柏林的 pub 歌聲，或巨人堤玄武岩柱的海風，會把旅程再拉開一層。',
    ],
    tips: [
      '請先選一條常見路線尺度：英格蘭精華、英格蘭＋蘇格蘭，或再加愛爾蘭；不要預設只玩倫敦。',
      '倫敦近郊（溫莎、牛津、劍橋、巨石陣、Bicester）可當日往返；約克、愛丁堡、都柏林請換宿。',
      '英格蘭→蘇格蘭可用火車；跨海愛爾蘭常見短程航班或渡輪，需預留轉場日。',
      '走完整英格蘭＋蘇格蘭＋愛爾蘭重要景點，舒服節奏常要 18–24 天，不是 10 天城市遊。',
    ],
    flexDayIdeas: [
      '倫敦博物館／雨備日',
      '科茨沃爾德小鎮慢遊',
      '愛丁堡再留一晚看節日或酒吧',
      '高地天氣緩衝日',
      '都柏林 pub 與文學漫遊',
    ],
    recommendedDays: {
      min: 10,
      comfortable: 16,
      suggestedLongest: 24,
      note: '英國：倫敦＋英格蘭近郊約 7–10 天；英格蘭＋蘇格蘭舒服約 14–18 天；再加愛爾蘭常見 18–24 天。勿把「英國」估成只玩倫敦的 10 日。',
    },
    routeOptions: [
      {
        id: 'england-classics',
        nameZh: '英格蘭精華',
        summary: '倫敦 overnight＋巴斯／巨石陣、牛津或劍橋、約克等英格蘭經典，不含蘇格蘭／愛爾蘭。',
        cities: ['倫敦', '巴斯', '牛津', '約克'],
        comfortableDays: 10,
        longestDays: 14,
      },
      {
        id: 'britain-scotland',
        nameZh: '英格蘭＋蘇格蘭',
        summary: '英格蘭精華後北上愛丁堡，可加高地／湖泊區；這是最常見的「玩英國」串線。',
        cities: ['倫敦', '巴斯', '約克', '愛丁堡', '高地'],
        comfortableDays: 16,
        longestDays: 20,
      },
      {
        id: 'britain-ireland',
        nameZh: '不列顛＋愛爾蘭',
        summary: '英格蘭＋蘇格蘭後再加都柏林／巨人堤或西岸；覆蓋重要場景常需三週上下。',
        cities: ['倫敦', '約克', '愛丁堡', '都柏林', '巨人堤'],
        comfortableDays: 20,
        longestDays: 24,
      },
    ],
    travelOrder: [
      '倫敦',
      '溫莎',
      '牛津',
      '劍橋',
      '巴斯',
      '巨石',
      '布里斯托',
      '卡地夫',
      '科茨沃',
      '湖區',
      '利物浦',
      '曼徹斯特',
      '約克',
      '愛丁堡',
      '格拉斯哥',
      '高地',
      '因弗內斯',
      '都柏林',
      '貝爾法斯特',
      '巨人堤',
      '戈爾韋',
    ],
    hotels: [
      {
        name: '倫敦市中心／南岸精品旅店',
        area: '倫敦・市中心',
        nightsHint: '英格蘭南段連住 3–5 晚',
        pricePerNight: '£140–280',
        highlight: '方便地鐵與近郊日遊（溫莎／牛津／巨石陣／Bicester）',
        styles: hotelStyles(['standard', 'luxuryValue', 'clean']),
      },
      {
        name: '巴斯／科茨沃爾德小鎮旅店',
        area: '巴斯・舊城',
        nightsHint: '英格蘭西段 1–2 晚',
        pricePerNight: '£120–220',
        highlight: '溫泉古城 overnight，避開只從倫敦趕當日往返',
        styles: hotelStyles(['standard', 'value', 'clean']),
      },
      {
        name: '約克古城牆內旅店',
        area: '約克・舊城',
        nightsHint: '英格蘭北段 1–2 晚',
        pricePerNight: '£110–200',
        highlight: '中世紀老城 overnight，銜接北上蘇格蘭',
        styles: hotelStyles(['value', 'standard', 'clean']),
      },
      {
        name: '愛丁堡舊城／皇家英里旅店',
        area: '愛丁堡・舊城',
        nightsHint: '蘇格蘭段連住 2–3 晚',
        pricePerNight: '£130–250',
        highlight: '城堡與高地日遊的 overnight 基地',
        styles: hotelStyles(['standard', 'luxuryValue', 'clean']),
      },
      {
        name: '都柏林坦普爾吧／河岸旅店',
        area: '都柏林・市中心',
        nightsHint: '愛爾蘭段 2–3 晚（若行程含愛爾蘭）',
        pricePerNight: '€130–240',
        highlight: '跨海後的 overnight 基地，可接巨人堤或西岸',
        styles: hotelStyles(['standard', 'luxuryValue', 'value']),
      },
    ],
    spotSeeds: [
      {
        name: '大本鐘與西敏寺',
        tags: ['must', 'photo', 'culture', 'popular'],
        hours: 3,
        area: '倫敦・西敏',
        summary:
          '西敏寺與大本鐘是倫敦的帝國門面：哥德尖塔、河岸鐘樓與國會石牆擠在同一視野。建議步行串泰晤士河岸，把「我到了英國」的第一個畫面留給這裡，而不是塞進趕場清單。',
        nearbyFood: '西敏一帶 Pub 的 Fish & Chips、Sunday Roast；傍晚可轉去南岸市集。',
        souvenirs: '紅茶禮盒、皇家徽章小物、西敏寺書店明信片。',
        shoppingOutlet: '國會廣場周邊禮品店；精品購物另排牛津街／攝政街。',
      },
      {
        name: '大英博物館',
        tags: ['must', 'culture'],
        hours: 4,
        area: '倫敦・布魯姆斯伯里',
        summary:
          '大英博物館把世界文明收藏壓進同一座中庭：羅塞塔石碑、帕特農雕像與埃及廳最容易讓人停太久。挑 2–3 區深挖比走馬看花更值得；雨天更是倫敦最穩的室內主菜。',
        nearbyFood: '館內咖啡或附近 Bloomsbury 的英式早午餐、咖哩館。',
        souvenirs: '博物館複製品、歷史主題書、設計感文具。',
        shoppingOutlet: '館內商店為主；想逛街可另排 Covent Garden。',
      },
      {
        name: '倫敦眼／南岸漫遊',
        tags: ['photo', 'popular'],
        hours: 3,
        area: '倫敦・南岸',
        summary:
          '南岸是倫敦最友善的步行帶：街頭藝人、書店、河風與對岸國會輪廓。倫敦眼可選可不選；重點是把泰晤士河當成城市客廳來走，而不是只拍一張膠囊艙自拍。',
        nearbyFood: 'Borough Market 起司、海鮮與街頭小吃；傍晚南岸酒吧。',
        souvenirs: '河景明信片、英國設計小物、市集美食伴手。',
        shoppingOutlet: 'Southbank Centre 書店與設計店；Borough Market 周邊。',
      },
      {
        name: '塔橋與倫敦塔',
        tags: ['must', 'photo', 'culture', 'popular'],
        hours: 3.5,
        area: '倫敦・塔區',
        summary:
          '倫敦塔是王室權力與囚禁史的石堡，塔橋則是維多利亞工程的名片。兩者同區很好排：上午城堡、下午橋上步道與河景，讓「皇權＋工業時代」在同一天對照。',
        nearbyFood: 'St. Katharine Docks 河岸餐廳、英式派與精釀啤酒。',
        souvenirs: '王冠珠寶主題小物、塔橋模型、英式太妃糖。',
        shoppingOutlet: '塔橋展區商店；東區潮流店可另排。',
      },
      {
        name: '巨石陣與巴斯羅馬浴場',
        tags: ['must', 'culture', 'photo', 'popular'],
        hours: 8,
        area: '巴斯・近郊',
        summary:
          '巨石陣的風很大、很安靜；巴斯則用蜜色石屋與羅馬浴場寫出另一種英格蘭。這是典型「英格蘭西段」全日：可從倫敦日遊，但若行程夠長，建議在巴斯 overnight，讓古城夜燈進記憶。',
        nearbyFood: '巴斯的 Sally Lunn 甜麵包、英式下午茶；巨石陣園區簡餐。',
        souvenirs: '巴斯石皂、羅馬浴場主題書、英國蜂蜜。',
        shoppingOutlet: '巴斯舊城精品與 Independent 小店；Outlet 另排 Bicester。',
      },
      {
        name: '牛津大學城漫遊',
        tags: ['culture', 'photo', 'popular'],
        hours: 6,
        area: '牛津・大學城',
        summary:
          '牛津用學院庭院、圖書館與單車鈴寫出英格蘭知識分子的日常。Christ Church、Bodleian 與高街很適合半日到一日；可從倫敦往返，也可當英格蘭中段 overnight 節點。',
        nearbyFood: '學院區 Pub 的Steak & Ale Pie、Covered Market 小吃。',
        souvenirs: '大學徽章、二手書、英國格子圍巾。',
        shoppingOutlet: '高街書店與學院禮品店。',
      },
      {
        name: '約克大教堂與古城牆',
        tags: ['must', 'culture', 'photo'],
        hours: 5,
        area: '約克・舊城',
        summary:
          '約克是英格蘭北部最完整的中世紀城之一：城牆可走、Shambles 石巷可鑽，大教堂的彩窗尺度驚人。這裡適合作為北上蘇格蘭前的 overnight，而不是硬塞進倫敦日遊半徑。',
        nearbyFood: '約克布丁、英式早餐、巧克力精品店甜點。',
        souvenirs: '約克茶、巧克力、中世紀風格小物。',
        shoppingOutlet: 'Shambles 與市區 Independent 店。',
      },
      {
        name: '愛丁堡城堡與皇家英里',
        tags: ['must', 'photo', 'culture', 'popular'],
        hours: 5,
        area: '愛丁堡・舊城',
        summary:
          '愛丁堡城堡壓在死火山岩頂上，皇家英里把舊城氣氛一路送到聖吉爾教堂。蘇格蘭行程幾乎都以這裡作 overnight 基地：白天看城堡與阿瑟座，晚上鑽 pub 聽現場音樂。',
        nearbyFood: 'Haggis、魚排薯條、威士忌品飲；Victoria Street 一帶餐廳。',
        souvenirs: '短裙呢絨、威士忌小瓶、城堡徽章。',
        shoppingOutlet: '皇家英里禮品店；精品另排王子街。',
      },
      {
        name: '蘇格蘭高地／尼斯湖日遊',
        tags: ['must', 'nature', 'photo', 'popular'],
        hours: 9,
        area: '愛丁堡・高地',
        summary:
          '高地日遊把湖光、荒原、城堡廢墟與羊群一次攤開，是「英國＝只有倫敦」最需要被打破的那段風景。請獨立留整天，並以愛丁堡（或格拉斯哥）overnight；天氣多變要備防水層。',
        nearbyFood: '途中小鎮湯品與甜點；回城後再吃正式蘇格蘭餐。',
        souvenirs: '短麵包乾糧風小物、高地風景明信片、威士忌糖。',
        shoppingOutlet: '服務區與城堡商店；正式購物回愛丁堡。',
      },
      {
        name: '都柏林聖殿酒吧區與三一學院',
        tags: ['must', 'culture', 'food', 'popular'],
        hours: 4,
        area: '都柏林・市中心',
        summary:
          '若路線含愛爾蘭：都柏林用三一學院的長廳書香與 Temple Bar 的 live music 打開第一夜。這不是倫敦的延伸日遊，而是跨海後的新 overnight 基地，後面可接巨人堤或西岸。',
        nearbyFood: '愛爾蘭燉羊肉、 Guinness 黑啤、海鮮巧達湯。',
        souvenirs: '愛爾蘭羊毛、威士忌、三一學院主題書。',
        shoppingOutlet: 'Grafton Street 與 Temple Bar 市集。',
      },
      {
        name: '巨人堤道',
        tags: ['must', 'nature', 'photo'],
        hours: 8,
        area: '貝爾法斯特・近郊',
        summary:
          '巨人堤的玄武岩柱像被海神切齊的琴鍵，是愛爾蘭／北愛爾蘭線上最強的自然場面。通常需從貝爾法斯特或都柏林安排近乎全日的移動；請換宿，不要幻想從倫敦當日往返。',
        nearbyFood: '海岸小鎮魚料理、熱湯與司康。',
        souvenirs: '玄武岩主題小物、愛爾蘭海鹽、風景明信片。',
        shoppingOutlet: '遊客中心商店；回城再補手信。',
      },
      {
        name: 'Bicester Village 名牌 Outlet',
        tags: ['shopping', 'popular'],
        hours: 6,
        area: '牛津郡・比斯特（倫敦一日購）',
        summary:
          'Bicester Village 是倫敦旅客最著名的名牌 Outlet 一日購。請整日專程前往，不要與倫敦市區地標排在同一天。',
        nearbyFood: '園區內咖啡與輕食；回倫敦後可安排 Pub 晚餐。',
        souvenirs: 'Outlet 戰利品、英國茶葉禮盒。',
        shoppingOutlet: 'Bicester Village 本體為當日購物主力。',
      },
    ],
  },
  {
    id: 'france',
    labelZh: '法國',
    match: /法國|France|French Republic|法兰西/i,
    cityOnly:
      /^(巴黎|Paris|里昂|Lyon|尼斯|Nice|馬賽|Marseille|波爾多|Bordeaux|史特拉斯堡|Strasbourg|亞維儂|Avignon|尼斯舊城)$/i,
    tagline: '巴黎、羅亞爾、普羅旺斯與南法海岸的國土串線',
    intro:
      '法國不是只有巴黎市區。常見路線會把巴黎、羅亞爾河谷城堡、里昂或勃艮第、普羅旺斯與蔚藍海岸串成 overnight 基地；想走完重要場景，往往需要兩週到三週。',
    background:
      '法國国土從塞納河的首都圈，延伸到羅亞爾的城堡帶、阿爾卑斯與中央山脈，再到普羅旺斯的石鎮與地中海海岸。巴黎濃縮藝術與都會節奏，盧瓦爾保存王室狩獵時代的優雅，里昂是美食之都，尼斯與普羅旺斯則用陽光、市場與海風寫出南法生活。用 TGV 換宿，才能離開「巴黎＋凡爾賽」的預設答案。',
    memorable: [
      '塞納河黃昏與博物館島的燈光，是巴黎最穩的第一印象。',
      '羅亞爾城堡的花園對稱線，會讓人忽然懂「法式優雅」從哪來。',
      '里昂老城的小巷與市集氣味，常常比首都更像日常生活。',
      '普羅旺斯的薰衣草田與石鎮午後，適合把行程節奏放慢。',
      '尼斯海角步道的風，會把整趟法國從博物館換成地中海。',
    ],
    tips: [
      '先選路線尺度：巴黎精華、巴黎＋羅亞爾／里昂，或巴黎＋普羅旺斯＋蔚藍海岸。',
      '凡爾賽可當日往返巴黎；羅亞爾、里昂、亞維儂、尼斯請換宿。',
      'TGV 是跨城主力；南法段可搭配租車逛村鎮。',
      '覆蓋巴黎到南法重要景點，舒服節奏常要 14–21 天。',
    ],
    flexDayIdeas: [
      '巴黎雨備博物館日',
      '羅亞爾多訪一座城堡',
      '里昂美食夜',
      '普羅旺斯市集早晨',
      '尼斯海角散步日',
    ],
    recommendedDays: {
      min: 9,
      comfortable: 14,
      suggestedLongest: 21,
      note: '法國：巴黎單城約 5–8 天；巴黎＋羅亞爾／里昂約 10–14 天；再加普羅旺斯與蔚藍海岸常見 14–21 天。',
    },
    routeOptions: [
      {
        id: 'paris-core',
        nameZh: '巴黎精華（含近郊）',
        summary: '巴黎 overnight＋凡爾賽／吉維尼等近郊，不含長距離南法。',
        cities: ['巴黎', '凡爾賽'],
        comfortableDays: 7,
        longestDays: 10,
      },
      {
        id: 'paris-loire-lyon',
        nameZh: '巴黎＋羅亞爾／里昂',
        summary: '首都後往城堡帶或美食之都，適合第一次「玩法國」但不赶南法海岸。',
        cities: ['巴黎', '羅亞爾', '里昂'],
        comfortableDays: 12,
        longestDays: 16,
      },
      {
        id: 'france-classic-south',
        nameZh: '巴黎＋普羅旺斯＋蔚藍海岸',
        summary: '經典國土串線：巴黎→（可經里昂）→亞維儂／普羅旺斯→尼斯；重要場景常需兩至三週。',
        cities: ['巴黎', '里昂', '亞維儂', '尼斯'],
        comfortableDays: 16,
        longestDays: 21,
      },
    ],
    travelOrder: [
      '巴黎',
      '凡爾賽',
      '吉維尼',
      '諾曼第',
      '羅亞爾',
      '圖爾',
      '波爾多',
      '里昂',
      '亞維儂',
      '亞爾',
      '普羅旺斯',
      '馬賽',
      '尼斯',
      '坎城',
      '摩納哥',
      '安錫',
      '史特拉斯堡',
    ],
    hotels: [
      {
        name: '巴黎瑪黑／聖日耳曼精品旅店',
        area: '巴黎・瑪黑',
        nightsHint: '首都段連住 3–5 晚',
        pricePerNight: '€180–350',
        highlight: '步行友善，方便博物館與近郊日遊',
        styles: hotelStyles(['standard', 'luxuryValue', 'clean']),
      },
      {
        name: '羅亞爾河谷城堡區旅店',
        area: '圖爾・羅亞爾',
        nightsHint: '城堡段 1–2 晚',
        pricePerNight: '€120–240',
        highlight: 'overnight 在城堡帶，避免只從巴黎趕當日往返',
        styles: hotelStyles(['standard', 'value', 'clean']),
      },
      {
        name: '里昂老城／半島區旅店',
        area: '里昂・老城',
        nightsHint: '美食之都 1–2 晚',
        pricePerNight: '€130–250',
        highlight: '銜接北法與南法的 overnight 節點',
        styles: hotelStyles(['standard', 'luxuryValue', 'value']),
      },
      {
        name: '亞維儂城牆內旅店',
        area: '亞維儂・舊城',
        nightsHint: '普羅旺斯段 2 晚',
        pricePerNight: '€110–220',
        highlight: '逛石鎮與市集的 overnight 基地',
        styles: hotelStyles(['value', 'standard', 'clean']),
      },
      {
        name: '尼斯海濱／舊城旅店',
        area: '尼斯・海濱',
        nightsHint: '蔚藍海岸 2–3 晚',
        pricePerNight: '€150–300',
        highlight: '南法收尾 overnight，可接摩納哥／埃茲日遊',
        styles: hotelStyles(['standard', 'luxury', 'luxuryValue']),
      },
    ],
    spotSeeds: [
      {
        name: '羅浮宮與塞納河右岸',
        tags: ['must', 'culture', 'photo', 'popular'],
        hours: 4.5,
        area: '巴黎・羅浮',
        summary:
          '羅浮宮是巴黎的重量級室內主菜：別想一天看完，挑埃及、繪畫或雕塑其中兩條動線即可。傍晚走到塞納河橋上，城市燈光會把「法國之旅開始了」寫進第一夜。',
        nearbyFood: 'Palais Royal 廊下游廊咖啡館、法式洋葱湯、可麗餅。',
        souvenirs: '博物館海報、法國香皂、馬卡龍鐵盒。',
        shoppingOutlet: '館內商店；精品另排 Rivoli 或聖歐諾雷。',
      },
      {
        name: '艾菲爾鐵塔與戰神廣場',
        tags: ['must', 'photo', 'popular'],
        hours: 3,
        area: '巴黎・七區',
        summary:
          '鐵塔是法國最被辨識的天際線符號。建議預留排隊與安檢時間，或在戰神廣場、特羅卡德羅取景；日落時段人多，但光線確實最好。',
        nearbyFood: '七區法式小館、起司拼盤與紅酒。',
        souvenirs: '鐵塔模型、法國國旗小物。',
        shoppingOutlet: 'Champ de Mars 周邊禮品店。',
      },
      {
        name: '凡爾賽宮',
        tags: ['must', 'culture', 'photo', 'popular'],
        hours: 7,
        area: '凡爾賽（巴黎近郊）',
        summary:
          '凡爾賽是巴黎最經典的近郊全日：鏡廳、幾何花園與小特里亞農能把「絕對王權」講完。可當日往返；若整體法國行程很長，也不必在此 overnight。',
        nearbyFood: '園區餐廳或凡爾賽小鎮法式午餐。',
        souvenirs: '凡爾賽主題巧克力、花園明信片。',
        shoppingOutlet: '宮內商店；精品回巴黎。',
      },
      {
        name: '羅亞爾河谷城堡（香波堡／雪農索）',
        tags: ['must', 'culture', 'photo'],
        hours: 8,
        area: '圖爾・羅亞爾',
        summary:
          '羅亞爾城堡帶是法國王室離開巴黎後的另一張臉：護城河、狩獵園林與文藝復興立面。請以圖爾或安布瓦斯 overnight，把 1–2 座城堡排成全日，而不是只在巴黎看照片。',
        nearbyFood: '盧瓦爾白葡萄酒搭配地方起司、鄉村套餐。',
        souvenirs: '葡萄酒、城堡磁鐵、花飾小物。',
        shoppingOutlet: '城堡商店與小鎮市集。',
      },
      {
        name: '里昂老城與貝勒庫爾廣場',
        tags: ['must', 'food', 'culture', 'popular'],
        hours: 5,
        area: '里昂・老城',
        summary:
          '里昂是法國的美食首都之一：Traboules 密道、粉紅巷與市集讓城市比巴黎更「日常」。適合作為北法往南法的 overnight 轉場，晚上一定要留一頓 Bouchon。',
        nearbyFood: 'Quenelle、香腸與里昂沙拉；早晨去 Les Halles 市集。',
        souvenirs: '丝绸小巾、巧克力、在地芥末。',
        shoppingOutlet: '老城小店與市集；Outlet 非重點。',
      },
      {
        name: '亞維儂教宗宮與普羅旺斯石鎮',
        tags: ['must', 'culture', 'photo', 'nature'],
        hours: 6,
        area: '亞維儂・舊城',
        summary:
          '亞維儂城牆與教宗宮是普羅旺斯的大門；再往外是戈爾德、盧貝隆一類石鎮。這裡開始要用 overnight＋慢節奏，才碰得到市集、薰衣草與午後陰影。',
        nearbyFood: '普羅旺斯香草烤雞、橄榄與玫瑰酒。',
        souvenirs: '薰衣草包、皂、香草鹽。',
        shoppingOutlet: '舊城市集與香氛店。',
      },
      {
        name: '尼斯英國人步道與舊城',
        tags: ['must', 'photo', 'food', 'popular'],
        hours: 4,
        area: '尼斯・海濱',
        summary:
          '尼斯把地中海藍與義法混血市集攤在同一條海角步道上。這是法國南段的 overnight 收尾：白天走舊城與花市，傍晚看海，隔日再加摩納哥或埃茲。',
        nearbyFood: 'Socca 煎餅、Salat Niçoise、海鮮拼盤。',
        souvenirs: '橄榄油、柑橘糖、海濱明信片。',
        shoppingOutlet: '舊城小巷與花市周邊。',
      },
      {
        name: '摩納哥／埃茲村日遊',
        tags: ['photo', 'popular', 'culture'],
        hours: 7,
        area: '尼斯・近郊',
        summary:
          '從尼斯出發的蔚藍海岸日遊：摩納哥的王室岩石區與埃茲的懸崖石巷，是南法明信片的標準答案。請以尼斯 overnight，獨立留白天。',
        nearbyFood: '海岸小鎮海鮮或埃茲觀景餐廳簡餐。',
        souvenirs: '摩納哥磁鐵、香水（格拉斯方向可另排）。',
        shoppingOutlet: '遊客區小店；精品回尼斯。',
      },
    ],
  },
  {
    id: 'switzerland',
    labelZh: '瑞士',
    match: /瑞士|Switzerland|Swiss|Suisse|Schweiz/i,
    cityOnly:
      /^(蘇黎世|Zurich|Zürich|日內瓦|Geneva|琉森|Lucerne|盧塞恩|伯恩|Bern|因特拉肯|Interlaken|策馬特|Zermatt|洛桑|Lausanne|盧加諾|Lugano)$/i,
    tagline: '湖畔城市與阿爾卑斯山城的經典環線',
    intro:
      '瑞士常見玩法不是只留在蘇黎世或日內瓦市區，而是用火車把琉森、因特拉肯／少女峰、策馬特（馬特洪峰）與日內瓦湖區串成 overnight 基地。想走完重要山湖場景，多半需要 10–16 天以上。',
    background:
      '瑞士以高山鐵路、湖泊與多語區聞名：德瑞的蘇黎世與琉森、伯恩舊城、因特拉肯通往少女峰區，西南則是法瑞的日內瓦湖，南邊還有義瑞風情的提契諾。風景主菜是山與湖，移動本身就是體驗——Swiss Travel Pass 與山岳鐵路是行程骨架，而不是首都打卡清單。',
    memorable: [
      '琉森木橋與湖面倒影，是瑞士最溫柔的開場。',
      '少女峰區的雲海與積雪，會把「阿爾卑斯」從名詞變成體感。',
      '策馬特街頭一抬頭就是馬特洪峰三角尖，傍晚燈火特別乾淨。',
      '日內瓦湖的噴泉與湖風，適合當作收線時的呼吸。',
      '車上從山谷爬到雪山的那段安靜，常常比景點本身更記得住。',
    ],
    tips: [
      '先選常見環線：琉森＋因特拉肯，或再加策馬特／日內瓦湖；不要只估蘇黎世城市遊。',
      '山岳日遊（少女峰、戈爾內格拉特）請獨立留整天，並在山城 overnight。',
      '火車準點但轉乘多；大件行李建議少換宿、連住山城。',
      '覆蓋湖區＋兩座名峰，舒服節奏常要 12–18 天。',
    ],
    flexDayIdeas: [
      '琉森湖遊船半日',
      '因特拉肯天氣備案日',
      '策馬特村內散步不加峰',
      '伯恩舊城雨備',
      '日內瓦湖自行車道',
    ],
    recommendedDays: {
      min: 8,
      comfortable: 12,
      suggestedLongest: 18,
      note: '瑞士：單城湖畔約 4–6 天；琉森＋少女峰區約 8–11 天；再加策馬特與日內瓦湖常見 12–18 天。',
    },
    routeOptions: [
      {
        id: 'lucerne-jungfrau',
        nameZh: '琉森＋少女峰區',
        summary: '最常見的瑞士入門：蘇黎世進、琉森 overnight、因特拉肯／格林德瓦攻少女峰。',
        cities: ['蘇黎世', '琉森', '因特拉肯'],
        comfortableDays: 9,
        longestDays: 12,
      },
      {
        id: 'classic-alps',
        nameZh: '湖區＋少女峰＋馬特洪峰',
        summary: '經典山湖串線：琉森→因特拉肯→策馬特，覆蓋兩座代表性山峰。',
        cities: ['琉森', '因特拉肯', '策馬特'],
        comfortableDays: 12,
        longestDays: 16,
      },
      {
        id: 'grand-swiss',
        nameZh: '西瑞士大環線',
        summary: '山湖之後再加日內瓦／洛桑或伯恩；重要場景走完常要兩週以上。',
        cities: ['琉森', '因特拉肯', '策馬特', '蒙特勒', '日內瓦'],
        comfortableDays: 15,
        longestDays: 18,
      },
    ],
    travelOrder: [
      '蘇黎世',
      '琉森',
      '盧塞恩',
      '因特拉肯',
      '格林德瓦',
      '勞特布魯寧',
      '伯恩',
      '策馬特',
      '蒙特勒',
      '洛桑',
      '日內瓦',
      '盧加諾',
    ],
    hotels: [
      {
        name: '蘇黎世舊城／車站旅店',
        area: '蘇黎世・舊城',
        nightsHint: '進出關 1 晚',
        pricePerNight: 'CHF 180–320',
        highlight: '機場與火車樞紐方便，不建議整趟都住這裡',
        styles: hotelStyles(['standard', 'value', 'clean']),
      },
      {
        name: '琉森湖畔旅店',
        area: '琉森・湖畔',
        nightsHint: '湖區連住 2 晚',
        pricePerNight: 'CHF 200–380',
        highlight: '木橋與湖景 overnight，經典瑞士開場',
        styles: hotelStyles(['standard', 'luxuryValue', 'clean']),
      },
      {
        name: '因特拉肯／格林德瓦山城旅店',
        area: '因特拉肯・山城',
        nightsHint: '少女峰段連住 2–3 晚',
        pricePerNight: 'CHF 180–350',
        highlight: '攻頂與山谷步道的 overnight 基地',
        styles: hotelStyles(['standard', 'value', 'clean']),
      },
      {
        name: '策馬特無車村山景旅店',
        area: '策馬特・山村',
        nightsHint: '馬特洪峰段 2 晚',
        pricePerNight: 'CHF 220–420',
        highlight: '抬頭見峰，建議連住感受晨暮光線',
        styles: hotelStyles(['luxuryValue', 'standard', 'luxury']),
      },
      {
        name: '日內瓦／洛桑湖畔旅店',
        area: '日內瓦・湖畔',
        nightsHint: '西瑞士收尾 1–2 晚',
        pricePerNight: 'CHF 190–360',
        highlight: '法瑞湖區 overnight，方便離境',
        styles: hotelStyles(['standard', 'luxuryValue', 'clean']),
      },
    ],
    spotSeeds: [
      {
        name: '琉森老城與卡貝爾木橋',
        tags: ['must', 'photo', 'culture', 'popular'],
        hours: 3.5,
        area: '琉森・湖畔',
        summary:
          '琉森是瑞士最經典的湖畔開場：木橋壁畫、水塔與湖面遊船把節奏立刻放慢。建議 overnight，隔日再進山，而不是把琉森當蘇黎世的半日附屬。',
        nearbyFood: '湖魚、瑞士馬鈴薯餅 Rösti、熱巧克力。',
        souvenirs: '軍刀、牛奶巧克力、木橋明信片。',
        shoppingOutlet: '舊城步行街與湖畔禮品店。',
      },
      {
        name: '皮拉圖斯山或鐵力士山',
        tags: ['nature', 'photo', 'popular'],
        hours: 7,
        area: '琉森・近郊',
        summary:
          '從琉森出發的山岳全日：齒軌列車或纜車把湖區換成雲上視角。請獨立留整天，並以琉森 overnight。',
        nearbyFood: '山頂簡餐；回城再吃瑞士起司鍋。',
        souvenirs: '山岳明信片、小熊玩偶。',
        shoppingOutlet: '山頂商店；正式購物回舊城。',
      },
      {
        name: '少女峰／格林德瓦山谷',
        tags: ['must', 'nature', 'photo', 'popular'],
        hours: 9,
        area: '因特拉肯・山城',
        summary:
          '少女峰區是瑞士行程的核心山岳日：火車爬升、雪地與「頂峰的歐洲」觀景台。務必在因特拉肯或格林德瓦 overnight，預留天氣備案日。',
        nearbyFood: '山谷小鎮義大利麵與起司料理；山頂咖啡。',
        souvenirs: '瑞士空運巧克力、羊毛帽、山岳貼紙。',
        shoppingOutlet: '車站與山頂商店。',
      },
      {
        name: '策馬特與馬特洪峰展望',
        tags: ['must', 'photo', 'nature', 'popular'],
        hours: 6,
        area: '策馬特・山村',
        summary:
          '策馬特是無車村，街頭軸線的盡頭就是馬特洪峰三角尖。可搭配戈爾內格拉特鐵路；建議連住兩晚看不同光線，這是瑞士串線裡不該省略的南段。',
        nearbyFood: '山村義瑞混血餐廳、Raclette 起司。',
        souvenirs: '馬特洪峰模型、高山蜂蜜。',
        shoppingOutlet: 'Bahnhofstrasse 山村步行街。',
      },
      {
        name: '伯恩舊城世界遺產漫遊',
        tags: ['culture', 'photo'],
        hours: 3.5,
        area: '伯恩・舊城',
        summary:
          '伯恩舊城的拱廊與鐘樓適合當作山城之間的轉場半日：節奏比少女峰鬆，也能看見瑞士首都的生活尺度。',
        nearbyFood: '聯邦廣場附近咖啡館、巧克力店。',
        souvenirs: '熊主題小物、巧克力條。',
        shoppingOutlet: '舊城拱廊商店。',
      },
      {
        name: '日內瓦湖噴泉與湖畔步道',
        tags: ['photo', 'popular', 'nature'],
        hours: 3,
        area: '日內瓦・湖畔',
        summary:
          '日內瓦湖區適合作法瑞收尾：噴泉、湖風與對岸山線。可住日內瓦或洛桑，當作離境前的呼吸日，而不是整趟瑞士唯一 overnight。',
        nearbyFood: '湖畔海鮮、瑞士巧克力甜點。',
        souvenirs: '瑞士手錶周邊、巧克力禮盒。',
        shoppingOutlet: 'Rue du Rhône 精品街。',
      },
      {
        name: '蒙特勒與西庸城堡',
        tags: ['culture', 'photo', 'popular'],
        hours: 5,
        area: '蒙特勒・湖畔',
        summary:
          '蒙特勒把日內瓦湖的優雅與西庸城堡的石牆放在同一段湖岸。適合接在策馬特之後、日內瓦之前，作為西瑞士 overnight 或長半日。',
        nearbyFood: '湖魚定食、葡萄酒。',
        souvenirs: '城堡明信片、拉沃葡萄主題小物。',
        shoppingOutlet: '湖畔小店與城堡商店。',
      },
    ],
  },
]

/** True when the typed destination is a country-scale trip (not a single city). */
export function isMultiRegionCountryTrip(name: string): boolean {
  return matchCommonRouteRegion(name) != null
}

/** Resolve a country-scale common-route region, or null for city breaks. */
export function matchCommonRouteRegion(name: string): CommonRouteRegion | null {
  const text = name.trim()
  if (!text) return null
  for (const region of COMMON_ROUTE_REGIONS) {
    if (region.cityOnly?.test(text)) continue
    if (region.match.test(text)) return region
  }
  return null
}

/** Compact route options for AI prompts / UI copy. */
export function commonRouteOptionsForPrompt(name: string): string | null {
  const region = matchCommonRouteRegion(name)
  if (!region) return null
  const lines = region.routeOptions.map(
    (route) =>
      `- ${route.nameZh}（約 ${route.comfortableDays}–${route.longestDays} 天）：${route.summary}｜ overnight 城市：${route.cities.join('、')}`,
  )
  return [
    `目的地「${region.labelZh}」是國土／多區尺度，禁止只輸出首都＋近郊。`,
    `請在景點與 hotels 中覆蓋下列常見路線的 overnight 城市（可依使用者天數選擇其中一條為主，並在 tips 說明其他路線）：`,
    ...lines,
    `recommendedDays 必須反映多城串線真實尺度（舒服常 ≥ ${region.recommendedDays.comfortable}，最長可到 ${region.recommendedDays.suggestedLongest}），不要把國土行程估成 7–10 天城市遊。`,
  ].join('\n')
}

export function spotsFromCommonRoute(
  place: string,
  region: CommonRouteRegion,
): ScenicSpot[] {
  return region.spotSeeds.map((item, index) => ({
    id: `custom-spot-${slugify(place)}-${index + 1}`,
    name: item.name,
    nameLocal: place,
    area: item.area,
    stayHours: item.hours,
    summary: item.summary,
    nearbyFood: item.nearbyFood || '',
    souvenirs: item.souvenirs || '',
    shoppingOutlet: item.shoppingOutlet || '',
    tags: item.tags,
    ticket: '視當地而定',
    bestFor: ['solo', 'couple', 'family', 'friends'] as Companion[],
  }))
}

function slugify(name: string): string {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff-]+/gi, '')
      .slice(0, 40) || 'place'
  )
}

/** Extended duration applies to highway long-hauls and country-scale circuits. */
export function allowsExtendedTripDuration(name: string): boolean {
  if (/新疆|南北疆|青甘|大環線|環線|帕米爾|自駕公路|西藏.*線|川藏|滇藏/.test(name)) {
    return true
  }
  if (isMultiRegionCountryTrip(name)) return true
  const text = name.trim()
  // Germany already ships a multi-city template; keep single-city breaks capped.
  if (/^(柏林|慕尼黑|科隆|德累斯頓|法蘭克福|海德堡|漢堡|杜塞道夫)$/i.test(text)) {
    return false
  }
  return /德國|Germany|Deutschland/i.test(text)
}
