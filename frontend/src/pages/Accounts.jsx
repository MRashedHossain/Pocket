import { useEffect, useState } from 'react'
import api from '../api/client'

const TYPES = ['cash', 'bank', 'mobile_banking', 'card']

export default function Accounts() {
  const [accounts, setAccounts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'cash', balance: '', note: '' })

  const load = () => api.get('/accounts').then(r => setAccounts(r.data))
  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault()
    await api.post('/accounts', { ...form, balance: Number(form.balance) })
    setShowForm(false)
    setForm({ name: '', type: 'cash', balance: '', note: '' })
    load()
  }

  const del = async id => {
    if (!confirm('Delete account?')) return
    await api.delete(`/accounts/${id}`)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Accounts & Wallets</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700">
          + Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Account name" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="number" placeholder="Opening balance" value={form.balance}
              onChange={e => setForm(f => ({ ...f, balance: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="text" placeholder="Note (optional)" value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-1.5">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <p className="text-gray-400 text-sm">No accounts yet</p>
        ) : accounts.map(a => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{a.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{a.type}</p>
              </div>
              <button onClick={() => del(a.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
            </div>
            <p className="text-2xl font-bold mt-3">৳{a.balance.toLocaleString()}</p>
            {a.note && <p className="text-xs text-gray-400 mt-1">{a.note}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
