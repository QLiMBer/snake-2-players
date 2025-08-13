# Repository Guidelines

## Project Structure & Module Organization
- `src/App.tsx`: App shell, theme and settings wiring.
- `src/components/`: UI components (`GameBoard.tsx`, `SettingsPanel.tsx`, `ScoreBoard.tsx`).
- `src/state/`: Game types and logic (`gameTypes.ts`, `gameLogic.ts`).
- `src/hooks/`: React hooks (`useGame.ts`) managing loop and input.
- `src/styles.css`: Global styles, dark mode, grid overlay.
- `index.html`, `vite.config.ts`, `tsconfig*.json`: Tooling configuration.

## Build, Test, and Development Commands
- `npm install`: Install dependencies.
- `npm run dev`: Start Vite dev server with HMR.
- `npm run build`: Type-check and produce production build in `dist/`.
- `npm run preview`: Serve the built app locally.

## Coding Style & Naming Conventions
- Language: TypeScript + React (function components + hooks).
- Indentation: 2 spaces; keep lines concise and focused.
- Names: PascalCase for components/files (`GameBoard.tsx`), camelCase for variables/functions, UPPER_SNAKE_CASE for constants.
- State: Keep game state in `useGame`; components stay presentational.
- CSS: Prefer CSS variables; keep component-agnostic rules in `styles.css`.
- Lint/format: No enforcers configured; follow Prettier-like conventions (semi-colons, single quotes OK either way, trailing commas allowed).

## Testing Guidelines
- No test runner configured yet. Recommended stack: Vitest + React Testing Library.
- Place tests alongside code as `*.test.ts(x)` (e.g., `src/state/gameLogic.test.ts`).
- Focus on pure logic first: `step`, `initialState`, and collision rules. Aim for fast, deterministic tests.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, etc. Examples in history: `feat(game): …`, `fix(input): …`.
- Keep commits small and atomic. Describe user-visible changes and affected areas.
- PRs should include: summary, screenshots/gifs for UI, steps to test, and any follow-ups.

## Security & Configuration Tips
- Do not commit secrets; this repo is client-side only.
- Use SSH for pushes (`git@github.com:QLiMBer/snake-2-players.git`).
- When adding deps, prefer type-safe, tree-shakeable packages; avoid heavy globals.
