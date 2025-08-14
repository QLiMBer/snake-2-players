Snake — 2 Players (Vite + React + TypeScript)

Getting started
- Install deps: `npm ci` (or `npm install`)
- Start dev server: `npm run dev` (http://localhost:5173)
- Build: `npm run build`
- Preview build: `npm run preview`

Testing
- Run tests: `npm run test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage` (outputs `coverage/`)

Features
- Two-player snake with rounds and cumulative scoring
- Countdown, game over, and match over states
- Subtle animations for food, death, and spawn events
- Wall collision toggle, grid overlay, board size, speed, round count
- Dark/light theme toggle with CSS variables

Controls
- Player 1: WASD
- Player 2: Arrow keys
- Global: Space = pause/resume, R = restart match, Enter/N = next round

Project notes
- Source lives in `src/` (components, state, hooks, styles)
- Tests co-located as `*.test.ts(x)`; setup in `src/test/setup.ts`
