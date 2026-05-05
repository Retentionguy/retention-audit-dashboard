import { useState } from 'react'
import { X } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import sourceMarketsData from '../data/sourceMarkets.json'
import { SourceMarket } from '../types'
import { formatNumber } from '../lib/utils'
import TrendBadge from '../components/shared/TrendBadge'

const markets = sourceMarketsData as SourceMarket[]

const PIE_COLORS = ['#2ea595', '#388bfd', '#d29922', '#3fb950', '#f85149', '#8b949e']

export default function SourceMarkets() {
  const [selected, setSelected] = useState<SourceMarket | null>(null)

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20, position: 'relative' }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>Source Market Intelligence</h1>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
          Student flows, motivations, and market trends by origin country
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
        {markets.map(m => (
          <div
            key={m.id}
            onClick={() => setSelected(m)}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: 24,
              cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-teal)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <span style={{ fontSize: 40, lineHeight: 1 }}>{m.flag}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>{m.country}</span>
                  <span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                    {m.region}
                  </span>
                </div>
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div>
                    <span className="mono" style={{ fontSize: 22, fontWeight: 500, color: 'var(--text-primary)' }}>
                      {formatNumber(m.studentVolume)}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 4 }}>students/yr</span>
                  </div>
                  <span style={{ background: 'rgba(63,185,80,0.15)', color: '#3fb950', fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99 }}>
                    +{m.yoyGrowth}% YoY
                  </span>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6 }}>Top Destination</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--bg-tertiary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${m.topDestinationShare}%`, height: '100%', background: 'var(--accent-teal)', borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                  {m.topDestination} <span className="mono" style={{ color: 'var(--accent-teal)' }}>{m.topDestinationShare}%</span>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {m.primaryMotivations.slice(0, 3).map((mot, i) => (
                <span key={i} style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: 11, padding: '3px 8px', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                  {mot}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {selected && (
        <>
          <div
            onClick={() => setSelected(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 40 }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 480,
              height: '100vh',
              background: 'var(--bg-secondary)',
              borderLeft: '1px solid var(--border)',
              zIndex: 50,
              overflowY: 'auto',
              padding: 28,
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 32 }}>{selected.flag}</span>
                  <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)' }}>{selected.country}</h2>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ background: 'var(--bg-tertiary)', color: 'var(--text-tertiary)', fontSize: 11, padding: '2px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
                    {selected.region}
                  </span>
                  <TrendBadge trend={selected.sentimentTrend} label={selected.sentimentTrend} />
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 6, padding: 6, cursor: 'pointer', color: 'var(--text-secondary)', display: 'flex' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { label: 'Students / Year', value: formatNumber(selected.studentVolume), mono: true },
                { label: 'YoY Growth', value: `+${selected.yoyGrowth}%`, mono: true },
                { label: 'Avg Agent Fee', value: `USD ${formatNumber(selected.avgAgentFee)}`, mono: true },
                { label: 'Avg IELTS', value: selected.avgIELTS.toFixed(1), mono: true },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)', borderRadius: 6, padding: '12px 14px' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>{s.label}</div>
                  <div className={s.mono ? 'mono' : ''} style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)' }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Pie chart */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Destination Split</div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={selected.destinations}
                    dataKey="share"
                    nameKey="country"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ country, share }) => `${country} ${share}%`}
                    labelLine={{ stroke: 'var(--text-tertiary)' }}
                  >
                    {selected.destinations.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                    formatter={(v: number, name: string) => [`${v}%`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top courses */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Top Courses</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.topCourses.map((course, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-tertiary)', minWidth: 16 }}>{i + 1}.</span>
                    {course}
                  </div>
                ))}
              </div>
            </div>

            {/* Challenge factors */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Challenge Factors</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selected.challengeFactors.map((cf, i) => (
                  <span key={i} style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149', fontSize: 12, padding: '4px 10px', borderRadius: 4, display: 'inline-block', width: 'fit-content' }}>
                    {cf}
                  </span>
                ))}
              </div>
            </div>

            {/* Insight */}
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>Intelligence Insight</div>
              <div style={{
                background: 'rgba(46,165,149,0.08)',
                border: '1px solid rgba(46,165,149,0.3)',
                borderRadius: 6,
                padding: 14,
                fontSize: 13,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
              }}>
                {selected.insight}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
