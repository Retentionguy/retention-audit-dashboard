import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import AlertCard from '../components/shared/AlertCard'

const SEVERITY_OPTIONS = ['All', 'high', 'medium', 'info']
const COUNTRY_OPTIONS = ['All', 'Australia', 'Canada', 'New Zealand', 'UK']

export default function Alerts() {
  const { alerts, unreadCount, markAllRead } = useAppStore()

  // Local filter state — use URL params would be overkill for MVP
  const [severityFilter, setSeverityFilter] = useState('All')
  const [countryFilter, setCountryFilter] = useState('All')
  const [readFilter, setReadFilter] = useState('All')

  const filtered = alerts.filter(a => {
    if (severityFilter !== 'All' && a.severity !== severityFilter) return false
    if (countryFilter !== 'All' && a.country !== countryFilter) return false
    if (readFilter === 'Unread' && a.read) return false
    if (readFilter === 'Read' && !a.read) return false
    return true
  })

  const selectStyle = {
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: 6,
    color: 'var(--text-primary)',
    fontSize: 13,
    padding: '7px 12px',
    fontFamily: 'DM Sans, sans-serif',
    outline: 'none',
    cursor: 'pointer',
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Alerts & Intelligence Feed</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {unreadCount > 0 ? (
              <><span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>{unreadCount}</span> unread alerts</>
            ) : 'All caught up'}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: 13,
              padding: '7px 16px',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} style={selectStyle}>
          {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s === 'All' ? 'All Severities' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={selectStyle}>
          {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>{c === 'All' ? 'All Countries' : c}</option>)}
        </select>
        <select value={readFilter} onChange={e => setReadFilter(e.target.value)} style={selectStyle}>
          {['All', 'Unread', 'Read'].map(r => <option key={r} value={r}>{r === 'All' ? 'All' : r}</option>)}
        </select>
      </div>

      {/* Alert feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
            No alerts match your filters
          </div>
        ) : (
          filtered.map(a => <AlertCard key={a.id} alert={a} />)
        )}
      </div>
    </div>
  )
}
