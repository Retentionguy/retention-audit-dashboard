import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Radio, Users, Globe, Bell, LogOut } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

const NAV = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Visa Signals', to: '/visa-signals', icon: Radio },
  { label: 'Clients', to: '/clients', icon: Users },
  { label: 'Source Markets', to: '/source-markets', icon: Globe },
  { label: 'Alerts', to: '/alerts', icon: Bell },
]

export default function Sidebar() {
  const { user, logout, unreadCount } = useAppStore()
  const navigate = useNavigate()

  const initials = user?.name
    .split(' ')
    .map(p => p[0])
    .join('')
    .toUpperCase() ?? 'AC'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        height: '100vh',
        background: 'var(--bg-primary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        overflow: 'hidden',
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
        }}
      >
        <span
          className="mono"
          style={{ fontSize: 18, fontWeight: 500, color: 'var(--accent-teal)', letterSpacing: '-0.02em' }}
        >
          EDIOS
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 8, marginTop: 2 }}>
          Intelligence OS
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {NAV.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 20px',
              fontSize: 14,
              fontWeight: 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              textDecoration: 'none',
              background: isActive ? 'rgba(46,165,149,0.08)' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent-teal)' : '2px solid transparent',
              transition: 'all 0.15s',
              position: 'relative',
            })}
          >
            <Icon size={16} />
            <span style={{ flex: 1 }}>{label}</span>
            {label === 'Alerts' && unreadCount > 0 && (
              <span
                style={{
                  background: '#f85149',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 99,
                  minWidth: 18,
                  textAlign: 'center',
                }}
              >
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom user section */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {user?.agency}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(46,165,149,0.2)',
              border: '1px solid rgba(46,165,149,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--accent-teal)',
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            width: '100%',
            fontFamily: 'DM Sans, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = '#f85149'
            ;(e.currentTarget as HTMLButtonElement).style.color = '#f85149'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
          }}
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
