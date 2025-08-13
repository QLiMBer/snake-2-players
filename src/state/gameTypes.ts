export type Vec = { x: number; y: number }

export type Direction = 'up' | 'down' | 'left' | 'right'

export type Snake = {
  id: 'p1' | 'p2'
  body: Vec[]
  dir: Direction
  pendingDir?: Direction
  alive: boolean
}

export type GameSettings = {
  boardSize: number
  tickMs: number
  wallCollision: boolean
  showGrid: boolean
  theme: 'dark' | 'light'
}

export type GameState = {
  food: Vec
  snakes: Snake[]
  phase: 'countdown' | 'running' | 'paused' | 'gameover'
  countdownMsLeft: number
  tick: number
  scores: { p1: number; p2: number }
  winner?: 'p1' | 'p2' | 'draw'
  events: GameEvent[]
}

export type GameEvent =
  | { type: 'eat'; at: Vec; who: 'p1' | 'p2' }
  | { type: 'death'; at: Vec; who: 'p1' | 'p2' }
  | { type: 'spawnFood'; at: Vec }
