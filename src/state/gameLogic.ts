import type { Direction, GameSettings, GameEvent, GameState, Snake, Vec } from './gameTypes'

export function vecEq(a: Vec, b: Vec): boolean {
  return a.x === b.x && a.y === b.y
}

export function nextDir(current: Direction, pending?: Direction): Direction {
  if (!pending) return current
  if (
    (current === 'up' && pending === 'down') ||
    (current === 'down' && pending === 'up') ||
    (current === 'left' && pending === 'right') ||
    (current === 'right' && pending === 'left')
  ) return current
  return pending
}

function stepHead(pos: Vec, dir: Direction): Vec {
  switch (dir) {
    case 'up': return { x: pos.x, y: pos.y - 1 }
    case 'down': return { x: pos.x, y: pos.y + 1 }
    case 'left': return { x: pos.x - 1, y: pos.y }
    case 'right': return { x: pos.x + 1, y: pos.y }
  }
}

function wrap(pos: Vec, size: number): Vec {
  let x = pos.x, y = pos.y
  if (x < 0) x = size - 1
  if (x >= size) x = 0
  if (y < 0) y = size - 1
  if (y >= size) y = 0
  return { x, y }
}

function randomInt(max: number) { return Math.floor(Math.random() * max) }

export function spawnFood(size: number, occupied: Vec[]): Vec {
  let tries = 0
  while (tries++ < 1000) {
    const f = { x: randomInt(size), y: randomInt(size) }
    if (!occupied.some((v) => vecEq(v, f))) return f
  }
  // fallback if heavily occupied
  return { x: 0, y: 0 }
}

export function initialState(settings: GameSettings): GameState {
  const size = settings.boardSize
  const mid = Math.floor(size / 2)
  const p1: Snake = {
    id: 'p1',
    dir: 'right',
    body: [ { x: 2, y: mid }, { x: 1, y: mid }, { x: 0, y: mid } ],
    alive: true,
  }
  const p2: Snake = {
    id: 'p2',
    dir: 'left',
    body: [ { x: size - 3, y: mid }, { x: size - 2, y: mid }, { x: size - 1, y: mid } ],
    alive: true,
  }
  const occupied = [...p1.body, ...p2.body]
  const food = spawnFood(size, occupied)
  return {
    food,
    snakes: [p1, p2],
    phase: 'paused',
    countdownMsLeft: 3000,
    tick: 0,
    scores: { p1: 0, p2: 0 },
    events: [{ type: 'spawnFood', at: food }],
    round: 1,
    roundsTotal: settings.roundsTotal,
  }
}

export function prepareNextRound(prev: GameState, settings: GameSettings): GameState {
  const size = settings.boardSize
  const mid = Math.floor(size / 2)
  const p1: Snake = { id: 'p1', dir: 'right', body: [ { x: 2, y: mid }, { x: 1, y: mid }, { x: 0, y: mid } ], alive: true }
  const p2: Snake = { id: 'p2', dir: 'left', body: [ { x: size - 3, y: mid }, { x: size - 2, y: mid }, { x: size - 1, y: mid } ], alive: true }
  const occupied = [...p1.body, ...p2.body]
  const food = spawnFood(size, occupied)
  return {
    ...prev,
    food,
    snakes: [p1, p2],
    phase: 'countdown',
    countdownMsLeft: 3000,
    events: [{ type: 'spawnFood', at: food }],
    round: Math.min(prev.round + 1, prev.roundsTotal),
    roundWinner: undefined,
  }
}

export function step(state: GameState, settings: GameSettings): GameState {
  const size = settings.boardSize
  const snakes: Snake[] = state.snakes.map((s) => ({ ...s, body: [...s.body] }))

  // Precompute intentions
  const nextHeads: Record<'p1'|'p2', Vec> = { p1: { x: 0, y: 0 }, p2: { x: 0, y: 0 } }
  const willEatIntent: Record<'p1'|'p2', boolean> = { p1: false, p2: false }
  const dead: Record<'p1'|'p2', boolean> = { p1: false, p2: false }
  const events: GameEvent[] = []
  let food = state.food
  const scores = { ...state.scores }

  for (const s of snakes) {
    if (!s.alive) { dead[s.id] = true; continue }
    s.dir = nextDir(s.dir, s.pendingDir)
    s.pendingDir = undefined
    let head = stepHead(s.body[0], s.dir)
    if (!settings.wallCollision) head = wrap(head, size)
    // wall collision
    if (settings.wallCollision && (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size)) {
      dead[s.id] = true
      events.push({ type: 'death', at: head, who: s.id })
    }
    nextHeads[s.id] = head
    willEatIntent[s.id] = vecEq(head, food)
  }

  // Head-to-head equal cell
  const h1 = nextHeads.p1, h2 = nextHeads.p2
  if (!dead.p1 && !dead.p2 && vecEq(h1, h2)) {
    dead.p1 = true; dead.p2 = true
    events.push({ type: 'death', at: h1, who: 'p1' })
    events.push({ type: 'death', at: h2, who: 'p2' })
  }
  // Head swap
  const cur1 = snakes.find((s) => s.id === 'p1')!.body[0]
  const cur2 = snakes.find((s) => s.id === 'p2')!.body[0]
  if (!dead.p1 && !dead.p2 && vecEq(h1, cur2) && vecEq(h2, cur1)) {
    dead.p1 = true; dead.p2 = true
    events.push({ type: 'death', at: h1, who: 'p1' })
    events.push({ type: 'death', at: h2, who: 'p2' })
  }

  // Occupied cells excluding tails that move away (when that snake doesn't eat)
  const occupied = new Set<string>()
  for (const sn of snakes) {
    const cells = sn.body
    for (let i = 0; i < cells.length; i++) {
      const isTail = i === cells.length - 1
      if (isTail && !willEatIntent[sn.id]) continue
      occupied.add(cells[i].x + ':' + cells[i].y)
    }
  }

  // Body collisions
  for (const s of snakes) {
    if (dead[s.id]) continue
    const key = nextHeads[s.id].x + ':' + nextHeads[s.id].y
    if (occupied.has(key)) {
      dead[s.id] = true
      events.push({ type: 'death', at: nextHeads[s.id], who: s.id })
    }
  }

  // Apply moves and eating
  for (const s of snakes) {
    if (dead[s.id]) { s.alive = false; continue }
    const head = nextHeads[s.id]
    s.body.unshift(head)
    const eat = willEatIntent[s.id]
    if (eat) {
      if (s.id === 'p1') scores.p1 += 1; else scores.p2 += 1
      events.push({ type: 'eat', at: head, who: s.id })
    } else {
      s.body.pop()
    }
  }

  // Spawn food if needed
  if (snakes.some((s) => s.alive && willEatIntent[s.id])) {
    const allOcc = snakes.flatMap((sn) => sn.body)
    food = spawnFood(size, allOcc)
    events.push({ type: 'spawnFood', at: food })
  }

  const p1Alive = snakes.find((s) => s.id === 'p1')!.alive
  const p2Alive = snakes.find((s) => s.id === 'p2')!.alive
  let phase = state.phase
  let roundWinner: GameState['roundWinner'] = state.roundWinner
  let matchWinner: GameState['matchWinner'] = state.matchWinner
  const anyDied = !p1Alive || !p2Alive
  if (anyDied) {
    if (p1Alive && !p2Alive) roundWinner = 'p1'
    else if (!p1Alive && p2Alive) roundWinner = 'p2'
    else roundWinner = 'draw'
    if (state.round >= state.roundsTotal) {
      phase = 'matchover'
      matchWinner = scores.p1 > scores.p2 ? 'p1' : scores.p1 < scores.p2 ? 'p2' : 'draw'
    } else {
      phase = 'gameover'
    }
  }

  return { ...state, food, snakes, scores, phase, roundWinner, matchWinner, tick: state.tick + 1, events }
}

export function setSnakeDir(s: Snake, d: Direction) {
  s.pendingDir = d
}
