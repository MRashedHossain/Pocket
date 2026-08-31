import { useEffect, useState } from 'react'
import api from '../api/client'
import PeriodPicker, { usePeriod } from '../components/PeriodPicker'

const COLORS = ['#ff6a4d', '#7b5cf0', '#0fb3a3', '#f9a825', '#2f9bff', '#ff5fa2', '#7fc244']

function fmt(n) { return '৳' + Math.round(n ?? 0).toLocaleString('en-US') }

function StatCard({ label, value, sub, bg, ink, subColor }) {
  return (
    <div style={{ background: bg, borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ fontSize: 10.5, fontWeight: 800, color: ink, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: '"Bricolage Grotesque"' }}>{label}</div>
      <div className="figure">{value}</div>
      <div style={{ fontSize: 12, color: subColor }}>{sub}</div>
    </div>
  )
}

function DonutChart({ segments, label, total }) {
  const r = 52, cx = 70, cy = 70, circ = 2 * Math.PI * r
  let offset = 0
  const segs = (segments || []).map(s => {
    const dash = (s.pct / 100) * circ
    const seg = { ...s, dash, offset: -offset }
    offset += dash
    return seg
  })
  return (
    <div className="donut-chart">
      <div className="donut-ring">
        <svg viewBox="0 0 140 140" style={{ width: '100%', height: '100%', display: 'block' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f2ebe1" strokeWidth="15" />
          <g transform={`rotate(-90 ${cx} ${cy})`}>
            {segs.map((s, i) => (
              <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                stroke={s.color} strokeWidth="15" strokeLinecap="round"
                strokeDasharray={`${s.dash} ${circ}`} strokeDashoffset={s.offset} />
            ))}
          </g>
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: '#6f6880', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
          <div className="tnum" style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em' }}>{fmt(total)}</div>
        </div>
      </div>
      <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 9, height: 9, flex: 'none', borderRadius: 3, background: s.color }} />
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{s.category}</span>
            <span className="tnum" style={{ fontWeight: 700, flexShrink: 0 }}>{fmt(s.amount)}</span>
            <span className="tnum" style={{ width: 34, textAlign: 'right', color: '#6f6880', fontSize: 12, flexShrink: 0 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const period = usePeriod()

  useEffect(() => {
    // Keep the previous numbers on screen while the new window loads — blanking
    // to a spinner on every month/day change felt slower than it was.
    let alive = true
    api.get(`/dashboard?${period.query}`).then(r => { if (alive) setData(r.data) }).catch(() => {})
    return () => { alive = false }
  }, [period.query])

  const isDay = period.isDay
  const monthLabel = data?.label || period.label
  const shortMonth = period.shortLabel

  const expSegs = (data?.expenseByCategory || []).map((c, i) => ({ ...c, color: COLORS[i % COLORS.length] }))
  const incSegs = (data?.incomeByCategory || []).map((c, i) => ({ ...c, color: COLORS[i % COLORS.length] }))

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</h1>
          <p style={{ margin: '2px 0 0', color: '#6f6880', fontSize: 13 }}>{monthLabel}</p>
        </div>
        <PeriodPicker period={period} />
      </div>

      {!data ? (
        <p style={{ color: '#6f6880' }}>Loading…</p>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="In your pocket" value={fmt(data.balance)} sub="All time net" bg="#dcf7ea" ink="#0b6b52" subColor="#0d7a5d" />
            <StatCard label={`Came in — ${shortMonth}`} value={fmt(data.monthIncome)} sub={`${data.incomeCount} payment${data.incomeCount !== 1 ? 's' : ''}`} bg="#eae1ff" ink="#54407f" subColor="#5c4a86" />
            <StatCard label={`Went out — ${shortMonth}`} value={fmt(data.monthExpense)} sub={`${data.expenseCount} expense${data.expenseCount !== 1 ? 's' : ''}`} bg="#ffe3dc" ink="#9c3a22" subColor="#a4462f" />
            <StatCard label={isDay ? 'Kept that day' : 'Kept this month'} value={(data.monthNet < 0 ? '−' : '') + fmt(Math.abs(data.monthNet))} sub={data.monthIncome > 0 ? `${data.savingsRatePct}% saved` : 'Nothing in yet'} bg="#fff1cc" ink="#7a5300" subColor="#856000" />
          </div>

          <div className="section-grid-2">
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800 }}>Where it went</h3>
                <div style={{ fontSize: 13, color: '#6f6880', marginTop: 2 }}>{monthLabel} · by category</div>
              </div>
              {expSegs.length === 0
                ? <p style={{ color: '#6f6880', fontSize: 14 }}>No expenses {isDay ? 'that day' : 'this month'}</p>
                : <DonutChart segments={expSegs} label="Spent" total={data.monthExpense} />
              }
            </section>

            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800 }}>Where it came from</h3>
                <div style={{ fontSize: 13, color: '#6f6880', marginTop: 2 }}>{monthLabel} · by source</div>
              </div>
              {incSegs.length === 0
                ? <p style={{ color: '#6f6880', fontSize: 14 }}>No income {isDay ? 'that day' : 'this month'}</p>
                : <DonutChart segments={incSegs} label="Earned" total={data.monthIncome} />
              }
            </section>
          </div>

          <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 800 }}>Budget check</h3>
              <div style={{ fontSize: 13, color: '#6f6880', marginTop: 2 }}>{monthLabel}</div>
            </div>
            {(data.budgets || []).length === 0 ? (
              <p style={{ color: '#6f6880', fontSize: 14 }}>No budgets set for this month</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {data.budgets.map((b, i) => {
                  const pct = b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0
                  const color = b.overLimit ? '#ff6a4d' : COLORS[i % COLORS.length]
                  return (
                    <div key={b.category}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, fontSize: 13, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.category}</span>
                        <span className="tnum" style={{ color: '#6f6880' }}>{fmt(b.spent)} / {fmt(b.limit)}</span>
                        {b.overLimit && <span style={{ fontSize: 11, fontWeight: 700, color: '#9c3a22', background: '#ffe3dc', borderRadius: 999, padding: '2px 8px' }}>over</span>}
                      </div>
                      <div style={{ height: 8, background: '#f0e5d7', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: 8, background: color, borderRadius: 999, width: `${pct}%`, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          <section className="card">
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6f6880', marginBottom: 14 }}>Debts snapshot</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { label: 'Lent out', value: fmt(data.debts?.lent), color: '#0b6b52' },
                { label: 'Borrowed', value: fmt(data.debts?.borrowed), color: '#9c3a22' },
                { label: 'Net', value: (data.debts?.net < 0 ? '−' : '') + fmt(Math.abs(data.debts?.net ?? 0)), color: (data.debts?.net ?? 0) >= 0 ? '#0b6b52' : '#9c3a22' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#6f6880', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4, fontFamily: '"Bricolage Grotesque"' }}>{label}</div>
                  <div className="figure" style={{ fontSize: 20, color }}>{value}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </>
  )
}
