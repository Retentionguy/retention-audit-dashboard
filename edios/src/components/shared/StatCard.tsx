import { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: string | number
  sub?: string
  icon?: LucideIcon
  accent?: string
  mono?: boolean
}

export default function StatCard({ label, value, sub, icon: Icon, accent, mono }: Props) {
  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        {Icon && (
          <span style={{ color: accent ?? 'var(--text-tertiary)' }}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <div
        className={mono ? 'mono' : ''}
        style={{
          fontSize: 32,
          fontWeight: mono ? 500 : 600,
          color: accent ?? 'var(--text-primary)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{sub}</div>
      )}
    </div>
  )
}
