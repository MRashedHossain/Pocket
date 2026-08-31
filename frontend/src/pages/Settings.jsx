import { useEffect, useRef, useState } from 'react'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'

function CategoryChip({ cat, onRename, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(cat.name)
  const busy = useRef(false)

  const commit = async () => {
    if (busy.current) return
    const trimmed = draft.trim()
    setEditing(false)
    if (!trimmed || trimmed === cat.name) { setDraft(cat.name); return }
    busy.current = true
    try {
      await onRename(cat.id, trimmed)
    } catch {
      setDraft(cat.name)
    } finally {
      busy.current = false
    }
  }

  if (editing) {
    return (
      <input
        autoFocus
        className="inp"
        style={{ width: 140, minHeight: 32, padding: '4px 10px', fontSize: 13 }}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); commit() }
          if (e.key === 'Escape') { setDraft(cat.name); setEditing(false) }
        }}
      />
    )
  }

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0e5d7', borderRadius: 999, padding: '5px 8px 5px 14px', fontSize: 13, fontWeight: 700 }}>
      <button onClick={() => { setDraft(cat.name); setEditing(true) }} title="Rename"
        style={{ background: 'none', border: 0, cursor: 'pointer', color: 'inherit', padding: 0, font: 'inherit' }}>
        {cat.name}
      </button>
      <button onClick={() => onDelete(cat.id)} title="Delete"
        style={{ background: 'none', border: 0, cursor: 'pointer', color: '#b0a8bd', padding: '0 4px', lineHeight: 1, fontSize: 18 }}
        onMouseEnter={e => e.currentTarget.style.color = '#ff6a4d'}
        onMouseLeave={e => e.currentTarget.style.color = '#b0a8bd'}>×</button>
    </span>
  )
}

function CategoryManager({ title, cats, onAdd, onRename, onDelete }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const submit = async e => {
    e.preventDefault()
    if (saving) return
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await onAdd(trimmed)
      setName('')
    } finally { setSaving(false) }
  }
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 15 }}>{title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, minHeight: 28, alignItems: 'center' }}>
        {cats.length === 0
          ? <span style={{ fontSize: 13.5, color: '#b0a8bd' }}>No categories yet</span>
          : cats.map(c => (
            <CategoryChip key={c.id} cat={c} onRename={onRename} onDelete={onDelete} />
          ))}
      </div>
      <form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
        <input className="inp" style={{ flex: 1 }} placeholder="New category…" value={name}
          onChange={e => setName(e.target.value)} />
        <button type="submit" className="btn-violet" disabled={saving}
          style={{ flexShrink: 0, minHeight: 40, padding: '8px 16px', fontSize: 14 }}>{saving ? 'Adding…' : 'Add'}</button>
      </form>
    </div>
  )
}

export default function Settings() {
  const { user, logout } = useAuth()
  const [settings, setSettings] = useState(null)
  const [saved, setSaved] = useState(false)
  const [cats, setCats] = useState({ expense: [], income: [], debt: [] })

  useEffect(() => {
    api.get('/settings').then(r => setSettings(r.data)).catch(() => {})
    api.get('/expense-categories').then(r => setCats(c => ({ ...c, expense: r.data || [] }))).catch(() => {})
    api.get('/income/categories').then(r => setCats(c => ({ ...c, income: r.data || [] }))).catch(() => {})
    api.get('/debt-categories').then(r => setCats(c => ({ ...c, debt: r.data || [] }))).catch(() => {})
  }, [])

  const save = async e => {
    e.preventDefault()
    await api.patch('/settings', settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addCat = async (kind, name) => {
    const r = await api.post('/settings/categories', { name, kind })
    setCats(c => ({ ...c, [kind]: [...c[kind], r.data] }))
  }

  const renameCat = async (kind, id, name) => {
    const r = await api.patch(`/settings/categories/${id}`, { name })
    setCats(c => ({ ...c, [kind]: c[kind].map(x => x.id === id ? { ...x, name: r.data.name } : x) }))
  }

  const delCat = async (kind, id) => {
    await api.delete(`/settings/categories/${id}`)
    setCats(c => ({ ...c, [kind]: c[kind].filter(x => x.id !== id) }))
  }

  if (!settings) return <p style={{ color: '#6f6880' }}>Loading…</p>

  return (
    <>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Settings</h1>
        <p style={{ margin: '4px 0 0', color: '#6f6880', fontSize: 14 }}>Preferences and categories</p>
      </div>

      <form onSubmit={save} style={{ maxWidth: 480 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="lbl" htmlFor="currency">Currency symbol</label>
            <input className="inp" id="currency" type="text" value={settings.currencySymbol}
              onChange={e => setSettings(s => ({ ...s, currencySymbol: e.target.value }))} />
          </div>
          <div>
            <label className="lbl" htmlFor="density">Display density</label>
            <select className="inp" id="density" value={settings.density}
              onChange={e => setSettings(s => ({ ...s, density: e.target.value }))}>
              <option>Comfortable</option>
              <option>Compact</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="showTrend" checked={settings.showTrend}
              onChange={e => setSettings(s => ({ ...s, showTrend: e.target.checked }))}
              style={{ width: 18, height: 18, accentColor: '#7b5cf0', cursor: 'pointer' }} />
            <label htmlFor="showTrend" style={{ fontSize: 15, cursor: 'pointer' }}>Show trend chart on dashboard</label>
          </div>
          <button type="submit" className="btn-violet" style={{ alignSelf: 'flex-start' }}>
            {saved ? '✓ Saved' : 'Save settings'}
          </button>
        </div>
      </form>

      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6f6880', marginTop: 8 }}>Categories</div>
        <CategoryManager title="Expense categories" cats={cats.expense}
          onAdd={name => addCat('expense', name)} onRename={(id, name) => renameCat('expense', id, name)} onDelete={id => delCat('expense', id)} />
        <CategoryManager title="Income sources" cats={cats.income}
          onAdd={name => addCat('income', name)} onRename={(id, name) => renameCat('income', id, name)} onDelete={id => delCat('income', id)} />
        <CategoryManager title="Debt categories" cats={cats.debt}
          onAdd={name => addCat('debt', name)} onRename={(id, name) => renameCat('debt', id, name)} onDelete={id => delCat('debt', id)} />
      </div>

      <div style={{ maxWidth: 480, borderTop: '1px solid #f0e5d7', paddingTop: 20, marginTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: '#6f6880', marginTop: 2 }}>{user?.email}</div>
          </div>
          <button onClick={logout} className="btn-signout" style={{ flexShrink: 0 }}>
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}
