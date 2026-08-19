import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => { api.get('/settings').then(r => setSettings(r.data)) }, [])

  const save = async e => {
    e.preventDefault()
    await api.patch('/settings', settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!settings) return <p className="text-gray-400">Loading…</p>

  return (
    <div className="max-w-md">
      <h1 className="text-xl font-semibold mb-6">Settings</h1>
      <form onSubmit={save} className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-gray-700">Currency symbol</label>
          <input type="text" value={settings.currencySymbol}
            onChange={e => setSettings(s => ({ ...s, currencySymbol: e.target.value }))}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Display density</label>
          <select value={settings.density}
            onChange={e => setSettings(s => ({ ...s, density: e.target.value }))}
            className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option>Comfortable</option>
            <option>Compact</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="showTrend" checked={settings.showTrend}
            onChange={e => setSettings(s => ({ ...s, showTrend: e.target.checked }))}
            className="h-4 w-4 text-indigo-600 rounded" />
          <label htmlFor="showTrend" className="text-sm text-gray-700">Show trend chart on dashboard</label>
        </div>
        <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">
          {saved ? 'Saved!' : 'Save settings'}
        </button>
      </form>
    </div>
  )
}
