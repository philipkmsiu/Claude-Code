/**
 * Relaxed in-app soundscape: soft ambient pad + gentle UI / motion cues.
 * Fully synthesized with Web Audio (no external media files).
 */

const STORAGE_KEY = 'km-sound-muted'

type ToneName = 'tick' | 'whoosh' | 'chime' | 'softPop' | 'ready'

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
  private ambientNodes: AudioNode[] = []
  private lfoTimer: number | null = null
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
          this.playTone(784, 0.05, 0.035, 'sine')
          break
        case 'softPop':
          this.playTone(523.25, 0.07, 0.04, 'triangle')
          this.playTone(659.25, 0.09, 0.025, 'sine', 0.02)
          break
        case 'whoosh':
          this.playWhoosh()
          break
        case 'chime':
          this.playTone(523.25, 0.22, 0.05, 'sine')
          this.playTone(659.25, 0.28, 0.04, 'sine', 0.05)
          this.playTone(783.99, 0.34, 0.03, 'triangle', 0.1)
          break
        case 'ready':
          this.playTone(392, 0.18, 0.045, 'sine')
          this.playTone(493.88, 0.24, 0.04, 'sine', 0.08)
          this.playTone(587.33, 0.32, 0.035, 'triangle', 0.16)
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
    sfxGain.gain.value = 0.9
    sfxGain.connect(master)

    this.ctx = ctx
    this.master = master
    this.ambientGain = ambientGain
    this.sfxGain = sfxGain
  }

  private startAmbient() {
    if (!this.ctx || !this.ambientGain || this.muted || this.ambientOn) return
    this.ambientOn = true

    const ctx = this.ctx
    const bus = this.ambientGain
    bus.gain.cancelScheduledValues(ctx.currentTime)
    bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime)
    bus.gain.linearRampToValueAtTime(0.085, ctx.currentTime + 1.6)

    // Soft traveling pad: warm fifths + airy high partials.
    const padNotes = [130.81, 164.81, 196.0, 246.94, 329.63]
    for (const [index, freq] of padNotes.entries()) {
      const osc = ctx.createOscillator()
      osc.type = index < 2 ? 'sine' : 'triangle'
      osc.frequency.value = freq
      const gain = ctx.createGain()
      gain.gain.value = index < 2 ? 0.22 : 0.08
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 420 + index * 90
      filter.Q.value = 0.5
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(bus)
      osc.start()
      this.ambientNodes.push(osc, gain, filter)
    }

    // Gentle filtered noise bed (sea / wind feel, very quiet).
    const noise = this.createNoiseSource(8)
    const noiseFilter = ctx.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 280
    noiseFilter.Q.value = 0.6
    const noiseGain = ctx.createGain()
    noiseGain.gain.value = 0.035
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(bus)
    noise.start()
    this.ambientNodes.push(noise, noiseFilter, noiseGain)

    // Slow shimmer LFO on pad brightness.
    const lfo = ctx.createOscillator()
    lfo.type = 'sine'
    lfo.frequency.value = 0.07
    const lfoGain = ctx.createGain()
    lfoGain.gain.value = 120
    lfo.connect(lfoGain)
    for (const node of this.ambientNodes) {
      if (node instanceof BiquadFilterNode && node.type === 'lowpass') {
        lfoGain.connect(node.frequency)
      }
    }
    lfo.start()
    this.ambientNodes.push(lfo, lfoGain)

    // Occasional soft sparkle notes for motion presence.
    const sparkle = () => {
      if (!this.ambientOn || this.muted || !this.ctx) return
      const picks = [523.25, 587.33, 659.25, 783.99, 880]
      const freq = picks[Math.floor(Math.random() * picks.length)]
      this.playTone(freq, 0.9, 0.018, 'sine', 0, true)
      this.lfoTimer = window.setTimeout(sparkle, 4200 + Math.random() * 3800)
    }
    this.lfoTimer = window.setTimeout(sparkle, 2400)
  }

  private stopAmbient(fade = true) {
    if (!this.ctx || !this.ambientGain) {
      this.ambientOn = false
      return
    }
    if (this.lfoTimer != null) {
      window.clearTimeout(this.lfoTimer)
      this.lfoTimer = null
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
      this.ambientOn = false
    }
    if (fade) {
      bus.gain.cancelScheduledValues(ctx.currentTime)
      bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime)
      bus.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5)
      window.setTimeout(end, 560)
    } else {
      bus.gain.setValueAtTime(0, ctx.currentTime)
      end()
    }
  }

  private createNoiseSource(seconds: number) {
    const ctx = this.ctx!
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds))
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let last = 0
    for (let i = 0; i < length; i += 1) {
      // Pink-ish noise
      const white = Math.random() * 2 - 1
      last = (last + 0.02 * white) / 1.02
      data[i] = last * 3.5
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    src.loop = true
    return src
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
    osc.type = type
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)
    osc.connect(gain)
    gain.connect(dest)
    osc.start(t0)
    osc.stop(t0 + duration + 0.02)
  }

  private playWhoosh() {
    if (!this.ctx || !this.sfxGain) return
    const ctx = this.ctx
    const t0 = ctx.currentTime
    const src = this.createNoiseSource(1.2)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 0.8
    filter.frequency.setValueAtTime(280, t0)
    filter.frequency.exponentialRampToValueAtTime(1400, t0 + 0.28)
    filter.frequency.exponentialRampToValueAtTime(420, t0 + 0.55)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.07, t0 + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55)
    src.connect(filter)
    filter.connect(gain)
    gain.connect(this.sfxGain)
    src.start(t0)
    src.stop(t0 + 0.6)
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
