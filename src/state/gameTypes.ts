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
  running: boolean
  tick: number
  scores: { p1: number; p2: number }
}
