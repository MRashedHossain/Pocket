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
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', target: '', note: '' })
  const [addMemberProject, setAddMemberProject] = useState(null)
  const [memberEmail, setMemberEmail] = useState('')
  const [memberError, setMemberError] = useState('')
  const [memberLoading, setMemberLoading] = useState(false)
  const [contribProject, setContribProject] = useState(null)
  const [contribForm, setContribForm] = useState({ member: '', amount: '', txn: '' })
  const [contribError, setContribError] = useState('')
  const [contribLoading, setContribLoading] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => api.get('/projects').then(r => setProjects(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditingId(null); setForm({ name: '', target: '', note: '' }); setError(''); setModal('new') }
  const openEdit = p => { setEditingId(p.id); setForm({ name: p.name, target: String(p.target || ''), note: p.note || '' }); setError(''); setModal('new') }
  const closeModal = () => { setModal(null); setEditingId(null); setForm({ name: '', target: '', note: '' }) }

  const submit = async e => {
    e.preventDefault()
    if (saving) return
    setError(''); setSaving(true)
    try {
      const payload = { ...form, target: Number(form.target) || 0 }
      if (editingId) await api.patch(`/projects/${editingId}`, payload)
      else await api.post('/projects', payload)
      closeModal(); load()
    } catch (err) {
      setError(err.response?.data?.error?.message || (editingId ? 'Could not update project' : 'Could not create project'))
    } finally { setSaving(false) }
  }

  const del = async id => {
    if (!confirm('Delete project?')) return
    try {
      await api.delete(`/projects/${id}`); load()
    } catch (err) { alert(err.response?.data?.error?.message || 'Could not delete project') }
  }

  const openAddMember = (project) => {
    setAddMemberProject(project)
    setMemberEmail('')
    setMemberError('')
  }

  const submitAddMember = async e => {
    e.preventDefault()
    setMemberError('')
    setMemberLoading(true)
    try {
      const lookup = await api.get(`/users/lookup?email=${encodeURIComponent(memberEmail)}`)
      const name = lookup.data.name
      await api.post(`/projects/${addMemberProject.id}/members`, { name })
      setAddMemberProject(null)
      load()
    } catch (err) {
      setMemberError(err.response?.data?.error?.message || 'User not found')
    } finally {
      setMemberLoading(false)
    }
  }

  const openContribute = (project) => {
    setContribProject(project)
    setContribForm({ member: project.members?.[0] || '', amount: '', txn: '' })
    setContribError('')
  }

  const submitContribute = async e => {
    e.preventDefault()
    if (contribLoading) return
    setContribError('')
    setContribLoading(true)
    try {
      await api.post(`/projects/${contribProject.id}/contributions`, {
        member: contribForm.member,
        amount: Number(contribForm.amount) || 0,
        txn: contribForm.txn,
      })
      setContribProject(null)
      load()
    } catch (err) {
      setContribError(err.response?.data?.error?.message || 'Could not add money')
    } finally {
      setContribLoading(false)
    }
  }

  const removeMember = async (projectId, member) => {
    const project = projects.find(p => p.id === projectId)
    const members = await api.get(`/projects/${projectId}/members`)
    const m = members.data.find(m => m.name === member)
    if (!m) return
    try {
      await api.delete(`/projects/${projectId}/members/${m.id}`)
      load()
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Cannot remove member')
    }
  }

  return (
    <>
      <div className="page-topbar" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800 }}>Projects</h1>
          <p style={{ margin: '4px 0 0', color: '#6f6880', fontSize: 14 }}>{projects.length} pot{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-violet" onClick={openAdd} style={{ minHeight: 40, padding: '8px 20px', fontSize: 14, flexShrink: 0 }}>+ New pot</button>
      </div>

      {projects.length === 0 ? (
        <p style={{ color: '#6f6880' }}>No shared pots yet. Create one for a trip, event, or group goal.</p>
      ) : (
        <div className="entity-grid">
          {projects.map((p, idx) => {
            const total = (p.contributions || []).reduce((s, c) => s + c.amount, 0)
            const pct = p.target > 0 ? Math.min(Math.round(total / p.target * 100), 100) : 0
            const color = COLORS[idx % COLORS.length]
            return (
              <div key={p.id} className="card">
                <div className="entity-card-head">
                  <div className="title-block">
                    <div style={{ fontWeight: 700, fontFamily: '"Bricolage Grotesque"', fontSize: 17, lineHeight: 1.25 }}>{p.name}</div>
                    {p.note && <div style={{ fontSize: 13, color: '#6f6880', marginTop: 3 }}>{p.note}</div>}
                  </div>
                  <div className="entity-card-actions">
                    <button className="act-edit" onClick={() => openEdit(p)}>Edit</button>
                    <button className="act-del" onClick={() => del(p.id)}>Delete</button>
                  </div>
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
                {!(p.target > 0) && (
                  <div style={{ fontSize: 13, color: '#6f6880', marginBottom: 12 }}>
                    <span className="tnum" style={{ fontWeight: 700, color: '#241f2e' }}>৳{total.toLocaleString()}</span> raised
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                  {(p.members || []).map((m) => (
                    <span key={m} style={{ background: '#f0e5d7', color: '#241f2e', borderRadius: 999, padding: '4px 10px', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 18, height: 18, borderRadius: '50%', background: '#e2d4bf', display: 'grid', placeItems: 'center', fontSize: 10, flexShrink: 0 }}>{initials(m)}</span>
                      {m}
                      <button onClick={() => removeMember(p.id, m)} title="Remove" style={{ background: 'none', border: 0, cursor: 'pointer', color: '#b0a8bd', fontSize: 11, padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ff6a4d'}
                        onMouseLeave={e => e.currentTarget.style.color = '#b0a8bd'}>×</button>
                    </span>
                  ))}
                  <button onClick={() => openAddMember(p)} title="Add member" style={{ background: '#eae1ff', color: '#7b5cf0', border: 0, borderRadius: 999, padding: '4px 10px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
                </div>
                <button className="btn-violet" onClick={() => openContribute(p)} style={{ marginTop: 12, width: '100%', minHeight: 38, fontSize: 13.5 }}>+ Add money</button>
              </div>
            )
          })}
        </div>
      )}

      {modal === 'new' && (
        <Modal title={editingId ? 'Edit pot' : 'Open a new pot'} onClose={closeModal}>
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
            {error && <div style={{ background: '#ffe3dc', color: '#9c2f1a', borderRadius: 14, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}>{error}</div>}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={closeModal}>Never mind</button>
              <button type="submit" className="btn-violet" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create pot'}</button>
            </div>
          </form>
        </Modal>
      )}

      {contribProject && (
        <Modal title={`Add money to ${contribProject.name}`} onClose={() => setContribProject(null)}>
          <form onSubmit={submitContribute} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="lbl">Member</label>
              <select className="inp" required value={contribForm.member}
                onChange={e => setContribForm(f => ({ ...f, member: e.target.value }))}>
                {(contribProject.members || []).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Amount (৳)</label>
              <input className="inp tnum" type="number" min="1" required placeholder="500"
                value={contribForm.amount} onChange={e => setContribForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="lbl">Reference (bKash / bank txn)</label>
              <input className="inp" type="text" required placeholder="TXN123ABC"
                value={contribForm.txn} onChange={e => setContribForm(f => ({ ...f, txn: e.target.value }))} />
            </div>
            {contribError && (
              <div style={{ background: '#ffe3dc', color: '#9c2f1a', borderRadius: 14, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}>{contribError}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setContribProject(null)}>Cancel</button>
              <button type="submit" className="btn-violet" disabled={contribLoading}>{contribLoading ? 'Adding…' : 'Add money'}</button>
            </div>
          </form>
        </Modal>
      )}

      {addMemberProject && (
        <Modal title={`Add member to ${addMemberProject.name}`} onClose={() => setAddMemberProject(null)}>
          <form onSubmit={submitAddMember} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="lbl">Email address</label>
              <input className="inp" type="email" placeholder="friend@example.com" required autoFocus
                value={memberEmail} onChange={e => { setMemberEmail(e.target.value); setMemberError('') }} />
              <p style={{ margin: '6px 0 0', fontSize: 12.5, color: '#6f6880' }}>They must have a Pocket account.</p>
            </div>
            {memberError && (
              <div style={{ background: '#ffe3dc', color: '#9c2f1a', borderRadius: 14, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}>{memberError}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => setAddMemberProject(null)}>Cancel</button>
              <button type="submit" className="btn-violet" disabled={memberLoading}>{memberLoading ? 'Adding…' : 'Add member'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
