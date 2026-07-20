import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type TextareaHTMLAttributes,
} from 'react'

type Props = {
  id: string
  value: string
  onValueChange: (value: string) => void
  multiline?: boolean
  rows?: number
} & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'id' | 'rows' | 'defaultValue'
>

function insertAtCursor(
  current: string,
  inserted: string,
  start: number,
  end: number,
): { next: string; caret: number } {
  const next = current.slice(0, start) + inserted + current.slice(end)
  return { next, caret: start + inserted.length }
}

/**
 * Text field tuned for Chinese IME, voice keyboards, and paste-from-other-apps.
 * Paste is applied manually from clipboardData so it is not lost on re-render.
 */
export function FreeTextField({
  id,
  value,
  onValueChange,
  multiline = false,
  rows = 3,
  onCompositionStart,
  onCompositionEnd,
  onPaste,
  onKeyDown,
  ...rest
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const composing = useRef(false)
  const [draft, setDraft] = useState(value)

  // Keep local draft aligned with parent when not composing.
  useEffect(() => {
    if (!composing.current) setDraft(value)
  }, [value])

  useEffect(() => {
    const el = ref.current
    if (!el || composing.current) return
    if (el.value !== draft) {
      const start = el.selectionStart
      const end = el.selectionEnd
      el.value = draft
      try {
        el.setSelectionRange(start, end)
      } catch {
        // Ignore selection errors on some mobile browsers.
      }
    }
  }, [draft])

  function commit(next: string) {
    setDraft(next)
    onValueChange(next)
  }

  function handlePaste(e: ClipboardEvent<HTMLTextAreaElement>) {
    onPaste?.(e)
    if (e.defaultPrevented) return

    const text =
      e.clipboardData?.getData('text/plain') ||
      e.clipboardData?.getData('text') ||
      ''

    // Mouse / context-menu paste sometimes gives empty clipboardData.
    // Do NOT preventDefault in that case — let the browser paste natively.
    if (!text) {
      window.requestAnimationFrame(() => {
        if (ref.current) commit(ref.current.value)
      })
      return
    }

    e.preventDefault()
    const el = e.currentTarget
    const start = el.selectionStart ?? draft.length
    const end = el.selectionEnd ?? draft.length
    const { next, caret } = insertAtCursor(draft, text, start, end)
    commit(next)

    requestAnimationFrame(() => {
      try {
        el.setSelectionRange(caret, caret)
      } catch {
        // ignore
      }
    })
  }

  return (
    <textarea
      {...rest}
      id={id}
      ref={ref}
      rows={multiline ? rows : 2}
      lang="zh-Hant"
      inputMode="text"
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      spellCheck={false}
      enterKeyHint={multiline ? 'enter' : 'done'}
      className={`free-text-field ${multiline ? 'multiline' : 'singleline'} ${rest.className ?? ''}`}
      value={draft}
      onCompositionStart={(e) => {
        composing.current = true
        onCompositionStart?.(e)
      }}
      onCompositionEnd={(e) => {
        composing.current = false
        commit(e.currentTarget.value)
        onCompositionEnd?.(e)
      }}
      onChange={(e) => {
        const next = e.currentTarget.value
        setDraft(next)
        if (!composing.current) onValueChange(next)
      }}
      onPaste={handlePaste}
      onDrop={(e) => {
        const text = e.dataTransfer?.getData('text/plain')
        if (!text) return
        e.preventDefault()
        commit(draft.trim() ? `${draft.trim()}\n${text}` : text)
      }}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes('text/plain')) e.preventDefault()
      }}
      onKeyDown={(e) => {
        const native = e.nativeEvent
        if (native.isComposing || composing.current || native.keyCode === 229) {
          onKeyDown?.(e)
          return
        }
        if (!multiline && e.key === 'Enter') {
          e.preventDefault()
          commit(e.currentTarget.value)
          e.currentTarget.form?.requestSubmit()
        }
        onKeyDown?.(e)
      }}
    />
  )
}
