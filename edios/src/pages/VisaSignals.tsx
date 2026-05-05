import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAppStore } from '../store/useAppStore'
import visaSignalsData from '../data/visaSignals.json'
import { VisaSignal } from '../types'
import TrendBadge from '../components/shared/TrendBadge'

const signals = visaSignalsData as VisaSignal[]

const RISK_COLORS: Record<string, string> = {
  low: '#3fb950',
  medium: '#d29922',
  high: '#f85149',
}

const TYPE_COLORS: Record<string, string> = {
  policy: '#388bfd',
  processing: '#d29922',
  statistics: '#8b949e',
  positive_change: '#3fb950',
}

const IMPACT_COLORS: Record<string, string> = {
  high: '#f85149',
  medium: '#d29922',
  low: '#8b949e',
  positive: '#3fb950',
}

const AREA_COLORS: Record<string, string> = {
  Australia: '#2ea595',
  Canada: '#f85149',
  'New Zealand': '#3fb950',
  UK: '#388bfd',
}

export default function VisaSignals() {
  const { activeSignalCountry, setActiveSignalCountry } = useAppStore()
  const signal = signals.find(s => s.country === activeSignalCountry) ?? signals[0]
  const delta = signal.currentApprovalRate - signal.previousApprovalRate
  const areaColor = AREA_COLORS[signal.country] ?? '#2ea595'

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {signals.map(s => (
          <button
            key={s.country}
            onClick={() => setActiveSignalCountry(s.country)}
            style={{
              background: s.country === activeSignalCountry ? 'var(--bg-secondary)' : 'transparent',
              border: '1px solid',
              borderColor: s.country === activeSignalCountry ? 'var(--border)' : 'transparent',
              borderBottom: s.country === activeSignalCountry ? '1px solid var(--bg-secondary)' : '1px solid transparent',
              marginBottom: -1,
              color: s.country === activeSignalCountry ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              padding: '8px 16px',
              borderRadius: '6px 6px 0 0',
              cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>{s.flag}</span> {s.country}
          </button>
        ))}
      </div>

      {/* Hero metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto auto 1fr', gap: 32, alignItems: 'center', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '24px 32px' }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Approval Rate</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span className="mono" style={{ fontSize: 52, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1 }}>
              {signal.currentApprovalRate}%
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <TrendBadge trend={signal.trend} />
              <span
                className="mono"
                style={{ fontSize: 12, color: delta < 0 ? '#f85149' : '#3fb950', fontWeight: 500 }}
              >
                {delta > 0 ? '+' : ''}{delta} pts
              </span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
            {signal.visaSubclass}
          </div>
        </div>

        <div style={{ width: 1, height: 60, background: 'var(--border)' }} />

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Avg Processing</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span className="mono" style={{ fontSize: 32, fontWeight: 500, color: 'var(--text-primary)' }}>
              {signal.avgProcessingDays}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>days</span>
          </div>
          <div style={{ marginTop: 6 }}>
            <TrendBadge trend={signal.processingTrend} />
          </div>
        </div>

        <div style={{ width: 1, height: 60, background: 'var(--border)' }} />

        <div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Risk Level</div>
          <span
            style={{
              background: `${RISK_COLORS[signal.riskLevel]}20`,
              color: RISK_COLORS[signal.riskLevel],
              fontSize: 14,
              fontWeight: 700,
              padding: '6px 16px',
              borderRadius: 99,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {signal.riskLevel}
          </span>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
            Updated {signal.lastUpdated}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>
          Approval Rate — 6 Month Trend
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={signal.monthlyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={areaColor} stopOpacity={0.25} />
                <stop offset="95%" stopColor={areaColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis domain={[40, 100]} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
            <Tooltip
              contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
              formatter={(v: number) => [`${v}%`, 'Approval Rate']}
            />
            <Area type="monotone" dataKey="rate" stroke={areaColor} strokeWidth={2} fill="url(#areaGrad)" dot={false} activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent changes */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>
          Recent Intelligence
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {signal.recentChanges.map((change, i) => (
            <div
              key={i}
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{change.date}</span>
                <span
                  style={{
                    background: `${TYPE_COLORS[change.type] ?? '#8b949e'}20`,
                    color: TYPE_COLORS[change.type] ?? '#8b949e',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 99,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {change.type.replace('_', ' ')}
                </span>
                <span
                  style={{
                    background: `${IMPACT_COLORS[change.impact] ?? '#8b949e'}15`,
                    color: IMPACT_COLORS[change.impact] ?? '#8b949e',
                    fontSize: 10,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 99,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {change.impact} impact
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{change.title}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{change.description}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
