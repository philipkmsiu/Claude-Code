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
  伏見稻荷: 'Fushimi Inari Shrine torii',
  清水寺: 'Kiyomizu-dera Kyoto',
  大阪城: 'Osaka Castle keep',
}

function normalizeKey(raw: string): string {
  return raw
    .replace(/（.*?）|\(.*?\)/g, '')
    .replace(
      /景區|國家遺址公園|遺址公園|公園|博物館|博物院|度假酒店|酒店|住宿|精華|重點景區|野生動物園|音樂廳|美術[館院]/g,
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

function searchHint(query: string): string {
  const q = normalizeKey(query)
  if (SEARCH_HINT[q]) return SEARCH_HINT[q]
  for (const [key, hint] of Object.entries(SEARCH_HINT)) {
    if (q.includes(key) || key.includes(q)) return hint
  }
  return `${q} landmark China`
}

export async function resolvePlacePhoto(
  query: string,
  options?: { avoidUrls?: Set<string> },
): Promise<string | null> {
  const key = normalizeKey(query)
  if (!key) return null
  const avoid = options?.avoidUrls

  const cached = photoCache.get(key)
  if (cached && (!avoid || !avoid.has(cached))) return cached

  const local = localMatch(key)
  if (local && (!avoid || !avoid.has(local))) {
    photoCache.set(key, local)
    return local
  }

  try {
    const hint = searchHint(key)
    const res = await fetch(
      `/api/place-photo?q=${encodeURIComponent(hint)}&fallback=${encodeURIComponent(key)}`,
    )
    if (!res.ok) {
      photoCache.set(key, null)
      return null
    }
    const data = (await res.json()) as { url?: string | null }
    const url = data.url || null
    if (url && avoid?.has(url)) {
      // Ask again with offset / different wording to avoid repeating the same wall photo.
      for (const [suffix, offset] of [
        ['scenic view', 1],
        ['night view', 2],
        ['panorama', 3],
      ] as const) {
        const retry = await fetch(
          `/api/place-photo?q=${encodeURIComponent(`${hint} ${suffix}`)}&fallback=${encodeURIComponent(`${key} ${suffix}`)}&offset=${offset}`,
        )
        if (!retry.ok) continue
        const retryData = (await retry.json()) as { url?: string | null }
        if (retryData.url && !avoid.has(retryData.url)) {
          photoCache.set(`${key}::${suffix}`, retryData.url)
          return retryData.url
        }
      }
      return null
    }
    photoCache.set(key, url)
    return url
  } catch {
    photoCache.set(key, null)
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

  for (const day of days) {
    const candidates = dayPhotoCandidates(day, destinationName)
    let picked: string | null = null
    for (const candidate of candidates) {
      const url = await resolvePlacePhoto(candidate, { avoidUrls: used })
      if (url && !used.has(url)) {
        picked = url
        used.add(url)
        break
      }
    }
    // Last resort: allow a city photo even if seen before, rather than a blank/broken slot.
    if (!picked) {
      for (const candidate of candidates) {
        const url = await resolvePlacePhoto(candidate)
        if (url) {
          picked = url
          break
        }
      }
    }
    results.push(picked)
  }

  return results
}
