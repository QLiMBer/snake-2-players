// Lightweight Web Audio helper for simple game SFX
type Player = 'p1' | 'p2'

class SoundEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private enabled = true

  private ensure() {
    if (!this.enabled) return
    if (this.ctx) return
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext
      if (!Ctx) return
      this.ctx = new Ctx()
      const ctx = this.ctx!
      const master = ctx.createGain()
      master.gain.value = 0.2
      master.connect(ctx.destination)
      this.master = master
    } catch {
      this.enabled = false
    }
  }

  private now() { this.ensure(); return this.ctx ? this.ctx.currentTime : 0 }

  private osc(type: OscillatorType, freq: number, time: number, dur: number, vol = 1, attack = 0.005, release = 0.06) {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx!
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = freq
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, time)
    g.gain.linearRampToValueAtTime(vol, time + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, time + Math.max(attack + 0.001, dur - release))
    o.connect(g)
    g.connect(this.master!)
    o.start(time)
    o.stop(time + dur)
  }

  private noise(time: number, dur: number, vol = 0.4, type: 'white'|'brown' = 'white') {
    if (!this.ctx || !this.master) return
    const ctx = this.ctx!
    const sr = ctx.sampleRate
    const buffer = ctx.createBuffer(1, dur * sr, sr)
    const data = buffer.getChannelData(0)
    let lastOut = 0
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      const sample = type === 'brown' ? (lastOut + 0.02 * white) / 1.02 : white
      data[i] = sample * (type === 'brown' ? 3.5 : 0.6)
      lastOut = data[i]
    }
    const src = ctx.createBufferSource()
    src.buffer = buffer
    const g = ctx.createGain()
    g.gain.value = vol
    src.connect(g)
    g.connect(this.master!)
    src.start(time)
    src.stop(time + dur)
  }

  eat(player: Player) {
    this.ensure(); if (!this.ctx) return
    const t = this.now()
    const base = player === 'p1' ? 520 : 580
    this.osc('sine', base, t, 0.08, 0.8)
    this.osc('sine', base * 1.25, t + 0.02, 0.06, 0.7)
  }

  spawn() {
    this.ensure(); if (!this.ctx) return
    const t = this.now()
    this.osc('triangle', 640, t, 0.05, 0.5)
  }

  death(player: Player) {
    this.ensure(); if (!this.ctx) return
    const t = this.now()
    const base = player === 'p1' ? 220 : 200
    this.osc('sawtooth', base, t, 0.2, 0.5)
    this.noise(t, 0.18, 0.15, 'brown')
  }

  countdownTick() {
    this.ensure(); if (!this.ctx) return
    const t = this.now()
    this.osc('square', 880, t, 0.05, 0.35)
  }

  countdownGo() {
    this.ensure(); if (!this.ctx) return
    const t = this.now()
    this.osc('square', 660, t, 0.05, 0.5)
    this.osc('square', 990, t + 0.03, 0.06, 0.4)
  }

  roundWin(winner: Player | 'draw') {
    this.ensure(); if (!this.ctx) return
    const t = this.now()
    if (winner === 'draw') {
      this.osc('triangle', 440, t, 0.18, 0.35)
      this.osc('triangle', 440, t + 0.2, 0.12, 0.25)
      return
    }
    const base = winner === 'p1' ? 523.25 : 587.33 // C5 / D5
    this.osc('triangle', base, t, 0.12, 0.4)
    this.osc('triangle', base * 1.25, t + 0.12, 0.12, 0.35)
    this.osc('triangle', base * 1.5, t + 0.24, 0.16, 0.35)
  }

  matchWin(winner: Player | 'draw') {
    this.ensure(); if (!this.ctx) return
    const t = this.now()
    if (winner === 'draw') {
      // majestic draw chord
      this.osc('sawtooth', 392.0, t, 0.25, 0.35)
      this.osc('sawtooth', 493.9, t + 0.02, 0.25, 0.35)
      this.osc('sawtooth', 587.3, t + 0.04, 0.3, 0.35)
      return
    }
    // small triumphant fanfare (I - V - I) for the winner
    const root = winner === 'p1' ? 523.25 : 587.33 // C5 / D5
    this.osc('square', root, t, 0.18, 0.5)
    this.osc('square', root * 1.5, t + 0.1, 0.2, 0.45)
    this.osc('square', root * 2, t + 0.22, 0.24, 0.4)
    this.noise(t + 0.05, 0.25, 0.08, 'white')
  }
}

export const sound = new SoundEngine()
