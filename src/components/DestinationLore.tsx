import type { Destination, ScenicSpot } from '../data/types'

type Props = {
  destination: Destination
  /** Compact teaser for destination cards. */
  compact?: boolean
  /** Spots to feature with fuller scene descriptions. */
  highlightSpots?: ScenicSpot[]
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
  // Prefer spots that already have a real paragraph, not one-liners.
  const rich = ranked.filter((s) => (s.summary?.trim().length ?? 0) >= 28)
  const list = (rich.length ? rich : ranked).slice(0, compactLimit(highlightSpots))
  return list
}

function compactLimit(highlightSpots?: ScenicSpot[]) {
  if (highlightSpots && highlightSpots.length > 8) return 10
  return 8
}

export function DestinationLore({
  destination,
  compact = false,
  highlightSpots,
}: Props) {
  const memorable = destination.memorable ?? []
  const preview = memorable.slice(0, compact ? 2 : memorable.length)
  const scenes = compact ? [] : pickSceneSpots(destination, highlightSpots)

  if (compact) {
    return (
      <div className="dest-lore compact">
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
    <div className="dest-lore">
      <h4>{destination.nameZh}</h4>
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
                  <small className="dest-scene-extra">🍽 {spot.nearbyFood}</small>
                ) : null}
                {spot.souvenirs ? (
                  <small className="dest-scene-extra">🎁 手信：{spot.souvenirs}</small>
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
    </div>
  )
}
