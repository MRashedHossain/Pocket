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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow p-8">
        <h1 className="text-2xl font-bold text-indigo-600 mb-6">Pocket</h1>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <form onSubmit={submit} className="space-y-4">
          <input
            type="email" placeholder="Email" required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <input
            type="password" placeholder="Password" required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
          />
          <button type="submit" className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-indigo-700">
            Sign in
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          No account? <Link to="/register" className="text-indigo-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
