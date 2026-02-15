import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import ApiErrorBlock from '../components/ApiErrorBlock';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './Dashboard.css';

function copyToClipboard(text, onDone) {
  navigator.clipboard?.writeText(text).then(() => onDone?.()).catch(() => onDone?.(false));
}

const POLL_INTERVAL_MS = 3000;

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [couple, setCouple] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(null); // 'code' | 'link' | null
  const pollRef = useRef(null);

  useEffect(() => {
    document.title = 'Tableau de bord — CoupleMatch';
    return () => { document.title = 'CoupleMatch'; };
  }, []);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite && invite.length === 6) setJoinCode(invite.toUpperCase());
  }, [searchParams]);

  const invitationLink = couple?.invitation_code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${couple.invitation_code}`
    : '';

  const handleCopyCode = useCallback(() => {
    if (!couple?.invitation_code) return;
    copyToClipboard(couple.invitation_code, (ok) => {
      setCopied(ok !== false ? 'code' : null);
      if (ok) setTimeout(() => setCopied(null), 2000);
    });
  }, [couple?.invitation_code]);

  const handleCopyLink = useCallback(() => {
    if (!invitationLink) return;
    copyToClipboard(invitationLink, (ok) => {
      setCopied(ok !== false ? 'link' : null);
      if (ok) setTimeout(() => setCopied(null), 2000);
    });
  }, [invitationLink]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const [coupleRes, sessionRes] = await Promise.all([
        api.get('/couple'),
        api.get('/session/current'),
      ]);
      if (coupleRes.data?.success) setCouple(coupleRes.data.data ?? null);
      if (sessionRes.data?.success && sessionRes.data?.data?.session) setSession(sessionRes.data.data.session);
    } catch (err) {
      if (err.response?.status === 404) {
        setCouple(null);
        setSession(null);
      } else {
        setError(err.response?.data?.message || 'Erreur chargement. Vérifiez que le backend tourne sur ' + (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'));
      }
    } finally {
      setLoading(false);
    }
  }

  async function createCouple() {
    setCreating(true);
    setError('');
    try {
      const { data } = await api.post('/couple');
      if (data.success) {
        setCouple(data.data);
        // Ne pas appeler load() ici : ça remettait "Chargement…" et masquait le code.
        // On affiche tout de suite la réponse (id, status, invitation_code).
        loadSessionOnly();
      } else setError(data.message || 'Erreur');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de créer le couple');
    } finally {
      setCreating(false);
    }
  }

  async function loadSessionOnly() {
    try {
      const sessionRes = await api.get('/session/current');
      if (sessionRes.data?.success && sessionRes.data?.data?.session) {
        setSession(sessionRes.data.data.session);
      }
    } catch {
      // ignoré
    }
  }

  const handleViewResult = useCallback(async () => {
    try {
      const sessionRes = await api.get('/session/current');
      const sess = sessionRes.data?.data?.session;
      if (sess?.result) {
        navigate(`/app/result/${sess.id}`, { replace: true });
      } else {
        setSession(sess || null);
      }
    } catch {
      setSession(null);
    }
  }, [navigate]);

  useEffect(() => {
    if (!session?.ready_to_calculate || session?.result) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const sessionRes = await api.get('/session/current');
        const sess = sessionRes.data?.data?.session;
        if (sess?.result) {
          if (pollRef.current) clearInterval(pollRef.current);
          navigate(`/app/result/${sess.id}`, { replace: true });
        } else {
          setSession(sess || null);
        }
      } catch {
        // keep current state
      }
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [session?.ready_to_calculate, session?.result, navigate]);

  async function joinCouple(e) {
    e.preventDefault();
    if (!joinCode.trim() || joinCode.trim().length !== 6) {
      setError('Le code doit faire 6 caractères.');
      return;
    }
    setJoining(true);
    setError('');
    try {
      const { data } = await api.post('/couple/join', { code: joinCode.trim().toUpperCase() });
      if (data.success) {
        setCouple(data.data);
        setJoinCode('');
        load();
      } else setError(data.message || 'Erreur');
    } catch (err) {
      setError(err.response?.data?.message || 'Code invalide ou expiré.');
    } finally {
      setJoining(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <h1>Tableau de bord</h1>
        <LoadingSkeleton variant="cards" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="dashboard">
        <h1>Tableau de bord</h1>
        <ApiErrorBlock
          message={error}
          onRetry={load}
          backTo="/app"
          backLabel="Retour au tableau de bord"
        />
      </div>
    );
  }

  const hasPartner = couple?.partner;
  const canStart = hasPartner && !session;

  return (
    <div className="dashboard">
      <h1>Tableau de bord</h1>

      {!couple ? (
        <>
          <section className="dashboard-card">
            <h2>Vous n'avez pas encore de couple</h2>
            <p>Créez un couple pour générer un code d'invitation et inviter votre partenaire.</p>
            <button type="button" className="btn btn-primary" onClick={createCouple} disabled={creating}>
              {creating ? 'Création…' : 'Créer un couple'}
            </button>
          </section>
          <section className="dashboard-card">
            <h2>Rejoindre avec un code</h2>
            <p>Votre partenaire vous a envoyé un code à 6 caractères ? Saisissez-le ci-dessous.</p>
            <form onSubmit={joinCouple} className="join-form">
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="XXXXXX"
                maxLength={6}
                className="join-input"
              />
              <button type="submit" className="btn btn-primary" disabled={joining || joinCode.length !== 6}>
                {joining ? 'En cours…' : 'Rejoindre'}
              </button>
            </form>
          </section>
        </>
      ) : (
        <>
          <section className="dashboard-card">
            <h2>Mon couple</h2>
            <p><strong>Statut :</strong> {couple.status}</p>
            {couple.partner ? (
              <p><strong>Partenaire :</strong> {couple.partner.name}</p>
            ) : (
              <>
                <p className="dashboard-waiting">En attente que votre partenaire rejoigne avec le code.</p>
                {couple.invitation_code ? (
                  <div className="invitation-block">
                    <h3>Inviter votre partenaire</h3>
                    <p className="invitation-hint">Partagez le code ou le lien ci-dessous. Votre partenaire pourra rejoindre le couple après connexion ou inscription.</p>
                    <div className="invitation-code-row">
                      <span className="invitation-label">Code d'invitation</span>
                      <strong className="invitation-code">{couple.invitation_code}</strong>
                      <button type="button" className="btn btn-outline btn-sm" onClick={handleCopyCode}>
                        {copied === 'code' ? 'Copié !' : 'Copier le code'}
                      </button>
                    </div>
                    <div className="invitation-link-row">
                      <span className="invitation-label">Lien d'invitation</span>
                      <code className="invitation-link-url">{invitationLink}</code>
                      <button type="button" className="btn btn-outline btn-sm" onClick={handleCopyLink}>
                        {copied === 'link' ? 'Copié !' : 'Copier le lien'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="invitation-missing">Code d&apos;invitation en cours de chargement… Rechargez la page si besoin.</p>
                )}
              </>
            )}
          </section>

          {session && (
            <section className="dashboard-card">
              <h2>Session de test</h2>
              {session.result ? (
                <>
                  <p>Dernier résultat : <strong>{session.result.percentage}%</strong> – {session.result.level}</p>
                  <Link to={`/app/result/${session.id}`} className="btn btn-primary">Voir le détail</Link>
                </>
              ) : (
                <>
                  <p>Vos réponses : {session.my_responses_count} / {session.expected_questions_count ?? 40}</p>
                  <p>Partenaire : {session.partner_responses_count} / {session.expected_questions_count ?? 40}</p>
                  {session.ready_to_calculate ? (
                    <>
                      <p className="ready-msg">Les deux ont répondu.</p>
                      <button type="button" className="btn btn-primary" onClick={handleViewResult}>
                        Voir le résultat
                      </button>
                    </>
                  ) : (
                    <Link to="/app/questionnaire" className="btn btn-primary">
                      {(session.my_responses_count ?? 0) >= (session.expected_questions_count ?? 40) ? 'En attente du partenaire' : 'Continuer le questionnaire'}
                    </Link>
                  )}
                </>
              )}
            </section>
          )}

          {canStart && !session && (
            <section className="dashboard-card">
              <p>Démarrez un test de compatibilité avec votre partenaire.</p>
              <Link to="/app/questionnaire" className="btn btn-primary">Démarrer le questionnaire</Link>
            </section>
          )}

          <p className="dashboard-link">
            <Link to="/app/history">Voir l'historique des tests →</Link>
          </p>
        </>
      )}
    </div>
  );
}
