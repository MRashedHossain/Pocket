import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Settings() {
  const [settings, setSettings] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => { api.get('/settings').then(r => setSettings(r.data)).catch(() => {}) }, [])

  const save = async e => {
    e.preventDefault()
    await api.patch('/settings', settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (!settings) return <p style={{ color: '#6f6880' }}>Loading…</p>

  return (
    <>
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>Settings</h1>
        <p style={{ margin: '4px 0 0', color: '#6f6880', fontSize: 14 }}>Preferences and display options</p>
      </div>

      <form onSubmit={save} style={{ maxWidth: 480 }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="lbl" htmlFor="currency">Currency symbol</label>
            <input className="inp" id="currency" type="text" value={settings.currencySymbol}
              onChange={e => setSettings(s => ({ ...s, currencySymbol: e.target.value }))} />
          </div>
          <div>
            <label className="lbl" htmlFor="density">Display density</label>
            <select className="inp" id="density" value={settings.density}
              onChange={e => setSettings(s => ({ ...s, density: e.target.value }))}>
              <option>Comfortable</option>
              <option>Compact</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input type="checkbox" id="showTrend" checked={settings.showTrend}
              onChange={e => setSettings(s => ({ ...s, showTrend: e.target.checked }))}
              style={{ width: 18, height: 18, accentColor: '#7b5cf0', cursor: 'pointer' }} />
            <label htmlFor="showTrend" style={{ fontSize: 15, cursor: 'pointer' }}>Show trend chart on dashboard</label>
          </div>
          <button type="submit" className="btn-violet" style={{ alignSelf: 'flex-start' }}>
            {saved ? '✓ Saved' : 'Save settings'}
          </button>
        </div>
      </form>
    </>
  )
}
