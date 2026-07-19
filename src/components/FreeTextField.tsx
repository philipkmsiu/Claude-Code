import { useEffect, useRef, type TextareaHTMLAttributes } from 'react'

type Props = {
  id: string
  value: string
  onValueChange: (value: string) => void
  multiline?: boolean
  rows?: number
} & Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'value' | 'onChange' | 'id' | 'rows'
>

/**
 * Text field that plays nicely with Chinese IME, mobile voice keyboards,
 * and paste-from-other-apps. Stays uncontrolled during composition so React
 * re-renders cannot interrupt typing.
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

  useEffect(() => {
    const el = ref.current
    if (!el || composing.current) return
    if (el.value !== value) el.value = value
  }, [value])

  return (
    <textarea
      {...rest}
      id={id}
      ref={ref}
      rows={multiline ? rows : 1}
      lang="zh-Hant"
      inputMode="text"
      autoCapitalize="off"
      autoCorrect="off"
      autoComplete="off"
      spellCheck={false}
      enterKeyHint={multiline ? 'enter' : 'done'}
      className={`free-text-field ${multiline ? 'multiline' : 'singleline'} ${rest.className ?? ''}`}
      defaultValue={value}
      onCompositionStart={(e) => {
        composing.current = true
        onCompositionStart?.(e)
      }}
      onCompositionEnd={(e) => {
        composing.current = false
        onValueChange(e.currentTarget.value)
        onCompositionEnd?.(e)
      }}
      onChange={(e) => {
        // Keep React state in sync when not composing (voice / paste / Latin).
        if (!composing.current) onValueChange(e.currentTarget.value)
      }}
      onPaste={(e) => {
        // Let the browser paste first (supports Chinese & clipboard from other apps),
        // then sync React state from the DOM value.
        onPaste?.(e)
        if (e.defaultPrevented) return
        window.requestAnimationFrame(() => {
          if (ref.current) onValueChange(ref.current.value)
        })
      }}
      onKeyDown={(e) => {
        const native = e.nativeEvent
        if (native.isComposing || composing.current || native.keyCode === 229) {
          // Don't let parent form treat IME confirmation Enter as submit.
          onKeyDown?.(e)
          return
        }
        if (!multiline && e.key === 'Enter') {
          e.preventDefault()
          onValueChange(e.currentTarget.value)
          e.currentTarget.form?.requestSubmit()
        }
        onKeyDown?.(e)
      }}
    />
  )
}
