import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/expenses', label: 'Expenses' },
  { to: '/income', label: 'Income' },
  { to: '/budgets', label: 'Budgets' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/debts', label: 'Debts' },
  { to: '/projects', label: 'Projects' },
  { to: '/settings', label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="px-5 py-4 border-b border-gray-200">
        <span className="text-lg font-bold text-indigo-600">Pocket</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 truncate">{user?.name}</p>
        <button
          onClick={logout}
          className="mt-1 text-xs text-red-500 hover:text-red-700"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
