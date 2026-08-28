// A real <input type="date"> (so iOS/Android show their native date picker and
// the browser handles `required` validation) laid transparently over a display
// layer that always reads DD-MM-YYYY. The native input's own text renders in the
// OS locale — usually MM/DD/YYYY — so we hide it and show our own formatting.

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
  const display = isoToDisplay(value)
  return (
    <div className={`inp datefield ${className}`.trim()} style={style}>
      <span className={display ? 'datefield-value' : 'datefield-placeholder'}>
        {display || placeholder}
      </span>
      <input
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
