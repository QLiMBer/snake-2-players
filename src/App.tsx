import { useEffect, useMemo, useState } from 'react'
import { GameBoard } from './components/GameBoard'
import { SettingsPanel } from './components/SettingsPanel'
import { ScoreBoard } from './components/ScoreBoard'
import type { GameSettings } from './state/gameTypes'
import { useGame } from './hooks/useGame'

export default function App() {
  const [settings, setSettings] = useState<GameSettings>({
    boardSize: 24,
    tickMs: 120,
    wallCollision: true,
    showGrid: true,
    theme: 'dark',
  })

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
  }, [settings.theme])

  const onToggleWall = () =>
    setSettings((s) => ({ ...s, wallCollision: !s.wallCollision }))

  const onToggleGrid = () => setSettings((s) => ({ ...s, showGrid: !s.showGrid }))

  const onThemeToggle = () =>
    setSettings((s) => ({ ...s, theme: s.theme === 'dark' ? 'light' : 'dark' }))

  const boardStyle = useMemo(
    () => ({ grid: settings.showGrid, size: settings.boardSize }),
    [settings.showGrid, settings.boardSize],
  )

  const game = useGame(settings)

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Snake — 2 Players</h1>
        <div className="header-actions">
          <button className="btn" onClick={onThemeToggle} aria-label="Toggle theme">
            {settings.theme === 'dark' ? 'Light' : 'Dark'} Mode
          </button>
        </div>
      </header>

      <main className="layout">
        <aside className="sidebar">
          <SettingsPanel
            settings={settings}
            onToggleWall={onToggleWall}
            onToggleGrid={onToggleGrid}
            onChangeBoardSize={(v) => setSettings((s) => ({ ...s, boardSize: v }))}
            onChangeTickMs={(v) => setSettings((s) => ({ ...s, tickMs: v }))}
          />
        </aside>

        <section className="stage">
          <ScoreBoard p1={game.state.scores.p1} p2={game.state.scores.p2} />
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button className="btn" onClick={game.toggleRunning} disabled={game.state.phase === 'countdown' || game.state.phase === 'gameover'}>
              {game.state.phase === 'running' ? 'Pause' : 'Resume'}
            </button>
            <button className="btn" onClick={game.reset}>Restart (R)</button>
          </div>
          <GameBoard size={boardStyle.size} showGrid={boardStyle.grid} state={game.state} />
        </section>
      </main>

      <footer className="app-footer">
        <span>Controls: P1 ⌨️ WASD · P2 ⌨️ Arrows · Space to pause</span>
      </footer>
    </div>
  )
}
