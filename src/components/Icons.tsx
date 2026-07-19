/** Lightweight inline icons for KM Travel Planner UI. */

import type { ReactNode } from 'react'

type IconProps = {
  size?: number
  className?: string
  title?: string
}

function Svg({
  size = 20,
  className,
  title,
  children,
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  )
}

const stroke = {
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function IconMapPin(props: IconProps) {
  return (
    <Svg {...props}>
      <path {...stroke} d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11z" />
      <circle {...stroke} cx="12" cy="10" r="2.2" />
    </Svg>
  )
}

export function IconCalendar(props: IconProps) {
  return (
    <Svg {...props}>
      <rect {...stroke} x="3.5" y="5" width="17" height="15.5" rx="2" />
      <path {...stroke} d="M8 3.5v3.5M16 3.5v3.5M3.5 10h17" />
    </Svg>
  )
}

export function IconPlane(props: IconProps) {
  return (
    <Svg {...props}>
      <path
        {...stroke}
        d="M3.5 12.5 10 11l3.5-6.5L15 6l-1.5 5.5 5.5 1.2 1.5-1.7L22 12l-1.5 1.2-1.5-1.7-5.5 1.2L15 18l-1.5 1.5L10 13l-6.5-1.5z"
      />
    </Svg>
  )
}

export function IconCamera(props: IconProps) {
  return (
    <Svg {...props}>
      <path {...stroke} d="M4 8.5h3l1.5-2h7l1.5 2h3v10H4z" />
      <circle {...stroke} cx="12" cy="13" r="3.2" />
    </Svg>
  )
}

export function IconSpark(props: IconProps) {
  return (
    <Svg {...props}>
      <path {...stroke} d="M12 3.5 13.8 9l5.7 1.8L13.8 12.5 12 18l-1.8-5.5L4.5 10.8 10.2 9z" />
    </Svg>
  )
}

export function IconRoute(props: IconProps) {
  return (
    <Svg {...props}>
      <circle {...stroke} cx="6" cy="6" r="2.2" />
      <circle {...stroke} cx="18" cy="18" r="2.2" />
      <path {...stroke} d="M8 7.2c4 0 4 9.6 8 9.6" />
    </Svg>
  )
}

export function IconHotel(props: IconProps) {
  return (
    <Svg {...props}>
      <path {...stroke} d="M4 19V7.5A2.5 2.5 0 0 1 6.5 5H14v14" />
      <path {...stroke} d="M14 10h3.5A2.5 2.5 0 0 1 20 12.5V19" />
      <path {...stroke} d="M3 19h18M8 9h2M8 12.5h2" />
    </Svg>
  )
}

export function IconWallet(props: IconProps) {
  return (
    <Svg {...props}>
      <path {...stroke} d="M4 7.5h14.5A1.5 1.5 0 0 1 20 9v9.5a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 18.5z" />
      <path {...stroke} d="M4 7.5V6.2A1.7 1.7 0 0 1 5.7 4.5H16" />
      <circle {...stroke} cx="15.5" cy="13.5" r="1.2" />
    </Svg>
  )
}

export function IconUsers(props: IconProps) {
  return (
    <Svg {...props}>
      <circle {...stroke} cx="9" cy="8" r="2.5" />
      <path {...stroke} d="M3.5 18.5c.6-3 2.6-4.5 5.5-4.5s4.9 1.5 5.5 4.5" />
      <circle {...stroke} cx="17" cy="9" r="2" />
      <path {...stroke} d="M14.5 18.5c.4-1.8 1.6-3 3.5-3.3" />
    </Svg>
  )
}

export function IconRefresh(props: IconProps) {
  return (
    <Svg {...props}>
      <path {...stroke} d="M20 6.5v5h-5" />
      <path {...stroke} d="M4 17.5v-5h5" />
      <path {...stroke} d="M6.2 9A7 7 0 0 1 18.5 8.2L20 11.5M17.8 15A7 7 0 0 1 5.5 15.8L4 12.5" />
    </Svg>
  )
}

export function IconCompass(props: IconProps) {
  return (
    <Svg {...props}>
      <circle {...stroke} cx="12" cy="12" r="8.5" />
      <path {...stroke} d="m14.8 9.2-1.4 4.6-4.6 1.4 1.4-4.6z" />
    </Svg>
  )
}

export function IconPoster(props: IconProps) {
  return (
    <Svg {...props}>
      <rect {...stroke} x="5" y="3.5" width="14" height="17" rx="2" />
      <path {...stroke} d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5" />
    </Svg>
  )
}

export function IconCheck(props: IconProps) {
  return (
    <Svg {...props}>
      <path {...stroke} d="m5 12.5 4.2 4.2L19 7" />
    </Svg>
  )
}

export function IconArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path {...stroke} d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  )
}
