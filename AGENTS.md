# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Source code and modules.
  - `App.tsx`: App shell, theme, settings wiring.
  - `components/`: UI pieces (`GameBoard.tsx`, `SettingsPanel.tsx`, `ScoreBoard.tsx`).
  - `hooks/`: Runtime/game hooks (`useGame.ts`).
  - `state/`: Game types and logic (`gameTypes.ts`, `gameLogic.ts`).
  - `styles.css`: Global styles and theme variables.
- Tooling: `index.html`, `vite.config.ts`, `tsconfig*.json`, `package.json`.

## Build, Test, and Development Commands
- `npm ci` (or `npm install`): Install dependencies (Node 18+ recommended).
- `npm run dev`: Start Vite dev server with HMR at `http://localhost:5173`.
- `npm run build`: Type-check and create production build in `dist/`.
- `npm run preview`: Serve the built app locally for smoke testing.
- `npm run test` / `npm run test:watch`: Run Vitest once / watch.
- `npm run test:coverage`: Coverage report.

## Coding Style & Naming Conventions
- Language: TypeScript + React (function components, hooks-first).
- Indentation: 2 spaces; prefer single quotes; no trailing semicolons.
- Names: PascalCase components/files (`GameBoard.tsx`), camelCase vars/functions, UPPER_SNAKE_CASE constants.
- State: Keep core game loop and logic in `useGame`/`state/*`; keep components presentational.
- CSS: Use CSS variables in `styles.css`; keep selectors narrow and component-agnostic.

## Testing Guidelines
- Framework: Vitest (jsdom) + React Testing Library; configured in `vite.config.ts` and `src/test/setup.ts`.
- Place tests alongside code as `*.test.ts`/`*.test.tsx` (e.g., `src/state/gameLogic.test.ts`).
- Prioritize pure logic tests for `step`, collision rules, and scoring; add light component tests for rendering/controls.

## Commit & Pull Request Guidelines
- Conventional Commits are used (see history): `feat(game): …`, `fix(input): …`, `docs: …`.
- Keep commits small and focused; write imperative, descriptive messages.
- PRs should include: summary, linked issues, test/verification steps, and screenshots/GIFs for UI changes.
- Ensure `npm run build` passes and the app runs via `npm run preview` before review.

## Security & Configuration Tips
- Client-only app; do not commit secrets. If env vars are added, use the `VITE_` prefix.
- Prefer small, tree-shakeable deps; avoid global side effects.
