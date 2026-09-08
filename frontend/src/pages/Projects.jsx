import { useEffect, useState } from 'react'
import api from '../api/client'

const COLORS = ['#7b5cf0', '#0fb3a3', '#f9a825', '#ff6a4d', '#2f9bff', '#ff5fa2', '#7fc244']

// A debit takes money out of the pot; a credit puts money in. Net = credits − debits.
// Debit is the default — anything not explicitly "credit" counts as debit.
const isDebit = c => c.kind !== 'credit'
const signedAmount = c => (isDebit(c) ? -c.amount : c.amount)
const netTotal = list => (list || []).reduce((s, c) => s + signedAmount(c), 0)

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
  const [detailId, setDetailId] = useState(null)
  const [contribProject, setContribProject] = useState(null)
  const [contribEditId, setContribEditId] = useState(null)
  const [contribForm, setContribForm] = useState({ member: '', amount: '', kind: 'debit', txn: '', note: '' })
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
    setContribEditId(null)
    setContribForm({ member: project.members?.[0] || '', amount: '', kind: 'debit', txn: '', note: '' })
    setContribError('')
  }

  const openEditContribution = (project, contrib) => {
    setContribProject(project)
    setContribEditId(contrib.id)
    setContribForm({ member: contrib.member, amount: String(contrib.amount), kind: contrib.kind === 'credit' ? 'credit' : 'debit', txn: contrib.txn, note: contrib.note || '' })
    setContribError('')
  }

  const closeContribute = () => { setContribProject(null); setContribEditId(null) }

  const submitContribute = async e => {
    e.preventDefault()
    if (contribLoading) return
    setContribError('')
    setContribLoading(true)
    try {
      const payload = {
        member: contribForm.member,
        amount: Number(contribForm.amount) || 0,
        kind: contribForm.kind,
        txn: contribForm.txn,
        note: contribForm.note,
      }
      if (contribEditId) {
        await api.patch(`/projects/${contribProject.id}/contributions/${contribEditId}`, payload)
      } else {
        await api.post(`/projects/${contribProject.id}/contributions`, payload)
      }
      closeContribute()
      load()
    } catch (err) {
      setContribError(err.response?.data?.error?.message || (contribEditId ? 'Could not update' : 'Could not add money'))
    } finally {
      setContribLoading(false)
    }
  }

  const delContribution = async (projectId, contribId) => {
    if (!confirm('Delete this contribution?')) return
    try {
      await api.delete(`/projects/${projectId}/contributions/${contribId}`)
      load()
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Could not delete contribution')
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

  const detail = detailId ? projects.find(p => p.id === detailId) : null

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
            const total = netTotal(p.contributions)
            const pct = p.target > 0 ? Math.min(Math.round(Math.max(total, 0) / p.target * 100), 100) : 0
            const color = COLORS[idx % COLORS.length]
            return (
              <div key={p.id} className="card">
                <div className="entity-card-head">
                  <div className="title-block">
                    <button
                      type="button"
                      onClick={() => setDetailId(p.id)}
                      title="View contributions"
                      style={{ background: 'none', border: 0, padding: 0, textAlign: 'left', cursor: 'pointer', fontWeight: 700, fontFamily: '"Bricolage Grotesque"', fontSize: 17, lineHeight: 1.25, color: '#7b5cf0', textDecoration: 'underline', textUnderlineOffset: 3 }}
                    >{p.name}</button>
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
                <button
                  type="button"
                  onClick={() => setDetailId(p.id)}
                  style={{ marginTop: 12, width: '100%', minHeight: 36, fontSize: 13, fontWeight: 700, background: '#f4efff', color: '#7b5cf0', border: 0, borderRadius: 999, cursor: 'pointer' }}
                >View {(p.contributions || []).length} contribution{(p.contributions || []).length !== 1 ? 's' : ''}</button>
                <button className="btn-violet" onClick={() => openContribute(p)} style={{ marginTop: 8, width: '100%', minHeight: 38, fontSize: 13.5 }}>+ Add money</button>
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

      {detail && (
        <Modal title={detail.name} onClose={() => setDetailId(null)}>
          {(() => {
            const rows = [...(detail.contributions || [])].sort((a, b) => (b.date || '').localeCompare(a.date || ''))
            const credit = rows.filter(c => !isDebit(c)).reduce((s, c) => s + c.amount, 0)
            const debit = rows.filter(isDebit).reduce((s, c) => s + c.amount, 0)
            const total = credit - debit
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {detail.note && <div style={{ fontSize: 13.5, color: '#6f6880' }}>{detail.note}</div>}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span className="stat-pill credit"><em>Credit</em><b className="tnum">৳{credit.toLocaleString()}</b></span>
                  <span className="stat-pill debit"><em>Debit</em><b className="tnum">৳{debit.toLocaleString()}</b></span>
                  <span className="stat-pill net"><em>Net{detail.target > 0 ? ` / ৳${detail.target.toLocaleString()}` : ''}</em><b className="tnum">৳{total.toLocaleString()}</b></span>
                </div>
                <div style={{ fontSize: 13, color: '#6f6880' }}>{rows.length} contribution{rows.length !== 1 ? 's' : ''}</div>
                {rows.length === 0 ? (
                  <p style={{ color: '#6f6880', fontSize: 14, margin: 0 }}>No contributions yet.</p>
                ) : (
                  <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #f0e5d7', borderRadius: 12 }}>
                    <table className="pocket-table">
                      <thead>
                        <tr>
                          <th>Member</th>
                          <th>Type</th>
                          <th>Reference</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                          <th style={{ textAlign: 'right' }}>Date</th>
                          <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map(c => (
                          <tr key={c.id}>
                            <td>{c.member}</td>
                            <td><span className={`kind-badge ${isDebit(c) ? 'debit' : 'credit'}`}>{isDebit(c) ? 'Debit' : 'Credit'}</span></td>
                            <td style={{ color: '#6f6880' }}>
                              {c.txn}
                              {c.note && <div style={{ fontSize: 12, color: '#9a93a8', marginTop: 2 }}>{c.note}</div>}
                            </td>
                            <td className="tnum" style={{ fontWeight: 700, color: isDebit(c) ? '#c23a1e' : '#0f9d84' }}>
                              {isDebit(c) ? '−' : '+'}৳{c.amount.toLocaleString()}
                            </td>
                            <td className="tnum" style={{ color: '#6f6880' }}>{c.date}</td>
                            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                              <span className="contrib-actions">
                                <button type="button" className="act-edit" onClick={() => openEditContribution(detail, c)}>Edit</button>
                                <button type="button" className="act-del" onClick={() => delContribution(detail.id, c.id)}>Delete</button>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button type="button" className="btn-ghost" onClick={() => setDetailId(null)}>Close</button>
                  <button type="button" className="btn-violet" onClick={() => openContribute(detail)}>+ Add money</button>
                </div>
              </div>
            )
          })()}
        </Modal>
      )}

      {contribProject && (
        <Modal title={contribEditId ? `Edit contribution · ${contribProject.name}` : `Add money to ${contribProject.name}`} onClose={closeContribute}>
          <form onSubmit={submitContribute} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="lbl">Member</label>
              <select className="inp" required value={contribForm.member}
                onChange={e => setContribForm(f => ({ ...f, member: e.target.value }))}>
                {[...new Set([...(contribProject.members || []), contribForm.member].filter(Boolean))].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl">Type</label>
              <div className="kind-toggle">
                <button type="button"
                  className={contribForm.kind === 'credit' ? 'is-active credit' : ''}
                  onClick={() => setContribForm(f => ({ ...f, kind: 'credit' }))}>Credit (money in)</button>
                <button type="button"
                  className={contribForm.kind === 'debit' ? 'is-active debit' : ''}
                  onClick={() => setContribForm(f => ({ ...f, kind: 'debit' }))}>Debit (money out)</button>
              </div>
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
            <div>
              <label className="lbl">Note (optional)</label>
              <input className="inp" type="text" placeholder="What was this for?"
                value={contribForm.note} onChange={e => setContribForm(f => ({ ...f, note: e.target.value }))} />
            </div>
            {contribError && (
              <div style={{ background: '#ffe3dc', color: '#9c2f1a', borderRadius: 14, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}>{contribError}</div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn-ghost" onClick={closeContribute}>Cancel</button>
              <button type="submit" className="btn-violet" disabled={contribLoading}>{contribLoading ? 'Saving…' : contribEditId ? 'Save changes' : 'Add money'}</button>
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
