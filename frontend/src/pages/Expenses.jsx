import { useEffect, useState } from 'react'
import api from '../api/client'

const METHODS = ['Cash', 'bKash', 'Card', 'Bank transfer']

export default function Expenses() {
  const [items, setItems] = useState([])
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), category: '', amount: '', note: '', method: 'Cash' })
  const [error, setError] = useState('')

  const load = () => api.get(`/expenses?month=${month}`).then(r => setItems(r.data))
  useEffect(() => { load() }, [month])

  const submit = async e => {
    e.preventDefault()
    setError('')
    try {
      await api.post('/expenses', { ...form, amount: Number(form.amount) })
      setShowForm(false)
      setForm({ date: new Date().toISOString().slice(0, 10), category: '', amount: '', note: '', method: 'Cash' })
      load()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to save')
    }
  }

  const del = async id => {
    if (!confirm('Delete this expense?')) return
    await api.delete(`/expenses/${id}`)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Expenses</h1>
        <div className="flex gap-3">
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" />
          <button onClick={() => setShowForm(true)}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700">
            + Add
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <input type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="text" placeholder="Category" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="number" placeholder="Amount" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {METHODS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <input type="text" placeholder="Note (optional)" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <div className="flex gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-1.5">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-left">Category</th>
              <th className="px-4 py-3 text-left">Note</th>
              <th className="px-4 py-3 text-left">Method</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No expenses</td></tr>
            ) : items.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{e.date}</td>
                <td className="px-4 py-3">{e.category}</td>
                <td className="px-4 py-3 text-gray-500">{e.note}</td>
                <td className="px-4 py-3 text-gray-500">{e.method}</td>
                <td className="px-4 py-3 text-right font-medium">৳{e.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => del(e.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
