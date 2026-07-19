/** Resolve landmark photos for Stage-4 posters via app proxy + local handbook. */

const photoCache = new Map<string, string | null>()

/** Local handbook photos shipped with the app (always available offline). */
const LOCAL: Record<string, string> = {
  嘉峪關: '/handbook/qinggan-jiayuguan.jpeg',
  翡翠湖: '/handbook/qinggan-feicuihu.jpeg',
  茫崖: '/handbook/qinggan-feicuihu.jpeg',
  艾肯泉: '/handbook/qinggan-aikengquan.jpeg',
  莫高窟: '/handbook/qinggan-mogao.jpeg',
  敦煌: '/handbook/qinggan-mogao.jpeg',
  青海湖: '/handbook/qinggan-qinghai.jpeg',
  茶卡: '/handbook/qinggan-desert-lake.jpeg',
}

/** English search hints improve Commons hit-rate for Chinese landmarks. */
const SEARCH_HINT: Record<string, string> = {
  兵馬俑: "Terracotta Army Xi'an",
  秦始皇兵馬俑: "Terracotta Army Xi'an",
  大雁塔: "Giant Wild Goose Pagoda Xi'an",
  小雁塔: "Small Wild Goose Pagoda Xi'an",
  西安城牆: "Xi'an City Wall",
  城牆: "Xi'an City Wall fortification",
  回民街: "Muslim Quarter Xi'an street food",
  鐘樓: "Bell Tower Xi'an",
  鼓樓: "Drum Tower Xi'an",
  華清池: 'Huaqing Pool Xi\'an',
  華山: 'Mount Hua China peak',
  陝西歷史博物館: 'Shaanxi History Museum exhibits',
  大明宮: "Daming Palace Xi'an",
  大唐芙蓉園: "Tang Paradise Xi'an",
  大唐不夜城: "Great Tang All Day Mall Xi'an night",
  碑林: "Stele Forest Xi'an",
  興慶宮公園: "Xingqing Palace Park Xi'an",
  終南山: 'Zhongnan Mountains temple',
  法門寺: 'Famen Temple pagoda',
  乾陵: 'Qianling Mausoleum',
  翠華山: "Cuihua Mountain Xi'an",
  曲江池: "Qujiang Pond Xi'an",
  漢城湖: "Hancheng Lake Xi'an",
  西安博物院: "Xi'an Museum",
  西安音樂廳: "Xi'an Concert Hall",
  秦嶺: 'Qinling Mountains wildlife',
  西安: "Xi'an Bell Tower night",
  敦煌: 'Mogao Caves Dunhuang',
  莫高窟: 'Mogao Caves murals',
  嘉峪關: 'Jiayu Pass fortress',
  青海湖: 'Qinghai Lake landscape',
  鳴沙山: 'Singing Sand Dunes Dunhuang',
  月牙泉: 'Crescent Lake Dunhuang',
  喀納斯: 'Kanas Lake Xinjiang',
  喀納斯湖: 'Kanas Lake Xinjiang autumn',
  禾木: 'Hemu Village Xinjiang autumn',
  賽里木湖: 'Sayram Lake Xinjiang',
  喀什: 'Kashgar Old City',
  喀什古城: 'Kashgar Old Town streets',
  烏魯木齊: 'Urumqi Hongshan Park',
  烏市: 'Urumqi Grand Bazaar',
  天山天池: 'Heaven Lake Tian Shan',
  阿勒泰: 'Altay Xinjiang mountains',
  阿禾公路: 'Ahe Highway Xinjiang birch',
  五彩灘: 'Five Colored Beach Burqin',
  世界魔鬼城: 'Urho Ghost City Yardang',
  魔鬼城: 'Urho Ghost City Xinjiang',
  克拉瑪依: 'Karamay Xinjiang',
  布爾津: 'Burqin Xinjiang river',
  伊寧: 'Yining Liuxing Street',
  六星街: 'Yining Six Star Street',
  塔縣: 'Tashkurgan Stone City',
  石頭城: 'Tashkurgan Stone Fortress',
  白沙湖: 'Baisha Lake Pamir',
  喀拉庫里: 'Karakul Lake Muztagh Ata',
  慕士塔格: 'Muztagh Ata mountain',
  庫車: 'Kuqa Grand Canyon Xinjiang',
  天山神秘大峽谷: 'Kuqa Tianshan Mysterious Canyon',
  國際大巴扎: 'Urumqi International Grand Bazaar',
  紅山公園: 'Hongshan Park Urumqi',
  新疆博物館: 'Xinjiang Regional Museum',
  伏見稻荷: 'Fushimi Inari-taisha torii gates',
  伏見稻荷大社: 'Fushimi Inari-taisha torii gates',
  清水寺: 'Kiyomizu-dera Kyoto stage',
  大阪城: 'Osaka Castle keep park',
  金閣寺: 'Kinkaku-ji Golden Pavilion Kyoto',
  嵐山: 'Arashiyama Bamboo Grove Kyoto',
  嵐山竹林: 'Arashiyama Bamboo Grove path',
  渡月橋: 'Togetsukyo Bridge Arashiyama',
  祇園: 'Gion Kyoto street evening',
  花見小路: 'Hanamikoji Street Gion',
  道頓堀: 'Dotonbori Osaka neon night',
  心齋橋: 'Shinsaibashi Osaka shopping street',
  黑門市場: 'Kuromon Market Osaka seafood',
  新世界: 'Shinsekai Tsutenkaku Osaka',
  通天閣: 'Tsutenkaku Tower Osaka',
  梅田空中庭園: 'Umeda Sky Building Floating Garden',
  空中庭園: 'Umeda Sky Building observatory',
  環球影城: 'Universal Studios Japan Osaka',
  USJ: 'Universal Studios Japan entrance',
  海遊館: 'Osaka Aquarium Kaiyukan',
  難波八阪神社: 'Namba Yasaka Shrine lion head',
  二条城: 'Nijo Castle Kyoto',
  哲學之道: 'Philosopher Path Kyoto',
  錦市場: 'Nishiki Market Kyoto',
  宇治: 'Byodo-in Temple Uji',
  平等院: 'Byodo-in Phoenix Hall Uji',
  奈良公園: 'Nara Park deer Todai-ji',
  奈良: 'Todai-ji Great Buddha Nara',
  東大寺: 'Todai-ji Temple Nara',
  神戶: 'Kobe Harbor night view',
  神戶港: 'Kobe Port Tower harbor',
  淺草寺: 'Senso-ji Temple Asakusa',
  晴空塔: 'Tokyo Skytree',
  澀谷: 'Shibuya Crossing Tokyo',
  明治神宮: 'Meiji Shrine Tokyo',
  新天鵝堡: 'Neuschwanstein Castle Bavaria',
  科隆大教堂: 'Cologne Cathedral facade',
  布蘭登堡門: 'Brandenburg Gate Berlin',
  柏林圍牆: 'Berlin Wall Memorial',
  // United Kingdom
  白金漢宮: 'Buckingham Palace London facade',
  倫敦: 'Tower Bridge London',
  大英博物館: 'British Museum London facade',
  倫敦塔橋: 'Tower Bridge London',
  塔橋: 'Tower Bridge London',
  牛津: 'Radcliffe Camera Oxford',
  牛津大學: 'University of Oxford Radcliffe Camera',
  劍橋: 'King\'s College Chapel Cambridge',
  劍橋大學: 'King\'s College Chapel Cambridge',
  愛丁堡: 'Edinburgh Castle rock',
  愛丁堡城堡: 'Edinburgh Castle Scotland',
  巨人堤道: 'Giant\'s Causeway hexagonal columns',
  巨人之路: 'Giant\'s Causeway Northern Ireland',
  北愛爾蘭: 'Giant\'s Causeway coastline',
  巨石陣: 'Stonehenge Wiltshire aerial',
  威爾特郡: 'Stonehenge stones',
  卡地夫: 'Cardiff Castle keep',
  卡地夫城堡: 'Cardiff Castle Wales',
  巴斯: 'Roman Baths Bath England',
  羅馬浴場: 'Roman Baths Bath England',
  湖區: 'Lake District Derwentwater',
  湖區國家公園: 'Lake District mountains lake',
  利物浦: 'Royal Albert Dock Liverpool',
  披頭四故事館: 'The Beatles Story Liverpool',
  披頭四: 'The Beatles Story Liverpool',
  約克: 'York Minster cathedral',
  約克大教堂: 'York Minster west front',
  巴斯修道院: 'Bath Abbey England',
  溫莎城堡: 'Windsor Castle England',
  大本鐘: 'Big Ben Elizabeth Tower London',
  西敏寺: 'Westminster Abbey London',
}

/** English Wikipedia page titles for stable scenic thumbnails. */
const WIKI_TITLE: Record<string, string> = {
  伏見稻荷: 'Fushimi Inari-taisha',
  伏見稻荷大社: 'Fushimi Inari-taisha',
  清水寺: 'Kiyomizu-dera',
  大阪城: 'Osaka Castle',
  金閣寺: 'Kinkaku-ji',
  嵐山: 'Arashiyama',
  嵐山竹林: 'Arashiyama',
  渡月橋: 'Togetsukyo Bridge',
  祇園: 'Gion',
  道頓堀: 'Dotonbori',
  心齋橋: 'Shinsaibashi',
  黑門市場: 'Kuromon Market',
  通天閣: 'Tsūtenkaku',
  梅田空中庭園: 'Umeda Sky Building',
  空中庭園: 'Umeda Sky Building',
  環球影城: 'Universal Studios Japan',
  USJ: 'Universal Studios Japan',
  海遊館: 'Osaka Aquarium Kaiyukan',
  二条城: 'Nijō Castle',
  哲學之道: "Philosopher's Walk",
  錦市場: 'Nishiki Market',
  宇治: 'Byōdō-in',
  平等院: 'Byōdō-in',
  奈良公園: 'Nara Park',
  奈良: 'Tōdai-ji',
  東大寺: 'Tōdai-ji',
  神戶港: 'Port of Kobe',
  神戶: 'Port of Kobe',
  淺草寺: 'Sensō-ji',
  晴空塔: 'Tokyo Skytree',
  澀谷: 'Shibuya Crossing',
  明治神宮: 'Meiji Shrine',
  新天鵝堡: 'Neuschwanstein Castle',
  科隆大教堂: 'Cologne Cathedral',
  布蘭登堡門: 'Brandenburg Gate',
  柏林圍牆: 'Berlin Wall Memorial',
  博物館島: 'Museum Island',
  海德堡城堡: 'Heidelberg Castle',
  白金漢宮: 'Buckingham Palace',
  倫敦塔橋: 'Tower Bridge',
  塔橋: 'Tower Bridge',
  大英博物館: 'British Museum',
  牛津: 'Radcliffe Camera',
  牛津大學: 'University of Oxford',
  劍橋: "King's College, Cambridge",
  劍橋大學: "King's College, Cambridge",
  愛丁堡: 'Edinburgh Castle',
  愛丁堡城堡: 'Edinburgh Castle',
  巨人堤道: "Giant's Causeway",
  巨人之路: "Giant's Causeway",
  北愛爾蘭: "Giant's Causeway",
  巨石陣: 'Stonehenge',
  威爾特郡: 'Stonehenge',
  卡地夫: 'Cardiff Castle',
  卡地夫城堡: 'Cardiff Castle',
  巴斯: 'Roman Baths, Bath',
  羅馬浴場: 'Roman Baths, Bath',
  湖區: 'Lake District',
  湖區國家公園: 'Lake District',
  利物浦: 'Royal Albert Dock',
  披頭四故事館: 'The Beatles Story',
  披頭四: 'The Beatles Story',
  約克: 'York Minster',
  約克大教堂: 'York Minster',
  大本鐘: 'Big Ben',
  西敏寺: 'Westminster Abbey',
  溫莎城堡: 'Windsor Castle',
}

function normalizeKey(raw: string): string {
  return raw
    .replace(/（.*?）|\(.*?\)/g, '')
    .replace(
      /景區|國家遺址公園|遺址公園|公園|博物館|博物院|度假酒店|酒店|住宿|精華|重點景區|野生動物園|音樂廳|美術[館院]|全日遊|打卡紅點/g,
      '',
    )
    .trim()
}

function localMatch(query: string): string | null {
  const q = normalizeKey(query)
  if (!q) return null
  if (LOCAL[q]) return LOCAL[q]
  for (const [key, url] of Object.entries(LOCAL)) {
    if (q.includes(key) || key.includes(q)) return url
  }
  return null
}

function lookupMap(map: Record<string, string>, query: string): string | null {
  const q = normalizeKey(query)
  if (!q) return null
  if (map[q]) return map[q]
  for (const [key, value] of Object.entries(map)) {
    if (q.includes(key) || key.includes(q)) return value
  }
  return null
}

function photoRegion(destinationName: string, query: string): string {
  const text = `${destinationName} ${query}`
  if (/關西|大阪|京都|奈良|神戶|東京|日本|Japan|Osaka|Kyoto|Tokyo|Kansai/i.test(text)) {
    return 'Japan'
  }
  if (/首爾|韓國|Korea|Seoul/i.test(text)) return 'South Korea'
  if (
    /英國|UK|United Kingdom|Britain|倫敦|愛丁堡|劍橋|牛津|約克|巴斯|卡地夫|湖區|巨人|巨石|利物浦|英格蘭|蘇格蘭|威爾斯|威爾士|北愛爾蘭|London|Edinburgh|Cambridge|Oxford|York|Bath|Cardiff|Liverpool|Stonehenge/i.test(
      text,
    )
  ) {
    return 'United Kingdom'
  }
  if (/德國|柏林|慕尼黑|科隆|Germany|german|Europe|巴黎|France/i.test(text)) {
    return 'Europe'
  }
  if (/台北|臺灣|台灣|Taiwan/i.test(text)) return 'Taiwan'
  if (/新疆|青甘|西安|中國|China|敦煌|喀什/i.test(text)) return 'China'
  return 'travel'
}

function searchHint(query: string, destinationName = ''): string {
  const mapped = lookupMap(SEARCH_HINT, query)
  if (mapped) return mapped
  const q = normalizeKey(query)
  const region = photoRegion(destinationName, q)
  return `${q} landmark ${region}`
}

function wikiTitleFor(query: string): string | null {
  return lookupMap(WIKI_TITLE, query)
}

export async function resolvePlacePhoto(
  query: string,
  options?: {
    avoidUrls?: Set<string>
    destinationName?: string
    offset?: number
  },
): Promise<string | null> {
  const key = normalizeKey(query)
  if (!key) return null
  const avoid = options?.avoidUrls
  const destinationName = options?.destinationName || ''
  const region = photoRegion(destinationName, key)
  const offset = Math.max(0, options?.offset || 0)
  const cacheKey = offset ? `${region}::${key}::o${offset}` : `${region}::${key}`

  const cached = photoCache.get(cacheKey)
  if (cached && (!avoid || !avoid.has(cached))) return cached

  const local = localMatch(key)
  if (local && (!avoid || !avoid.has(local))) {
    photoCache.set(cacheKey, local)
    return local
  }

  try {
    const hint = searchHint(key, destinationName)
    const wiki = wikiTitleFor(key)
    const params = new URLSearchParams({
      q: hint,
      fallback: key,
      region,
    })
    if (offset > 0) params.set('offset', String(offset))
    // Only use Wikipedia first-hit when not seeking an alternate frame.
    if (wiki && offset <= 0) params.set('wiki', wiki)
    const res = await fetch(`/api/place-photo?${params.toString()}`)
    if (!res.ok) {
      photoCache.set(cacheKey, null)
      return null
    }
    const data = (await res.json()) as { url?: string | null }
    const url = data.url || null
    if (url && avoid?.has(url)) {
      // Ask again with offset / different wording to avoid repeating the same wall photo.
      // Omit wiki on retries so we don't keep getting the same Wikipedia thumb.
      for (const [suffix, offset] of [
        ['scenic view', 1],
        ['exterior daytime', 2],
        ['landscape panorama', 3],
        ['tourist photo', 4],
      ] as const) {
        const retryParams = new URLSearchParams({
          q: `${hint} ${suffix}`,
          fallback: `${key} ${suffix}`,
          region,
          offset: String(offset),
        })
        const retry = await fetch(`/api/place-photo?${retryParams.toString()}`)
        if (!retry.ok) continue
        const retryData = (await retry.json()) as { url?: string | null }
        if (retryData.url && !avoid.has(retryData.url)) {
          photoCache.set(`${cacheKey}::${suffix}`, retryData.url)
          return retryData.url
        }
      }
      return null
    }
    photoCache.set(cacheKey, url)
    return url
  } catch {
    photoCache.set(cacheKey, null)
    return null
  }
}

export type DayPhotoQuery = {
  stayCity?: string
  theme?: string
  mainPlan?: string
  spotNames?: string[]
}

/** Scenic fallbacks when a day is mostly rest / logistics. */
const CITY_SCENIC: Record<string, string[]> = {
  烏魯木齊: ['紅山公園', '國際大巴扎', '新疆博物館', '天山天池'],
  烏市: ['紅山公園', '國際大巴扎'],
  喀什: ['喀什古城', '喀什'],
  禾木: ['禾木'],
  喀納斯: ['喀納斯湖', '喀納斯'],
  賽里木湖: ['賽里木湖'],
  伊寧: ['六星街', '伊寧'],
  塔縣: ['石頭城', '塔縣'],
  庫車: ['天山神秘大峽谷', '庫車'],
  克拉瑪依: ['世界魔鬼城', '克拉瑪依'],
  布爾津: ['五彩灘', '布爾津'],
  阿勒泰: ['阿勒泰'],
  返程: ['烏魯木齊', '紅山公園'],
  大阪: ['大阪城', '道頓堀', '通天閣'],
  京都: ['清水寺', '金閣寺', '伏見稻荷'],
  奈良: ['奈良公園', '東大寺'],
  神戶: ['神戶港'],
  東京: ['淺草寺', '澀谷', '晴空塔'],
  柏林: ['布蘭登堡門', '柏林圍牆'],
  慕尼黑: ['新天鵝堡'],
  科隆: ['科隆大教堂'],
  倫敦: ['白金漢宮', '塔橋', '大本鐘', '大英博物館'],
  牛津: ['牛津大學', '牛津'],
  劍橋: ['劍橋大學', '劍橋'],
  愛丁堡: ['愛丁堡城堡', '愛丁堡'],
  北愛爾蘭: ['巨人堤道', '巨人之路'],
  威爾特郡: ['巨石陣'],
  卡地夫: ['卡地夫城堡', '卡地夫'],
  巴斯: ['羅馬浴場', '巴斯'],
  湖區: ['湖區國家公園', '湖區'],
  利物浦: ['披頭四故事館', '利物浦'],
  約克: ['約克大教堂', '約克'],
}

/** Candidate queries for one day, most specific first. */
export function dayPhotoCandidates(
  day: DayPhotoQuery,
  destinationName: string,
): string[] {
  const fromSpots = (day.spotNames || []).filter(
    (n) => n && !/住宿|機場|返程|出發|午餐|晚餐|包車|轉乘|自駕|前往/.test(n),
  )
  const fromPlan = (day.mainPlan || '')
    .split(/[、，,；;]/)
    .map((s) => s.trim())
    .filter((s) => s && !/休息|洗衣|咖啡|散步|自由|整理|按摩|緩衝|彈性/.test(s))
  const theme = (day.theme || '').replace(/抵達|收尾|休息日|·/g, '').trim()
  const city = (day.stayCity || '').replace(/市區|景區內|湖畔/g, '').trim()
  const cityScenic = CITY_SCENIC[city] || []
  const ordered = [
    ...fromSpots,
    ...fromPlan,
    ...cityScenic,
    city && city !== destinationName ? city : '',
    theme,
  ].filter(Boolean) as string[]
  return [...new Set(ordered)]
}

export async function resolveDayPhotos(
  days: DayPhotoQuery[],
  destinationName: string,
): Promise<(string | null)[]> {
  const used = new Set<string>()
  const results: (string | null)[] = []

  for (const [dayIndex, day] of days.entries()) {
    const candidates = [
      ...dayPhotoCandidates(day, destinationName),
      // Day-index variants help Commons return different frames for similar UK cities.
      ...(day.stayCity
        ? [`${day.stayCity} landmark`, `${day.stayCity} scenic`]
        : []),
    ]
    let picked: string | null = null
    for (const candidate of candidates) {
      const url = await resolvePlacePhoto(candidate, {
        avoidUrls: used,
        destinationName,
      })
      if (url && !used.has(url)) {
        picked = url
        used.add(url)
        break
      }
    }
    // Last resort: still avoid reusing another day's photo (blank > duplicate).
    if (!picked) {
      const city = (day.stayCity || day.theme || destinationName || '').trim()
      if (city) {
        for (const offset of [dayIndex + 1, dayIndex + 2, dayIndex + 3]) {
          const url = await resolvePlacePhoto(city, {
            avoidUrls: used,
            destinationName,
            offset,
          })
          if (url && !used.has(url)) {
            picked = url
            used.add(url)
            break
          }
        }
      }
    }
    results.push(picked)
  }

  return results
}
