import { useEffect, useState } from 'react'

// The native <input type="date"> renders in the browser/OS locale (often
// MM/DD/YYYY) and that can't be overridden. DateField is a plain text field that
// always shows and accepts DD-MM-YYYY, while storing the canonical YYYY-MM-DD
// string its callers expect.

export function isoToDisplay(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${d}-${m}-${y}`
}

export function displayToIso(s) {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec((s || '').trim())
  if (!m) return null
  const [, dd, mm, yyyy] = m
  const dt = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`)
  if (Number.isNaN(dt.getTime())) return null
  // reject impossible dates that JS would roll over (e.g. 31-02-2026)
  if (dt.getUTCMonth() + 1 !== Number(mm) || dt.getUTCDate() !== Number(dd)) return null
  return `${yyyy}-${mm}-${dd}`
}

export default function DateField({
  value, onChange, required, id,
  className = 'inp', style, placeholder = 'DD-MM-YYYY',
}) {
  const [text, setText] = useState(() => isoToDisplay(value))

  // Re-sync when the parent changes value out from under us (e.g. form reset
  // after submit). Skip while the user is mid-edit and the text already means
  // the same date.
  useEffect(() => {
    setText(cur => (displayToIso(cur) === value ? cur : isoToDisplay(value)))
  }, [value])

  const handle = e => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    let out = digits
    if (digits.length > 4) out = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`
    else if (digits.length > 2) out = `${digits.slice(0, 2)}-${digits.slice(2)}`
    setText(out)

    const iso = displayToIso(out)
    if (iso) onChange(iso)
    else if (out === '') onChange('')
  }

  // Snap back to the last valid value if the field is left half-typed.
  const handleBlur = () => {
    if (text !== '' && !displayToIso(text)) setText(isoToDisplay(value))
  }

  return (
    <input
      id={id} className={className} style={style}
      type="text" inputMode="numeric" autoComplete="off"
      placeholder={placeholder} required={required}
      value={text} onChange={handle} onBlur={handleBlur}
    />
  )
}
