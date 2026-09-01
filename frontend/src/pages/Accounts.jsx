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
  const [editAccount, setEditAccount] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', type: 'cash', note: '', dir: 'add', amount: '' })
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

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

  const openEdit = (a, dir = 'add') => {
    setEditAccount(a)
    setEditForm({ name: a.name, type: a.type, note: a.note || '', dir, amount: '' })
    setEditError('')
  }

  const submitEdit = async e => {
    e.preventDefault()
    if (editSaving) return
    setEditError('')
    const amt = Math.floor(Number(editForm.amount)) || 0
    let balance = editAccount.balance
    if (amt > 0) balance = editForm.dir === 'spend' ? balance - amt : balance + amt
    if (balance < 0) { setEditError('That would take the balance below zero.'); return }
    setEditSaving(true)
    try {
      await api.patch(`/accounts/${editAccount.id}`, {
        name: editForm.name,
        type: editForm.type,
        note: editForm.note,
        balance,
      })
      setEditAccount(null); load()
    } catch (err) {
      setEditError(err.response?.data?.error?.message || 'Could not update account')
    } finally { setEditSaving(false) }
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
        <div className="entity-grid">
          {accounts.map(a => (
            <div key={a.id} className="card">
              <div className="entity-card-head">
                <div className="title-block" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 42, height: 42, borderRadius: 12, background: TYPE_BG[a.type] || '#f0e5d7', display: 'grid', placeItems: 'center', fontSize: 18, color: TYPE_COLORS[a.type] || '#6f6880', flexShrink: 0 }}>
                    {a.type === 'cash' ? '💵' : a.type === 'bank' ? '🏦' : a.type === 'mobile_banking' ? '📱' : '💳'}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontFamily: '"Bricolage Grotesque"', fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</div>
                    <div style={{ fontSize: 12.5, color: '#6f6880', fontWeight: 700, textTransform: 'capitalize' }}>{a.type.replace('_', ' ')}</div>
                  </div>
                </div>
                <div className="entity-card-actions">
                  <button className="act-edit" onClick={() => openEdit(a)}>Edit</button>
                  <button className="act-del" onClick={() => del(a.id)}>Delete</button>
                </div>
              </div>
              <div className="figure" style={{ fontSize: 30 }}>৳{a.balance.toLocaleString()}</div>
              {a.note && <p style={{ fontSize: 13, color: '#6f6880', margin: '8px 0 0' }}>{a.note}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button className="btn-ghost" style={{ flex: 1, minHeight: 38, fontSize: 13.5 }} onClick={() => openEdit(a, 'add')}>+ Add money</button>
                <button className="btn-ghost" style={{ flex: 1, minHeight: 38, fontSize: 13.5 }} onClick={() => openEdit(a, 'spend')}>− Spend</button>
              </div>
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

      {editAccount && (
        <Modal title={`Edit ${editAccount.name}`} onClose={() => setEditAccount(null)}>
          <form onSubmit={submitEdit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="lbl">Name</label>
              <input className="inp" type="text" required value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="lbl">Type</label>
              <select className="inp" value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))}>
                {TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Note</label>
              <input className="inp" type="text" placeholder="Personal MFS" value={editForm.note} onChange={e => setEditForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div>
              <label className="lbl">Adjust balance — current ৳{editAccount.balance.toLocaleString()}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select className="inp" style={{ flex: '0 0 110px' }} value={editForm.dir} onChange={e => setEditForm(f => ({ ...f, dir: e.target.value }))}>
                  <option value="add">Add</option>
                  <option value="spend">Spend</option>
                </select>
                <input className="inp tnum" type="number" min="0" step="1" placeholder="0" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <p style={{ margin: '6px 0 0', color: '#6f6880', fontSize: 12 }}>Leave at 0 to keep the balance unchanged.</p>
            </div>
            {editError && <div style={{ background: '#ffe9e3', color: '#c0392b', fontSize: 13, fontWeight: 600, padding: '8px 12px', borderRadius: 10 }}>{editError}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setEditAccount(null)}>Never mind</button>
              <button type="submit" className="btn-violet" disabled={editSaving}>{editSaving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
