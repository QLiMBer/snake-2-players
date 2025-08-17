import type { GameSettings } from '../state/gameTypes'

type Props = {
  settings: GameSettings
  onToggleWall: () => void
  onToggleGrid: () => void
  onChangeBoardSize: (v: number) => void
  onChangeTickMs: (v: number) => void
  onChangeRounds: (v: number) => void
}

export function SettingsPanel({
  settings,
  onToggleWall,
  onToggleGrid,
  onChangeBoardSize,
  onChangeTickMs,
  onChangeRounds,
}: Props) {
  return (
    <div className="panel">
      <h2>Settings</h2>

      <div className="field">
        <label>Wall Collision</label>
        <button className="btn" onClick={onToggleWall}>
          {settings.wallCollision ? 'On' : 'Off'}
        </button>
      </div>

      <div className="field">
        <label>Show Grid</label>
        <button className="btn" onClick={onToggleGrid}>
          {settings.showGrid ? 'On' : 'Off'}
        </button>
      </div>

      <div className="field">
        <label>Board Size</label>
        <input
          type="range"
          min={10}
          max={40}
          value={settings.boardSize}
          onChange={(e) => onChangeBoardSize(parseInt(e.target.value, 10))}
        />
        <span className="hint">{settings.boardSize} cells</span>
      </div>

      <div className="field">
        <label>Tick Speed</label>
        <input
          type="range"
          min={60}
          max={240}
          step={10}
          value={settings.tickMs}
          onChange={(e) => onChangeTickMs(parseInt(e.target.value, 10))}
        />
        <span className="hint">{settings.tickMs} ms</span>
      </div>

      <div className="field">
        <label>Rounds</label>
        <input
          type="range"
          min={1}
          max={20}
          value={settings.roundsTotal}
          onChange={(e) => onChangeRounds(parseInt(e.target.value, 10))}
        />
        <span className="hint">{settings.roundsTotal}</span>
      </div>

      {/* Controls info moved to footer */}
    </div>
  )
}
