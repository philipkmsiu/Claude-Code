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
          specialNeeds: payload.specialNeeds ?? [],
          localHeuristicHint: payload.heuristic ?? null,
          ask: '請審核並給出你認為正確的最少／最舒服／建議最長天數。',
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

    const content = await chatCompletion([
      {
        role: 'system',
        content: `你是專業旅遊規劃 AI。請審核「已選天數」與「已選景點」是否匹配。
只回傳 JSON：
{
  "status": "too_packed" | "too_light" | "balanced",
  "recommendedDays": number,
  "minDays": number,
  "comfortableDays": number,
  "title": string,
  "message": string,
  "adjustments": string[]
}
規則：
- 天數 2-21 整數，且 minDays <= recommendedDays <= comfortableDays
- 若景點多、區域跨度大、有多個全日行程，不要低估天數
- 新疆南北疆／長環線即使景點列表不完整，也要按真實地理給長天數
- 全文繁體中文，不要 Markdown`,
      },
      {
        role: 'user',
        content: JSON.stringify({
          destinationName,
          chosenDays,
          pace: payload.pace ?? 'balanced',
          companions: payload.companions ?? 'friends',
          specialNeeds: payload.specialNeeds ?? [],
          spots: payload.spots ?? [],
          localHeuristicHint: payload.heuristic ?? null,
          ask: '請用 AI 判斷天數是否夠用，並給出正常完成天數。',
        }),
      },
    ])

    const parsed = extractJson(content) as {
      status?: string
      recommendedDays?: number
      minDays?: number
      comfortableDays?: number
      title?: string
      message?: string
      adjustments?: string[]
    }

    sendJson(res, 200, {
      source: 'crazyrouter',
      status: parsed.status || 'balanced',
      recommendedDays: Number(parsed.recommendedDays),
      minDays: Number(parsed.minDays),
      comfortableDays: Number(parsed.comfortableDays),
      title: parsed.title || 'AI 天數審核',
      message: parsed.message || '',
      adjustments: Array.isArray(parsed.adjustments) ? parsed.adjustments : [],
    })
  } catch (error) {
    sendJson(res, 500, {
      error: error instanceof Error ? error.message : 'AI review-plan failed',
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
