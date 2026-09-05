import { useEffect, useState } from 'react'
import api from '../api/client'

const COLORS = ['#ff6a4d', '#7b5cf0', '#0fb3a3', '#f9a825', '#2f9bff', '#ff5fa2', '#7fc244']
const mNames = ['January','February','March','April','May','June','July','August','September','October','November','December']

function Modal({ title, onClose, children }) {
  return (
    <div onClick={onClose} className="modal-overlay">
      <div onClick={e => e.stopPropagation()} className="modal-box">
        <h3 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{title}</h3>
        {children}
      </div>
    </div>
  )
}

export default function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [cats, setCats] = useState([])
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [modal, setModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ category: '', limit: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const openAdd = () => { setEditingId(null); setForm({ category: '', limit: '' }); setError(''); setModal(true) }
  const openEdit = b => { setEditingId(b.id); setForm({ category: b.category, limit: String(b.limit) }); setError(''); setModal(true) }
  const closeModal = () => { setModal(false); setEditingId(null) }

  const load = () => api.get(`/budgets?month=${month}`).then(r => setBudgets(r.data)).catch(() => {})
  useEffect(() => { load() }, [month])
  useEffect(() => {
    api.get('/expense-categories').then(r => setCats(r.data || [])).catch(() => {})
  }, [])

  const submit = async e => {
    e.preventDefault()
    if (saving) return
    setError(''); setSaving(true)
    try {
      const payload = { category: form.category, month, limit: Number(form.limit) }
      if (editingId) await api.patch(`/budgets/${editingId}`, payload)
      else await api.post('/budgets', payload)
      closeModal(); setForm({ category: '', limit: '' }); load()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not save budget')
    } finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete budget?')) return
    await api.delete(`/budgets/${id}`); load()
  }

  const ml = month ? mNames[Number(month.split('-')[1]) - 1] + ' ' + month.split('-')[0] : ''
  const overCount = budgets.filter(b => b.overLimit).length

  return (
    <>
      <div className="page-topbar" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Budgets</h1>
          <p style={{ margin: '4px 0 0', color: '#6f6880', fontSize: 14 }}>
            {ml}{overCount > 0 ? ` · ${overCount} over limit` : ''}
          </p>
        </div>
        <div className="topbar-controls">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="inp" style={{ width: 'auto', minHeight: 40, padding: '8px 14px', fontSize: 14 }} />
          <button className="btn-violet" onClick={openAdd} style={{ minHeight: 40, padding: '8px 20px', fontSize: 14, flexShrink: 0 }}>+ Add budget</button>
        </div>
      </div>

      {budgets.length === 0 ? (
        <p style={{ color: '#6f6880' }}>No budgets for this month. Add one to start nudging yourself.</p>
      ) : (
        <div className="entity-grid">
          {budgets.map((b, i) => {
            const pct = b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0
            const color = b.overLimit ? '#ff6a4d' : COLORS[i % COLORS.length]
            return (
              <div key={b.id} className="card" style={{ border: b.overLimit ? '1px solid #ffd9cf' : '1px solid #f0e5d7' }}>
                <div className="entity-card-head">
                  <div className="title-block" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontFamily: '"Bricolage Grotesque"', fontSize: 16 }}>{b.category}</span>
                    {b.overLimit && <span style={{ fontSize: 12, fontWeight: 700, color: '#9c3a22', background: '#ffe3dc', borderRadius: 999, padding: '3px 10px' }}>Over limit</span>}
                  </div>
                  <div className="entity-card-actions">
                    <button className="act-edit" onClick={() => openEdit(b)}>Edit</button>
                    <button className="act-del" onClick={() => del(b.id)}>Delete</button>
                  </div>
                </div>
                <div style={{ height: 8, background: '#f0e5d7', borderRadius: 999, overflow: 'hidden', marginBottom: 10 }}>
                  <div style={{ height: 8, background: color, borderRadius: 999, width: `${pct}%`, transition: 'width 0.3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6f6880' }}>
                  <span>৳{b.spent.toLocaleString()} spent</span>
                  <span style={{ fontWeight: 700, color: '#241f2e' }}>৳{b.limit.toLocaleString()} cap</span>
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: b.overLimit ? '#9c3a22' : '#0b6b52', fontWeight: 700 }}>
                  {b.overLimit ? `৳${b.remaining.toLocaleString()} over` : `৳${b.remaining.toLocaleString()} left`}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <Modal title={editingId ? 'Edit budget cap' : 'Set a budget cap'} onClose={closeModal}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="lbl">Category</label>
              {cats.length === 0 ? (
                <input className="inp" type="text" placeholder="e.g. Groceries" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
              ) : (
                <select className="inp" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  <option value="">Select category…</option>
                  {cats.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="lbl">Monthly cap (৳)</label>
              <input className="inp tnum" type="number" min="0" step="500" placeholder="0" required value={form.limit} onChange={e => setForm(f => ({ ...f, limit: e.target.value }))} />
            </div>
            {error && <div style={{ background: '#ffe3dc', color: '#9c2f1a', borderRadius: 14, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={closeModal}>Never mind</button>
              <button type="submit" className="btn-violet" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
