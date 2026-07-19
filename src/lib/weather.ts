import type { DayWeather } from '../data/types'

type GeoHit = {
  name: string
  latitude: number
  longitude: number
  timezone?: string
}

const geoCache = new Map<string, GeoHit | null>()

/** Prefer city centers over airports / obscure hits. */
const GEO_ALIAS: Record<string, string> = {
  烏魯木齊: 'Urumqi',
  乌鲁木齐: 'Urumqi',
  喀什: 'Kashgar',
  禾木: 'Hemu Xinjiang',
  喀納斯: 'Kanas Lake',
  布尔津: 'Burqin',
  布爾津: 'Burqin',
  克拉瑪依: 'Karamay',
  赛里木湖: 'Sayram Lake',
  賽里木湖: 'Sayram Lake',
  伊寧: 'Yining',
  伊宁: 'Yining',
  塔縣: 'Tashkurgan',
  塔县: 'Tashkurgan',
  庫車: 'Kuqa',
  库车: 'Kuqa',
  阿勒泰: 'Altay Xinjiang',
  返程: 'Urumqi',
  西寧: 'Xining',
  敦煌: 'Dunhuang',
  嘉峪關: 'Jiayuguan',
  青海湖: 'Qinghai Lake',
}

function wmoLabel(code: number, rainChance: number): string {
  if (rainChance >= 60 || code >= 61) return '有雨機會高'
  if (rainChance >= 40 || code >= 51) return '可能有短暫雨'
  if (code === 0) return '晴朗'
  if (code <= 2) return '大致晴朗'
  if (code === 3) return '多雲'
  if (code <= 48) return '有霧／陰'
  if (code <= 67) return '降雨'
  if (code <= 77) return '可能有雪'
  if (code <= 82) return '陣雨'
  return '天氣不穩'
}

async function geocode(place: string): Promise<GeoHit | null> {
  const key = place.trim()
  if (!key) return null
  if (geoCache.has(key)) return geoCache.get(key) ?? null

  const alias = GEO_ALIAS[key] || GEO_ALIAS[key.replace(/市區|景區|湖畔/g, '')]
  const queries = alias ? [alias, key] : [key]

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=3&language=en&format=json`,
      )
      if (!res.ok) continue
      const data = (await res.json()) as { results?: GeoHit[] }
      const hit =
        data.results?.find((r) => !/airport|aerodrome/i.test(r.name)) ??
        data.results?.[0] ??
        null
      if (hit) {
        geoCache.set(key, hit)
        return hit
      }
    } catch {
      /* try next */
    }
  }

  geoCache.set(key, null)
  return null
}

function addDays(isoDate: string, offset: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function shiftYear(isoDate: string, year: number): string {
  const [, m, d] = isoDate.split('-')
  // Handle Feb 29 → Feb 28 on non-leap years
  if (m === '02' && d === '29') {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    return `${year}-02-${leap ? '29' : '28'}`
  }
  return `${year}-${m}-${d}`
}

async function fetchDailyRange(options: {
  latitude: number
  longitude: number
  start: string
  end: string
  timezone: string
  mode: 'forecast' | 'climate'
}): Promise<Map<string, DayWeather>> {
  const map = new Map<string, DayWeather>()
  const common =
    'daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum'

  let url = ''
  if (options.mode === 'forecast') {
    url = `https://api.open-meteo.com/v1/forecast?latitude=${options.latitude}&longitude=${options.longitude}&${common}&timezone=${encodeURIComponent(options.timezone)}&start_date=${options.start}&end_date=${options.end}`
  } else {
    url = `https://archive-api.open-meteo.com/v1/archive?latitude=${options.latitude}&longitude=${options.longitude}&${common}&timezone=${encodeURIComponent(options.timezone)}&start_date=${options.start}&end_date=${options.end}`
  }

  const res = await fetch(url)
  if (!res.ok) return map
  const data = (await res.json()) as {
    daily?: {
      time: string[]
      weathercode: number[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      precipitation_probability_max?: (number | null)[]
      precipitation_sum: number[]
    }
  }
  const daily = data.daily
  if (!daily?.time?.length) return map

  daily.time.forEach((date, i) => {
    const rainMm = Number(daily.precipitation_sum?.[i] ?? 0)
    const rawProb = daily.precipitation_probability_max?.[i]
    // Archive often returns null probability — estimate from rainfall
    const rainChance =
      rawProb == null || Number.isNaN(Number(rawProb))
        ? rainMm >= 5
          ? 60
          : rainMm >= 1
            ? 35
            : rainMm > 0
              ? 20
              : 10
        : Number(rawProb)
    const code = Number(daily.weathercode?.[i] ?? 0)
    map.set(date, {
      date,
      label: wmoLabel(code, rainChance),
      tempMin: Math.round(Number(daily.temperature_2m_min?.[i] ?? 0)),
      tempMax: Math.round(Number(daily.temperature_2m_max?.[i] ?? 0)),
      rainChance: Math.round(rainChance),
      rainMm: Math.round(rainMm * 10) / 10,
      source: options.mode,
    })
  })
  return map
}

/** Average several prior years so one hot September day doesn't dominate. */
async function fetchClimateAverage(options: {
  latitude: number
  longitude: number
  tripDates: string[]
  timezone: string
  baseYear: number
}): Promise<Map<string, DayWeather>> {
  const years = [options.baseYear, options.baseYear - 1, options.baseYear - 2]
  const yearMaps = await Promise.all(
    years.map(async (year) => {
      const starts = options.tripDates.map((d) => shiftYear(d, year))
      const start = starts.reduce((a, b) => (a < b ? a : b))
      const end = starts.reduce((a, b) => (a > b ? a : b))
      return fetchDailyRange({
        latitude: options.latitude,
        longitude: options.longitude,
        start,
        end,
        timezone: options.timezone,
        mode: 'climate',
      })
    }),
  )

  const out = new Map<string, DayWeather>()
  for (const tripDate of options.tripDates) {
    const samples: DayWeather[] = []
    years.forEach((year, yi) => {
      const hit = yearMaps[yi].get(shiftYear(tripDate, year))
      if (hit) samples.push(hit)
    })
    if (!samples.length) continue
    const tempMin = Math.round(
      samples.reduce((s, w) => s + w.tempMin, 0) / samples.length,
    )
    const tempMax = Math.round(
      samples.reduce((s, w) => s + w.tempMax, 0) / samples.length,
    )
    const rainChance = Math.round(
      samples.reduce((s, w) => s + w.rainChance, 0) / samples.length,
    )
    const rainMm =
      Math.round(
        (samples.reduce((s, w) => s + w.rainMm, 0) / samples.length) * 10,
      ) / 10
    // Pick modal-ish label from the mildest/median sample
    const mid = samples[Math.floor(samples.length / 2)]
    out.set(tripDate, {
      date: tripDate,
      label: mid.label,
      tempMin,
      tempMax,
      rainChance,
      rainMm,
      source: 'climate',
    })
  }
  return out
}

/**
 * Attach daily weather (live forecast when near-term; else multi-year climate average)
 * for each itinerary day location.
 */
export async function loadDayWeather(options: {
  startDate: string
  places: string[]
}): Promise<(DayWeather | null)[]> {
  const start = options.startDate
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !options.places.length) {
    return options.places.map(() => null)
  }

  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const startMs = new Date(`${start}T12:00:00`).getTime()
  const daysOut = Math.round((startMs - today.getTime()) / 86400000)
  const useForecast = daysOut >= -1 && daysOut <= 14

  const results: (DayWeather | null)[] = Array.from(
    { length: options.places.length },
    () => null,
  )

  const byPlace = new Map<string, number[]>()
  options.places.forEach((place, index) => {
    const key = place.trim() || '目的地'
    const list = byPlace.get(key) ?? []
    list.push(index)
    byPlace.set(key, list)
  })

  await Promise.all(
    [...byPlace.entries()].map(async ([place, indexes]) => {
      const geo = await geocode(place)
      if (!geo) return
      const first = indexes[0]
      const last = indexes[indexes.length - 1]
      const rangeStart = addDays(start, first)
      const rangeEnd = addDays(start, last)
      const timezone = geo.timezone || 'auto'
      const tripDates = indexes.map((i) => addDays(start, i))

      let weatherMap: Map<string, DayWeather>
      if (useForecast) {
        weatherMap = await fetchDailyRange({
          latitude: geo.latitude,
          longitude: geo.longitude,
          start: rangeStart,
          end: rangeEnd,
          timezone,
          mode: 'forecast',
        })
      } else {
        weatherMap = await fetchClimateAverage({
          latitude: geo.latitude,
          longitude: geo.longitude,
          tripDates,
          timezone,
          baseYear: today.getFullYear() - 1,
        })
      }

      for (const index of indexes) {
        const tripDate = addDays(start, index)
        results[index] = weatherMap.get(tripDate) ?? null
      }
    }),
  )

  return results
}

export function formatWeatherLine(weather: DayWeather | null | undefined): string {
  if (!weather) return '天氣資料稍後載入'
  const rain =
    weather.rainChance >= 40 || weather.rainMm >= 1
      ? `降雨機率 ${weather.rainChance}%${weather.rainMm ? `・約 ${weather.rainMm}mm` : ''}`
      : `降雨機率 ${weather.rainChance}%`
  const source =
    weather.source === 'forecast' ? '預報' : '近三年同期平均'
  // South Xinjiang basins can still be warm in early September — keep the number,
  // but make the reference window obvious so it doesn't read like a live forecast.
  return `${weather.label} ${weather.tempMin}–${weather.tempMax}°C・${rain}（${source}）`
}
