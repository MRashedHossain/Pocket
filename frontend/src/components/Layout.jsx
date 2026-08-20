import { Outlet, NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'

const bottomLinks = [
  {
    to: '/dashboard', label: 'Home',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>,
  },
  {
    to: '/expenses', label: 'Expenses',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M15 9H9m6 6H9"/></svg>,
  },
  {
    to: '/income', label: 'Income',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  },
  {
    to: '/debts', label: 'IOUs',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  },
  {
    to: '/projects', label: 'Projects',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7h18M3 12h18M3 17h18"/><circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none"/><circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="7" cy="17" r="1.5" fill="currentColor" stroke="none"/></svg>,
  },
  {
    to: '/settings', label: 'More',
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  },
]

export default function Layout() {
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
      </nav>
    </div>
  )
}
