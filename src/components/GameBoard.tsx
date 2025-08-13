import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../state/gameTypes'

type Props = {
  size: number
  showGrid: boolean
  state: GameState
}

export function GameBoard({ size, showGrid, state }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimPx, setDimPx] = useState<number>(() => Math.min(720, Math.round(window.innerWidth * 0.9)))

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

  // drawing
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1))
    canvas.width = dimPx * dpr
    canvas.height = dimPx * dpr
    canvas.style.width = dimPx + 'px'
    canvas.style.height = dimPx + 'px'
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    // clear
    ctx.clearRect(0, 0, dimPx, dimPx)

    const cell = dimPx / size

    // food
    const fx = state.food.x * cell + cell / 2
    const fy = state.food.y * cell + cell / 2
    const r = Math.max(3, cell * 0.22)
    const g = ctx.createRadialGradient(fx, fy, r * 0.2, fx, fy, r)
    g.addColorStop(0, 'rgba(255,255,255,0.9)')
    g.addColorStop(1, 'rgba(109,211,255,0.15)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(fx, fy, r, 0, Math.PI * 2)
    ctx.fill()

    // snakes
    for (const s of state.snakes) {
      const col = s.id === 'p1' ? getComputedStyle(document.documentElement).getPropertyValue('--p1').trim() : getComputedStyle(document.documentElement).getPropertyValue('--p2').trim()
      const alpha = s.alive ? 0.95 : 0.35
      ctx.fillStyle = hexToRgba(col, alpha)
      ctx.strokeStyle = hexToRgba(col, Math.min(1, alpha + 0.05))
      ctx.lineWidth = Math.max(1, cell * 0.14)
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'

      // draw body segments as rounded rects
      for (let i = s.body.length - 1; i >= 0; i--) {
        const seg = s.body[i]
        const x = seg.x * cell
        const y = seg.y * cell
        const pad = cell * 0.12
        const radius = cell * 0.22
        roundRect(ctx, x + pad, y + pad, cell - pad * 2, cell - pad * 2, radius)
        ctx.fill()
      }

      // head highlight
      const head = s.body[0]
      const hx = head.x * cell + cell / 2
      const hy = head.y * cell + cell / 2
      ctx.beginPath()
      ctx.arc(hx, hy, cell * 0.18, 0, Math.PI * 2)
      ctx.stroke()
    }
  }, [dimPx, size, state])

  return (
    <div className="board-wrap" ref={containerRef}>
      <div
        className={"board" + (showGrid ? " grid" : "")}
        style={{ width: dimPx, height: dimPx, ["--cells" as any]: String(size) }}
        role="img"
        aria-label={`Game board ${size} by ${size}`}
      >
        <canvas ref={canvasRef} />
        {!state.running && (
          <div className="board-placeholder" aria-hidden>
            <span>Paused</span>
            <small>Press Space to resume</small>
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
