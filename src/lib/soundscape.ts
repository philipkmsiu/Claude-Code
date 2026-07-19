/**
 * Relaxed soundscape: rotating ambient playlist + first-page motion / choice SFX.
 * Motion SFX (kick, whoosh, clicks, etc.) only play on the home page;
 * after that, only background music continues.
 */

const STORAGE_KEY = 'km-sound-muted'
const LAST_TRACK_KEY = 'km-ambient-last-track'

/** Soft ambient loops — different mood each visit / rotation. */
const AMBIENT_PLAYLIST = [
  '/audio/relax-soft-dawn.mp3',
  '/audio/relax-warm-breeze.mp3',
  '/audio/relax-night-harbor.mp3',
  '/audio/relax-garden-walk.mp3',
  '/audio/relax-ambient.mp3',
] as const

/** Change background music every ~2 minutes while unlocked. */
const ROTATE_MS = 120_000
const FADE_MS = 900

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

function loadLastTrack(): string | null {
  try {
    return window.localStorage.getItem(LAST_TRACK_KEY)
  } catch {
    return null
  }
}

function saveLastTrack(src: string) {
  try {
    window.localStorage.setItem(LAST_TRACK_KEY, src)
  } catch {
    /* ignore */
  }
}

function pickTrack(avoid?: string | null): string {
  const pool = avoid
    ? AMBIENT_PLAYLIST.filter((src) => src !== avoid)
    : [...AMBIENT_PLAYLIST]
  const list = pool.length ? pool : [...AMBIENT_PLAYLIST]
  return list[Math.floor(Math.random() * list.length)]
}

class Soundscape {
  private music: HTMLAudioElement | null = null
  private fadingOut: HTMLAudioElement | null = null
  private currentTrack: string | null = null
  private ctx: AudioContext | null = null
  private sfxGain: GainNode | null = null
  private unlocked = false
  private muted = loadMuted()
  private starting = false
  private rotateTimer: number | null = null
  private fadeTimer: number | null = null
  /**
   * All short motion / UI SFX (kick, boom, whoosh, select, …).
   * Enabled only on the first (home) page; later steps are music-only.
   */
  private motionSfxEnabled = false
  private listeners = new Set<(state: { muted: boolean; unlocked: boolean }) => void>()

  get isMuted() {
    return this.muted
  }

  get isUnlocked() {
    return this.unlocked
  }

  get isLogoSfxEnabled() {
    return this.motionSfxEnabled
  }

  get isMotionSfxEnabled() {
    return this.motionSfxEnabled
  }

  get trackLabel() {
    if (!this.currentTrack) return ''
    const file = this.currentTrack.split('/').pop() || ''
    return file.replace(/^relax-/, '').replace(/\.mp3$/, '').replace(/-/g, ' ')
  }

  /** Enable motion SFX only on the home page; disable as soon as the user continues. */
  setMotionSfxEnabled(enabled: boolean) {
    this.motionSfxEnabled = enabled
  }

  /** @deprecated Use setMotionSfxEnabled — kept for KmLogo / older call sites. */
  setLogoSfxEnabled(enabled: boolean) {
    this.motionSfxEnabled = enabled
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

  private makeAudio(src: string) {
    const audio = new Audio(src)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = 0
    audio.setAttribute('playsinline', 'true')
    return audio
  }

  private ensureMusic() {
    if (this.music || !canUseAudio()) return
    const src = pickTrack(loadLastTrack())
    this.currentTrack = src
    saveLastTrack(src)
    this.music = this.makeAudio(src)
  }

  private ensureSfx() {
    if (this.ctx || typeof AudioContext === 'undefined') return
    const ctx = new AudioContext()
    const sfxGain = ctx.createGain()
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
      this.music.volume = 0
      await this.music.play()
      this.fadeTo(this.music, 0.34, FADE_MS)
      this.scheduleRotate()
    } catch {
      /* Autoplay blocked until next gesture. */
    } finally {
      this.starting = false
    }
  }

  private stopMusic() {
    this.clearRotate()
    if (this.fadeTimer != null) {
      window.clearInterval(this.fadeTimer)
      this.fadeTimer = null
    }
    if (this.music) {
      this.music.pause()
      this.music.volume = 0
    }
    if (this.fadingOut) {
      this.fadingOut.pause()
      this.fadingOut = null
    }
  }

  private clearRotate() {
    if (this.rotateTimer != null) {
      window.clearTimeout(this.rotateTimer)
      this.rotateTimer = null
    }
  }

  private scheduleRotate() {
    this.clearRotate()
    if (this.muted || !this.unlocked) return
    this.rotateTimer = window.setTimeout(() => {
      void this.rotateTrack()
    }, ROTATE_MS)
  }

  /** Crossfade to another ambient piece. */
  private async rotateTrack() {
    if (this.muted || !this.unlocked || !canUseAudio()) return
    const nextSrc = pickTrack(this.currentTrack)
    const next = this.makeAudio(nextSrc)
    try {
      await next.play()
    } catch {
      this.scheduleRotate()
      return
    }

    const prev = this.music
    this.music = next
    this.currentTrack = nextSrc
    saveLastTrack(nextSrc)
    this.emit()

    if (prev) {
      this.fadingOut = prev
      this.fadeTo(prev, 0, FADE_MS, () => {
        prev.pause()
        if (this.fadingOut === prev) this.fadingOut = null
      })
    }
    this.fadeTo(next, 0.34, FADE_MS)
    this.scheduleRotate()
  }

  private fadeTo(
    audio: HTMLAudioElement,
    target: number,
    ms: number,
    onDone?: () => void,
  ) {
    const steps = Math.max(8, Math.floor(ms / 40))
    let step = 0
    const from = audio.volume
    const id = window.setInterval(() => {
      step += 1
      const t = step / steps
      audio.volume = Math.max(0, Math.min(1, from + (target - from) * t))
      if (step >= steps) {
        window.clearInterval(id)
        if (this.fadeTimer === id) this.fadeTimer = null
        audio.volume = target
        onDone?.()
      }
    }, 40)
    this.fadeTimer = id
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

  /** Manual skip to another background track. */
  skipTrack() {
    if (this.muted) return
    void this.unlock().then(() => this.rotateTrack())
  }

  play(name: ToneName) {
    if (this.muted || !canUseAudio()) return
    this.ensureSfx()
    if (!this.ctx || !this.sfxGain) return

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
    // After the first page: ambient music only — no motion / click SFX.
    if (!this.motionSfxEnabled) return
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

  private playKick() {
    if (!this.ctx || !this.sfxGain) return
    const t0 = this.ctx.currentTime
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
    this.blip(520, 0.06, 0.16)
    this.blip(880, 0.04, 0.08, 0.02)
  }

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

/** Unlock audio on first gesture + play select SFX for choice clicks (home only). */
export function bindSoundscapeGestures() {
  if (!canUseAudio()) return () => undefined

  const unlock = () => {
    void soundscape.unlock()
  }
  window.addEventListener('pointerdown', unlock, { once: true, passive: true })
  window.addEventListener('keydown', unlock, { once: true })

  const onClick = (event: MouseEvent) => {
    if (!soundscape.isMotionSfxEnabled) return
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.closest('button.brand, a, .sound-toggle, .sound-skip')) return
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
