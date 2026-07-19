/** Real KM company mark: color-shifting body + kicking foot + football spectacle. */

import type { CSSProperties } from 'react'

type Props = {
  className?: string
  size?: number
  title?: string
  /** Football flies in, gets kicked off-screen with impact explosions (hero). */
  spectacle?: boolean
}

/** Bump when mask PNGs change so browsers skip stale cache. */
const ASSET_V = 'v4'

const SPARKS = [
  { x: 1, y: -1.1, delay: '0ms' },
  { x: 1.35, y: -0.35, delay: '20ms' },
  { x: 1.2, y: 0.55, delay: '35ms' },
  { x: 0.55, y: -1.35, delay: '15ms' },
  { x: 0.15, y: -1.5, delay: '40ms' },
  { x: 1.45, y: 0.15, delay: '55ms' },
  { x: 0.75, y: 1.05, delay: '25ms' },
  { x: -0.2, y: -1.25, delay: '45ms' },
] as const

export function KmLogo({
  className = '',
  size = 48,
  title = 'KM',
  spectacle = false,
}: Props) {
  return (
    <span
      className={`km-logo-live ${spectacle ? 'km-logo-spectacle' : ''} ${className}`.trim()}
      style={{ width: size, height: size }}
      role="img"
      aria-label={title}
    >
      {/* White alpha masks + animated background-color */}
      <span
        className="km-logo-base"
        style={{
          WebkitMaskImage: `url(/km-logo-base.png?${ASSET_V})`,
          maskImage: `url(/km-logo-base.png?${ASSET_V})`,
        }}
      />
      <span className="km-logo-foot-wrap" aria-hidden>
        <span
          className="km-logo-foot"
          style={{
            WebkitMaskImage: `url(/km-logo-foot.png?${ASSET_V})`,
            maskImage: `url(/km-logo-foot.png?${ASSET_V})`,
          }}
        />
      </span>

      {spectacle ? (
        <span className="km-kick-fx" aria-hidden>
          <span className="km-football">⚽</span>
          <span className="km-boom">
            <span className="km-boom-flash">💥</span>
            {SPARKS.map((spark, i) => (
              <span
                key={i}
                className="km-spark"
                style={
                  {
                    '--sx': spark.x,
                    '--sy': spark.y,
                    animationDelay: spark.delay,
                  } as CSSProperties
                }
              />
            ))}
            <span className="km-boom-ring" />
            <span className="km-boom-ring km-boom-ring-b" />
          </span>
          <span className="km-trail" />
        </span>
      ) : null}
    </span>
  )
}
