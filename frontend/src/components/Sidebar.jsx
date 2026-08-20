import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const links = [
  {
    to: '/dashboard', label: 'Home',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>,
  },
  {
    to: '/expenses', label: 'Expenses',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M15 9H9m6 6H9"/></svg>,
  },
  {
    to: '/income', label: 'Income',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>,
  },
  {
    to: '/budgets', label: 'Budgets',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    to: '/accounts', label: 'Accounts',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  },
  {
    to: '/debts', label: 'IOUs',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>,
  },
  {
    to: '/projects', label: 'Projects',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>,
  },
  {
    to: '/settings', label: 'Settings',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  },
]

const navItemStyle = (isActive) => ({
  display: 'flex', alignItems: 'center', gap: 11,
  padding: '10px 14px', borderRadius: 999, border: 0,
  background: isActive ? '#7b5cf0' : 'transparent',
  color: isActive ? '#fff' : '#6f6880',
  fontFamily: '"Bricolage Grotesque", system-ui',
  fontWeight: 600, fontSize: 15.5, cursor: 'pointer',
  boxShadow: isActive ? '0 6px 16px rgba(123,92,240,0.32)' : 'none',
  textDecoration: 'none',
  transition: 'all 0.15s',
})

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="side">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 12px 18px' }}>
        <span style={{ width: 34, height: 34, borderRadius: 12, background: '#f9a825', display: 'grid', placeItems: 'center', fontFamily: '"Bricolage Grotesque"', fontWeight: 800, color: '#241f2e', fontSize: 18 }}>৳</span>
        <span>
          <span style={{ display: 'block', fontFamily: '"Bricolage Grotesque"', fontWeight: 800, fontSize: 18, lineHeight: 1.1 }}>Pocket</span>
          <span style={{ display: 'block', fontSize: 12, color: '#6f6880', fontWeight: 700 }}>{user?.name}</span>
        </span>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {links.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => navItemStyle(isActive)}
            onMouseEnter={e => { if (!e.currentTarget.style.background.includes('7b5cf0')) { e.currentTarget.style.background = '#f6f0ff'; e.currentTarget.style.color = '#241f2e'; } }}
            onMouseLeave={e => { if (!e.currentTarget.style.background.includes('7b5cf0')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6f6880'; } }}
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '12px 14px', borderTop: '1px solid #f0e5d7', marginTop: 8 }}>
        <p style={{ fontSize: 12, color: '#6f6880', fontWeight: 700, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
        <button onClick={logout} style={{ marginTop: 4, background: 'none', border: 0, padding: 0, fontSize: 12, color: '#ff6a4d', cursor: 'pointer', fontWeight: 700 }}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
