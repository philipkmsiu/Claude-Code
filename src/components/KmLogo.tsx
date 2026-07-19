/** Real KM company mark: color-shifting body + kicking foot + football spectacle. */

import { useEffect, type CSSProperties } from 'react'
import { soundscape } from '../lib/soundscape'

type Props = {
  className?: string
  size?: number
  title?: string
  /** Football flies in, gets kicked in a parabola with mid-air boom (hero). */
  spectacle?: boolean
}

/** Bump when mask / ball assets change so browsers skip stale cache. */
const ASSET_V = 'v5'
const BALL_V = 'v2'

/** Must match `--km-kick-dur` / foot-kick animation in App.css (2.8s). */
const KICK_CYCLE_MS = 2800
/** Strike at ~32% of the kick timeline. */
const KICK_AT_MS = Math.round(KICK_CYCLE_MS * 0.32)
/** Apex boom at ~48% of the spectacle timeline. */
const BOOM_AT_MS = Math.round(KICK_CYCLE_MS * 0.48)

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
  // Sync thump / boom SFX to the hero ball-kick loop only (avoid stacked brand/footer logos).
  useEffect(() => {
    if (!spectacle || typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let cancelled = false
    const timers: number[] = []

    const runCycle = () => {
      if (cancelled || soundscape.isMuted) return
      timers.push(
        window.setTimeout(() => {
          if (!cancelled && !soundscape.isMuted) soundscape.play('kick')
        }, KICK_AT_MS),
      )
      timers.push(
        window.setTimeout(() => {
          if (!cancelled && !soundscape.isMuted) soundscape.play('boom')
        }, BOOM_AT_MS),
      )
    }

    // Align roughly with CSS animation start on mount.
    runCycle()
    const loop = window.setInterval(runCycle, KICK_CYCLE_MS)
    return () => {
      cancelled = true
      window.clearInterval(loop)
      for (const id of timers) window.clearTimeout(id)
    }
  }, [spectacle])

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
              <span className="km-football">
                <img
                  className="km-football-img"
                  src={`/km-football.png?${BALL_V}`}
                  alt=""
                  draggable={false}
                  width={128}
                  height={128}
                />
              </span>
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
