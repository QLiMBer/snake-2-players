import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Direction, GameSettings, GameState } from '../state/gameTypes'
import { initialState, setSnakeDir, step } from '../state/gameLogic'

export function useGame(settings: GameSettings) {
  const [state, setState] = useState<GameState>(() => initialState(settings.boardSize))
  const timerRef = useRef<number | null>(null)

  // restart when board size changes
  useEffect(() => {
    setState(initialState(settings.boardSize))
  }, [settings.boardSize])

  const tickOnce = useCallback(() => {
    setState((s) => (s.running ? step(s, settings) : s))
  }, [settings])

  // interval driver
  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current)
    timerRef.current = window.setInterval(tickOnce, settings.tickMs) as unknown as number
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [settings.tickMs, tickOnce])

  // controls
  const setDir = useCallback((player: 'p1' | 'p2', dir: Direction) => {
    setState((s) => {
      const snakes = s.snakes.map((sn) => ({ ...sn, body: sn.body }))
      const target = snakes.find((sn) => sn.id === player)
      if (target && target.alive) setSnakeDir(target, dir)
      return { ...s, snakes }
    })
  }, [])

  const toggleRunning = useCallback(() => setState((s) => ({ ...s, running: !s.running })), [])
  const reset = useCallback(() => setState(initialState(settings.boardSize)), [settings.boardSize])

  // keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'w': case 'W': setDir('p1', 'up'); break
        case 's': case 'S': setDir('p1', 'down'); break
        case 'a': case 'A': setDir('p1', 'left'); break
        case 'd': case 'D': setDir('p1', 'right'); break
        case 'ArrowUp': setDir('p2', 'up'); e.preventDefault(); break
        case 'ArrowDown': setDir('p2', 'down'); e.preventDefault(); break
        case 'ArrowLeft': setDir('p2', 'left'); e.preventDefault(); break
        case 'ArrowRight': setDir('p2', 'right'); e.preventDefault(); break
        case ' ': toggleRunning(); e.preventDefault(); break
        case 'r': case 'R': reset(); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setDir, toggleRunning, reset])

  return useMemo(() => ({ state, setDir, toggleRunning, reset }), [state, setDir, toggleRunning, reset])
}

