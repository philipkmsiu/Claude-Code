import type { DayWeather } from '../data/types'

type GeoHit = {
  name: string
  latitude: number
  longitude: number
  timezone?: string
}

const geoCache = new Map<string, GeoHit | null>()

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
  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(key)}&count=1&language=zh&format=json`
    const res = await fetch(url)
    if (!res.ok) {
      geoCache.set(key, null)
      return null
    }
    const data = (await res.json()) as { results?: GeoHit[] }
    const hit = data.results?.[0] ?? null
    geoCache.set(key, hit)
    return hit
  } catch {
    geoCache.set(key, null)
    return null
  }
}

function addDays(isoDate: string, offset: number): string {
  const d = new Date(`${isoDate}T12:00:00`)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function shiftYear(isoDate: string, year: number): string {
  const [, m, d] = isoDate.split('-')
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
    // Same calendar dates last year as climate reference for far-future trips.
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
      precipitation_probability_max?: number[]
      precipitation_sum: number[]
    }
  }
  const daily = data.daily
  if (!daily?.time?.length) return map

  daily.time.forEach((date, i) => {
    const rainChance = Number(daily.precipitation_probability_max?.[i] ?? 0)
    const rainMm = Number(daily.precipitation_sum?.[i] ?? 0)
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

/**
 * Attach daily weather (live forecast when near-term; else last-year climate proxy)
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

  // Group indices by place to minimize API calls.
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
        const year = today.getFullYear() - 1
        weatherMap = await fetchDailyRange({
          latitude: geo.latitude,
          longitude: geo.longitude,
          start: shiftYear(rangeStart, year),
          end: shiftYear(rangeEnd, year),
          timezone,
          mode: 'climate',
        })
        // Remap climate dates onto trip dates.
        const remapped = new Map<string, DayWeather>()
        for (const index of indexes) {
          const tripDate = addDays(start, index)
          const climateDate = shiftYear(tripDate, year)
          const climate = weatherMap.get(climateDate)
          if (climate) {
            remapped.set(tripDate, { ...climate, date: tripDate, source: 'climate' })
          }
        }
        weatherMap = remapped
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
  const source = weather.source === 'forecast' ? '預報' : '往年同期參考'
  return `${weather.label} ${weather.tempMin}–${weather.tempMax}°C・${rain}（${source}）`
}
