/** Animated KM mark — the grey K foot kicks. */

type Props = {
  className?: string
  size?: number
  title?: string
}

export function KmLogo({ className = '', size = 48, title = 'KM' }: Props) {
  return (
    <svg
      className={`km-logo-svg ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 200 160"
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      {/* Grey accent cap */}
      <rect className="km-cap" x="48" y="18" width="26" height="16" rx="5" fill="#6E6E6E" />

      {/* Red K body (stem + upper arm into M join) */}
      <path
        fill="#C8102E"
        d="M42 142 V36 c0-5 3-8 8-8 h16 c4 0 7 3 7 8 v38
           l26-38 c3-5 8-8 14-8 h10 c6 0 10 7 6 12
           L95 88 l8 10
           L88 112 V142 c0 5-3 8-8 8 H50 c-5 0-8-3-8-8 z"
      />

      {/* Grey K foot — kicks from the hip */}
      <g className="km-foot-pivot">
        <path
          className="km-foot"
          fill="#6E6E6E"
          d="M72 62
             c8 0 14 4 20 12
             l18 28
             c3 5 1 11-4 13
             l-10 4
             c-5 2-11 0-14-5
             L68 78
             c-3-5-1-12 4-14
             c0 0 0-2 0-2 z"
        />
      </g>

      {/* Red M */}
      <path
        fill="#C8102E"
        d="M108 142 V52 c0-7 4-12 11-12 h14 c6 0 10 4 12 10
           l14 40 14-40 c2-6 6-10 12-10 h14 c7 0 11 5 11 12
           v90 c0 5-3 8-8 8 h-18 c-5 0-8-3-8-8 V78
           l-11 30 c-2 5-7 8-12 8 h-4 c-5 0-10-3-12-8
           L131 78 v64 c0 5-3 8-8 8 h-18 c-5 0-8-3-8-8 z"
      />
    </svg>
  )
}
