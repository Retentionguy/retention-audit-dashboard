import { Alert } from '../../types'
import { relativeTime } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'

interface Props {
  alert: Alert
}

const SEVERITY_COLORS: Record<string, string> = {
  high: '#f85149',
  medium: '#d29922',
  info: '#388bfd',
}

const SEVERITY_BG: Record<string, string> = {
  high: 'rgba(248,81,73,0.12)',
  medium: 'rgba(210,153,34,0.12)',
  info: 'rgba(56,139,253,0.12)',
}

export default function AlertCard({ alert }: Props) {
  const markAlertRead = useAppStore(s => s.markAlertRead)
  const borderColor = SEVERITY_COLORS[alert.severity] ?? '#8b949e'

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 8,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        opacity: alert.read ? 0.75 : 1,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span
          style={{
            background: SEVERITY_BG[alert.severity],
            color: borderColor,
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 99,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {alert.severity}
        </span>
        <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>
          {alert.countryFlag} {alert.country}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
          {relativeTime(alert.timestamp)}
        </span>
      </div>

      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
        {alert.title}
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {alert.body}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 2 }}>
        <span
          style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-secondary)',
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 4,
            border: '1px solid var(--border)',
          }}
        >
          {alert.affectedVisaType}
        </span>
        {alert.actionRequired && (
          <span
            style={{
              background: 'rgba(210,153,34,0.15)',
              color: '#d29922',
              fontSize: 11,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 99,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Action Required
          </span>
        )}
        {!alert.read && (
          <button
            onClick={() => markAlertRead(alert.id)}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: 12,
              padding: '3px 10px',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Mark as read
          </button>
        )}
      </div>
    </div>
  )
}
