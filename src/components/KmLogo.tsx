/** Real KM company mark: color-shifting body + kicking, color-cycling foot. */

type Props = {
  className?: string
  size?: number
  title?: string
}

const ASSET_V = 'v3'

export function KmLogo({ className = '', size = 48, title = 'KM' }: Props) {
  return (
    <span
      className={`km-logo-live ${className}`.trim()}
      style={{ width: size, height: size }}
      role="img"
      aria-label={title}
    >
      <img
        className="km-logo-base"
        src={`/km-logo-base.png?${ASSET_V}`}
        alt=""
        draggable={false}
        width={size}
        height={size}
      />
      <span className="km-logo-foot-wrap" aria-hidden>
        <img
          className="km-logo-foot"
          src={`/km-logo-foot.png?${ASSET_V}`}
          alt=""
          draggable={false}
          width={size}
          height={size}
        />
      </span>
    </span>
  )
}
