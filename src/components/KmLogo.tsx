/** Real KM company mark: color-shifting body + kicking, color-cycling foot. */

type Props = {
  className?: string
  size?: number
  title?: string
}

/** Bump when mask PNGs change so browsers skip stale cache. */
const ASSET_V = 'v4'

export function KmLogo({ className = '', size = 48, title = 'KM' }: Props) {
  return (
    <span
      className={`km-logo-live ${className}`.trim()}
      style={{ width: size, height: size }}
      role="img"
      aria-label={title}
    >
      {/* White alpha masks + animated background-color (filters on grey PNGs are invisible) */}
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
    </span>
  )
}
