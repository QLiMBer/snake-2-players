import { describe, it, expect } from 'vitest'
import { initialState, step } from './gameLogic'
import type { GameSettings } from './gameTypes'

const baseSettings: GameSettings = {
  boardSize: 24,
  tickMs: 120,
  wallCollision: true,
  showGrid: true,
  theme: 'dark',
  roundsTotal: 10,
}

describe('gameLogic', () => {
  it('initialState sets up two alive snakes and food on board', () => {
    const s = initialState(baseSettings)
    expect(s.snakes).toHaveLength(2)
    expect(s.snakes.every((sn) => sn.alive)).toBe(true)
    expect(s.food.x).toBeGreaterThanOrEqual(0)
    expect(s.food.x).toBeLessThan(baseSettings.boardSize)
    expect(s.food.y).toBeGreaterThanOrEqual(0)
    expect(s.food.y).toBeLessThan(baseSettings.boardSize)
    expect(s.phase).toBe('countdown')
    expect(s.roundsTotal).toBe(baseSettings.roundsTotal)
  })

  it('increments score and grows when a snake eats', () => {
    let s = initialState(baseSettings)
    // Place food directly in front of p1's head (moving right by default)
    const p1 = s.snakes.find((sn) => sn.id === 'p1')!
    const head = p1.body[0]
    s = { ...s, phase: 'running', food: { x: head.x + 1, y: head.y } }

    const next = step(s, baseSettings)
    expect(next.scores.p1).toBe(s.scores.p1 + 1)
    const nextP1 = next.snakes.find((sn) => sn.id === 'p1')!
    expect(nextP1.body.length).toBeGreaterThan(p1.body.length) // grew by 1
    // Eat event and new food spawned
    expect(next.events.some((e) => e.type === 'eat' && e.who === 'p1')).toBe(true)
    expect(next.events.some((e) => e.type === 'spawnFood')).toBe(true)
  })

  it('handles head-to-head collision as draw and ends round', () => {
    // Craft a scenario where both heads enter the same cell
    let s = initialState(baseSettings)
    s = {
      ...s,
      phase: 'running',
      food: { x: 0, y: 0 }, // keep food out of the way
      snakes: [
        { id: 'p1', dir: 'right', alive: true, body: [{ x: 4, y: 5 }] },
        { id: 'p2', dir: 'left', alive: true, body: [{ x: 6, y: 5 }] },
      ],
    }

    const next = step(s, baseSettings)
    const p1Alive = next.snakes.find((sn) => sn.id === 'p1')!.alive
    const p2Alive = next.snakes.find((sn) => sn.id === 'p2')!.alive
    expect(p1Alive).toBe(false)
    expect(p2Alive).toBe(false)
    expect(next.roundWinner).toBe('draw')
    expect(['gameover', 'matchover']).toContain(next.phase)
  })
})

