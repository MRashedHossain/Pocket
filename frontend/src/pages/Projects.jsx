import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', target: '', note: '' })

  const load = () => api.get('/projects').then(r => setProjects(r.data))
  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault()
    await api.post('/projects', { ...form, target: Number(form.target) || 0 })
    setShowForm(false)
    setForm({ name: '', target: '', note: '' })
    load()
  }

  const del = async id => {
    if (!confirm('Delete project?')) return
    await api.delete(`/projects/${id}`)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">Projects</h1>
        <button onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-indigo-700">
          + New project
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input type="text" placeholder="Project name" required value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm col-span-2" />
            <input type="number" placeholder="Target amount (0 = open)" value={form.target}
              onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input type="text" placeholder="Note (optional)" value={form.note}
              onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 px-4 py-1.5">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <p className="text-gray-400 text-sm">No projects yet</p>
        ) : projects.map(p => {
          const total = p.contributions.reduce((s, c) => s + c.amount, 0)
          const pct = p.target ? Math.min(Math.round(total / p.target * 100), 100) : 0
          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.note && <p className="text-xs text-gray-400 mt-0.5">{p.note}</p>}
                </div>
                <button onClick={() => del(p.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
              </div>
              {p.target > 0 && (
                <>
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-2">
                    <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>৳{total.toLocaleString()} raised</span>
                    <span>৳{p.target.toLocaleString()} target ({pct}%)</span>
                  </div>
                </>
              )}
              <div className="mt-3 flex flex-wrap gap-1">
                {p.members.map(m => (
                  <span key={m} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">{m}</span>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
