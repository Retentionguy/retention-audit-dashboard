import { useEffect, useState } from 'react'
import { FACTOR_LABELS, FACTOR_WEIGHTS, scoreToColor } from '../../lib/scoring'

interface Props {
  factors: Record<string, number>
}

export default function FactorBreakdown({ factors }: Props) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 80)
    return () => clearTimeout(t)
  }, [])

  const entries = Object.entries(FACTOR_LABELS)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {entries.map(([key, label]) => {
        const score = factors[key] ?? 0
        const weight = FACTOR_WEIGHTS[key] ?? 0
        const color = scoreToColor(score)

        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <div>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
                <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>
                  Weight: {Math.round(weight * 100)}%
                </div>
              </div>
              <span
                className="mono"
                style={{ fontSize: 14, fontWeight: 500, color, alignSelf: 'center' }}
              >
                {score}
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: 'var(--bg-tertiary)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: animated ? `${score}%` : '0%',
                  background: color,
                  borderRadius: 2,
                  transition: 'width 0.8s ease-out',
                  boxShadow: `0 0 6px ${color}60`,
                }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
