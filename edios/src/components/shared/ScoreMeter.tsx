import { useEffect, useState } from 'react'
import { scoreToColor, scoreToLabel } from '../../lib/scoring'

interface Props {
  score: number
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = {
  sm: { px: 72, stroke: 6, fontSize: 16, labelSize: 8 },
  md: { px: 120, stroke: 9, fontSize: 26, labelSize: 10 },
  lg: { px: 180, stroke: 12, fontSize: 40, labelSize: 13 },
}

export default function ScoreMeter({ score, size = 'md' }: Props) {
  const [animated, setAnimated] = useState(false)
  const cfg = SIZES[size]

  const radius = (cfg.px - cfg.stroke * 2) / 2
  const cx = cfg.px / 2
  const cy = cfg.px / 2

  // Arc from 220° to -40° (240° sweep)
  const startAngle = 220
  const totalSweep = 240
  const circumference = (totalSweep / 360) * (2 * Math.PI * radius)

  const color = scoreToColor(score)
  const label = scoreToLabel(score)

  const toRad = (deg: number) => (deg * Math.PI) / 180

  const arcPath = (startDeg: number, sweepDeg: number) => {
    const endDeg = startDeg - sweepDeg
    const x1 = cx + radius * Math.cos(toRad(startDeg))
    const y1 = cy - radius * Math.sin(toRad(startDeg))
    const x2 = cx + radius * Math.cos(toRad(endDeg))
    const y2 = cy - radius * Math.sin(toRad(endDeg))
    const largeArc = sweepDeg > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`
  }

  const scoreFraction = score / 100
  const dashOffset = animated ? circumference * (1 - scoreFraction) : circumference

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 50)
    return () => clearTimeout(t)
  }, [])

  return (
    <div style={{ width: cfg.px, height: cfg.px, position: 'relative', flexShrink: 0 }}>
      <svg width={cfg.px} height={cfg.px} style={{ transform: 'rotate(0deg)' }}>
        {/* Background arc */}
        <path
          d={arcPath(startAngle, totalSweep)}
          fill="none"
          stroke="#30363d"
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
        />
        {/* Foreground arc */}
        <path
          d={arcPath(startAngle, totalSweep)}
          fill="none"
          stroke={color}
          strokeWidth={cfg.stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s ease-out', filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          marginTop: size === 'sm' ? 2 : size === 'md' ? 4 : 6,
        }}
      >
        <div
          className="mono"
          style={{ fontSize: cfg.fontSize, fontWeight: 500, color: color, lineHeight: 1 }}
        >
          {score}
        </div>
        {size !== 'sm' && (
          <div
            style={{
              fontSize: cfg.labelSize,
              color: 'var(--text-secondary)',
              marginTop: 2,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {label}
          </div>
        )}
      </div>
    </div>
  )
}
