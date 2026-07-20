/**
 * KM Travel Planner — product principles from ALL user feedback.
 *
 * These rules apply to EVERY destination users type (London, Tokyo, Paris,
 * custom places…). Server AI prompts and client sanitizers both follow this
 * file so destination-specific patches never become the only guardrail.
 *
 * Feedback encoded here (do not regress):
 * 1. Same AI research pipeline for every destination before planning.
 * 2. Automatic research — users must not re-prompt what to research.
 * 3. Hotels must match overnight cities (never all nights in one wrong city).
 * 4. AI thinking UI — placeholders are never shown as final answers.
 * 5. Journey-map photos: unique per day, match that day's landmarks.
 * 6. Rotating ambient background music across visits / during the session.
 * 7. Shopping／Outlet field on spots; nearby shops per landmark.
 * 8. Famous outlets = ONE dedicated spot/day — never paste the same outlet
 *    day-trip line onto every landmark card.
 * 9. nearbyFood / souvenirs / shoppingOutlet must be spot-specific (no spam).
 * 10. Motion / click SFX only on the home page; later steps = music only.
 */

/** Machine-readable principle ids (keep in sync with comments above). */
export const PRODUCT_PRINCIPLES = [
  'same_ai_research_for_every_destination',
  'automatic_research_no_user_prompting',
  'hard_gate_until_ai_research_succeeds',
  'hotels_match_overnight_cities',
  'ai_thinking_ui_placeholders_are_not_finals',
  'unique_day_photos_match_landmarks',
  'rotating_ambient_background_music',
  'shopping_line_is_nearby_not_global_outlet_spam',
  'famous_outlet_is_its_own_dedicated_spot',
  'spot_fields_food_souvenir_shopping_must_differ',
  'motion_sfx_home_only_then_music_only',
  'no_copy_paste_fields_across_spots',
  'country_trips_propose_common_multi_region_routes',
] as const

/**
 * Hard rules injected into the AI research system prompt.
 * Examples are illustrative; logic must stay universal for any place.
 */
export const AI_RESEARCH_PRINCIPLES_ZH = `
【產品原則 — 使用者輸入的任何目的地都必須遵守；禁止只對熱門城市認真、對其他地方敷衍】
1) 同一套自動調研：先完成地理結構、季節氣候、真實景點、在地飲食／手信、購物、住宿分區、天數尺度，再輸出 JSON。使用者不會再提示你查什麼。
2) 景點欄位必須「一景一義」：nearbyFood、souvenirs、shoppingOutlet 都要寫該景點附近、可執行的內容；禁止把同一句文案複製到多數景點（美食／手信／購物都一樣禁止）。
3) 購物／Outlet 規則：
   - shoppingOutlet = 該景點步行或短程可達的購物街／市集／百貨／禮品店／博物館商店。
   - 若該行程合理範圍內有著名 Outlet／名牌村／一日購，必須列為「獨立 shopping 景點」（整日或大半日），不可塞進市區觀光同一天。
   - 禁止在每個地標的 shoppingOutlet 重複寫「可安排一日往返某某 Outlet」。Outlet 文案只出現在它自己的景點卡上。
   - 不同城區要寫不同逛街地點；沒有著名 Outlet 的城市就寫當地高街／市集，不要硬套其他國家的 Outlet。
4) 多城行程：hotels 必須覆蓋各主要過夜城市（area 對應真實過夜城），不可全部擠在同一城。
5) 景點 name 必須是真實地點；禁止「經典地標」「老城／歷史區」這類空泛類別名。
6) area 用真實城市／城區，方便同城排同一天、並讓住宿對上過夜城市。
7) 全日遠足／Outlet 日 stayHours 建議 ≥ 5，且不要與大量市區地標擠在同一天。
8) 國土／多區目的地（例如英國、法國、瑞士、義大利、德國）：禁止只給首都＋近郊日遊。必須提出 2–3 條常見路線尺度（精華短線／經典串線／含偏遠區的長線），並讓 spots／hotels 覆蓋對應 overnight 城市。英國要想到英格蘭、蘇格蘭，以及可選的愛爾蘭；法國要想羅亞爾／里昂／普羅旺斯／蔚藍海岸；瑞士要想琉森、少女峰區、策馬特等山湖基地。走完重要場景常需 14–24 天，不要把國土行程估成 7–10 天城市遊。
9) 全文繁體中文；不要 Markdown。
`.trim()

/** User-message ask string — same principles, shorter. */
export const AI_RESEARCH_ASK_ZH =
  '請先自行完整調研並分析這個目的地（無需使用者再提示），再輸出：季節氣候、歷史背景、難忘之處、真實景點（每點各自不同的附近美食、手信、附近購物）、分城市住宿、必吃必喝必買、建議天數與實用 tips。禁止空泛類別句。禁止把同一句美食／手信／Outlet 文案複製到每個地標。著名 Outlet／名牌村若適合此行程，必須是獨立一日購景點；其他景點只寫附近逛街。多城行程的 hotels 必須覆蓋各過夜城市。若目的地是國家／多區（英國、法國、瑞士等），請提出常見路線（含 overnight 城市），不要只圍着首都打轉；天數要符合多城串線真實尺度。'

/** Famous outlet day-trips to inject once when the destination region matches. */
export const FAMOUS_OUTLET_SPOTS: {
  /** Destination name must match this. */
  match: RegExp
  /** If set and matches, skip injection unless `force` also matches. */
  exclude?: RegExp
  /** Overrides exclude when destination clearly includes this hub. */
  force?: RegExp
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
    // London / SE England day-trip radius — not Scotland-only trips.
    match:
      /英國|UK|United Kingdom|Britain|倫敦|London|英格蘭|牛津|劍橋|約克|巴斯|卡地夫|利物浦|溫莎|巨石|Stonehenge|Bicester|比斯特/i,
    exclude: /愛丁堡|Edinburgh|蘇格蘭|Scotland|格拉斯哥|Glasgow|北愛爾蘭|巨人堤/i,
    force: /倫敦|London|溫莎|Windsor|Bicester|比斯特|牛津|劍橋|巨石|Stonehenge|巴斯|Bath/i,
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
    match: /德國|Germany|Deutschland|慕尼黑|Munich|巴伐利亞|斯圖加特|Metzingen|Berlin|柏林|法蘭克/i,
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
    // Kansai only — do not inject into Tokyo-only trips.
    match: /大阪|京都|奈良|神戶|神戸|關西|Kansai|臨空|Rinku/i,
    force: /大阪|京都|奈良|神戶|神戸|關西|Kansai|臨空/i,
    name: '臨空 Premium Outlets',
    nameLocal: 'Rinku Premium Outlets',
    area: '大阪臨空（Outlet 一日購）',
    stayHours: 5,
    summary:
      '臨空 Premium Outlets 適合大阪／關西行程的獨立 Outlet 半日或一日。僅在此景點詳述 Outlet，不要複製到清水寺、道頓堀等地標購物欄。',
    nearbyFood: '園區餐飲或關西機場周邊；回市區再安排正餐。',
    souvenirs: 'Outlet 服飾配件；日本伴手禮可另在市區藥妝補。',
    shoppingOutlet: '臨空 Premium Outlets 本體為當日購物主力。',
  },
]

/** Whether a famous outlet should be injected for this destination name. */
export function shouldInjectFamousOutlet(
  place: string,
  famous: (typeof FAMOUS_OUTLET_SPOTS)[number],
): boolean {
  const text = place.trim()
  if (!famous.match.test(text)) return false
  if (famous.force && famous.force.test(text)) return true
  if (famous.exclude && famous.exclude.test(text)) return false
  return true
}

/** Detect copy-pasted “day trip to X outlet” spam on landmark cards. */
export const OUTLET_DAYTRIP_SPAM_RE =
  /可安排一日往返|一日往返.{0,24}(Outlet|名牌村|Premium Outlets|Village|奧特萊斯)|必去.{0,16}(Outlet|名牌村|奧特萊斯)|Outlet 首選|亦可去臨空|想 Outlet 可另排|或附近 Designer Outlet|一日購，或/i

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
  const name = spotName.trim()
  if (/Outlet|名牌村|Bicester|比斯特|Metzingen|臨空|Premium Outlets|奧特萊斯/i.test(name)) {
    return false
  }
  return true
}

/** Count how often each line repeats (exact match). */
export function fieldDuplicateCounts(lines: string[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const line of lines) {
    const key = line.trim()
    if (!key) continue
    counts.set(key, (counts.get(key) || 0) + 1)
  }
  return counts
}

/** @deprecated Use fieldDuplicateCounts */
export const shoppingDuplicateCounts = fieldDuplicateCounts

/** True when the same line was pasted onto many spots. */
export function isDuplicateFieldSpam(
  line: string,
  counts: Map<string, number>,
  threshold = 2,
): boolean {
  const n = counts.get(line.trim()) || 0
  return n >= threshold
}

/** @deprecated Use isDuplicateFieldSpam */
export const isDuplicateShoppingSpam = isDuplicateFieldSpam
