interface Props {
  trend: 'rising' | 'declining' | 'stable' | 'improving' | 'worsening' | 'growing'
  label?: string
}

const CONFIGS = {
  rising:    { bg: 'rgba(63,185,80,0.15)', color: '#3fb950', prefix: '↑ ' },
  improving: { bg: 'rgba(63,185,80,0.15)', color: '#3fb950', prefix: '↑ ' },
  growing:   { bg: 'rgba(63,185,80,0.15)', color: '#3fb950', prefix: '↑ ' },
  declining: { bg: 'rgba(248,81,73,0.15)', color: '#f85149', prefix: '↓ ' },
  worsening: { bg: 'rgba(248,81,73,0.15)', color: '#f85149', prefix: '↓ ' },
  stable:    { bg: 'rgba(139,148,158,0.15)', color: '#8b949e', prefix: '→ ' },
}

export default function TrendBadge({ trend, label }: Props) {
  const cfg = CONFIGS[trend] ?? CONFIGS.stable
  const text = label ?? (trend.charAt(0).toUpperCase() + trend.slice(1))
  return (
    <span
      style={{
        background: cfg.bg,
        color: cfg.color,
        fontSize: 11,
        fontWeight: 500,
        padding: '2px 8px',
        borderRadius: 99,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        fontFamily: 'DM Sans, sans-serif',
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.prefix}{text}
    </span>
  )
}
