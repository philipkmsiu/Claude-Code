/**
 * Relaxed soundscape: real melodic ambient MP3 loop + tiny sine UI cues.
 * Continuous oscillator drones were removed — they sounded like “ng ng” hum.
 */

const STORAGE_KEY = 'km-sound-muted'
const AMBIENT_SRC = '/audio/relax-ambient.mp3'

type ToneName = 'tick' | 'whoosh' | 'chime' | 'softPop' | 'ready'

function canUseAudio(): boolean {
  return typeof window !== 'undefined'
}

function loadMuted(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function saveMuted(muted: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, muted ? '1' : '0')
  } catch {
    /* ignore */
  }
}

class Soundscape {
  private music: HTMLAudioElement | null = null
  private ctx: AudioContext | null = null
  private sfxGain: GainNode | null = null
  private unlocked = false
  private muted = loadMuted()
  private starting = false
  private listeners = new Set<(state: { muted: boolean; unlocked: boolean }) => void>()

  get isMuted() {
    return this.muted
  }

  get isUnlocked() {
    return this.unlocked
  }

  subscribe(listener: (state: { muted: boolean; unlocked: boolean }) => void) {
    this.listeners.add(listener)
    listener({ muted: this.muted, unlocked: this.unlocked })
    return () => {
      this.listeners.delete(listener)
    }
  }

  private emit() {
    const state = { muted: this.muted, unlocked: this.unlocked }
    for (const listener of this.listeners) listener(state)
  }

  private ensureMusic() {
    if (this.music || !canUseAudio()) return
    const audio = new Audio(AMBIENT_SRC)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0.38
    audio.setAttribute('playsinline', 'true')
    this.music = audio
  }

  private ensureSfx() {
    if (this.ctx || typeof AudioContext === 'undefined') return
    const ctx = new AudioContext()
    const sfxGain = ctx.createGain()
    sfxGain.gain.value = 0.55
    sfxGain.connect(ctx.destination)
    this.ctx = ctx
    this.sfxGain = sfxGain
  }

  /** Call from a user gesture so browsers allow audio. */
  async unlock() {
    if (!canUseAudio()) return
    this.ensureMusic()
    this.ensureSfx()
    if (this.ctx?.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        /* ignore */
      }
    }
    this.unlocked = true
    this.emit()
    if (!this.muted) await this.startMusic()
  }

  private async startMusic() {
    if (!this.music || this.muted || this.starting) return
    this.starting = true
    try {
      this.music.currentTime = this.music.currentTime || 0
      await this.music.play()
    } catch {
      // Autoplay blocked until next gesture; mute toggle / next click retries.
    } finally {
      this.starting = false
    }
  }

  private stopMusic() {
    if (!this.music) return
    this.music.pause()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    saveMuted(muted)
    if (muted) {
      this.stopMusic()
    } else {
      void this.unlock().then(() => this.startMusic())
    }
    this.emit()
  }

  toggleMuted() {
    this.setMuted(!this.muted)
  }

  play(name: ToneName) {
    if (this.muted || !canUseAudio()) return
    void this.unlock().then(() => {
      if (this.muted || !this.ctx || !this.sfxGain) return
      switch (name) {
        case 'tick':
          this.blip(880, 0.05, 0.03)
          break
        case 'softPop':
          this.blip(698.46, 0.08, 0.028)
          this.blip(880, 0.1, 0.018, 0.03)
          break
        case 'whoosh':
          // Soft rising tone — no noise bursts.
          this.blip(330, 0.22, 0.025, 0, 520)
          break
        case 'chime':
          this.blip(659.25, 0.28, 0.032)
          this.blip(830.61, 0.32, 0.024, 0.06)
          this.blip(1046.5, 0.36, 0.018, 0.12)
          break
        case 'ready':
          this.blip(523.25, 0.26, 0.03)
          this.blip(659.25, 0.3, 0.024, 0.08)
          this.blip(783.99, 0.36, 0.02, 0.16)
          break
        default:
          break
      }
    })
  }

  private blip(
    frequency: number,
    duration: number,
    peak: number,
    delay = 0,
    endFrequency?: number,
  ) {
    if (!this.ctx || !this.sfxGain) return
    const t0 = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, t0)
    if (endFrequency) {
      osc.frequency.exponentialRampToValueAtTime(endFrequency, t0 + duration)
    }
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.025)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
  }
}

export const soundscape = new Soundscape()

/** Ensure audio unlocks on the first user gesture anywhere in the app. */
export function bindSoundscapeGestures() {
  if (!canUseAudio()) return () => undefined
  const unlock = () => {
    void soundscape.unlock()
  }
  window.addEventListener('pointerdown', unlock, { once: true, passive: true })
  window.addEventListener('keydown', unlock, { once: true })
  return () => {
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
  }
}
