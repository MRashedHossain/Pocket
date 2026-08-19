import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Budgets() {
  const [budgets, setBudgets] = useState([])
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ category: '', limit: '' })

  const load = () => api.get(`/budgets?month=${month}`).then(r => setBudgets(r.data))
  useEffect(() => { load() }, [month])

  const submit = async e => {
    e.preventDefault()
    await api.post('/budgets', { category: form.category, month, limit: Number(form.limit) })
    setShowForm(false)
    setForm({ category: '', limit: '' })
    load()
  }

  const del = async id => {
    if (!confirm('Delete budget?')) return
    await api.delete(`/budgets/${id}`)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Budgets</h1>
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
          <div className="flex gap-3">
            <input type="text" placeholder="Category" required value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1" />
            <input type="number" placeholder="Monthly limit" required value={form.limit}
              onChange={e => setForm(f => ({ ...f, limit: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-40" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-1.5">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {budgets.length === 0 ? (
          <p className="text-gray-400 text-sm">No budgets for this month</p>
        ) : budgets.map(b => (
          <div key={b.id} className={`bg-white rounded-xl border p-5 ${b.overLimit ? 'border-red-200' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{b.category}</span>
              <div className="flex items-center gap-3">
                {b.overLimit && <span className="text-xs text-red-600 font-medium">Over limit</span>}
                <button onClick={() => del(b.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full ${b.overLimit ? 'bg-red-500' : 'bg-indigo-500'}`}
                style={{ width: `${Math.min((b.spent / b.limit) * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Spent ৳{b.spent.toLocaleString()}</span>
              <span>Limit ৳{b.limit.toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
