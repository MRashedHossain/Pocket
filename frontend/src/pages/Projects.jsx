import { useEffect, useState } from 'react'
import api from '../api/client'

const COLORS = ['#7b5cf0', '#0fb3a3', '#f9a825', '#ff6a4d', '#2f9bff', '#ff5fa2', '#7fc244']

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

function initials(name) {
  return String(name).split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({ name: '', target: '', note: '' })

  const load = () => api.get('/projects').then(r => setProjects(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const submit = async e => {
    e.preventDefault()
    await api.post('/projects', { ...form, target: Number(form.target) || 0 })
    setModal(null); setForm({ name: '', target: '', note: '' }); load()
  }

  const del = async id => {
    if (!confirm('Delete project?')) return
    await api.delete(`/projects/${id}`); load()
  }

  return (
    <>
      <div className="page-topbar" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Projects</h1>
          <p style={{ margin: '4px 0 0', color: '#6f6880', fontSize: 14 }}>{projects.length} pot{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-violet" onClick={() => setModal('new')} style={{ minHeight: 40, padding: '8px 20px', fontSize: 14, flexShrink: 0 }}>+ New pot</button>
      </div>

      {projects.length === 0 ? (
        <p style={{ color: '#6f6880' }}>No shared pots yet. Create one for a trip, event, or group goal.</p>
      ) : (
        <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
          {projects.map((p, idx) => {
            const total = (p.contributions || []).reduce((s, c) => s + c.amount, 0)
            const pct = p.target > 0 ? Math.min(Math.round(total / p.target * 100), 100) : 0
            const color = COLORS[idx % COLORS.length]
            return (
              <div key={p.id} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontFamily: '"Bricolage Grotesque"', fontSize: 16 }}>{p.name}</div>
                    {p.note && <div style={{ fontSize: 13, color: '#6f6880', marginTop: 2 }}>{p.note}</div>}
                  </div>
                  <button onClick={() => del(p.id)} style={{ background: 'none', border: 0, cursor: 'pointer', color: '#b0a8bd', fontSize: 13, fontWeight: 700, padding: '4px 8px', borderRadius: 999 }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ff6a4d'; e.currentTarget.style.background = '#ffe9e3' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#b0a8bd'; e.currentTarget.style.background = 'none' }}>Delete</button>
                </div>
                {p.target > 0 && (
                  <>
                    <div style={{ height: 8, background: '#f0e5d7', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
                      <div style={{ height: 8, background: color, borderRadius: 999, width: `${pct}%`, transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6f6880', marginBottom: 12 }}>
                      <span className="tnum">৳{total.toLocaleString()} raised</span>
                      <span className="tnum" style={{ fontWeight: 700, color: '#241f2e' }}>৳{p.target.toLocaleString()} · {pct}%</span>
                    </div>
                  </>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(p.members || []).map((m, i) => (
                    <span key={m} style={{ background: '#f0e5d7', color: '#241f2e', borderRadius: 999, padding: '4px 10px', fontSize: 12.5, fontWeight: 700 }}>{initials(m)}</span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal === 'new' && (
        <Modal title="Open a new pot" onClose={() => setModal(null)}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="lbl">Name</label>
              <input className="inp" type="text" placeholder="Sylhet trip" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="lbl">Target (৳, 0 = open-ended)</label>
              <input className="inp tnum" type="number" min="0" placeholder="0" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
            </div>
            <div>
              <label className="lbl">Note</label>
              <input className="inp" type="text" placeholder="Four families, three nights" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setModal(null)}>Never mind</button>
              <button type="submit" className="btn-violet">Create pot</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
