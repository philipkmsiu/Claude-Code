import type { Destination, ScenicSpot } from '../data/types'
import { ensureRichSpotCopy } from '../data/travel'

export type AiLoreStatus = 'thinking' | 'placeholder' | 'ready' | 'error'

type Props = {
  destination: Destination
  /** Compact teaser for destination cards. */
  compact?: boolean
  /** Spots to feature with fuller scene descriptions. */
  highlightSpots?: ScenicSpot[]
  /** Whether AI research is in progress / done — avoids mistaking templates for final copy. */
  aiStatus?: AiLoreStatus
  aiError?: string
}

function pickSceneSpots(
  destination: Destination,
  highlightSpots?: ScenicSpot[],
): ScenicSpot[] {
  const pool =
    highlightSpots && highlightSpots.length
      ? highlightSpots
      : destination.spots
  const ranked = [...pool].sort((a, b) => {
    const score = (s: ScenicSpot) =>
      (s.tags.includes('must') ? 4 : 0) +
      (s.tags.includes('photo') ? 2 : 0) +
      (s.tags.includes('culture') ? 1 : 0) +
      Math.min(s.summary.length / 40, 3)
    return score(b) - score(a)
  })
  const enriched = ranked.map((s) =>
    ensureRichSpotCopy(s, destination.nameZh),
  )
  // Prefer spots that already have a real paragraph, not one-liners.
  const rich = enriched.filter((s) => (s.summary?.trim().length ?? 0) >= 40)
  const list = (rich.length ? rich : enriched).slice(
    0,
    compactLimit(highlightSpots),
  )
  return list
}

function compactLimit(highlightSpots?: ScenicSpot[]) {
  if (highlightSpots && highlightSpots.length > 8) return 10
  return 8
}

function AiStatusBanner({
  status,
  destinationName,
  error,
}: {
  status: AiLoreStatus
  destinationName: string
  error?: string
}) {
  if (status === 'thinking') {
    return (
      <div className="ai-thinking-banner" role="status" aria-live="polite">
        <span className="ai-thinking-spinner" aria-hidden />
        <div>
          <strong>AI 正在調研 {destinationName}…</strong>
          <p>
            正在分析歷史背景、真實景點、美食與手信。下方骨架是載入中，不是最終內容。
          </p>
        </div>
      </div>
    )
  }
  if (status === 'placeholder') {
    return (
      <div className="ai-placeholder-banner" role="status">
        <strong>暫定範本（尚未完成 AI 調研）</strong>
        <p>
          你現在看到的「經典地標／老城區」等是占位文字，不是最終景點。進入下一步後 AI
          會自動換成真實地點。
        </p>
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="ai-error-banner" role="alert">
        <strong>AI 調研未完成</strong>
        <p>{error || '請按「重新自動調研」再試；目前內容仍可能是暫定範本。'}</p>
      </div>
    )
  }
  return (
    <div className="ai-ready-banner" role="status">
      <strong>AI 已完成調研</strong>
      <p>以下背景與景點已由 AI 整理，可當作規劃依據。</p>
    </div>
  )
}

function SceneSkeleton() {
  return (
    <ul className="dest-scene-list dest-scene-skeleton" aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="skeleton-card">
          <span className="skeleton-line w-40" />
          <span className="skeleton-line" />
          <span className="skeleton-line w-80" />
          <span className="skeleton-line w-55" />
        </li>
      ))}
    </ul>
  )
}

export function DestinationLore({
  destination,
  compact = false,
  highlightSpots,
  aiStatus = 'ready',
  aiError,
}: Props) {
  const memorable = destination.memorable ?? []
  const preview = memorable.slice(0, compact ? 2 : memorable.length)
  const scenes = compact ? [] : pickSceneSpots(destination, highlightSpots)
  const showSkeleton = !compact && aiStatus === 'thinking'
  const isDraft = aiStatus === 'placeholder' || aiStatus === 'thinking'

  if (compact) {
    return (
      <div className={`dest-lore compact ai-${aiStatus}`}>
        {aiStatus === 'thinking' ? (
          <p className="ai-compact-status thinking">
            <span className="ai-thinking-spinner sm" aria-hidden />
            AI 調研中…
          </p>
        ) : aiStatus === 'placeholder' ? (
          <p className="ai-compact-status placeholder">暫定範本</p>
        ) : null}
        <p className="dest-background">{destination.background}</p>
        {preview.length > 0 ? (
          <ul className="dest-memorable-chips">
            {preview.map((item) => (
              <li key={item} title={item}>
                {item.replace(/。.*$/, '。')}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  }

  return (
    <div className={`dest-lore ai-${aiStatus}${isDraft ? ' is-draft' : ''}`}>
      <AiStatusBanner
        status={aiStatus}
        destinationName={destination.nameZh}
        error={aiError}
      />
      <h4>{destination.nameZh}</h4>
      {showSkeleton ? (
        <>
          <p className="dest-lore-label">
            <strong>歷史與背景</strong>
          </p>
          <div className="skeleton-block">
            <span className="skeleton-line" />
            <span className="skeleton-line w-90" />
            <span className="skeleton-line w-70" />
          </div>
          <p className="dest-lore-label">
            <strong>景點場景・歷史與氛圍</strong>
          </p>
          <SceneSkeleton />
        </>
      ) : (
        <>
          <p>
            <strong>歷史與背景：</strong>
            {destination.background}
          </p>
          {memorable.length > 0 ? (
            <>
              <p className="dest-lore-label">
                <strong>難忘／有趣之處</strong>
              </p>
              <ul className="dest-memorable-list">
                {memorable.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
          {scenes.length > 0 ? (
            <>
              <p className="dest-lore-label">
                <strong>景點場景・歷史與氛圍</strong>
                {aiStatus === 'placeholder' ? (
                  <em className="draft-tag">（暫定範本）</em>
                ) : null}
              </p>
              <ul className="dest-scene-list">
                {scenes.map((spot) => (
                  <li key={spot.id}>
                    <strong>
                      {spot.name}
                      {spot.area ? <em>（{spot.area}）</em> : null}
                    </strong>
                    <p>{spot.summary}</p>
                    {spot.nearbyFood ? (
                      <small className="dest-scene-extra">
                        🍽 {spot.nearbyFood}
                      </small>
                    ) : null}
                    {spot.souvenirs ? (
                      <small className="dest-scene-extra">
                        🎁 手信：{spot.souvenirs}
                      </small>
                    ) : null}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="dest-lore-intro">
            <strong>行程小記：</strong>
            {destination.intro}
          </p>
        </>
      )}
    </div>
  )
}
