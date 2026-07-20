import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = { children: ReactNode }
type State = { error: Error | null }

/** Catch render crashes so the page never stays a blank black screen. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          padding: '2rem',
          fontFamily: 'Noto Sans TC, sans-serif',
          background: 'linear-gradient(165deg, #eef2f3, #f5f1eb)',
          color: '#1c2622',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            畫面暫時無法顯示
          </p>
          <p style={{ color: '#6a756f', margin: '0 0 1.25rem' }}>
            按下面按鈕重新載入 App，即可從頭開始規劃。
          </p>
          <button
            type="button"
            onClick={() => {
              window.location.assign(
                `${window.location.pathname}${window.location.search}`,
              )
            }}
            style={{
              border: 0,
              borderRadius: 999,
              padding: '0.75rem 1.4rem',
              background: '#c8102e',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            重新載入 App
          </button>
        </div>
      </div>
    )
  }
}
