import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const navigation = [
  { to: '/dashboard', label: 'Overview', icon: '⌂' },
  { to: '/tasks', label: 'Tasks', icon: '✓' },
  { to: '/calendar', label: 'Calendar', icon: '□' },
  { to: '/notes', label: 'Notes', icon: '≡' },
  { to: '/categories', label: 'Categories', icon: '◈' }
  ,{ to: '/assistant', label: 'AI Assistant', icon: '✦' },
  { to: '/reminders', label: 'Reminders', icon: '◷' }
  ,{ to: '/focus', label: 'Focus', icon: '◉' }
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signOut = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <div className="public-shell">
        <div className="public-brand"><span className="brand-mark">S</span> StudyMind</div>
        <main className="container py-4">{children}</main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className={`app-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="sidebar-header">
          <NavLink className="brand-link" to="/dashboard" onClick={() => setMobileOpen(false)}>
            <span className="brand-mark">S</span>
            <span>StudyMind</span>
          </NavLink>
          <button className="icon-button sidebar-close" onClick={() => setMobileOpen(false)} aria-label="Close navigation">×</button>
        </div>
        <div className="sidebar-label">Workspace</div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
              <span className="nav-icon" aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-label">Account</div>
        <NavLink to="/settings" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setMobileOpen(false)}>
          <span className="nav-icon" aria-hidden="true">⚙</span><span>Settings</span>
        </NavLink>
        <div className="sidebar-user">
          {user.avatarDataUrl ? <img className="avatar avatar-image" src={user.avatarDataUrl} alt="" /> : <span className="avatar">{user.name?.charAt(0).toUpperCase() || 'S'}</span>}
          <span className="user-copy"><strong>{user.name}</strong><small>{user.email}</small></span>
        </div>
      </aside>
      {mobileOpen && <button className="sidebar-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
      <div className="app-main">
        <header className="topbar">
          <button className="icon-button menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open navigation">☰</button>
          <div className="topbar-context">Personal workspace <span>·</span> {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
          <div className="topbar-actions">
            <button className="theme-toggle" onClick={toggle} aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}>
              <span aria-hidden="true">{dark ? '☼' : '◐'}</span>{dark ? 'Light' : 'Dark'}
            </button>
            <button className="logout-button" onClick={signOut}>Log out</button>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
