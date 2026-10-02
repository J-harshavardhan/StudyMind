import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  return (
    <>
      <nav className="navbar navbar-expand-lg bg-primary navbar-dark">
        <div className="container">
          <NavLink className="navbar-brand fw-bold" to="/">StudyMind</NavLink>
          {user && <div className="d-flex align-items-center gap-3 flex-wrap">
            <NavLink className="text-white" to="/dashboard">Dashboard</NavLink>
            <NavLink className="text-white" to="/notes">Notes</NavLink>
            <NavLink className="text-white" to="/categories">Categories</NavLink>
            <NavLink className="text-white" to="/settings">Settings</NavLink>
            <button className="btn btn-outline-light btn-sm" onClick={toggle}>{dark ? 'Light' : 'Dark'}</button>
            <button className="btn btn-light btn-sm" onClick={() => { logout(); navigate('/login'); }}>Logout</button>
          </div>}
        </div>
      </nav>
      <main className="container py-4">{children}</main>
    </>
  );
}
