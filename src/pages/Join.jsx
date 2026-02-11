import { useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Join.css';

export default function Join() {
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code')?.toUpperCase().trim() || '';
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const redirectUrl = code ? `/join?code=${code}` : '/join';

  useEffect(() => {
    if (isAuthenticated && code && code.length === 6) {
      navigate(`/app?invite=${code}`, { replace: true });
    }
  }, [isAuthenticated, code, navigate]);

  if (isAuthenticated && code && code.length === 6) {
    return (
      <div className="join-page">
        <div className="join-card">
          <p>Redirection vers le tableau de bord pour rejoindre le couple…</p>
        </div>
      </div>
    );
  }

  if (!code || code.length !== 6) {
    return (
      <div className="join-page">
        <div className="join-card">
          <h1>Lien d'invitation invalide</h1>
          <p>Ce lien ne contient pas de code valide. Demandez à votre partenaire de vous envoyer à nouveau le lien d'invitation.</p>
          <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="join-page">
      <div className="join-card">
        <h1>Rejoindre un couple</h1>
        <p>Pour rejoindre le couple avec le code <strong>{code}</strong>, connectez-vous ou créez un compte.</p>
        <div className="join-actions">
          <Link to={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="btn btn-primary">
            Se connecter
          </Link>
          <Link to={`/register?redirect=${encodeURIComponent(redirectUrl)}`} className="btn btn-outline">
            Créer un compte
          </Link>
        </div>
        <p className="join-back">
          <Link to="/">← Retour à l'accueil</Link>
        </p>
      </div>
    </div>
  );
}
