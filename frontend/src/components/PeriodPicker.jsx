import { useState } from 'react'
import DateField from './DateField'

const mNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// usePeriod holds the Month/Day selection for a page and derives everything a
// caller needs from it: the API query fragment (`month=…` or `date=…`), a full
// label ("August 2026" / "29 August 2026") and a short one ("Aug" / "Aug 29").
export function usePeriod() {
  const [view, setView] = useState('month') // 'month' | 'day'
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [day, setDay] = useState(() => new Date().toISOString().slice(0, 10))

  const isDay = view === 'day'
  const [dy, dm, dd] = day.split('-')
  const [my, mm] = month.split('-')

  const label = isDay
    ? `${Number(dd)} ${mNames[Number(dm) - 1]} ${dy}`
    : `${mNames[Number(mm) - 1]} ${my}`
  const shortLabel = isDay
    ? `${mNames[Number(dm) - 1]?.slice(0, 3)} ${Number(dd)}`
    : mNames[Number(mm) - 1]?.slice(0, 3)

  return {
    view, setView, month, setMonth, day, setDay,
    isDay,
    query: isDay ? `date=${day}` : `month=${month}`,
    label,
    shortLabel,
    noun: isDay ? 'that day' : 'this month',
  }
}

export default function PeriodPicker({ period }) {
  const { view, setView, month, setMonth, day, setDay, isDay } = period
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
      <div style={{ display: 'inline-flex', background: '#f0e5d7', borderRadius: 999, padding: 3, flexShrink: 0 }}>
        {['month', 'day'].map(v => (
          <button key={v} type="button" onClick={() => setView(v)}
            style={{
              border: 0, cursor: 'pointer', borderRadius: 999, padding: '6px 14px',
              fontSize: 13, fontWeight: 700, textTransform: 'capitalize',
              background: view === v ? '#fff' : 'transparent',
              color: view === v ? '#2a2438' : '#6f6880',
              boxShadow: view === v ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
            }}>{v}</button>
        ))}
      </div>
      {isDay ? (
        <DateField value={day} onChange={v => { if (v) setDay(v) }}
          style={{ flex: '1 1 140px', minWidth: 0, minHeight: 40, padding: '8px 12px', fontSize: 14 }} />
      ) : (
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          className="inp" style={{ flex: '1 1 140px', minWidth: 0, minHeight: 40, padding: '8px 12px', fontSize: 14 }} />
      )}
    </div>
  )
}
