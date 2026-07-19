import type { Destination } from '../data/types'

type Props = {
  destination: Destination
  /** Compact teaser for destination cards. */
  compact?: boolean
}

export function DestinationLore({ destination, compact = false }: Props) {
  const memorable = destination.memorable ?? []
  const preview = memorable.slice(0, compact ? 2 : memorable.length)

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
      <p className="dest-lore-intro">
        <strong>行程小記：</strong>
        {destination.intro}
      </p>
    </div>
  )
}
