import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'

export default function Login() {
  const [email, setEmail] = useState('agent@edios.io')
  const [password, setPassword] = useState('demo123')
  const [error, setError] = useState('')
  const login = useAppStore(s => s.login)
  const navigate = useNavigate()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const ok = login(email, password)
    if (ok) navigate('/dashboard')
    else setError('Invalid credentials. Use agent@edios.io / demo123')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div className="mono" style={{ fontSize: 32, fontWeight: 500, color: 'var(--accent-teal)', letterSpacing: '-0.02em' }}>
            EDIOS
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
            Education & Migration Intelligence OS
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: 32,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: 'var(--text-primary)' }}>
            Agent Sign In
          </h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontFamily: 'DM Sans, sans-serif',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  padding: '10px 14px',
                  color: 'var(--text-primary)',
                  fontSize: 14,
                  fontFamily: 'DM Sans, sans-serif',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{ fontSize: 13, color: '#f85149', background: 'rgba(248,81,73,0.1)', padding: '8px 12px', borderRadius: 6 }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              style={{
                background: 'var(--accent-teal)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '12px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif',
                marginTop: 4,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Sign In
            </button>
          </form>

          <div style={{ marginTop: 20, padding: '12px 14px', background: 'var(--bg-tertiary)', borderRadius: 6, border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>Demo credentials</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>agent@edios.io / demo123</div>
          </div>
        </div>
      </div>
    </div>
  )
}
