import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Clock, Send, Sparkles, Loader2 } from 'lucide-react';
import api from '../api/client';
import ApiErrorBlock from '../components/ApiErrorBlock';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../components/useToast';
import './Questionnaire.css';

export default function Questionnaire() {
  const [step, setStep] = useState('themes');
  const [themes, setThemes] = useState([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  const loadThemesAndSession = useCallback(async () => {
    try {
      const [themesRes, sessionRes] = await Promise.all([
        api.get('/themes'),
        api.get('/session/current'),
      ]);
      if (themesRes.data?.success && Array.isArray(themesRes.data.data)) {
        setThemes(themesRes.data.data);
      }
      const sess = sessionRes.data?.data?.session;
      if (sess) {
        setSession(sess);
        if (sess.result) {
          navigate(`/app/result/${sess.id}`, { replace: true });
          return;
        }
        const themeIds = sess.theme_ids?.length ? sess.theme_ids : null;
        const qParams = themeIds ? { params: { theme_ids: themeIds.join(',') } } : {};
        const qRes = await api.get('/questions', qParams);
        if (qRes.data?.success && Array.isArray(qRes.data.data) && qRes.data.data.length > 0) {
          setQuestions(qRes.data.data);
          setStep('questions');
        } else if (!themeIds) {
          setQuestions(qRes.data?.data || []);
          setStep('questions');
        }
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    document.title = 'Questionnaire — CoupleMatch';
    return () => { document.title = 'CoupleMatch'; };
  }, []);

  useEffect(() => { loadThemesAndSession(); }, [loadThemesAndSession]);

  function toggleTheme(id) {
    setSelectedThemeIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleStartWithThemes() {
    if (selectedThemeIds.length === 0) {
      setError('Sélectionnez au moins un thème.');
      return;
    }
    setStarting(true);
    setError('');
    try {
      const startRes = await api.post('/session/start', { theme_ids: selectedThemeIds });
      if (!startRes.data?.success || !startRes.data?.data?.session?.id) {
        setError('Impossible de démarrer la session.');
        return;
      }
      const newSession = startRes.data.data.session;
      setSession(newSession);
      const qRes = await api.get('/questions', {
        params: { theme_ids: selectedThemeIds.join(',') },
      });
      const qList = qRes.data?.success && Array.isArray(qRes.data.data) ? qRes.data.data : [];
      if (qList.length === 0) {
        setError('Aucune question pour les thèmes choisis.');
        setStarting(false);
        return;
      }
      setQuestions(qList);
      setStep('questions');
    } catch (err) {
      setError(err.response?.data?.message || 'Impossible de démarrer. Avez-vous un couple actif ?');
    } finally {
      setStarting(false);
    }
  }

  function handleOption(optionId) {
    const q = questions[currentIndex];
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }));
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setTimeout(() => setCurrentIndex((i) => i + 1), 240);
    }
  }

  async function handleSubmit() {
    const filled = questions.filter((qu) => answers[qu.id]).length;
    if (filled < questions.length) {
      const missing = questions.length - filled;
      toast.error(`Il reste ${missing} question${missing > 1 ? 's' : ''} sans réponse`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        session_id: session?.id,
        answers: questions.map((qu) => ({ question_id: qu.id, option_id: answers[qu.id] })),
      };
      const { data } = await api.post('/session/submit', payload);
      if (data.success) {
        toast.success('Réponses envoyées !');
        if (data.data?.calculated && data.data?.result) {
          navigate(`/app/result/${data.data.result.session_id}`, { replace: true });
        } else {
          navigate('/app', { replace: true });
        }
      } else setError(data.message || 'Erreur');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  // Build segmented progress by theme/pillar
  const segments = useMemo(() => {
    if (!questions.length) return [];
    const groups = [];
    let lastKey = null;
    questions.forEach((q, i) => {
      const key = q.theme?.id || q.pillar || 'all';
      if (key !== lastKey) {
        groups.push({ key, label: q.theme?.name || q.pillar || '—', from: i, to: i });
        lastKey = key;
      } else {
        groups[groups.length - 1].to = i;
      }
    });
    return groups;
  }, [questions]);

  if (loading) {
    return (
      <div className="questionnaire">
        <LoadingSkeleton variant="cards" />
      </div>
    );
  }

  if (error && step === 'themes' && themes.length === 0) {
    return (
      <div className="questionnaire">
        <ApiErrorBlock
          message={error}
          onRetry={() => { setError(''); loadThemesAndSession(); }}
          backTo="/app"
          backLabel="Retour au tableau de bord"
        />
      </div>
    );
  }

  // ÉTAPE 1 — choix des thèmes
  if (step === 'themes') {
    return (
      <motion.div
        className="questionnaire questionnaire-themes"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <header className="themes-head">
          <span className="badge"><Sparkles size={12} /> Étape 1 sur 2</span>
          <h1 className="display themes-title">
            Choisissez vos <em>thèmes</em>.
          </h1>
          <p className="themes-sub">
            Sélectionnez un ou plusieurs thèmes pour personnaliser votre questionnaire.
          </p>
        </header>

        {error && <div className="questionnaire-error">{error}</div>}

        <div className="theme-cards">
          {themes.map((theme, i) => {
            const selected = selectedThemeIds.includes(theme.id);
            return (
              <motion.button
                key={theme.id}
                type="button"
                className={`theme-card ${selected ? 'theme-card--selected' : ''}`}
                onClick={() => toggleTheme(theme.id)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="theme-card__check">
                  <AnimatePresence>
                    {selected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Check size={12} strokeWidth={3} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <h3 className="theme-card__name">{theme.name}</h3>
                {theme.description && (
                  <p className="theme-card__description">{theme.description}</p>
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="themes-footer">
          <p className="themes-footer__estimate">
            <Clock size={14} /> {selectedThemeIds.length === 0 ? 'Sélectionnez au moins un thème' : `≈ ${Math.max(5, selectedThemeIds.length * 4)} min à deux`}
          </p>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={handleStartWithThemes}
            disabled={selectedThemeIds.length === 0 || starting}
          >
            {starting ? <><Loader2 size={18} className="spin" /> Démarrage…</> : <>Démarrer le questionnaire <ArrowRight size={18} /></>}
          </button>
        </div>
      </motion.div>
    );
  }

  // ÉTAPE 2 — questions
  if (!questions.length) {
    return (
      <div className="questionnaire-empty">
        <p>Aucune question disponible.</p>
        <button type="button" className="btn btn-outline" onClick={() => setStep('themes')}>
          Changer les thèmes
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];
  const total = questions.length;
  const answeredCount = Object.keys(answers).filter((k) => questions.find((x) => String(x.id) === String(k))).length;
  const remaining = total - answeredCount;
  const remainingMins = Math.max(1, Math.round((remaining * 12) / 60)); // ~12s/question

  function go(delta) {
    const next = currentIndex + delta;
    if (next < 0 || next >= total) return;
    setDirection(delta);
    setCurrentIndex(next);
  }

  return (
    <div className="questionnaire questionnaire-quiz">
      {error && <div className="questionnaire-error">{error}</div>}

      {/* Progress segmenté */}
      <div className="qprogress">
        <div className="qprogress__head">
          <span className="qprogress__count">
            <strong>{currentIndex + 1}</strong> / {total}
          </span>
          <span className="qprogress__time"><Clock size={12} /> ≈ {remainingMins} min restantes</span>
        </div>
        <div className="qprogress__segments">
          {segments.map((seg) => {
            const segLen = seg.to - seg.from + 1;
            const segPos = currentIndex >= seg.from
              ? Math.min(segLen, currentIndex - seg.from + 1)
              : 0;
            const pct = (segPos / segLen) * 100;
            return (
              <div key={seg.key} className="qprogress__seg" title={seg.label} style={{ flex: segLen }}>
                <div className="qprogress__seg-fill" style={{ width: `${pct}%` }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Question card */}
      <div className="qcard-wrap">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.article
            key={q.id}
            className="qcard"
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            {q.theme && <span className="badge qcard__theme">{q.theme.name}</span>}
            {!q.theme && q.pillar && <span className="badge qcard__theme">{q.pillar}</span>}
            <h2 className="qcard__title">{q.title}</h2>

            <div className="options">
              {q.options?.map((opt, i) => {
                const selected = answers[q.id] === opt.id;
                return (
                  <motion.button
                    key={opt.id}
                    type="button"
                    className={`option-btn ${selected ? 'is-selected' : ''}`}
                    onClick={() => handleOption(opt.id)}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 + i * 0.04 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="option-key">{opt.label}</span>
                    <span className="option-text">{opt.text}</span>
                    <span className="option-check">
                      {selected && <Check size={14} strokeWidth={3} />}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="qactions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => go(-1)}
          disabled={currentIndex === 0}
        >
          <ArrowLeft size={16} /> Précédent
        </button>
        {currentIndex === total - 1 && answeredCount === total ? (
          <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><Loader2 size={16} className="spin" /> Envoi…</> : <><Send size={16} /> Envoyer mes réponses</>}
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => go(1)}
            disabled={!answers[q.id]}
          >
            Suivant <ArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
