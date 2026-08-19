import { useEffect, useState } from 'react'
import api from '../api/client'

const METHODS = ['Cash', 'bKash', 'Card', 'Bank transfer']
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

export default function Expenses() {
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), category: '', amount: '', note: '', method: 'Cash' })
  const [error, setError] = useState('')

  const load = () => api.get(`/expenses?month=${month}`).then(r => setItems(r.data)).catch(() => {})
  useEffect(() => { load() }, [month])
  useEffect(() => {
    api.get('/expense-categories').then(r => { setCats(r.data || []); if (r.data?.length) setForm(f => ({ ...f, category: r.data[0].name })) }).catch(() => {})
  }, [])

  const submit = async e => {
    e.preventDefault(); setError('')
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) })
      setModal(false)
      setForm({ date: new Date().toISOString().slice(0, 10), category: cats[0]?.name || '', amount: '', note: '', method: 'Cash' })
      load()
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to save') }
  }

  const del = async id => {
    if (!confirm('Delete this expense?')) return
    await api.delete(`/expenses/${id}`); load()
  }

  const colorFor = cat => COLORS[cats.findIndex(c => c.name === cat) % COLORS.length] || COLORS[0]
  const ml = month ? mNames[Number(month.split('-')[1]) - 1] + ' ' + month.split('-')[0] : ''

  return (
    <>
      <div className="page-topbar" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Expenses</h1>
          <p style={{ margin: '4px 0 0', color: '#6f6880', fontSize: 14 }}>{items.length} expenses in {ml}</p>
        </div>
        <div className="topbar-controls">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="inp" style={{ width: 'auto', minHeight: 40, padding: '8px 14px', fontSize: 14 }} />
          <button className="btn-violet" onClick={() => setModal(true)} style={{ minHeight: 40, padding: '8px 20px', fontSize: 14, flexShrink: 0 }}>+ Add expense</button>
        </div>
      </div>

      <div className="card table-wrap" style={{ padding: 0 }}>
        <table className="pocket-table" style={{ minWidth: 580 }}>
          <thead>
            <tr>
              <th>Date</th><th>Category</th><th>Note</th><th>Method</th><th style={{ textAlign: 'right' }}>Amount</th><th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#6f6880', padding: '32px 16px' }}>No expenses this month</td></tr>
            ) : items.map(e => (
              <tr key={e.id}>
                <td data-label="Date" style={{ color: '#6f6880', fontSize: 14 }}>{e.date}</td>
                <td data-label="Category">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: colorFor(e.category), flexShrink: 0 }} />
                    {e.category}
                  </span>
                </td>
                <td data-label="Note" style={{ color: '#6f6880' }}>{e.note}</td>
                <td data-label="Method" style={{ color: '#6f6880' }}>{e.method}</td>
                <td data-label="Amount" style={{ fontWeight: 700 }} className="tnum">৳{e.amount.toLocaleString()}</td>
                <td data-label="">
                  <button onClick={() => del(e.id)} style={{ background: 'none', border: 0, cursor: 'pointer', color: '#b0a8bd', fontSize: 13, fontWeight: 700, padding: '5px 9px', borderRadius: 999 }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ff6a4d'; e.currentTarget.style.background = '#ffe9e3' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#b0a8bd'; e.currentTarget.style.background = 'none' }}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title="Log an expense" onClose={() => setModal(false)}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-row">
              <div>
                <label className="lbl">Date</label>
                <input className="inp" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div>
                <label className="lbl">Category</label>
                {cats.length > 0
                  ? <select className="inp" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>{cats.map(c => <option key={c.id}>{c.name}</option>)}</select>
                  : <input className="inp" placeholder="e.g. Groceries" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                }
              </div>
            </div>
            <div className="form-row">
              <div>
                <label className="lbl">Amount (৳)</label>
                <input className="inp tnum" type="number" min="0" step="1" required placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label className="lbl">Method</label>
                <select className="inp" value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}>{METHODS.map(m => <option key={m}>{m}</option>)}</select>
              </div>
            </div>
            <div>
              <label className="lbl">Note</label>
              <input className="inp" type="text" placeholder="What was it for?" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            {error && <div style={{ background: '#ffe3dc', color: '#9c2f1a', borderRadius: 14, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setModal(false)}>Never mind</button>
              <button type="submit" className="btn-violet">Log it</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
