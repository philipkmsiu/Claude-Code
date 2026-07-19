/**
 * Relaxed in-app soundscape: soft sine-pad ambient + clean UI cues.
 * Fully synthesized with Web Audio (no noise beds — those sounded like “ng ng”).
 */

const STORAGE_KEY = 'km-sound-muted'

type ToneName = 'tick' | 'whoosh' | 'chime' | 'softPop' | 'ready'

/** Soft C major / A minor travel pad voicings (Hz). */
const PAD_CHORDS: number[][] = [
  [261.63, 329.63, 392.0, 493.88], // Cmaj7-ish
  [220.0, 261.63, 329.63, 440.0], // Am7-ish
  [174.61, 220.0, 261.63, 349.23], // Fmaj
  [196.0, 246.94, 293.66, 392.0], // G
]

const MELODY: number[] = [
  523.25, 587.33, 659.25, 587.33, 523.25, 493.88, 440.0, 493.88,
]

function canUseAudio(): boolean {
  return typeof window !== 'undefined' && typeof AudioContext !== 'undefined'
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
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private ambientGain: GainNode | null = null
  private sfxGain: GainNode | null = null
  private padOscillators: OscillatorNode[] = []
  private ambientNodes: AudioNode[] = []
  private chordTimer: number | null = null
  private melodyTimer: number | null = null
  private chordIndex = 0
  private melodyIndex = 0
  private unlocked = false
  private muted = loadMuted()
  private ambientOn = false
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

  /** Call from a user gesture so browsers allow audio. */
  async unlock() {
    if (!canUseAudio()) return
    if (!this.ctx) this.createGraph()
    if (!this.ctx) return
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {
        return
      }
    }
    this.unlocked = true
    this.emit()
    if (!this.muted) this.startAmbient()
  }

  setMuted(muted: boolean) {
    this.muted = muted
    saveMuted(muted)
    if (this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : 1, this.now(), 0.08)
    }
    if (!muted) {
      void this.unlock().then(() => this.startAmbient())
    } else {
      this.stopAmbient(false)
    }
    this.emit()
  }

  toggleMuted() {
    this.setMuted(!this.muted)
  }

  play(name: ToneName) {
    if (this.muted || !canUseAudio()) return
    void this.unlock().then(() => {
      if (!this.ctx || !this.sfxGain || this.muted) return
      switch (name) {
        case 'tick':
          this.playTone(880, 0.06, 0.028, 'sine')
          break
        case 'softPop':
          this.playTone(659.25, 0.1, 0.03, 'sine')
          this.playTone(830.61, 0.12, 0.02, 'sine', 0.03)
          break
        case 'whoosh':
          this.playSoftSweep()
          break
        case 'chime':
          this.playTone(659.25, 0.35, 0.04, 'sine')
          this.playTone(830.61, 0.4, 0.03, 'sine', 0.07)
          this.playTone(1046.5, 0.45, 0.022, 'sine', 0.14)
          break
        case 'ready':
          this.playTone(523.25, 0.28, 0.038, 'sine')
          this.playTone(659.25, 0.34, 0.032, 'sine', 0.1)
          this.playTone(783.99, 0.42, 0.026, 'sine', 0.2)
          break
        default:
          break
      }
    })
  }

  private now() {
    return this.ctx?.currentTime ?? 0
  }

  private createGraph() {
    if (!canUseAudio() || this.ctx) return
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = this.muted ? 0 : 1
    master.connect(ctx.destination)

    const ambientGain = ctx.createGain()
    ambientGain.gain.value = 0
    ambientGain.connect(master)

    const sfxGain = ctx.createGain()
    sfxGain.gain.value = 0.75
    sfxGain.connect(master)

    this.ctx = ctx
    this.master = master
    this.ambientGain = ambientGain
    this.sfxGain = sfxGain
  }

  private startAmbient() {
    if (!this.ctx || !this.ambientGain || this.muted || this.ambientOn) return
    this.ambientOn = true
    this.chordIndex = 0
    this.melodyIndex = 0

    const ctx = this.ctx
    const bus = this.ambientGain
    bus.gain.cancelScheduledValues(ctx.currentTime)
    bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), ctx.currentTime)
    bus.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.8)

    // Shared warm low-pass so the pad stays soft and musical.
    const padFilter = ctx.createBiquadFilter()
    padFilter.type = 'lowpass'
    padFilter.frequency.value = 1800
    padFilter.Q.value = 0.4
    padFilter.connect(bus)
    this.ambientNodes.push(padFilter)

    // Four sine voices with very light chorus detune — no noise, no triangle buzz.
    this.padOscillators = []
    const firstChord = PAD_CHORDS[0]
    for (let i = 0; i < 4; i += 1) {
      const oscA = ctx.createOscillator()
      const oscB = ctx.createOscillator()
      oscA.type = 'sine'
      oscB.type = 'sine'
      const freq = firstChord[i]
      oscA.frequency.value = freq
      oscB.frequency.value = freq * 1.002
      const voice = ctx.createGain()
      voice.gain.value = i === 0 ? 0.09 : 0.07
      oscA.connect(voice)
      oscB.connect(voice)
      voice.connect(padFilter)
      oscA.start()
      oscB.start()
      this.padOscillators.push(oscA, oscB)
      this.ambientNodes.push(oscA, oscB, voice)
    }

    // Slow brightness breathe (subtle, not a wah).
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.05
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 220
    lfo.connect(lfoGain)
    lfoGain.connect(padFilter.frequency)
    lfo.start()
    this.ambientNodes.push(lfo, lfoGain)

    this.applyChord(0, 0.01)
    this.scheduleChordWalk()
    this.scheduleMelody()
  }

  private scheduleChordWalk() {
    if (!this.ambientOn || this.muted) return
    this.chordTimer = window.setTimeout(() => {
      if (!this.ambientOn || this.muted) return
      this.chordIndex = (this.chordIndex + 1) % PAD_CHORDS.length
      this.applyChord(this.chordIndex, 2.4)
      this.scheduleChordWalk()
    }, 7200)
  }

  private applyChord(index: number, glideSec: number) {
    if (!this.ctx) return
    const chord = PAD_CHORDS[index]
    const t = this.ctx.currentTime
    this.padOscillators.forEach((osc, voice) => {
      const tone = chord[Math.floor(voice / 2)]
      if (!tone) return
      const target = voice % 2 === 0 ? tone : tone * 1.002
      osc.frequency.cancelScheduledValues(t)
      osc.frequency.setValueAtTime(osc.frequency.value, t)
      osc.frequency.linearRampToValueAtTime(target, t + Math.max(0.05, glideSec))
    })
  }

  private scheduleMelody() {
    if (!this.ambientOn || this.muted) return
    this.melodyTimer = window.setTimeout(() => {
      if (!this.ambientOn || this.muted || !this.ctx) return
      const freq = MELODY[this.melodyIndex % MELODY.length]
      this.melodyIndex += 1
      // Very soft high sine “bell” phrase — musical, not noise.
      this.playTone(freq, 1.4, 0.02, 'sine', 0, true)
      this.playTone(freq * 1.5, 1.1, 0.008, 'sine', 0.02, true)
      this.scheduleMelody()
    }, this.melodyIndex === 0 ? 2800 : 2600)
  }

  private stopAmbient(fade = true) {
    if (!this.ctx || !this.ambientGain) {
      this.ambientOn = false
      return
    }
    if (this.chordTimer != null) {
      window.clearTimeout(this.chordTimer)
      this.chordTimer = null
    }
    if (this.melodyTimer != null) {
      window.clearTimeout(this.melodyTimer)
      this.melodyTimer = null
    }
    const ctx = this.ctx
    const bus = this.ambientGain
    const end = () => {
      for (const node of this.ambientNodes) {
        try {
          if ('stop' in node && typeof node.stop === 'function') {
            node.stop()
          }
          node.disconnect()
        } catch {
          /* ignore */
        }
      }
      this.ambientNodes = []
      this.padOscillators = []
      this.ambientOn = false
    }
    if (fade) {
      bus.gain.cancelScheduledValues(ctx.currentTime)
      bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), ctx.currentTime)
      bus.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6)
      window.setTimeout(end, 680)
    } else {
      bus.gain.setValueAtTime(0, ctx.currentTime)
      end()
    }
  }

  private playTone(
    frequency: number,
    duration: number,
    peak: number,
    type: OscillatorType,
    delay = 0,
    throughAmbient = false,
  ) {
    if (!this.ctx) return
    const dest = throughAmbient ? this.ambientGain : this.sfxGain
    if (!dest) return
    const t0 = this.ctx.currentTime + delay
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = Math.min(2400, frequency * 3)
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.06)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(dest)
    osc.start(t0)
    osc.stop(t0 + duration + 0.03)
  }

  /** Soft rising sine sweep instead of noisy whoosh. */
  private playSoftSweep() {
    if (!this.ctx || !this.sfxGain) return
    const ctx = this.ctx
    const t0 = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    osc.type = 'sine'
    filter.type = 'lowpass'
    filter.frequency.value = 2200
    osc.frequency.setValueAtTime(220, t0)
    osc.frequency.exponentialRampToValueAtTime(660, t0 + 0.32)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.045, t0 + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4)
    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    osc.start(t0)
    osc.stop(t0 + 0.45)
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
