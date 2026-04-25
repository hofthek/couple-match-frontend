import { useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowLeft, HeartHandshake } from 'lucide-react';
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
        <Link to="/" className="auth-brand">
          <span className="auth-brand__mark"><Heart size={14} fill="currentColor" /></span>
          CoupleMatch
        </Link>
        <motion.div
          className="join-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1>Lien invalide</h1>
          <p>Ce lien ne contient pas de code valide. Demandez à votre partenaire de vous renvoyer le lien d'invitation.</p>
          <Link to="/" className="btn btn-primary">Retour à l'accueil</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="join-page">
      <Link to="/" className="auth-brand">
        <span className="auth-brand__mark"><Heart size={14} fill="currentColor" /></span>
        CoupleMatch
      </Link>
      <motion.div
        className="join-card"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="join-icon"><HeartHandshake size={28} /></span>
        <h1>Vous êtes invité·e</h1>
        <p>Pour rejoindre le couple avec le code</p>
        <div className="join-code">{code}</div>
        <p>connectez-vous ou créez un compte.</p>
        <div className="join-actions">
          <Link to={`/login?redirect=${encodeURIComponent(redirectUrl)}`} className="btn btn-primary btn-lg">
            Se connecter
          </Link>
          <Link to={`/register?redirect=${encodeURIComponent(redirectUrl)}`} className="btn btn-outline btn-lg">
            Créer un compte
          </Link>
        </div>
      </motion.div>
      <p className="join-back">
        <Link to="/"><ArrowLeft size={14} /> Retour à l'accueil</Link>
      </p>
    </div>
  );
}
