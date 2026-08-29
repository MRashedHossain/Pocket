import { useEffect, useState } from 'react'
import api from '../api/client'

const TYPES = ['cash', 'bank', 'mobile_banking', 'card']
const TYPE_COLORS = { cash: '#f9a825', bank: '#2f9bff', mobile_banking: '#0fb3a3', card: '#7b5cf0' }
const TYPE_BG = { cash: '#fff1cc', bank: '#ddeeff', mobile_banking: '#dcf7ea', card: '#eae1ff' }

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

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'cash', balance: '', note: '' })
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/accounts').then(r => setAccounts(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    try {
      await api.post('/accounts', { ...form, balance: Number(form.balance) })
      setModal(false); setForm({ name: '', type: 'cash', balance: '', note: '' }); load()
    } finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete account?')) return
    await api.delete(`/accounts/${id}`); load()
  }

  const total = accounts.reduce((s, a) => s + a.balance, 0)

  return (
    <>
      <div className="page-topbar" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Accounts & Wallets</h1>
          <p style={{ margin: '4px 0 0', color: '#6f6880', fontSize: 14 }}>{accounts.length} accounts · ৳{total.toLocaleString()} total</p>
        </div>
        <button className="btn-violet" onClick={() => setModal(true)} style={{ minHeight: 40, padding: '8px 20px', fontSize: 14, flexShrink: 0 }}>+ Add account</button>
      </div>

      {accounts.length === 0 ? (
        <p style={{ color: '#6f6880' }}>No accounts yet. Add your cash, bank, or mobile banking accounts.</p>
      ) : (
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
          {accounts.map(a => (
            <div key={a.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 36, height: 36, borderRadius: 10, background: TYPE_BG[a.type] || '#f0e5d7', display: 'grid', placeItems: 'center', fontSize: 16, color: TYPE_COLORS[a.type] || '#6f6880' }}>
                    {a.type === 'cash' ? '💵' : a.type === 'bank' ? '🏦' : a.type === 'mobile_banking' ? '📱' : '💳'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: '"Bricolage Grotesque"', fontSize: 15 }}>{a.name}</div>
                    <div style={{ fontSize: 12, color: '#6f6880', fontWeight: 700, textTransform: 'capitalize' }}>{a.type.replace('_', ' ')}</div>
                  </div>
                </div>
                <button onClick={() => del(a.id)} style={{ background: 'none', border: 0, cursor: 'pointer', color: '#b0a8bd', fontSize: 13, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ff6a4d'; e.currentTarget.style.background = '#ffe9e3' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#b0a8bd'; e.currentTarget.style.background = 'none' }}>Delete</button>
              </div>
              <div className="figure" style={{ marginTop: 16, fontSize: 28 }}>৳{a.balance.toLocaleString()}</div>
              {a.note && <p style={{ fontSize: 13, color: '#6f6880', marginTop: 6 }}>{a.note}</p>}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal title="Add account" onClose={() => setModal(false)}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="lbl">Name</label>
              <input className="inp" type="text" placeholder="bKash" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="lbl">Type</label>
              <select className="inp" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Opening balance (৳)</label>
              <input className="inp tnum" type="number" min="0" placeholder="0" value={form.balance} onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} />
            </div>
            <div>
              <label className="lbl">Note</label>
              <input className="inp" type="text" placeholder="Personal MFS" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setModal(false)}>Never mind</button>
              <button type="submit" className="btn-violet" disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
