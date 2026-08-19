import { useEffect, useState } from 'react'
import api from '../api/client'

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

function KindChip({ kind }) {
  const lent = kind === 'lent'
  return (
    <span style={{ background: lent ? '#eae1ff' : '#ffe3dc', color: lent ? '#54407f' : '#9c3a22', borderRadius: 999, padding: '4px 12px', fontSize: 12.5, fontWeight: 700 }}>
      {lent ? 'Lent out' : 'Borrowed'}
    </span>
  )
}

export default function Debts() {
  const [debts, setDebts] = useState([])
  const [modal, setModal] = useState(null)
  const [payDebt, setPayDebt] = useState(null)
  const [form, setForm] = useState({ kind: 'lent', person: '', amount: '', due: '', note: '' })
  const [payForm, setPayForm] = useState({ amount: '', note: '' })
  const [error, setError] = useState('')

  const load = () => api.get('/debts').then(r => setDebts(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault(); setError('')
    try {
      await api.post('/debts', { ...form, amount: Number(form.amount), due: form.due || undefined })
      setModal(null); setForm({ kind: 'lent', person: '', amount: '', due: '', note: '' }); load()
    } catch (err) { setError(err.response?.data?.error?.message || 'Failed to save') }
  }

  const submitPayment = async e => {
    e.preventDefault()
    try {
      await api.post(`/debts/${payDebt.id}/payments`, { amount: Number(payForm.amount), note: payForm.note })
      setPayDebt(null); setPayForm({ amount: '', note: '' }); load()
    } catch (err) { alert(err.response?.data?.error?.message || 'Failed') }
  }

  const del = async id => {
    if (!confirm('Delete this debt?')) return
    await api.delete(`/debts/${id}`); load()
  }

  const open = debts.filter(d => !d.settled)
  const settled = debts.filter(d => d.settled)

  return (
    <>
      <div className="page-topbar" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Debts & Lending</h1>
          <p style={{ margin: '4px 0 0', color: '#6f6880', fontSize: 14 }}>{open.length} open · {settled.length} settled</p>
        </div>
        <button className="btn-violet" onClick={() => setModal('add')} style={{ minHeight: 40, padding: '8px 20px', fontSize: 14 }}>+ Add debt</button>
      </div>

      {open.length > 0 && (
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6f6880', marginBottom: 12 }}>Open</div>
          <div className="card table-wrap" style={{ padding: 0 }}>
            <table className="pocket-table" style={{ minWidth: 600 }}>
              <thead><tr>
                <th>Person</th><th>Kind</th><th>Note</th><th style={{ textAlign: 'right' }}>Total</th>
                <th style={{ textAlign: 'right' }}>Paid</th><th style={{ textAlign: 'right' }}>Remaining</th><th>Due</th><th />
              </tr></thead>
              <tbody>
                {open.map(d => (
                  <tr key={d.id}>
                    <td style={{ fontWeight: 700 }}>{d.person}</td>
                    <td><KindChip kind={d.kind} /></td>
                    <td style={{ color: '#6f6880', fontSize: 14 }}>{d.note || '—'}</td>
                    <td style={{ textAlign: 'right' }} className="tnum">৳{d.amount.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: '#0b6b52', fontWeight: 700 }} className="tnum">৳{d.paidAmount.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', color: '#9c3a22', fontWeight: 700 }} className="tnum">৳{d.remaining.toLocaleString()}</td>
                    <td style={{ color: '#6f6880', fontSize: 14 }}>{d.due || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => setPayDebt(d)} style={{ background: 'none', border: 0, cursor: 'pointer', color: '#7b5cf0', fontSize: 13, fontWeight: 700, padding: '5px 9px', borderRadius: 999 }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#eae1ff' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}>Pay</button>
                        <button onClick={() => del(d.id)} style={{ background: 'none', border: 0, cursor: 'pointer', color: '#b0a8bd', fontSize: 13, fontWeight: 700, padding: '5px 9px', borderRadius: 999 }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#ff6a4d'; e.currentTarget.style.background = '#ffe9e3' }}
                          onMouseLeave={e => { e.currentTarget.style.color = '#b0a8bd'; e.currentTarget.style.background = 'none' }}>Delete</button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {settled.length > 0 && (
        <section>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6f6880', marginBottom: 12 }}>Settled</div>
          <div className="card table-wrap" style={{ padding: 0 }}>
            <table className="pocket-table" style={{ minWidth: 440 }}>
              <thead><tr><th>Person</th><th>Kind</th><th>Note</th><th style={{ textAlign: 'right' }}>Amount</th><th /></tr></thead>
              <tbody>
                {settled.map(d => (
                  <tr key={d.id} style={{ opacity: 0.7 }}>
                    <td style={{ fontWeight: 700 }}>{d.person}</td>
                    <td><KindChip kind={d.kind} /></td>
                    <td style={{ color: '#6f6880', fontSize: 14 }}>{d.note || '—'}</td>
                    <td style={{ textAlign: 'right' }} className="tnum">৳{d.amount.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => del(d.id)} style={{ background: 'none', border: 0, cursor: 'pointer', color: '#b0a8bd', fontSize: 13, fontWeight: 700, padding: '5px 9px', borderRadius: 999 }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#ff6a4d'; e.currentTarget.style.background = '#ffe9e3' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#b0a8bd'; e.currentTarget.style.background = 'none' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {open.length === 0 && settled.length === 0 && (
        <p style={{ color: '#6f6880' }}>No debts recorded yet.</p>
      )}

      {modal === 'add' && (
        <Modal title="Add debt" onClose={() => setModal(null)}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {['lent', 'borrowed'].map(k => (
                <button key={k} type="button" onClick={() => setForm(f => ({ ...f, kind: k }))}
                  style={{ flex: 1, minHeight: 46, padding: '10px 16px', border: `2px solid ${form.kind === k ? '#7b5cf0' : '#f0e5d7'}`, borderRadius: 14, background: form.kind === k ? '#f4efff' : '#fff', color: form.kind === k ? '#7b5cf0' : '#6f6880', fontFamily: '"Bricolage Grotesque"', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  {k === 'lent' ? 'I lent it out' : 'I borrowed it'}
                </button>
              ))}
            </div>
            <div className="form-row">
              <div>
                <label className="lbl">Who</label>
                <input className="inp" type="text" placeholder="Rashed Karim" required value={form.person} onChange={e => setForm(f => ({ ...f, person: e.target.value }))} />
              </div>
              <div>
                <label className="lbl">Amount (৳)</label>
                <input className="inp tnum" type="number" min="0" step="100" placeholder="0" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label className="lbl">Pay back by</label>
                <input className="inp" type="date" value={form.due} onChange={e => setForm(f => ({ ...f, due: e.target.value }))} />
              </div>
              <div>
                <label className="lbl">What for</label>
                <input className="inp" type="text" placeholder="Covered his lunch tab" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            {error && <div style={{ background: '#ffe3dc', color: '#9c2f1a', borderRadius: 14, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Never mind</button>
              <button type="submit" className="btn-violet">Save</button>
            </div>
          </form>
        </Modal>
      )}

      {payDebt && (
        <Modal title={`Payment from ${payDebt.person}`} onClose={() => setPayDebt(null)}>
          <p style={{ margin: 0, color: '#6f6880', fontSize: 14 }}>Remaining: <strong style={{ color: '#241f2e' }}>৳{payDebt.remaining.toLocaleString()}</strong></p>
          <form onSubmit={submitPayment} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="lbl">Amount received (৳)</label>
              <input className="inp tnum" type="number" min="1" max={payDebt.remaining} required placeholder="0" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="lbl">Note</label>
              <input className="inp" type="text" placeholder="First instalment" value={payForm.note} onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setPayDebt(null)}>Cancel</button>
              <button type="submit" className="btn-violet">Record payment</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
