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

/** Classic black/white soccer ball (truncated icosahedron look). */
function RealFootball() {
  return (
    <svg
      className="km-football-svg"
      viewBox="0 0 100 100"
      width="100%"
      height="100%"
      aria-hidden
    >
      <defs>
        <radialGradient id="km-ball-shade" cx="32%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="55%" stopColor="#f2f2f2" />
          <stop offset="100%" stopColor="#c8c8c8" />
        </radialGradient>
        <radialGradient id="km-ball-gloss" cx="30%" cy="24%" r="40%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>

      {/* Sphere body */}
      <circle cx="50" cy="50" r="48" fill="url(#km-ball-shade)" />

      {/* Black pentagon panels */}
      <path
        d="M50 18 L61 26 L57 39 L43 39 L39 26 Z"
        fill="#1a1a1a"
      />
      <path
        d="M22 42 L33 34 L42 44 L36 56 L24 54 Z"
        fill="#1a1a1a"
      />
      <path
        d="M78 42 L76 54 L64 56 L58 44 L67 34 Z"
        fill="#1a1a1a"
      />
      <path
        d="M34 72 L43 62 L57 62 L66 72 L58 84 L42 84 Z"
        fill="#1a1a1a"
      />

      {/* Seam lines (hex edges around panels) */}
      <g
        fill="none"
        stroke="#111"
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity="0.9"
      >
        <path d="M50 18 L61 26 L72 22" />
        <path d="M50 18 L39 26 L28 22" />
        <path d="M61 26 L67 34 L78 42" />
        <path d="M39 26 L33 34 L22 42" />
        <path d="M57 39 L58 44 L64 56" />
        <path d="M43 39 L42 44 L36 56" />
        <path d="M64 56 L66 72" />
        <path d="M36 56 L34 72" />
        <path d="M43 62 L34 72 L42 84" />
        <path d="M57 62 L66 72 L58 84" />
        <path d="M42 84 L50 90 L58 84" />
        <path d="M22 42 L18 54 L24 54" />
        <path d="M78 42 L82 54 L76 54" />
        <path d="M28 22 L22 42" />
        <path d="M72 22 L78 42" />
      </g>

      {/* Soft highlight */}
      <ellipse cx="34" cy="30" rx="14" ry="10" fill="url(#km-ball-gloss)" />
      {/* Rim for depth */}
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.5"
      />
    </svg>
  )
}

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
              <span className="km-football">
                <RealFootball />
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
