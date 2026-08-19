import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Debts() {
  const [debts, setDebts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [payDebt, setPayDebt] = useState(null)
  const [form, setForm] = useState({ kind: 'lent', person: '', amount: '', due: '', note: '' })
  const [payForm, setPayForm] = useState({ amount: '', note: '' })
  const [error, setError] = useState('')

  const load = () => api.get('/debts').then(r => setDebts(r.data))
  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/debts', { ...form, amount: Number(form.amount), due: form.due || undefined })
      setShowForm(false)
      setForm({ kind: 'lent', person: '', amount: '', due: '', note: '' })
      load()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save')
    }
  }

  const submitPayment = async e => {
    e.preventDefault()
    try {
      await api.post(`/debts/${payDebt.id}/payments`, { amount: Number(payForm.amount), note: payForm.note })
      setPayDebt(null)
      setPayForm({ amount: '', note: '' })
      load()
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to record payment')
    }
  }

  const del = async id => {
    if (!confirm('Delete this debt?')) return
    await api.delete(`/debts/${id}`)
    load()
  }

  const open = debts.filter(d => !d.settled)
  const settled = debts.filter(d => d.settled)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Debts & Lending</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700">
          + Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <select value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="lent">I lent money</option>
              <option value="borrowed">I borrowed money</option>
            </select>
            <input type="text" placeholder="Person name" required value={form.person}
              onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Amount" required value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="date" placeholder="Due date (optional)" value={form.due}
              onChange={e => setForm(f => ({ ...f, due: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <input type="text" placeholder="Note (optional)" value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-1.5">Cancel</button>
          </div>
        </form>
      )}

      {payDebt && (
        <form onSubmit={submitPayment} className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 space-y-3">
          <p className="text-sm font-medium">Record payment from <strong>{payDebt.person}</strong> — remaining ৳{payDebt.remaining.toLocaleString()}</p>
          <div className="flex gap-3">
            <input type="number" placeholder="Payment amount" required value={payForm.amount}
              onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1" />
            <input type="text" placeholder="Note (optional)" value={payForm.note}
              onChange={e => setPayForm(f => ({ ...f, note: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-amber-500 text-white px-4 py-1.5 rounded-lg text-sm">Record</button>
            <button type="button" onClick={() => setPayDebt(null)} className="text-sm text-gray-500 px-4 py-1.5">Cancel</button>
          </div>
        </form>
      )}

      <DebtTable title="Open" debts={open} onPay={setPayDebt} onDelete={del} />
      {settled.length > 0 && <DebtTable title="Settled" debts={settled} onDelete={del} />}
    </div>
  )
}

function DebtTable({ title, debts, onPay, onDelete }) {
  if (debts.length === 0) return null
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h2>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Person</th>
              <th className="px-4 py-3 text-left">Kind</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-right">Paid</th>
              <th className="px-4 py-3 text-right">Remaining</th>
              <th className="px-4 py-3 text-left">Due</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {debts.map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{d.person}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${d.kind === 'lent' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                    {d.kind}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">৳{d.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-green-600">৳{d.paidAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-medium text-red-600">৳{d.remaining.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{d.due || '—'}</td>
                <td className="px-4 py-3 text-right flex gap-2 justify-end">
                  {!d.settled && onPay && (
                    <button onClick={() => onPay(d)} className="text-indigo-500 hover:text-indigo-700 text-xs">Pay</button>
                  )}
                  <button onClick={() => onDelete(d.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
