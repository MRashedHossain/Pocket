import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import Income from './pages/Income'
import Budgets from './pages/Budgets'
import Accounts from './pages/Accounts'
import Debts from './pages/Debts'
import Projects from './pages/Projects'
import Settings from './pages/Settings'

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-500">Loading…</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="expenses" element={<Expenses />} />
        <Route path="income" element={<Income />} />
        <Route path="budgets" element={<Budgets />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="debts" element={<Debts />} />
        <Route path="projects" element={<Projects />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
