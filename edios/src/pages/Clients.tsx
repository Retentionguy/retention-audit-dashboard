import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import clientsData from '../data/clients.json'
import { Client } from '../types'
import ScoreMeter from '../components/shared/ScoreMeter'
import { statusToColor } from '../lib/scoring'

const clients = clientsData as Client[]

const ALL_SOURCES = ['All', ...Array.from(new Set(clients.map(c => c.sourceCountry))).sort()]
const ALL_DESTS = ['All', ...Array.from(new Set(clients.map(c => c.destinationCountry))).sort()]
const ALL_STATUSES = ['All', 'In Progress', 'Ready to Submit', 'Submitted', 'At Risk', 'High Risk']

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

export default function Clients() {
  const navigate = useNavigate()
  const {
    clientSearch, setClientSearch,
    clientStatusFilter, setClientStatusFilter,
    clientSourceFilter, setClientSourceFilter,
    clientDestFilter, setClientDestFilter,
  } = useAppStore()

  const filtered = [...clients]
    .filter(c => {
      const q = clientSearch.toLowerCase()
      if (q && !c.name.toLowerCase().includes(q) && !c.university.toLowerCase().includes(q)) return false
      if (clientStatusFilter !== 'All' && c.status !== clientStatusFilter) return false
      if (clientSourceFilter !== 'All' && c.sourceCountry !== clientSourceFilter) return false
      if (clientDestFilter !== 'All' && c.destinationCountry !== clientDestFilter) return false
      return true
    })
    .sort((a, b) => b.approvalProbability - a.approvalProbability)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Client Pipeline</h1>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Showing {filtered.length} of {clients.length} clients
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            placeholder="Search clients..."
            value={clientSearch}
            onChange={e => setClientSearch(e.target.value)}
            style={{
              ...selectStyle,
              paddingLeft: 30,
              width: 220,
            }}
          />
        </div>
        <select value={clientSourceFilter} onChange={e => setClientSourceFilter(e.target.value)} style={selectStyle}>
          {ALL_SOURCES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Sources' : s}</option>)}
        </select>
        <select value={clientDestFilter} onChange={e => setClientDestFilter(e.target.value)} style={selectStyle}>
          {ALL_DESTS.map(d => <option key={d} value={d}>{d === 'All' ? 'All Destinations' : d}</option>)}
        </select>
        <select value={clientStatusFilter} onChange={e => setClientStatusFilter(e.target.value)} style={selectStyle}>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s === 'All' ? 'All Statuses' : s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Client', 'Destination', 'Quality', 'Probability', 'Status', 'Date', ''].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontSize: 18, fontWeight: 500, color: c.approvalProbability >= 75 ? 'var(--accent-green)' : c.approvalProbability >= 55 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
                      {c.approvalProbability}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: `${statusToColor(c.status)}20`, color: statusToColor(c.status), fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 99 }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="mono" style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.submissionDate}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button
                    onClick={e => { e.stopPropagation(); navigate(`/clients/${c.id}`) }}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--border)',
                      color: 'var(--text-secondary)',
                      fontSize: 12,
                      padding: '4px 12px',
                      borderRadius: 5,
                      cursor: 'pointer',
                      fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-tertiary)', fontSize: 13 }}>
            No clients match your filters
          </div>
        )}
      </div>
    </div>
  )
}
