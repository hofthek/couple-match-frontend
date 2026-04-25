import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  Copy, Check, Heart, UserPlus, Sparkles, Hourglass, Play,
  ArrowRight, Share2, Link2, History as HistoryIcon, Loader2,
  Sun, MessagesSquare, Flame,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ApiErrorBlock from '../components/ApiErrorBlock';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { AvatarPair } from '../components/Avatar';
import Avatar from '../components/Avatar';
import { useToast } from '../components/useToast';
import './Dashboard.css';

const POLL_INTERVAL_MS = 3000;

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [couple, setCouple] = useState(null);
  const [session, setSession] = useState(null);
  const [daily, setDaily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(null); // 'create' | 'join' | null
  const pollRef = useRef(null);

  useEffect(() => {
    document.title = 'Tableau de bord — CoupleMatch';
    return () => { document.title = 'CoupleMatch'; };
  }, []);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const invite = searchParams.get('invite');
    if (invite && invite.length === 6) {
      setJoinCode(invite.toUpperCase());
      setMode('join');
    }
  }, [searchParams]);

  const invitationLink = couple?.invitation_code
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join?code=${couple.invitation_code}`
    : '';

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
      // Charger la question du jour si on a un couple complet
      if (coupleRes.data?.data?.partner) {
        try {
          const dailyRes = await api.get('/daily/today');
          if (dailyRes.data?.success) setDaily(dailyRes.data.data);
        } catch { /* daily peut échouer si pas de couple, on ignore */ }
      }
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
        loadSessionOnly();
        toast.success('Couple créé. Partagez votre code !');
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
    } catch { /* ignore */ }
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
      } catch { /* keep current state */ }
    }, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
        setMode(null);
        load();
        toast.success('Vous avez rejoint le couple !');
      } else setError(data.message || 'Erreur');
    } catch (err) {
      setError(err.response?.data?.message || 'Code invalide ou expiré.');
    } finally {
      setJoining(false);
    }
  }

  async function copyText(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copié`);
    } catch {
      toast.error('Impossible de copier');
    }
  }

  async function shareInvite() {
    const text = `Rejoignez-moi sur CoupleMatch avec ce code : ${couple?.invitation_code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CoupleMatch', text, url: invitationLink });
      } catch { /* cancelled */ }
    } else {
      copyText(invitationLink, 'Lien');
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <header className="dashboard-greeting">
          <div className="dashboard-greeting__skeleton" />
        </header>
        <LoadingSkeleton variant="cards" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="dashboard">
        <h1 className="display dashboard-title">Tableau de bord</h1>
        <ApiErrorBlock
          message={error}
          onRetry={load}
          backTo="/app"
          backLabel="Retour au tableau de bord"
        />
      </div>
    );
  }

  const hasPartner = !!couple?.partner;
  const canStart = hasPartner && !session;
  const myCount = session?.my_responses_count ?? 0;
  const partnerCount = session?.partner_responses_count ?? 0;
  const expected = session?.expected_questions_count ?? 40;
  const myProgress = expected ? Math.min(100, (myCount / expected) * 100) : 0;
  const partnerProgress = expected ? Math.min(100, (partnerCount / expected) * 100) : 0;

  return (
    <div className="dashboard">
      {/* Greeting */}
      <motion.header
        className="dashboard-greeting"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <p className="dashboard-greeting__hi">Bonjour</p>
          <h1 className="display dashboard-title">{user?.name || 'Bienvenue'} 👋</h1>
        </div>
        {couple && (
          <AvatarPair a={user?.name} b={couple.partner?.name || '?'} size={44} />
        )}
      </motion.header>

      <AnimatePresence mode="wait">
        {!couple ? (
          <motion.div
            key="no-couple"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <p className="dashboard-lead">
              Pour démarrer un test de compatibilité, créez votre couple ou rejoignez celui de votre partenaire.
            </p>
            <div className="onboarding-grid">
              <button
                type="button"
                className={`onboarding-card ${mode === 'create' ? 'is-active' : ''}`}
                onClick={() => setMode('create')}
              >
                <span className="onboarding-card__icon"><Heart size={22} /></span>
                <h3>Créer un couple</h3>
                <p>Vous générez un code à 6 caractères à partager avec votre partenaire.</p>
              </button>
              <button
                type="button"
                className={`onboarding-card ${mode === 'join' ? 'is-active' : ''}`}
                onClick={() => setMode('join')}
              >
                <span className="onboarding-card__icon"><UserPlus size={22} /></span>
                <h3>Rejoindre un couple</h3>
                <p>Votre partenaire vous a envoyé un code ? Saisissez-le ici.</p>
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === 'create' && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="onboarding-action card"
                >
                  <p>On crée votre couple maintenant ?</p>
                  <button type="button" className="btn btn-primary" onClick={createCouple} disabled={creating}>
                    {creating ? <><Loader2 size={16} className="spin" /> Création…</> : <>Créer mon couple <ArrowRight size={16} /></>}
                  </button>
                </motion.div>
              )}
              {mode === 'join' && (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="onboarding-action card"
                >
                  <form onSubmit={joinCouple} className="join-form">
                    <label className="join-form__label">
                      Code d'invitation
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                        placeholder="XXXXXX"
                        maxLength={6}
                        className="join-input"
                        autoFocus
                      />
                    </label>
                    <button type="submit" className="btn btn-primary" disabled={joining || joinCode.length !== 6}>
                      {joining ? <><Loader2 size={16} className="spin" /> En cours…</> : <>Rejoindre <ArrowRight size={16} /></>}
                    </button>
                  </form>
                  {error && <p className="dashboard-inline-error">{error}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="has-couple"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="dashboard-stack"
          >
            {/* Couple status */}
            {!hasPartner ? (
              <section className="card invite-card">
                <header className="invite-card__head">
                  <span className="badge"><Hourglass size={12} /> En attente du partenaire</span>
                  <h2>Invitez votre partenaire</h2>
                  <p>Partagez votre code ou scannez le QR code. Vous démarrerez le test ensemble dès qu'il vous aura rejoint.</p>
                </header>

                {couple.invitation_code ? (
                  <div className="invite-card__body">
                    <div className="invite-qr">
                      <QRCodeSVG
                        value={invitationLink}
                        size={140}
                        bgColor="transparent"
                        fgColor="#f7f1ea"
                        level="M"
                      />
                    </div>
                    <div className="invite-meta">
                      <div className="invite-meta__row">
                        <span className="invite-meta__label">Votre code</span>
                        <div className="invite-code">
                          <code>{couple.invitation_code}</code>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm icon-btn"
                            onClick={() => copyText(couple.invitation_code, 'Code')}
                            aria-label="Copier le code"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="invite-meta__row">
                        <span className="invite-meta__label">Lien direct</span>
                        <div className="invite-link">
                          <span className="invite-link__url" title={invitationLink}>{invitationLink}</span>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm icon-btn"
                            onClick={() => copyText(invitationLink, 'Lien')}
                            aria-label="Copier le lien"
                          >
                            <Link2 size={14} />
                          </button>
                        </div>
                      </div>
                      <button type="button" className="btn btn-primary btn-sm invite-share" onClick={shareInvite}>
                        <Share2 size={14} /> Partager
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="invitation-missing">Code en cours de chargement… Rechargez la page si besoin.</p>
                )}

                <div className="invite-pulse" aria-hidden="true">
                  <span /><span /><span />
                </div>
              </section>
            ) : (
              <section className="card couple-card">
                <header className="couple-card__head">
                  <span className="badge"><Check size={12} /> Couple actif</span>
                  <h2>{user?.name} & {couple.partner.name}</h2>
                  <p>Vous êtes prêts à explorer votre compatibilité.</p>
                </header>
                <AvatarPair a={user?.name} b={couple.partner.name} size={56} />
              </section>
            )}

            {/* Session card */}
            {session && (
              <section className="card session-card">
                {session.result ? (
                  <>
                    <header className="result-preview__head">
                      <span className="badge"><Sparkles size={12} /> Dernier résultat</span>
                      <h2>{session.result.percentage}% — {session.result.level}</h2>
                    </header>
                    <Link to={`/app/result/${session.id}`} className="btn btn-primary">
                      Voir le détail <ArrowRight size={16} />
                    </Link>
                  </>
                ) : (
                  <>
                    <header className="session-card__head">
                      <span className="badge"><Play size={12} /> Test en cours</span>
                      <h2>Avancement du questionnaire</h2>
                    </header>

                    <div className="progress-duo">
                      <div className="progress-duo__row">
                        <Avatar name={user?.name} variant="a" size={32} />
                        <div className="progress-duo__bar">
                          <div className="progress-duo__fill progress-duo__fill--a" style={{ width: `${myProgress}%` }} />
                        </div>
                        <span className="progress-duo__count">{myCount} / {expected}</span>
                      </div>
                      <div className="progress-duo__row">
                        <Avatar name={couple.partner?.name || '?'} variant="b" size={32} />
                        <div className="progress-duo__bar">
                          <div className="progress-duo__fill progress-duo__fill--b" style={{ width: `${partnerProgress}%` }} />
                        </div>
                        <span className="progress-duo__count">{partnerCount} / {expected}</span>
                      </div>
                    </div>

                    {session.ready_to_calculate ? (
                      <div className="session-cta">
                        <p className="session-ready">✨ Vous avez tous les deux terminé !</p>
                        <button type="button" className="btn btn-primary" onClick={handleViewResult}>
                          Voir notre résultat <ArrowRight size={16} />
                        </button>
                      </div>
                    ) : (
                      <Link to="/app/questionnaire" className="btn btn-primary">
                        {myCount >= expected
                          ? <><Hourglass size={16} /> En attente du partenaire</>
                          : myCount > 0
                            ? <>Reprendre le questionnaire <ArrowRight size={16} /></>
                            : <>Commencer le questionnaire <ArrowRight size={16} /></>}
                      </Link>
                    )}
                  </>
                )}
              </section>
            )}

            {canStart && !session && (
              <section className="card start-card">
                <h2>Démarrer un test de compatibilité</h2>
                <p>Choisissez vos thèmes et répondez chacun de votre côté. Compte ≈ 10 minutes.</p>
                <Link to="/app/questionnaire" className="btn btn-primary">
                  <Sparkles size={16} /> Démarrer
                </Link>
              </section>
            )}

            {/* Question du jour — uniquement si couple complet */}
            {hasPartner && daily && (
              <Link to="/app/daily" className="card daily-teaser">
                <div className="daily-teaser__head">
                  <span className="badge daily-teaser__badge">
                    <Sun size={12} /> Question du jour
                  </span>
                  {daily.both_answered ? (
                    <span className="daily-teaser__status is-done">
                      <Check size={12} /> Révélée
                    </span>
                  ) : daily.my_response ? (
                    <span className="daily-teaser__status is-waiting">
                      <Hourglass size={12} /> {daily.partner_has_answered ? 'Révélation imminente' : 'En attente'}
                    </span>
                  ) : (
                    <span className="daily-teaser__status is-todo">À répondre</span>
                  )}
                </div>
                <p className="daily-teaser__question">« {daily.question.content} »</p>
                <span className="daily-teaser__cta">
                  {daily.both_answered ? 'Voir nos réponses' : daily.my_response ? 'Voir l\'état' : 'Répondre maintenant'}
                  <ArrowRight size={14} />
                </span>
              </Link>
            )}

            {/* Coach IA — uniquement si couple complet */}
            {hasPartner && (
              <Link to="/app/coach" className="card coach-teaser">
                <div className="coach-teaser__icon">
                  <MessagesSquare size={20} />
                </div>
                <div className="coach-teaser__body">
                  <h2>Parlez avec le coach IA</h2>
                  <p>Une question, un doute, une situation à débrouiller à deux. Le coach vous écoute et vous donne des pistes.</p>
                </div>
                <ArrowRight size={18} className="coach-teaser__arrow" />
              </Link>
            )}

            <Link to="/app/history" className="dashboard-link-history">
              <HistoryIcon size={14} /> Voir l'historique des tests
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
