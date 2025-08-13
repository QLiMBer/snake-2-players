type Props = { p1: number; p2: number }

export function ScoreBoard({ p1, p2 }: Props) {
  return (
    <div className="score">
      <div className="pill p1">
        <span className="label">P1</span>
        <span className="value">{p1}</span>
      </div>
      <div className="pill p2">
        <span className="label">P2</span>
        <span className="value">{p2}</span>
      </div>
    </div>
  )
}

