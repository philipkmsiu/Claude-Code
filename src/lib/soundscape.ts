/**
 * Relaxed soundscape: melodic ambient MP3 loop + audible motion / choice SFX.
 */

const STORAGE_KEY = 'km-sound-muted'
const AMBIENT_SRC = '/audio/relax-ambient.mp3'

export type ToneName =
  | 'tick'
  | 'whoosh'
  | 'chime'
  | 'softPop'
  | 'ready'
  | 'kick'
  | 'boom'
  | 'select'

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
  /** Logo kick/boom only while the home hero spectacle is visible. */
  private logoSfxEnabled = false
  private listeners = new Set<(state: { muted: boolean; unlocked: boolean }) => void>()

  get isMuted() {
    return this.muted
  }

  get isUnlocked() {
    return this.unlocked
  }

  get isLogoSfxEnabled() {
    return this.logoSfxEnabled
  }

  /** Enable only on the home page; disable as soon as the user continues. */
  setLogoSfxEnabled(enabled: boolean) {
    this.logoSfxEnabled = enabled
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
    audio.volume = 0.32
    audio.setAttribute('playsinline', 'true')
    this.music = audio
  }

  private ensureSfx() {
    if (this.ctx || typeof AudioContext === 'undefined') return
    const ctx = new AudioContext()
    const sfxGain = ctx.createGain()
    // Louder than before so clicks cut through ambient music.
    sfxGain.gain.value = 1
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
      /* Autoplay blocked until next gesture. */
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
    this.ensureSfx()
    if (!this.ctx || !this.sfxGain) return

    // Prefer immediate playback once unlocked so clicks feel instant.
    if (this.ctx.state === 'suspended' || !this.unlocked) {
      void this.unlock().then(() => {
        if (!this.muted) this.playNow(name)
      })
      return
    }
    this.playNow(name)
  }

  private playNow(name: ToneName) {
    if (!this.ctx || !this.sfxGain || this.muted) return
    // Kick/boom are home-hero only — never after entering later pages.
    if ((name === 'kick' || name === 'boom') && !this.logoSfxEnabled) return
    switch (name) {
      case 'tick':
      case 'select':
        this.blip(988, 0.07, 0.14)
        this.blip(1318.5, 0.05, 0.08, 0.015)
        break
      case 'softPop':
        this.blip(698.46, 0.1, 0.12)
        this.blip(880, 0.12, 0.08, 0.03)
        break
      case 'whoosh':
        this.blip(280, 0.28, 0.1, 0, 640)
        break
      case 'chime':
        this.blip(659.25, 0.32, 0.12)
        this.blip(830.61, 0.36, 0.09, 0.06)
        this.blip(1046.5, 0.4, 0.07, 0.12)
        break
      case 'ready':
        this.blip(523.25, 0.28, 0.11)
        this.blip(659.25, 0.32, 0.09, 0.08)
        this.blip(783.99, 0.38, 0.08, 0.16)
        break
      case 'kick':
        this.playKick()
        break
      case 'boom':
        this.playBoom()
        break
      default:
        break
    }
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
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = Math.min(3200, frequency * 2.4)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(frequency, t0)
    if (endFrequency) {
      osc.frequency.exponentialRampToValueAtTime(endFrequency, t0 + duration)
    }
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
  }

  /** Soft thump + bright tap for the logo foot strike. */
  private playKick() {
    if (!this.ctx || !this.sfxGain) return
    const t0 = this.ctx.currentTime
    // Body thump
    const thump = this.ctx.createOscillator()
    const thumpGain = this.ctx.createGain()
    thump.type = 'sine'
    thump.frequency.setValueAtTime(140, t0)
    thump.frequency.exponentialRampToValueAtTime(55, t0 + 0.16)
    thumpGain.gain.setValueAtTime(0.0001, t0)
    thumpGain.gain.exponentialRampToValueAtTime(0.42, t0 + 0.01)
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2)
    thump.connect(thumpGain)
    thumpGain.connect(this.sfxGain)
    thump.start(t0)
    thump.stop(t0 + 0.22)

    // Leather tap
    this.blip(520, 0.06, 0.16)
    this.blip(880, 0.04, 0.08, 0.02)
  }

  /** Mid-air boom / sparkle when the ball pops. */
  private playBoom() {
    if (!this.ctx || !this.sfxGain) return
    const t0 = this.ctx.currentTime
    const boom = this.ctx.createOscillator()
    const boomGain = this.ctx.createGain()
    boom.type = 'triangle'
    boom.frequency.setValueAtTime(180, t0)
    boom.frequency.exponentialRampToValueAtTime(70, t0 + 0.22)
    boomGain.gain.setValueAtTime(0.0001, t0)
    boomGain.gain.exponentialRampToValueAtTime(0.28, t0 + 0.012)
    boomGain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28)
    boom.connect(boomGain)
    boomGain.connect(this.sfxGain)
    boom.start(t0)
    boom.stop(t0 + 0.3)

    this.blip(1046.5, 0.18, 0.12)
    this.blip(1568, 0.22, 0.08, 0.04)
    this.blip(2093, 0.16, 0.05, 0.08)
  }
}

export const soundscape = new Soundscape()

const CHOICE_SELECTOR = [
  'button.chip',
  'button.style-card',
  'button.spot-card',
  'button.dest-card',
  'button.icon-btn',
  '.selected-chip button',
].join(',')

/** Unlock audio on first gesture + play select SFX for choice clicks. */
export function bindSoundscapeGestures() {
  if (!canUseAudio()) return () => undefined

  const unlock = () => {
    void soundscape.unlock()
  }
  window.addEventListener('pointerdown', unlock, { once: true, passive: true })
  window.addEventListener('keydown', unlock, { once: true })

  const onClick = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return
    // Don't double-fire from nested brand/nav primary actions.
    if (target.closest('button.brand, a, .sound-toggle')) return
    const choice = target.closest(CHOICE_SELECTOR)
    if (!choice) return
    soundscape.play('select')
  }
  document.addEventListener('click', onClick, true)

  return () => {
    window.removeEventListener('pointerdown', unlock)
    window.removeEventListener('keydown', unlock)
    document.removeEventListener('click', onClick, true)
  }
}
