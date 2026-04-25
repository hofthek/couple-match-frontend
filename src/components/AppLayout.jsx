import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { Heart, LayoutDashboard, ListChecks, History, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import './AppLayout.css';

const NAV = [
  { to: '/app', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/app/questionnaire', label: 'Questionnaire', icon: ListChecks },
  { to: '/app/history', label: 'Historique', icon: History },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/app" className="app-logo">
            <span className="app-logo__mark"><Heart size={14} fill="currentColor" /></span>
            <span className="app-logo__text">CoupleMatch</span>
          </Link>

          <nav className="app-nav" aria-label="Navigation principale">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `app-nav__link ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="app-user">
            <Avatar name={user?.name} size={32} />
            <span className="app-user__name">{user?.name}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="btn btn-ghost btn-sm app-user__logout"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-bottom-nav" aria-label="Navigation mobile">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `app-bottom-nav__link ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
