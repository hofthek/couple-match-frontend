import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Sparkles, Hourglass, Heart, Flame, Loader2, Clock, ChevronRight,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ApiErrorBlock from '../components/ApiErrorBlock';
import { useToast } from '../components/useToast';
import './Daily.css';

const POLL_INTERVAL_MS = 4000;

export default function Daily() {
  const { user } = useAuth();
  const toast = useToast();
  const [prompt, setPrompt] = useState(null);
  const [history, setHistory] = useState([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  useEffect(() => {
    document.title = 'Question du jour — CoupleMatch';
    return () => { document.title = 'CoupleMatch'; };
  }, []);

  const load = useCallback(async () => {
    setError('');
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get('/daily/today'),
        api.get('/daily/history'),
      ]);
      if (todayRes.data?.success) setPrompt(todayRes.data.data);
      if (historyRes.data?.success) {
        setHistory(historyRes.data.data?.items || []);
        setStreak(historyRes.data.data?.streak || 0);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Poll si on a répondu mais pas le partenaire
  useEffect(() => {
    const needsPoll = prompt?.my_response && !prompt?.both_answered;
    if (!needsPoll) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await api.get('/daily/today');
        if (res.data?.success) {
          const next = res.data.data;
          if (next.both_answered && !prompt.both_answered) {
            toast.success('Votre partenaire a répondu !');
          }
          setPrompt(next);
          if (next.both_answered) load();
        }
      } catch { /* keep state */ }
    }, POLL_INTERVAL_MS);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [prompt?.my_response, prompt?.both_answered, load, toast, prompt]);

  async function submit(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/daily/today', { content: draft.trim() });
      if (data?.success) {
        setPrompt(data.data);
        setDraft('');
        toast.success(data.data.both_answered ? 'C\'est révélé !' : 'Réponse enregistrée');
        if (data.data.both_answered) load();
      }
    } catch (e2) {
      toast.error(e2.response?.data?.message || 'Erreur d\'envoi');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="daily">
        <h1 className="display daily-title">Question du jour</h1>
        <LoadingSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="daily">
        <h1 className="display daily-title">Question du jour</h1>
        <ApiErrorBlock
          message={error}
          onRetry={() => { setLoading(true); load(); }}
          backTo="/app"
          backLabel="Tableau de bord"
        />
      </div>
    );
  }

  return (
    <div className="daily">
      <header className="daily-head">
        <Link to="/app" className="daily-back">
          <ArrowLeft size={14} /> Tableau de bord
        </Link>
        <div className="daily-head__row">
          <h1 className="display daily-title">
            <em>Une question</em>, à deux.
          </h1>
          {streak > 0 && (
            <motion.span
              className="streak-pill"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 380, damping: 24 }}
              title={`${streak} jour${streak > 1 ? 's' : ''} de suite`}
            >
              <Flame size={14} /> {streak}
            </motion.span>
          )}
        </div>
        <p className="daily-sub">
          Chaque jour, une question. Vous répondez chacun de votre côté, vos réponses se révèlent quand vous avez tous les deux répondu.
        </p>
      </header>

      {prompt && (
        <motion.section
          className="daily-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="daily-card__head">
            <span className="badge"><Sparkles size={12} /> Aujourd'hui</span>
            {prompt.question.category && (
              <span className="daily-card__category">{prompt.question.category}</span>
            )}
          </div>
          <h2 className="daily-card__question">{prompt.question.content}</h2>

          <AnimatePresence mode="wait">
            {prompt.both_answered ? (
              <motion.div key="reveal" {...fadeInOut} className="daily-reveal">
                <div className="reveal-row">
                  <Avatar name={user?.name} variant="a" size={36} />
                  <div className="reveal-bubble reveal-bubble--a">
                    <p className="reveal-name">{user?.name}</p>
                    <p>{prompt.my_response.content}</p>
                  </div>
                </div>
                <div className="reveal-row">
                  <Avatar name={prompt.partner_response?.name || 'Partenaire'} variant="b" size={36} />
                  <div className="reveal-bubble reveal-bubble--b">
                    <p className="reveal-name">{prompt.partner_response?.name || 'Partenaire'}</p>
                    <p>{prompt.partner_response?.content}</p>
                  </div>
                </div>
                <p className="daily-reveal__footer">
                  <Heart size={14} /> Revenez demain pour une nouvelle question.
                </p>
              </motion.div>
            ) : prompt.my_response ? (
              <motion.div key="waiting" {...fadeInOut} className="daily-waiting">
                <div className="reveal-row">
                  <Avatar name={user?.name} variant="a" size={36} />
                  <div className="reveal-bubble reveal-bubble--a">
                    <p className="reveal-name">{user?.name} <span className="reveal-status">— votre réponse</span></p>
                    <p>{prompt.my_response.content}</p>
                  </div>
                </div>
                <div className="daily-waiting__partner">
                  <span className="pulse-dot" /><span className="pulse-dot" /><span className="pulse-dot" />
                  <span><Hourglass size={14} /> {prompt.partner_has_answered ? 'Votre partenaire a répondu — révélation imminente…' : 'En attente de votre partenaire'}</span>
                </div>
              </motion.div>
            ) : (
              <motion.form key="form" {...fadeInOut} onSubmit={submit} className="daily-form">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Prenez une minute, et écrivez ce qui vous vient sincèrement…"
                  rows={5}
                  maxLength={2000}
                  required
                  autoFocus
                />
                <div className="daily-form__footer">
                  <span className="daily-form__hint">
                    <Clock size={14} /> Votre réponse sera révélée quand votre partenaire aura répondu
                  </span>
                  <button type="submit" className="btn btn-primary" disabled={submitting || !draft.trim()}>
                    {submitting ? <><Loader2 size={16} className="spin" /> Envoi…</> : <>Envoyer ma réponse <Send size={16} /></>}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.section>
      )}

      {/* History */}
      {history.length > 0 && (
        <section className="daily-history">
          <h2 className="daily-history__title">Vos échanges récents</h2>
          <ul className="daily-history__list">
            {history.map((p) => (
              <motion.li
                key={p.id}
                className="daily-history__item"
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <details>
                  <summary>
                    <span className="daily-history__date">
                      {new Date(p.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </span>
                    <span className="daily-history__q">{p.question.content}</span>
                    <ChevronRight size={16} className="daily-history__chev" />
                  </summary>
                  <div className="daily-history__body">
                    <div className="reveal-row">
                      <Avatar name={user?.name} variant="a" size={28} />
                      <div className="reveal-bubble reveal-bubble--a">
                        <p>{p.my_response?.content}</p>
                      </div>
                    </div>
                    <div className="reveal-row">
                      <Avatar name={p.partner_response?.name || '?'} variant="b" size={28} />
                      <div className="reveal-bubble reveal-bubble--b">
                        <p>{p.partner_response?.content}</p>
                      </div>
                    </div>
                  </div>
                </details>
              </motion.li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

const fadeInOut = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3 },
};
