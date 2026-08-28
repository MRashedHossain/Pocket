import { useRef } from 'react'

// A real <input type="date"> (so iOS/Android show their native date picker and
// the browser handles `required` validation) laid transparently over a display
// layer that always reads DD-MM-YYYY. The native input's own text renders in the
// OS locale — usually MM/DD/YYYY — so we hide it and show our own formatting.
//
// On desktop, clicking the body of a date input doesn't open the calendar (only
// the little indicator does), so we call showPicker() on click.

export function isoToDisplay(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}-${m}-${y}`
}

export default function DateField({
  value, onChange, required, id,
  className = '', style, placeholder = 'DD-MM-YYYY',
}) {
  const ref = useRef(null)
  const display = isoToDisplay(value)

  const openPicker = () => {
    const el = ref.current
    if (!el) return
    try { el.showPicker() } catch { el.focus() }
  }

  return (
    <div className={`inp datefield ${className}`.trim()} style={style} onClick={openPicker}>
      <span className={display ? 'datefield-value' : 'datefield-placeholder'}>
        {display || placeholder}
      </span>
      <input
        ref={ref}
        type="date"
        className="datefield-native"
        id={id}
        required={required}
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        aria-label="Date"
      />
    </div>
  )
}
