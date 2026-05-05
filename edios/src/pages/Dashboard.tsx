import { useNavigate } from 'react-router-dom'
import { Users, AlertTriangle, Bell, TrendingUp } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { format } from 'date-fns'
import { useAppStore } from '../store/useAppStore'
import clientsData from '../data/clients.json'
import visaSignalsData from '../data/visaSignals.json'
import StatCard from '../components/shared/StatCard'
import AlertCard from '../components/shared/AlertCard'
import ScoreMeter from '../components/shared/ScoreMeter'
import { Client } from '../types'
import { statusToColor } from '../lib/scoring'

const clients = clientsData as Client[]

// Merge monthly trend data for all countries into one array keyed by month
const COUNTRY_COLORS: Record<string, string> = {
  Australia: '#2ea595',
  Canada: '#f85149',
  'New Zealand': '#3fb950',
  UK: '#388bfd',
}

function buildChartData() {
  const months = visaSignalsData[0].monthlyTrend.map(m => m.month)
  return months.map((month, i) => {
    const row: Record<string, string | number> = { month }
    visaSignalsData.forEach(sig => {
      row[sig.country] = sig.monthlyTrend[i]?.rate ?? 0
    })
    return row
  })
}

const chartData = buildChartData()

export default function Dashboard() {
  const navigate = useNavigate()
  const { alerts, unreadCount, user } = useAppStore()

  const activeClients = clients.filter(c => !['Approved', 'Refused'].includes(c.status))
  const avgProb = Math.round(clients.reduce((s, c) => s + c.approvalProbability, 0) / clients.length)
  const highRiskCount = clients.filter(c => ['High Risk', 'At Risk'].includes(c.status)).length
  const recentUnread = alerts.filter(a => !a.read).slice(0, 3)

  const sortedClients = [...clients].sort((a, b) => b.approvalProbability - a.approvalProbability)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Intelligence Overview</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {format(new Date(), 'EEEE, d MMMM yyyy')} · {user?.agency}
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatCard label="Active Clients" value={activeClients.length} sub={`${clients.length} total`} icon={Users} />
        <StatCard label="Avg Approval Probability" value={`${avgProb}%`} sub="across all clients" icon={TrendingUp} accent="var(--accent-teal)" mono />
        <StatCard label="Unread Alerts" value={unreadCount} sub="require attention" icon={Bell} accent={unreadCount > 0 ? 'var(--accent-red)' : undefined} mono />
        <StatCard label="At-Risk Clients" value={highRiskCount} sub="high risk + at risk" icon={AlertTriangle} accent={highRiskCount > 0 ? 'var(--accent-amber)' : undefined} mono />
      </div>

      {/* Charts + alerts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Approval rate chart */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
            Approval Rate Trends — 6 Months
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[40, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-primary)', marginBottom: 4 }}
                formatter={(v: number, name: string) => [`${v}%`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              {visaSignalsData.map(sig => (
                <Line
                  key={sig.country}
                  type="monotone"
                  dataKey={sig.country}
                  stroke={COUNTRY_COLORS[sig.country]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Recent alerts */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Recent Alerts</div>
          {recentUnread.length === 0 ? (
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              All caught up
            </div>
          ) : (
            recentUnread.map(a => <AlertCard key={a.id} alert={a} />)
          )}
          <button
            onClick={() => navigate('/alerts')}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--accent-teal)',
              fontSize: 13,
              cursor: 'pointer',
              textAlign: 'left',
              padding: 0,
              marginTop: 4,
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            View all alerts →
          </button>
        </div>
      </div>

      {/* Client table */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
          Client Pipeline — All Clients
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Client', 'Destination & Visa', 'Score', 'Probability', 'Status', 'Submission'].map(h => (
                <th
                  key={h}
                  style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedClients.map(c => (
              <tr
                key={c.id}
                onClick={() => navigate(`/clients/${c.id}`)}
                style={{ borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{c.sourceFlag} {c.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{c.sourceCountry}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontSize: 13 }}>{c.destinationFlag} {c.destinationCountry}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{c.visaType}</div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <ScoreMeter score={c.qualityScore} size="sm" />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="mono" style={{ fontSize: 15, fontWeight: 500, color: c.approvalProbability >= 75 ? 'var(--accent-green)' : c.approvalProbability >= 55 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                    {c.approvalProbability}%
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span
                    style={{
                      background: `${statusToColor(c.status)}20`,
                      color: statusToColor(c.status),
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: 99,
                    }}
                  >
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {c.submissionDate}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
