import type { Connect, Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function chatCompletion(messages: ChatMessage[], temperature = 0.3): Promise<string> {
  const baseUrl = (process.env.OPENAI_BASE_URL || '').replace(/\/$/, '')
  const apiKey = process.env.OPENAI_API_KEY || ''
  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o'

  if (!baseUrl || !apiKey) {
    throw new Error('Crazyrouter API is not configured (OPENAI_BASE_URL / OPENAI_API_KEY).')
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature,
      messages,
      response_format: { type: 'json_object' },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Crazyrouter error ${response.status}: ${text.slice(0, 300)}`)
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('Crazyrouter returned empty content.')
  return content
}

function extractJson(text: string): unknown {
  const trimmed = text.trim()
  try {
    return JSON.parse(trimmed)
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('AI response was not valid JSON.')
    return JSON.parse(match[0])
  }
}

async function handleRecommendDays(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const payload = JSON.parse(await readBody(req)) as {
      destinationName?: string
      pace?: string
      companions?: string
      partySize?: number
      specialNeeds?: string[]
      heuristic?: {
        minDays?: number
        comfortableDays?: number
        suggestedLongestDays?: number
      }
    }

    const destinationName = payload.destinationName?.trim()
    if (!destinationName) {
      sendJson(res, 400, { error: 'destinationName is required' })
      return
    }

    const content = await chatCompletion([
      {
        role: 'system',
        content: `你是專業旅遊規劃 AI。請依目的地真實距離、交通與旅遊節奏，估算行程天數。
只回傳 JSON，欄位如下：
{
  "minDays": number,
  "comfortableDays": number,
  "suggestedLongestDays": number,
  "reason": string,
  "warnings": string[]
}
規則：
- 天數必須是 2 到 21 的整數
- minDays <= comfortableDays <= suggestedLongestDays
- 新疆南北疆、青甘大環線、長公路環線屬於長線，comfortableDays 通常 >= 14
- 「慢遊／舒適」要明顯加天
- reason / warnings 用繁體中文，簡短可執行
- 不要輸出 Markdown`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          destinationName,
          pace: payload.pace ?? 'balanced',
          companions: payload.companions ?? 'friends',
          partySize: Number(payload.partySize) || 2,
          specialNeeds: payload.specialNeeds ?? [],
          localHeuristicHint: payload.heuristic ?? null,
          ask: '請審核並給出你認為正確的最少／最舒服／建議最長天數；可順便提醒人數對交通／訂房的影響。',
        }),
      },
    ])

    const parsed = extractJson(content) as {
      minDays?: number
      comfortableDays?: number
      suggestedLongestDays?: number
      reason?: string
      warnings?: string[]
    }

    sendJson(res, 200, {
      source: 'crazyrouter',
      minDays: Number(parsed.minDays),
      comfortableDays: Number(parsed.comfortableDays),
      suggestedLongestDays: Number(parsed.suggestedLongestDays),
      reason: parsed.reason || '',
      warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
      raw: parsed,
    })
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'AI recommend-days failed',
    })
  }
}

async function handleReviewPlan(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const payload = JSON.parse(await readBody(req)) as {
      destinationName?: string
      chosenDays?: number
      pace?: string
      companions?: string
      partySize?: number
      specialNeeds?: string[]
      spots?: { name: string; stayHours: number; area: string }[]
      heuristic?: {
        status?: string
        recommendedDays?: number
        minDays?: number
        comfortableDays?: number
      }
    }

    const destinationName = payload.destinationName?.trim()
    const chosenDays = Number(payload.chosenDays)
    if (!destinationName || !Number.isFinite(chosenDays)) {
      sendJson(res, 400, { error: 'destinationName and chosenDays are required' })
      return
    }

    const heuristic = payload.heuristic ?? {}
    const hMin = Number(heuristic.minDays)
    const hRec = Number(heuristic.recommendedDays)
    const hCom = Number(heuristic.comfortableDays)

    const content = await chatCompletion([
      {
        role: 'system',
        content: `你是專業旅遊規劃 AI。請依「已選景點」估算完成這趟行程需要的絕對天數。
重要：不要被使用者目前選的天數帶偏；先估景點真正需要多久，status 由系統另算。
只回傳 JSON：
{
  "recommendedDays": number,
  "minDays": number,
  "comfortableDays": number,
  "message": string,
  "adjustments": string[]
}
規則：
- 天數 2-21 整數，且 minDays <= recommendedDays <= comfortableDays
- recommendedDays = 正常完成（不過度趕、也不故意拖）
- 一般城市＋1–2 個近郊日遊：多數落在 4–8 天，不要無故估到 14 天以上
- 只有長線（新疆南北疆／青甘／大環線公路）才給 12 天以上
- 必須參考 localHeuristicHint，最終數字應落在 heuristic 附近（約 ±2 天），長線可放寬
- 全文繁體中文，不要 Markdown`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          destinationName,
          // chosenDays is context only — do not inflate/deflate absolute need to match it
          currentlySelectedDaysForContextOnly: chosenDays,
          pace: payload.pace ?? 'balanced',
          companions: payload.companions ?? 'friends',
          partySize: Number(payload.partySize) || 2,
          specialNeeds: payload.specialNeeds ?? [],
          spots: payload.spots ?? [],
          localHeuristicHint: {
            minDays: Number.isFinite(hMin) ? hMin : null,
            recommendedDays: Number.isFinite(hRec) ? hRec : null,
            comfortableDays: Number.isFinite(hCom) ? hCom : null,
          },
          ask: '請給出完成這些景點的最少／正常／舒服天數（絕對估計，前後一致）。',
        }),
      },
    ], 0.2)

    const parsed = extractJson(content) as {
      recommendedDays?: number
      minDays?: number
      comfortableDays?: number
      message?: string
      adjustments?: string[]
    }

    const clamp = (n: number, lo: number, hi: number) =>
      Math.min(hi, Math.max(lo, Math.round(n)))

    let minDays = Number(parsed.minDays)
    let recommendedDays = Number(parsed.recommendedDays)
    let comfortableDays = Number(parsed.comfortableDays)

    // Anchor to heuristic so spots/result pages don't drift wildly.
    if (Number.isFinite(hMin) && Number.isFinite(hRec) && Number.isFinite(hCom)) {
      if (!Number.isFinite(minDays)) minDays = hMin
      if (!Number.isFinite(recommendedDays)) recommendedDays = hRec
      if (!Number.isFinite(comfortableDays)) comfortableDays = hCom
      minDays = clamp(minDays, Math.max(2, hMin - 1), Math.min(21, hRec + 2))
      recommendedDays = clamp(
        Math.round(recommendedDays * 0.4 + hRec * 0.6),
        Math.max(2, hMin),
        Math.min(21, hCom + 2),
      )
      comfortableDays = clamp(
        Math.round(comfortableDays * 0.4 + hCom * 0.6),
        recommendedDays,
        Math.min(21, hCom + 3),
      )
    } else {
      minDays = clamp(Number.isFinite(minDays) ? minDays : 3, 2, 21)
      recommendedDays = clamp(
        Number.isFinite(recommendedDays) ? recommendedDays : minDays + 1,
        2,
        21,
      )
      comfortableDays = clamp(
        Number.isFinite(comfortableDays) ? comfortableDays : recommendedDays + 1,
        2,
        21,
      )
    }

    if (minDays > recommendedDays) minDays = recommendedDays
    if (comfortableDays < recommendedDays) comfortableDays = recommendedDays

    let status: 'too_packed' | 'too_light' | 'balanced' = 'balanced'
    const lightThreshold = Math.max(recommendedDays + 2, comfortableDays)
    if (chosenDays < recommendedDays) status = 'too_packed'
    else if (chosenDays > lightThreshold) status = 'too_light'

    const title =
      status === 'too_packed'
        ? '行程過於緊湊，建議延長天數'
        : status === 'too_light'
          ? '行程天數偏多，可適度縮短'
          : '天數與景點搭配合理'

    sendJson(res, 200, {
      source: 'crazyrouter',
      status,
      recommendedDays,
      minDays,
      comfortableDays,
      title,
      message: parsed.message || '',
      adjustments: Array.isArray(parsed.adjustments) ? parsed.adjustments : [],
    })
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'AI review-plan failed',
    })
  }
}

async function handleSuggestSpots(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const payload = JSON.parse(await readBody(req)) as {
      destinationName?: string
      pace?: string
      companions?: string
      partySize?: number
      specialNeeds?: string[]
      days?: number
    }

    const destinationName = payload.destinationName?.trim()
    if (!destinationName) {
      sendJson(res, 400, { error: 'destinationName is required' })
      return
    }

    const content = await chatCompletion([
      {
        role: 'system',
        content: `你是專業旅遊規劃 AI，熟悉各地真實景點與動線。
請為指定目的地推薦「真實存在、可造訪」的景點清單。
只回傳 JSON：
{
  "intro": string,
  "spots": [
    {
      "name": string,
      "nameLocal": string,
      "area": string,
      "stayHours": number,
      "summary": string,
      "tags": ("must"|"photo"|"popular"|"culture"|"nature"|"food"|"shopping")[],
      "ticket": string
    }
  ]
}
硬性規則：
- 必須給 14–20 個景點
- name 必須是真實景點／街區／體驗名稱（例如「立山黑部阿爾卑斯路線」「富山市玻璃美術館」）
- 禁止空泛類別名，例如「經典地標」「老城／歷史區」「觀景／打卡點」「在地美食區」「近郊日遊」
- 禁止把目的地名稱直接串成「XX經典地標」這種模板
- tags 至少要有意義；必去用 must，打卡用 photo
- stayHours 用 1–9 的數字（全日近郊可 7–9）
- area 用實際區域／基地（如「立山」「富山市區」「高岡」「冰見」）
- intro / summary / ticket 用繁體中文，簡潔可執行
- 覆蓋：必去、自然、文化、美食、打卡、近郊；依目的地真實特色調整
- 不要 Markdown`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          destinationName,
          pace: payload.pace ?? 'balanced',
          companions: payload.companions ?? 'friends',
          partySize: Number(payload.partySize) || 2,
          specialNeeds: payload.specialNeeds ?? [],
          plannedDays: payload.days ?? null,
          ask: '請列出這個旅程真正該去的真實景點，不要給類別模板；可依人數微調親子／小團友善程度。',
        }),
      },
    ], 0.4)

    const parsed = extractJson(content) as {
      intro?: string
      spots?: {
        name?: string
        nameLocal?: string
        area?: string
        stayHours?: number
        summary?: string
        tags?: string[]
        ticket?: string
      }[]
    }

    const spots = Array.isArray(parsed.spots) ? parsed.spots : []
    if (spots.length < 8) {
      throw new Error('AI returned too few real spots.')
    }

    sendJson(res, 200, {
      source: 'crazyrouter',
      intro: parsed.intro || '',
      spots: spots.map((spot) => ({
        name: String(spot.name || '').trim(),
        nameLocal: String(spot.nameLocal || spot.name || '').trim(),
        area: String(spot.area || '市區').trim(),
        stayHours: Number(spot.stayHours) || 2,
        summary: String(spot.summary || '').trim(),
        tags: Array.isArray(spot.tags) ? spot.tags : [],
        ticket: String(spot.ticket || '視當地而定').trim(),
      })),
    })
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'AI suggest-spots failed',
    })
  }
}

async function handleSeasonGuide(req: IncomingMessage, res: ServerResponse) {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' })
    return
  }

  try {
    const payload = JSON.parse(await readBody(req)) as {
      destinationName?: string
    }
    const destinationName = payload.destinationName?.trim()
    if (!destinationName) {
      sendJson(res, 400, { error: 'destinationName is required' })
      return
    }

    const content = await chatCompletion(
      [
        {
          role: 'system',
          content: `你是專業旅遊氣候顧問。請為目的地給出「最適合」與「最不建議」的旅遊月份，並說明理由。
硬性規則：
- 幾乎沒有目的地是十二個月都同等適合；禁止寫成全年皆宜／每月都行
- bestMonths 與 worstMonths 必須是 1–12 的整數陣列，且不能相同
- 理由要具體（溫度、降雨、颱風、封路、開花、極晝等）
只回傳 JSON：
{
  "bestMonths": number[],
  "worstMonths": number[],
  "bestReason": string,
  "worstReason": string,
  "note": string
}
繁體中文，不要 Markdown。`,
        },
        {
          role: 'user',
          content: JSON.stringify({
            destinationName,
            ask: '請給最適合與最不建議月份，並說明原因。',
          }),
        },
      ],
      0.2,
    )

    const parsed = extractJson(content) as {
      bestMonths?: number[]
      worstMonths?: number[]
      bestReason?: string
      worstReason?: string
      note?: string
    }

    const bestMonths = (parsed.bestMonths || [])
      .map(Number)
      .filter((m) => m >= 1 && m <= 12)
    const worstMonths = (parsed.worstMonths || [])
      .map(Number)
      .filter((m) => m >= 1 && m <= 12)
    if (!bestMonths.length || !worstMonths.length) {
      throw new Error('AI season guide missing months')
    }

    sendJson(res, 200, {
      source: 'crazyrouter',
      bestMonths: [...new Set(bestMonths)].sort((a, b) => a - b),
      worstMonths: [...new Set(worstMonths)].sort((a, b) => a - b),
      bestReason: parsed.bestReason || '',
      worstReason: parsed.worstReason || '',
      note: parsed.note || '',
    })
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'AI season-guide failed',
    })
  }
}

function attachRoutes(middlewares: Connect.Server) {
  middlewares.use('/api/ai/recommend-days', (req, res, next) => {
    handleRecommendDays(req, res).catch(next)
  })
  middlewares.use('/api/ai/review-plan', (req, res, next) => {
    handleReviewPlan(req, res).catch(next)
  })
  middlewares.use('/api/ai/suggest-spots', (req, res, next) => {
    handleSuggestSpots(req, res).catch(next)
  })
  middlewares.use('/api/ai/season-guide', (req, res, next) => {
    handleSeasonGuide(req, res).catch(next)
  })
}

export function crazyRouterPlugin(): Plugin {
  return {
    name: 'crazyrouter-ai-proxy',
    configureServer(server) {
      attachRoutes(server.middlewares)
    },
    configurePreviewServer(server) {
      attachRoutes(server.middlewares)
    },
  }
}
