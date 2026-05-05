import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, Clock, RotateCcw, ChevronRight } from 'lucide-react'
import clientsData from '../data/clients.json'
import { Client } from '../types'
import ScoreMeter from '../components/shared/ScoreMeter'
import FactorBreakdown from '../components/shared/FactorBreakdown'
import { statusToColor, scoreToColor, FACTOR_LABELS } from '../lib/scoring'

const clients = clientsData as Client[]

const DOC_ICONS: Record<string, React.ReactNode> = {
  complete: <CheckCircle size={14} color="#3fb950" />,
  pending: <Clock size={14} color="#8b949e" />,
  in_review: <RotateCcw size={14} color="#d29922" />,
}

const DOC_COLORS: Record<string, string> = {
  complete: '#3fb950',
  pending: '#8b949e',
  in_review: '#d29922',
}

const TIMELINE_COLORS: Record<string, string> = {
  info: '#388bfd',
  success: '#3fb950',
  warning: '#d29922',
}

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const client = clients.find(c => c.id === id)

  if (!client) {
    return (
      <div style={{ padding: 24, color: 'var(--text-secondary)' }}>
        Client not found.{' '}
        <button onClick={() => navigate('/clients')} style={{ color: 'var(--accent-teal)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Go back
        </button>
      </div>
    )
  }

  // Find lowest factor
  const factorEntries = Object.entries(client.factors) as [string, number][]
  const lowestFactor = factorEntries.reduce((a, b) => b[1] < a[1] ? b : a)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Back button */}
      <button
        onClick={() => navigate('/clients')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans, sans-serif', padding: 0, width: 'fit-content' }}
      >
        <ArrowLeft size={14} /> All Clients
      </button>

      {/* Hero */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 28, display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: 'var(--text-primary)' }}>
              {client.sourceFlag} {client.name}
            </h1>
            <span style={{ background: `${statusToColor(client.status)}20`, color: statusToColor(client.status), fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 99 }}>
              {client.status}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'var(--text-secondary)', marginBottom: 8 }}>
            <span>{client.sourceCountry}</span>
            <ChevronRight size={14} />
            <span>{client.destinationFlag} {client.destinationCountry}</span>
          </div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 4 }}>{client.visaType}</div>
          <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            {client.university} · {client.course}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Approval Probability</div>
            <span
              className="mono"
              style={{ fontSize: 28, fontWeight: 500, color: client.approvalProbability >= 75 ? 'var(--accent-green)' : client.approvalProbability >= 55 ? 'var(--accent-amber)' : 'var(--accent-red)' }}
            >
              {client.approvalProbability}%
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <ScoreMeter score={client.qualityScore} size="lg" />
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Quality Score</div>
        </div>
      </div>

      {/* Two columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Left: factor breakdown */}
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Factor Breakdown</div>
          <FactorBreakdown factors={client.factors} />
        </div>

        {/* Right: documents + notes + timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Documents */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>Document Checklist</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {client.documents.map((doc, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {DOC_ICONS[doc.status]}
                  <span style={{ fontSize: 13, color: DOC_COLORS[doc.status] }}>{doc.name}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>
                    {doc.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Case Notes</div>
            <div
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 6,
                padding: 14,
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
              }}
            >
              {client.notes}
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>Timeline</div>
            <div style={{ position: 'relative', paddingLeft: 20 }}>
              <div style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 1, background: 'var(--border)' }} />
              {client.timeline.map((event, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: 16, paddingLeft: 12 }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: -14,
                      top: 4,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: TIMELINE_COLORS[event.type] ?? '#8b949e',
                      border: '2px solid var(--bg-secondary)',
                    }}
                  />
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>{event.date}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{event.event}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Score improvement callout */}
      <div style={{ background: 'var(--bg-secondary)', border: `1px solid ${scoreToColor(lowestFactor[1])}40`, borderRadius: 8, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          What Would Change This Score?
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          The weakest factor is{' '}
          <span style={{ color: scoreToColor(lowestFactor[1]), fontWeight: 600 }}>
            {FACTOR_LABELS[lowestFactor[0]]}
          </span>{' '}
          (currently <span className="mono" style={{ color: scoreToColor(lowestFactor[1]) }}>{lowestFactor[1]}</span>).
          Improving this factor by strengthening the supporting evidence would have the highest impact on the overall quality score and approval probability.
        </div>
      </div>
    </div>
  )
}
