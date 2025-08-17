import { useEffect, useRef, useState } from 'react'
import type { GameEvent, GameState } from '../state/gameTypes'
import { sound } from '../sound'

type Props = {
  size: number
  showGrid: boolean
  state: GameState
  onNextRound?: () => void
  onRestart?: () => void
}

export function GameBoard({ size, showGrid, state, onNextRound, onRestart }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimPx, setDimPx] = useState<number>(() => Math.min(720, Math.round(window.innerWidth * 0.9)))
  const stateRef = useRef<GameState>(state)
  const effectsRef = useRef<VisualEffect[]>([])
  const rafRef = useRef<number | null>(null)
  const prevPhaseRef = useRef<GameState['phase'] | null>(null)
  const prevCountdownSecRef = useRef<number | null>(null)

  // resize observer to keep canvas square and crisp
  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const w = Math.min(720, Math.round(e.contentRect.width))
        setDimPx(w)
      }
    })
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // keep refs updated
  useEffect(() => { stateRef.current = state }, [state])

  // ingest events into local effects list
  useEffect(() => {
    if (!state.events?.length) return
    const cell = dimPx / size
    for (const e of state.events) {
      const list = buildEffectsFromEvent(e, cell)
      effectsRef.current.push(...list)
      // sounds for events
      if (e.type === 'eat') sound.eat(e.who)
      else if (e.type === 'death') sound.death(e.who)
      else if (e.type === 'spawnFood') sound.spawn()
    }
  }, [state.events, dimPx, size])

  // countdown ticks and transitions
  useEffect(() => {
    if (state.phase === 'countdown') {
      const sec = Math.max(1, Math.ceil(state.countdownMsLeft / 1000))
      const prev = prevCountdownSecRef.current
      if (prev === null || sec < prev) sound.countdownTick()
      prevCountdownSecRef.current = sec
    }
    // when countdown completes to running
    if (prevPhaseRef.current === 'countdown' && state.phase === 'running') {
      sound.countdownGo()
      prevCountdownSecRef.current = null
    }
  }, [state.phase, state.countdownMsLeft])

  // phase change effects (round end vs match end)
  useEffect(() => {
    const prev = prevPhaseRef.current
    if (prev !== state.phase) {
      if (state.phase === 'gameover') {
        sound.roundWin(state.roundWinner ?? 'draw')
      } else if (state.phase === 'matchover') {
        sound.matchWin(state.matchWinner ?? 'draw')
        const cell = dimPx / size
        const col = getVar(state.matchWinner === 'p1' ? '--p1' : state.matchWinner === 'p2' ? '--p2' : '--muted')
        // spawn multiple celebratory bursts
        for (let i = 0; i < 10; i++) {
          const cx = Math.random() * dimPx
          const cy = Math.random() * dimPx * 0.7 + dimPx * 0.15
          effectsRef.current.push(makeConfettiBurst(cx, cy, col, cell, 900 + Math.random() * 600))
        }
      }
      prevPhaseRef.current = state.phase
    }
  }, [state.phase, state.roundWinner, state.matchWinner, dimPx, size])

  // animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let lastW = 0, lastH = 0

    const draw = () => {
      const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
      if (lastW !== dimPx || lastH !== dimPx || canvas.width !== dimPx * dpr) {
        canvas.width = dimPx * dpr
        canvas.height = dimPx * dpr
        canvas.style.width = dimPx + 'px'
        canvas.style.height = dimPx + 'px'
        ctx.setTransform(1, 0, 0, 1, 0, 0)
        ctx.scale(dpr, dpr)
        lastW = dimPx; lastH = dimPx
      }

      const s = stateRef.current
      const cell = dimPx / size

      // clear
      ctx.clearRect(0, 0, dimPx, dimPx)

      // food with gentle pulse
      const fx = s.food.x * cell + cell / 2
      const fy = s.food.y * cell + cell / 2
      const t = performance.now() / 1000
      const pulse = 0.04 * Math.sin(t * 4 * Math.PI) + 1
      const r = Math.max(3, cell * 0.22) * pulse
      const g = ctx.createRadialGradient(fx, fy, r * 0.2, fx, fy, r)
      g.addColorStop(0, 'rgba(255,255,255,0.9)')
      g.addColorStop(1, 'rgba(109,211,255,0.15)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(fx, fy, r, 0, Math.PI * 2)
      ctx.fill()

      // snakes
      for (const sn of s.snakes) {
        const col = getVar(sn.id === 'p1' ? '--p1' : '--p2')
        const alpha = sn.alive ? 0.95 : 0.35
        ctx.fillStyle = hexToRgba(col, alpha)
        ctx.strokeStyle = hexToRgba(col, Math.min(1, alpha + 0.05))
        ctx.lineWidth = Math.max(1, cell * 0.14)
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        for (let i = sn.body.length - 1; i >= 0; i--) {
          const seg = sn.body[i]
          const x = seg.x * cell
          const y = seg.y * cell
          const pad = cell * 0.12
          const radius = cell * 0.22
          roundRect(ctx, x + pad, y + pad, cell - pad * 2, cell - pad * 2, radius)
          ctx.fill()
        }
        const head = sn.body[0]
        const hx = head.x * cell + cell / 2
        const hy = head.y * cell + cell / 2
        ctx.beginPath()
        ctx.arc(hx, hy, cell * 0.18, 0, Math.PI * 2)
        ctx.stroke()
      }

      // visual effects
      const now = performance.now()
      effectsRef.current = effectsRef.current.filter((ef) => now - ef.startedAt < ef.duration)
      for (const ef of effectsRef.current) ef.draw(ctx, now)

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [dimPx, size])

  return (
    <div className="board-wrap" ref={containerRef}>
      <div
        className={"board" + (showGrid ? " grid" : "")}
        style={{ width: dimPx, height: dimPx, ["--cells" as any]: String(size) }}
        role="img"
        aria-label={`Game board ${size} by ${size}`}
      >
        <canvas ref={canvasRef} />
        {state.phase === 'paused' && (
          <div className="board-placeholder" aria-hidden>
            <span>Paused</span>
            <small>Press Space to resume</small>
          </div>
        )}
        {state.phase === 'countdown' && (
          <div className="board-placeholder" aria-hidden>
            <span style={{ fontSize: 48 }}>
              {Math.max(1, Math.ceil(state.countdownMsLeft / 1000))}
            </span>
            <small>Get Ready — Round {state.round}/{state.roundsTotal}</small>
          </div>
        )}
        {state.phase === 'gameover' && (
          <div className="board-placeholder" aria-hidden>
            <span>{state.roundWinner === 'draw' ? 'Draw!' : `${state.roundWinner?.toUpperCase()} Wins Round ${state.round}`}</span>
            <small>Press N or Enter — Next: Round {Math.min(state.round + 1, state.roundsTotal)} of {state.roundsTotal}</small>
            <button className="btn" onClick={onNextRound}>Next Round (N / Enter)</button>
          </div>
        )}
        {state.phase === 'matchover' && (
          <div className="board-placeholder" aria-hidden>
            <span style={{ fontSize: 36 }}>
              {state.matchWinner === 'draw' ? 'Match Draw!' : '🏆 ' + `${state.matchWinner?.toUpperCase()} Wins the Match!`}
            </span>
            <small>
              Final Score — P1 {state.scores.p1} · P2 {state.scores.p2}
            </small>
            <button className="btn" onClick={onRestart}>Restart Match (R)</button>
          </div>
        )}
      </div>
    </div>
  )
}

function hexToRgba(hex: string, a = 1): string {
  const m = hex.replace('#', '')
  const bigint = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16)
  const r = (bigint >> 16) & 255
  const g = (bigint >> 8) & 255
  const b = bigint & 255
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

type VisualEffect = {
  startedAt: number
  duration: number
  draw: (ctx: CanvasRenderingContext2D, now: number) => void
}

function buildEffectsFromEvent(e: GameEvent, cell: number): VisualEffect[] {
  const start = performance.now()
  if (e.type === 'eat') {
    const base = getVar(e.who === 'p1' ? '--p1' : '--p2')
    const cx = e.at.x * cell + cell / 2
    const cy = e.at.y * cell + cell / 2
    const duration = 350
    return [{
      startedAt: start,
      duration,
      draw: (ctx: CanvasRenderingContext2D, now: number) => {
        const t = Math.min(1, (now - start) / duration)
        ctx.strokeStyle = hexToRgba(base, 0.6 * (1 - t))
        ctx.lineWidth = Math.max(1, cell * 0.08 * (1 - t))
        ctx.beginPath()
        ctx.arc(cx, cy, cell * (0.3 + 0.7 * t), 0, Math.PI * 2)
        ctx.stroke()
      },
    }]
  } else if (e.type === 'death') {
    const base = getVar(e.who === 'p1' ? '--p1' : '--p2')
    const cx = e.at.x * cell + cell / 2
    const cy = e.at.y * cell + cell / 2
    const duration = 700
    return [{
      startedAt: start,
      duration,
      draw: (ctx: CanvasRenderingContext2D, now: number) => {
        const t = Math.min(1, (now - start) / duration)
        ctx.fillStyle = hexToRgba(base, 0.12 * (1 - t))
        ctx.beginPath()
        ctx.arc(cx, cy, cell * (0.4 + 1.2 * t), 0, Math.PI * 2)
        ctx.fill()
      },
    }]
  } else if (e.type === 'spawnFood') {
    const cx = e.at.x * cell + cell / 2
    const cy = e.at.y * cell + cell / 2
    const duration = 400
    return [{
      startedAt: start,
      duration,
      draw: (ctx: CanvasRenderingContext2D, now: number) => {
        const t = Math.min(1, (now - start) / duration)
        ctx.strokeStyle = 'rgba(109,211,255,' + (0.6 * (1 - t)) + ')'
        ctx.lineWidth = Math.max(1, cell * 0.06 * (1 - t))
        ctx.beginPath()
        ctx.arc(cx, cy, cell * (0.2 + 0.8 * t), 0, Math.PI * 2)
        ctx.stroke()
      },
    }]
  }
  return []
}

function getVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

// Celebratory confetti burst used for match over
function makeConfettiBurst(cx: number, cy: number, hexColor: string, cell: number, duration = 1200): VisualEffect {
  const start = performance.now()
  const color = hexColor || '#ffffff'
  const particles: { ang: number; speed: number; size: number; hueShift: number }[] = []
  const count = 60
  for (let i = 0; i < count; i++) {
    particles.push({
      ang: (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6,
      speed: (cell * 2.5) + Math.random() * (cell * 2.5),
      size: Math.max(2, cell * (0.06 + Math.random() * 0.08)),
      hueShift: (Math.random() - 0.5) * 30,
    })
  }
  return {
    startedAt: start,
    duration,
    draw: (ctx: CanvasRenderingContext2D, now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const ease = (u: number) => 1 - Math.pow(1 - u, 2)
      const tt = ease(t)
      for (const p of particles) {
        const dist = p.speed * tt
        const x = cx + Math.cos(p.ang) * dist
        const y = cy + Math.sin(p.ang) * dist + tt * cell * 0.6 // slight gravity
        ctx.fillStyle = shiftHue(color, p.hueShift, 1 - tt * 0.9)
        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  }
}

function shiftHue(hex: string, deg: number, alpha = 1): string {
  const m = hex.replace('#', '')
  const bigint = parseInt(m.length === 3 ? m.split('').map((c) => c + c).join('') : m, 16)
  let r = (bigint >> 16) & 255
  let g = (bigint >> 8) & 255
  let b = bigint & 255
  // convert to HSL, shift hue, back to RGB
  const rf = r / 255, gf = g / 255, bf = b / 255
  const max = Math.max(rf, gf, bf), min = Math.min(rf, gf, bf)
  let h = 0, s = 0, l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case rf: h = (gf - bf) / d + (gf < bf ? 6 : 0); break
      case gf: h = (bf - rf) / d + 2; break
      case bf: h = (rf - gf) / d + 4; break
    }
    h /= 6
  }
  h = (h * 360 + deg + 360) % 360
  // hsl to rgb
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m0 = l - c / 2
  let rr = 0, gg = 0, bb = 0
  if (h < 60) { rr = c; gg = x; bb = 0 }
  else if (h < 120) { rr = x; gg = c; bb = 0 }
  else if (h < 180) { rr = 0; gg = c; bb = x }
  else if (h < 240) { rr = 0; gg = x; bb = c }
  else if (h < 300) { rr = x; gg = 0; bb = c }
  else { rr = c; gg = 0; bb = x }
  r = Math.round((rr + m0) * 255)
  g = Math.round((gg + m0) * 255)
  b = Math.round((bb + m0) * 255)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
