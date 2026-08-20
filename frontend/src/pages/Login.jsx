import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    setError('')
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Login failed')
    }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', minHeight: '100dvh', flexDirection: 'column' }}>
      <div className="login-mobile-header">
        <span style={{ width: 32, height: 32, borderRadius: 10, background: '#f9a825', display: 'grid', placeItems: 'center', fontFamily: '"Bricolage Grotesque"', fontWeight: 800, color: '#241f2e', fontSize: 16 }}>৳</span>
        <span style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em' }}>Pocket</span>
      </div>
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      <div className="login-art" style={{ flex: '1 1 46%', background: '#7b5cf0', minWidth: 0, color: '#fff', padding: 44, flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 34, height: 34, borderRadius: 12, background: '#f9a825', display: 'grid', placeItems: 'center', fontFamily: '"Bricolage Grotesque"', fontWeight: 800, color: '#241f2e', fontSize: 18 }}>৳</span>
          <span style={{ fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 19, letterSpacing: '-0.01em' }}>Pocket</span>
        </div>
        <div>
          <h1 style={{ fontSize: 'clamp(38px,4.4vw,58px)', fontWeight: 800, maxWidth: '13em', fontFamily: '"Bricolage Grotesque"', letterSpacing: '-0.02em', lineHeight: 1.08 }}>Money, minus the mystery.</h1>
          <p style={{ maxWidth: '30em', fontSize: 17, lineHeight: 1.55, color: 'rgba(255,255,255,0.86)', margin: '18px 0 26px' }}>
            Track what you spend, what comes in, the pots you share with friends, and who still owes who.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ background: '#dcf7ea', color: '#0b6b52', borderRadius: 999, padding: '7px 15px', fontWeight: 700, fontSize: 13.5 }}>Budgets that nudge</span>
            <span style={{ background: '#fff1cc', color: '#7a5300', borderRadius: 999, padding: '7px 15px', fontWeight: 700, fontSize: 13.5 }}>Shared pots</span>
            <span style={{ background: '#ffe3dc', color: '#9c2f1a', borderRadius: 999, padding: '7px 15px', fontWeight: 700, fontSize: 13.5 }}>IOU tracker</span>
          </div>
        </div>
        <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)' }}>Track every taka · stay in control</div>
      </div>

      <div style={{ flex: '1 1 54%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', minWidth: 0 }}>
        <form onSubmit={submit} style={{ width: 'min(408px,100%)', background: '#fff', border: '1px solid #f0e5d7', borderRadius: 26, padding: 30, boxShadow: '0 14px 40px rgba(36,31,46,0.07)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 800, fontFamily: '"Bricolage Grotesque"', letterSpacing: '-0.02em' }}>Welcome back</h2>
            <p style={{ margin: '8px 0 0', color: '#6f6880', fontSize: 15 }}>Let's see where your money went this month.</p>
          </div>

          <div>
            <label className="lbl" htmlFor="email">Email</label>
            <input className="inp" id="email" type="email" autoComplete="username" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          </div>
          <div>
            <label className="lbl" htmlFor="password">Password</label>
            <input className="inp" id="password" type="password" autoComplete="current-password" required
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
          </div>

          {error && (
            <div style={{ background: '#ffe3dc', color: '#9c2f1a', borderRadius: 14, padding: '10px 14px', fontSize: 13.5, fontWeight: 700 }}>{error}</div>
          )}

          <button type="submit" className="btn-coral" style={{ width: '100%' }}>Let me in</button>

          <p style={{ textAlign: 'center', fontSize: 13, color: '#6f6880', margin: 0 }}>
            No account?{' '}
            <Link to="/register" style={{ color: '#7b5cf0', fontWeight: 700, textDecoration: 'none' }}>Create one</Link>
          </p>
        </form>
      </div>
      </div>
    </div>
  )
}
