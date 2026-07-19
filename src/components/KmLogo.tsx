/** Real KM company mark with an animated kicking K-foot. */

type Props = {
  className?: string
  size?: number
  title?: string
}

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
        src="/km-logo-base.png"
        alt=""
        draggable={false}
        width={size}
        height={size}
      />
      <img
        className="km-logo-foot"
        src="/km-logo-foot.png"
        alt=""
        draggable={false}
        width={size}
        height={size}
      />
    </span>
  )
}
