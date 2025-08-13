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

export function initialState(size: number): GameState {
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
    phase: 'countdown',
    countdownMsLeft: 3000,
    tick: 0,
    scores: { p1: 0, p2: 0 },
    events: [{ type: 'spawnFood', at: food }],
  }
}

export function step(state: GameState, settings: GameSettings): GameState {
  const size = settings.boardSize
  const snakes: Snake[] = state.snakes.map((s) => ({ ...s, body: [...s.body] }))

  // build occupied set for collision
  const occupiedAll = new Set(snakes.flatMap((s) => s.body).map((v) => v.x + ':' + v.y))

  let food = state.food
  const scores = { ...state.scores }
  const events: GameEvent[] = []

  for (const s of snakes) {
    if (!s.alive) continue
    s.dir = nextDir(s.dir, s.pendingDir)
    s.pendingDir = undefined
    let head = stepHead(s.body[0], s.dir)
    if (!settings.wallCollision) {
      head = wrap(head, size)
    }

    // wall collision
    if (settings.wallCollision && (head.x < 0 || head.x >= size || head.y < 0 || head.y >= size)) {
      s.alive = false
      continue
    }

    // self collision or other snake
    const key = head.x + ':' + head.y
    // account for own tail moving if not eating
    const willEat = vecEq(head, food)
    let collides = occupiedAll.has(key)
    if (collides && !willEat) {
      const ownTail = s.body[s.body.length - 1]
      const ownTailKey = ownTail.x + ':' + ownTail.y
      if (key === ownTailKey) collides = false
    }
    if (collides) {
      s.alive = false
      events.push({ type: 'death', at: head, who: s.id })
      continue
    }

    // move
    s.body.unshift(head)

    // eat
    if (willEat) {
      if (s.id === 'p1') scores.p1 += 1
      else scores.p2 += 1
      events.push({ type: 'eat', at: head, who: s.id })
      // do not pop tail (growth)
      const allOcc = snakes.flatMap((sn) => sn.body)
      food = spawnFood(size, allOcc)
      events.push({ type: 'spawnFood', at: food })
    } else {
      s.body.pop()
    }

    // update occupiedAll for subsequent snakes this tick
    occupiedAll.add(key)
    if (!willEat) {
      const tail = s.body[s.body.length - 1]
      occupiedAll.delete(tail.x + ':' + tail.y)
    }
  }

  const p1Alive = snakes.find((s) => s.id === 'p1')!.alive
  const p2Alive = snakes.find((s) => s.id === 'p2')!.alive
  let phase = state.phase
  let winner: GameState['winner'] = state.winner
  const anyDied = !p1Alive || !p2Alive
  if (anyDied) {
    if (p1Alive && !p2Alive) winner = 'p1'
    else if (!p1Alive && p2Alive) winner = 'p2'
    else winner = 'draw'
    phase = 'gameover'
  }

  return {
    ...state,
    food,
    snakes,
    scores,
    phase,
    winner,
    tick: state.tick + 1,
    events,
  }
}

export function setSnakeDir(s: Snake, d: Direction) {
  s.pendingDir = d
}
