/** Playful emoji stickers, chips, and motion widgets for a happier UI. */

import type { ReactNode } from 'react'

const FLOAT_EMOJI = ['✈️', '🗺️', '📸', '🍜', '⛰️', '🎒', '🌅', '🧭', '🎫', '✨', '🏖️', '🚂']

export function FloatingEmojiField() {
  return (
    <div className="emoji-field" aria-hidden>
      {FLOAT_EMOJI.map((emoji, i) => (
        <span
          key={`${emoji}-${i}`}
          className={`emoji-float e${i + 1}`}
          style={{ animationDelay: `${(i % 6) * 0.45}s` }}
        >
          {emoji}
        </span>
      ))}
    </div>
  )
}

export function MoodTicker() {
  const items = [
    '✈️ 出發快樂加倍',
    '🍜 先記低必吃清單',
    '📸 打卡位預留黃金光線',
    '🗺️ 路線像故事一樣走',
    '🎒 行李輕一點心情靚啲',
    '✨ AI 幫你執好天數',
  ]
  return (
    <div className="mood-ticker" aria-label="旅行心情小提示">
      <div className="mood-ticker-track">
        {[...items, ...items].map((item, i) => (
          <span key={`${item}-${i}`} className="mood-chip">
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

export function StickerWidget({
  emoji,
  title,
  note,
  tone = 'sunny',
}: {
  emoji: string
  title: string
  note: string
  tone?: 'sunny' | 'mint' | 'coral' | 'sky'
}) {
  return (
    <aside className={`sticker-widget tone-${tone}`}>
      <span className="sticker-emoji" aria-hidden>
        {emoji}
      </span>
      <div>
        <strong>{title}</strong>
        <p>{note}</p>
      </div>
    </aside>
  )
}

export function FunStatPills({
  items,
}: {
  items: { emoji: string; label: string; value: string }[]
}) {
  return (
    <div className="fun-stat-pills" role="list">
      {items.map((item) => (
        <div key={item.label} className="fun-stat" role="listitem">
          <span aria-hidden>{item.emoji}</span>
          <em>{item.value}</em>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  )
}

export function EmojiChipRow({
  label,
  chips,
  onPick,
}: {
  label: string
  chips: { emoji: string; text: string }[]
  onPick?: (text: string) => void
}) {
  return (
    <div className="emoji-chip-row">
      <p className="emoji-chip-label">{label}</p>
      <div className="emoji-chips">
        {chips.map((chip) => (
          <button
            key={chip.text}
            type="button"
            className="emoji-chip"
            onClick={() => onPick?.(chip.text)}
          >
            <span aria-hidden>{chip.emoji}</span>
            {chip.text}
          </button>
        ))}
      </div>
    </div>
  )
}

export function BounceBadge({ children }: { children: ReactNode }) {
  return <span className="bounce-badge">{children}</span>
}
