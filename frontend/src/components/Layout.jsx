import { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../contexts/AuthContext'

const icons = {
  home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>,
  expenses: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M15 9H9m6 6H9"/></svg>,
  income: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  debts: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  budgets: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  accounts: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  projects: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  more: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
}

// Primary tabs live in the bottom bar; the rest open from the "More" sheet.
const bottomLinks = [
  { to: '/dashboard', label: 'Home', icon: icons.home },
  { to: '/expenses', label: 'Expenses', icon: icons.expenses },
  { to: '/income', label: 'Income', icon: icons.income },
  { to: '/debts', label: 'IOUs', icon: icons.debts },
]

const moreLinks = [
  { to: '/budgets', label: 'Budgets', icon: icons.budgets },
  { to: '/accounts', label: 'Accounts', icon: icons.accounts },
  { to: '/projects', label: 'Projects', icon: icons.projects },
  { to: '/settings', label: 'Settings', icon: icons.settings },
]

export default function Layout() {
  const [moreOpen, setMoreOpen] = useState(false)
  const { user, logout } = useAuth()

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <div className="page-pad">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — only visible on mobile via CSS */}
      <nav className="bottom-nav">
        {bottomLinks.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <span className={`bottom-nav-item${isActive ? ' active' : ''}`}>
                {icon}
                {label}
              </span>
            )}
          </NavLink>
        ))}
        <button type="button" className={`bottom-nav-item${moreOpen ? ' active' : ''}`} onClick={() => setMoreOpen(true)}>
          {icons.more}
          More
        </button>
      </nav>

      {moreOpen && (
        <div className="more-sheet-overlay" onClick={() => setMoreOpen(false)}>
          <div className="more-sheet" onClick={e => e.stopPropagation()}>
            <div className="more-sheet-grip" />
            <div className="more-sheet-user">
              <img src="/icon.png" alt="" width="30" height="30" style={{ borderRadius: 9, objectFit: 'cover' }} />
              <span>
                <strong style={{ display: 'block', fontFamily: '"Bricolage Grotesque"', fontSize: 15 }}>{user?.name}</strong>
                <span style={{ fontSize: 12, color: '#6f6880' }}>{user?.email}</span>
              </span>
            </div>
            <div className="more-sheet-grid">
              {moreLinks.map(({ to, label, icon }) => (
                <NavLink key={to} to={to} onClick={() => setMoreOpen(false)} className="more-sheet-item"
                  style={({ isActive }) => (isActive ? { borderColor: '#7b5cf0', color: '#7b5cf0' } : undefined)}>
                  {icon}
                  {label}
                </NavLink>
              ))}
            </div>
            <button onClick={logout} className="btn-signout" style={{ width: '100%' }}>Sign out</button>
          </div>
        </div>
      )}
    </div>
  )
}
