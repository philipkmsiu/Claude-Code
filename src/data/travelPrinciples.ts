/**
 * KM Travel Planner — product principles learned from product feedback.
 *
 * These rules apply to EVERY destination (London, Tokyo, custom places…).
 * Server AI prompts and client sanitizers must both follow this file so
 * destination-specific patches never become the only guardrail.
 *
 * Feedback history encoded here:
 * - Research every destination with the same AI pipeline (no hardcoded-only plans).
 * - Hotels must match overnight cities (never park every night in one city).
 * - Journey-map photos must be unique per day and match the landmark.
 * - Motion / click SFX only on the home page; later steps = background music only.
 * - Shopping／Outlet on a landmark = nearby shops for THAT stop, not a copy-pasted
 *   famous outlet day trip on every card.
 * - Famous outlets (e.g. Bicester Village) are ONE dedicated shopping spot / day.
 */

/** Short labels shown in code comments / debugging. */
export const PRODUCT_PRINCIPLES = [
  'same_ai_research_for_every_destination',
  'hotels_match_overnight_cities',
  'unique_day_photos_match_landmarks',
  'motion_sfx_home_only_then_music_only',
  'shopping_line_is_nearby_not_global_outlet_spam',
  'famous_outlet_is_its_own_dedicated_spot',
  'no_copy_paste_fields_across_spots',
] as const

/**
 * Hard rules injected into the AI research system prompt.
 * Keep destination examples illustrative; logic must stay universal.
 */
export const AI_RESEARCH_PRINCIPLES_ZH = `
【產品原則 — 任何目的地都必須遵守；禁止只對熱門城市認真、對其他地方敷衍】
1) 同一套調研流程：先完成地理結構、季節氣候、真實景點、在地飲食／手信、購物、住宿分區、天數尺度，再輸出 JSON。使用者不會再提示你查什麼。
2) 景點欄位必須「一景一義」：nearbyFood／souvenirs／shoppingOutlet 都要寫該景點附近、可執行的內容；禁止把同一句文案複製到多數景點。
3) 購物／Outlet 規則（最重要）：
   - shoppingOutlet = 該景點步行或短程可達的購物街／市集／百貨／禮品店／博物館商店。
   - 若目的地有著名 Outlet／名牌村／一日購（例如倫敦 Bicester Village、德國 Metzingen／Ingolstadt Village、日本臨空 Premium Outlets），必須列為「獨立 shopping 景點」，建議整日或大半日，不可塞進市區觀光同一天。
   - 禁止在每個地標的 shoppingOutlet 重複寫「可安排一日往返某某 Outlet」。那個 Outlet 只出現在它自己的景點卡上。
   - 不同城區要寫不同逛街地點（例：南岸≠塔橋區≠博物館區）。
4) 多城行程：hotels 必須覆蓋各主要過夜城市，不可全部擠在同一城。
5) 景點 name 必須是真實地點；禁止「經典地標」「老城／歷史區」這類空泛類別名。
6) area 用真實城市／城區，方便同城排同一天。
7) 全文繁體中文；不要 Markdown。
`.trim()

/** User-message ask string — same principles, shorter. */
export const AI_RESEARCH_ASK_ZH =
  '請先自行完整調研並分析這個目的地（無需使用者再提示），再輸出：季節氣候、歷史背景、難忘之處、真實景點（每點各自的附近美食、手信、附近購物）、分城市住宿、必吃必喝必買、建議天數與實用 tips。禁止空泛類別句。購物原則：每個景點的 shoppingOutlet 只寫該點附近逛街；著名 Outlet／名牌村必須是獨立一日購景點，禁止把同一句 Outlet 文案複製到每個地標。'

/** Famous outlet day-trips to inject once when the destination region matches. */
export const FAMOUS_OUTLET_SPOTS: {
  match: RegExp
  name: string
  nameLocal: string
  area: string
  stayHours: number
  summary: string
  nearbyFood: string
  souvenirs: string
  shoppingOutlet: string
}[] = [
  {
    match:
      /英國|UK|United Kingdom|Britain|倫敦|London|英格蘭|牛津|劍橋|約克|巴斯|卡地夫|愛丁堡|利物浦/i,
    name: 'Bicester Village',
    nameLocal: 'Bicester Village',
    area: '牛津郡・比斯特（倫敦一日購）',
    stayHours: 6,
    summary:
      'Bicester Village 是倫敦旅客最著名的名牌 Outlet 一日購：從倫敦瑪麗勒本車站搭火車約一小時可達。請整日專程前往，不要與倫敦市區地標排在同一天，也不要在每個景點卡重複提及。',
    nearbyFood: '園區內咖啡與輕食；回倫敦後可安排一頓 Pub 晚餐。',
    souvenirs: 'Outlet 季末戰利品、英國茶葉禮盒、品牌配件。',
    shoppingOutlet:
      'Bicester Village 名牌 Outlet 本體：建議依清單鎖定品牌店；交通另計。',
  },
  {
    match: /德國|Germany|Deutschland|慕尼黑|Munich|巴伐利亞|Berlin|柏林/i,
    name: 'Outletcity Metzingen',
    nameLocal: 'Outletcity Metzingen',
    area: 'Metzingen（德國名牌 Outlet 一日購）',
    stayHours: 6,
    summary:
      'Outletcity Metzingen 是德國最知名的名牌 Outlet 一日購之一。應列為獨立購物日，不要在每個市區地標的購物欄重複貼上同一句。',
    nearbyFood: 'Outlet 園區餐飲；回城後可安排一頓德式餐。',
    souvenirs: 'Outlet 戰利品、德式巧克力或小物。',
    shoppingOutlet: 'Outletcity Metzingen 本體為當日購物主力。',
  },
  {
    match: /日本|Japan|大阪|京都|東京|Nagoya|名古屋/i,
    name: '臨空 Premium Outlets',
    nameLocal: 'Rinku Premium Outlets',
    area: '大阪臨空（Outlet 一日購）',
    stayHours: 5,
    summary:
      '臨空 Premium Outlets 適合大阪／關西行程的獨立 Outlet 半日或一日。僅在此景點詳述 Outlet，不要複製到清水寺、道頓堀等地標購物欄。',
    nearbyFood: '園區餐飲或關西機場周邊；回市區再安排正餐。',
    souvenirs: 'Outlet 服飾配件、日本伴手禮可另在市區藥妝補。',
    shoppingOutlet: '臨空 Premium Outlets 本體為當日購物主力。',
  },
]

/** Detect copy-pasted “day trip to X outlet” spam on landmark cards. */
export const OUTLET_DAYTRIP_SPAM_RE =
  /可安排一日往返|一日往返.{0,20}(Outlet|名牌村|Premium Outlets|Village)|必去.{0,12}(Outlet|名牌村)|Outlet 首選|整日專程前往.{0,20}Outlet/i

/**
 * Normalize free-form shopping text: if it looks like a global outlet day-trip
 * pasted onto a non-outlet landmark, treat it as invalid.
 */
export function isOutletDaytripSpam(
  shoppingOutlet: string,
  spotName: string,
): boolean {
  const outlet = shoppingOutlet.trim()
  if (!outlet) return true
  if (!OUTLET_DAYTRIP_SPAM_RE.test(outlet)) return false
  // Allowed on the outlet spot itself.
  const name = spotName.trim()
  if (/Outlet|名牌村|Bicester|比斯特|Metzingen|臨空|Premium Outlets|Village/i.test(name)) {
    return false
  }
  return true
}

/** Count how often each shopping line repeats (exact match). */
export function shoppingDuplicateCounts(
  lines: string[],
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const line of lines) {
    const key = line.trim()
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
}

/** True when the same shopping line was pasted onto many spots. */
export function isDuplicateShoppingSpam(
  line: string,
  counts: Map<string, number>,
  threshold = 2,
): boolean {
  const n = counts.get(line.trim()) || 0
  return n >= threshold
}
