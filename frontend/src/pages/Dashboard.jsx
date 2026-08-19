import { useEffect, useState } from 'react'
import api from '../api/client'

const COLORS = ['#ff6a4d', '#7b5cf0', '#0fb3a3', '#f9a825', '#2f9bff', '#ff5fa2', '#7fc244']
const mNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

function fmt(n) { return '৳' + Math.round(n ?? 0).toLocaleString('en-US') }

function StatCard({ label, value, sub, bg, ink, subColor }) {
  return (
    <div style={{ background: bg, borderRadius: 18, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: ink, letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: '"Bricolage Grotesque"' }}>{label}</div>
      <div className="figure">{value}</div>
      <div style={{ fontSize: 12.5, color: subColor }}>{sub}</div>
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
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', width: 140, height: 140, flex: 'none' }}>
        <svg viewBox="0 0 140 140" style={{ width: 140, height: 140, display: 'block' }}>
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
          <div style={{ fontSize: 10, fontWeight: 800, color: '#6f6880', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
          <div className="tnum" style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em' }}>{fmt(total)}</div>
        </div>
      </div>
      <div style={{ flex: '1 1 150px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 }}>
        {segs.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ width: 10, height: 10, flex: 'none', borderRadius: 3, background: s.color }} />
            <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{s.category}</span>
            <span className="tnum" style={{ fontWeight: 700 }}>{fmt(s.amount)}</span>
            <span className="tnum" style={{ width: 36, textAlign: 'right', color: '#6f6880', fontSize: 12 }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))

  useEffect(() => {
    api.get(`/dashboard?month=${month}`).then(r => setData(r.data)).catch(() => {})
  }, [month])

  const monthLabel = month ? mNames[Number(month.split('-')[1]) - 1] + ' ' + month.split('-')[0] : ''
  const shortMonth = month ? mNames[Number(month.split('-')[1]) - 1]?.slice(0, 3) : ''

  const expSegs = (data?.expenseByCategory || []).map((c, i) => ({ ...c, color: COLORS[i % COLORS.length] }))
  const incSegs = (data?.incomeByCategory || []).map((c, i) => ({ ...c, color: COLORS[i % COLORS.length] }))

  return (
    <>
      <div className="page-topbar" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Dashboard</h1>
          <p style={{ margin: '2px 0 0', color: '#6f6880', fontSize: 13 }}>{monthLabel}</p>
        </div>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="inp" style={{ width: 'auto', minHeight: 40, padding: '8px 12px', fontSize: 14 }} />
      </div>

      {!data ? (
        <p style={{ color: '#6f6880' }}>Loading…</p>
      ) : (
        <>
          <div className="stat-grid" style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <StatCard label="In your pocket" value={fmt(data.balance)} sub="All time net" bg="#dcf7ea" ink="#0b6b52" subColor="#0d7a5d" />
            <StatCard label={`Came in — ${shortMonth}`} value={fmt(data.monthIncome)} sub={`${data.incomeCount} payment${data.incomeCount !== 1 ? 's' : ''}`} bg="#eae1ff" ink="#54407f" subColor="#5c4a86" />
            <StatCard label={`Went out — ${shortMonth}`} value={fmt(data.monthExpense)} sub={`${data.expenseCount} expense${data.expenseCount !== 1 ? 's' : ''}`} bg="#ffe3dc" ink="#9c3a22" subColor="#a4462f" />
            <StatCard label="Kept this month" value={(data.monthNet < 0 ? '−' : '') + fmt(Math.abs(data.monthNet))} sub={data.monthIncome > 0 ? `${data.savingsRatePct}% saved` : 'Nothing in yet'} bg="#fff1cc" ink="#7a5300" subColor="#856000" />
          </div>

          <div className="section-grid-2" style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Where it went</h3>
                <div style={{ fontSize: 13, color: '#6f6880', marginTop: 2 }}>{monthLabel} · by category</div>
              </div>
              {expSegs.length === 0
                ? <p style={{ color: '#6f6880', fontSize: 14 }}>No expenses this month</p>
                : <DonutChart segments={expSegs} label="Spent" total={data.monthExpense} />
              }
            </section>

            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Where it came from</h3>
                <div style={{ fontSize: 13, color: '#6f6880', marginTop: 2 }}>{monthLabel} · by source</div>
              </div>
              {incSegs.length === 0
                ? <p style={{ color: '#6f6880', fontSize: 14 }}>No income this month</p>
                : <DonutChart segments={incSegs} label="Earned" total={data.monthIncome} />
              }
            </section>
          </div>

          <section className="card" style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { label: 'Lent out', value: fmt(data.debts?.lent), color: '#0b6b52' },
              { label: 'Borrowed', value: fmt(data.debts?.borrowed), color: '#9c3a22' },
              { label: 'Net', value: (data.debts?.net < 0 ? '−' : '') + fmt(Math.abs(data.debts?.net ?? 0)), color: (data.debts?.net ?? 0) >= 0 ? '#0b6b52' : '#9c3a22' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#6f6880', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                <div className="figure" style={{ fontSize: 22, color }}>{value}</div>
              </div>
            ))}
          </section>
        </>
      )}
    </>
  )
}
