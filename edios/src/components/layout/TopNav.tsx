import { useLocation } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { Bell } from 'lucide-react'
import { format } from 'date-fns'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Intelligence Overview',
  '/visa-signals': 'Visa Signal Monitor',
  '/clients': 'Client Pipeline',
  '/source-markets': 'Source Market Intelligence',
  '/alerts': 'Alerts & Intelligence Feed',
}

export default function TopNav() {
  const location = useLocation()
  const { unreadCount } = useAppStore()
  const pathBase = '/' + (location.pathname.split('/')[1] ?? '')
  const title = PAGE_TITLES[pathBase] ?? 'EDIOS'

  return (
    <header
      style={{
        height: 56,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      <div>
        <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }} className="mono">
          {format(new Date(), 'd MMM yyyy')}
        </span>
        <div style={{ position: 'relative' }}>
          <Bell size={16} style={{ color: 'var(--text-secondary)' }} />
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                background: '#f85149',
                width: 8,
                height: 8,
                borderRadius: '50%',
              }}
            />
          )}
        </div>
      </div>
    </header>
  )
}
