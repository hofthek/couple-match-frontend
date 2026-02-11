import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';
import './Auth.css';

export default function Login() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/login', { email, password });
      if (data.success && data.data?.token) {
        login(data.data.user, data.data.token);
        const target = redirectTo && redirectTo.startsWith('/') ? redirectTo : '/app';
        setLoading(false);
        setTimeout(() => navigate(target, { replace: true }), 0);
      } else {
        setError(data.message || 'Erreur de connexion');
      }
    } catch (err) {
      setError(
        err.response?.data?.message
          || (err.code === 'ERR_NETWORK' ? 'Impossible de joindre le serveur. Vérifiez que le backend tourne.' : 'Identifiants incorrects')
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Connexion</h1>
        <p className="auth-sub">Accédez à votre espace CoupleMatch</p>
        <form onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label>
            Mot de passe
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
        <p className="auth-footer">
          Pas encore de compte ? <Link to="/register">S'inscrire</Link>
        </p>
      </div>
      <p className="back-home">
        <Link to="/">← Retour à l'accueil</Link>
      </p>
    </div>
  );
}
