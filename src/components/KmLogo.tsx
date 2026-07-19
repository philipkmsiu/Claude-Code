/** Real KM company mark: color-shifting body + kicking foot + football spectacle. */

import type { CSSProperties } from 'react'

type Props = {
  className?: string
  size?: number
  title?: string
  /** Football flies in, gets kicked in a parabola with mid-air boom (hero). */
  spectacle?: boolean
}

/** Bump when mask PNGs change so browsers skip stale cache. */
const ASSET_V = 'v4'

const SPARKS = [
  { x: 1.1, y: -1.2 },
  { x: 1.55, y: -0.4 },
  { x: 1.4, y: 0.7 },
  { x: 0.65, y: -1.55 },
  { x: 0.1, y: -1.7 },
  { x: 1.7, y: 0.2 },
  { x: 0.9, y: 1.25 },
  { x: -0.35, y: -1.4 },
  { x: 1.25, y: -0.85 },
  { x: 0.4, y: 1.45 },
  { x: -0.5, y: 0.9 },
  { x: 1.85, y: -0.15 },
] as const

function BoomBurst({ className = '', lift = false }: { className?: string; lift?: boolean }) {
  const bits = (
    <>
      <span className="km-boom-glow" />
      <span className="km-boom-flash">💥</span>
      <span className="km-boom-flash km-boom-flash-b">✨</span>
      {SPARKS.map((spark, i) => (
        <span
          key={i}
          className={`km-spark${i % 3 === 0 ? ' km-spark-star' : ''}`}
          style={{ '--sx': spark.x, '--sy': spark.y } as CSSProperties}
        />
      ))}
      <span className="km-boom-ring" />
      <span className="km-boom-ring km-boom-ring-b" />
      <span className="km-boom-ring km-boom-ring-c" />
    </>
  )

  return (
    <span className={`km-boom ${className}`.trim()} aria-hidden>
      {lift ? <span className="km-boom-apex-lift">{bits}</span> : bits}
    </span>
  )
}

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
          {/* Nested X + Y = true parabolic flight after the kick */}
          <span className="km-football-run">
            <span className="km-football-arc">
              <span className="km-football">⚽</span>
            </span>
          </span>
          {/* Small kick spark at the foot */}
          <BoomBurst className="km-boom-kick" />
          {/* Bigger boom near the apex of the parabola */}
          <BoomBurst className="km-boom-apex" lift />
          <span className="km-trail" />
          <span className="km-trail km-trail-b" />
        </span>
      ) : null}
    </span>
  )
}
