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
    <div className="period-picker">
      <div className="period-seg" role="tablist" aria-label="Filter range">
        {['month', 'day'].map(v => (
          <button key={v} type="button" role="tab" aria-selected={view === v}
            className={view === v ? 'on' : ''} onClick={() => setView(v)}>
            {v}
          </button>
        ))}
      </div>
      {isDay ? (
        <DateField className="inp period-input" value={day} onChange={v => { if (v) setDay(v) }} />
      ) : (
        <input type="month" className="inp period-input" value={month}
          onChange={e => setMonth(e.target.value)} />
      )}
    </div>
  )
}
