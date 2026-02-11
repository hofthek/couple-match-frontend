import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

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
        <Link to="/app" className="app-logo">CoupleMatch</Link>
        <nav className="app-nav">
          <Link to="/app">Tableau de bord</Link>
          <Link to="/app/questionnaire">Questionnaire</Link>
          <Link to="/app/history">Historique</Link>
        </nav>
        <div className="app-user">
          <span>{user?.name}</span>
          <button type="button" onClick={handleLogout} className="btn btn-outline btn-sm">
            Déconnexion
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
