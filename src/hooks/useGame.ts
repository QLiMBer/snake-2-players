import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Direction, GameSettings, GameState } from '../state/gameTypes'
import { initialState, prepareNextRound, setSnakeDir, step } from '../state/gameLogic'

export function useGame(settings: GameSettings) {
  const [state, setState] = useState<GameState>(() => initialState(settings))
  const timerRef = useRef<number | null>(null)

  // restart when board size or rounds change
  useEffect(() => {
    setState(initialState(settings))
  }, [settings.boardSize, settings.roundsTotal])

  const tickOnce = useCallback(() => {
    setState((s) => (s.phase === 'running' ? step(s, settings) : s))
  }, [settings])

  // interval driver for game steps
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
      if (s.phase !== 'running') return s
      const snakes = s.snakes.map((sn) => ({ ...sn, body: sn.body }))
      const target = snakes.find((sn) => sn.id === player)
      if (target && target.alive) setSnakeDir(target, dir)
      return { ...s, snakes }
    })
  }, [])

  const toggleRunning = useCallback(() => setState((s) => {
    if (s.phase === 'running') return { ...s, phase: 'paused' }
    if (s.phase === 'paused') return { ...s, phase: 'running' }
    return s
  }), [])
  const reset = useCallback(() => setState(initialState(settings)), [settings])
  const nextRound = useCallback(() => setState((s) => {
    if (s.phase !== 'gameover') return s
    if (s.round >= s.roundsTotal) return s
    return prepareNextRound(s, settings)
  }), [settings])

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
        case 'n': case 'N': setState((s) => (s.phase === 'gameover' ? prepareNextRound(s, settings) : s)); break
        case 'Enter': setState((s) => (s.phase === 'gameover' ? prepareNextRound(s, settings) : s)); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setDir, toggleRunning, reset])

  // countdown driver
  useEffect(() => {
    if (state.phase !== 'countdown') return
    if (state.countdownMsLeft <= 0) {
      setState((s) => ({ ...s, phase: 'running', countdownMsLeft: 0 }))
      return
    }
    const id = window.setInterval(() => {
      setState((s) => {
        if (s.phase !== 'countdown') return s
        const left = Math.max(0, s.countdownMsLeft - 100)
        return left === 0 ? { ...s, phase: 'running', countdownMsLeft: 0 } : { ...s, countdownMsLeft: left }
      })
    }, 100)
    return () => window.clearInterval(id)
  }, [state.phase, state.countdownMsLeft])

  return useMemo(() => ({ state, setDir, toggleRunning, reset, nextRound }), [state, setDir, toggleRunning, reset, nextRound])
}
