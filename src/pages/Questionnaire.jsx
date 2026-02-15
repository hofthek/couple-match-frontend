import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import ApiErrorBlock from '../components/ApiErrorBlock';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './Questionnaire.css';

export default function Questionnaire() {
  const [step, setStep] = useState('themes'); // 'themes' | 'questions'
  const [themes, setThemes] = useState([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
        // Session en cours : charger les questions (avec theme_ids si présents) et passer au questionnaire
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

  useEffect(() => {
    loadThemesAndSession();
  }, [loadThemesAndSession]);

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
    if (currentIndex < questions.length - 1) setCurrentIndex((i) => i + 1);
  }

  async function handleSubmit() {
    const filled = questions.filter((qu) => answers[qu.id]).length;
    if (filled < questions.length) {
      setError(`Répondez à toutes les questions (${filled}/${questions.length}).`);
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

  if (loading) {
    return (
      <div className="questionnaire questionnaire-themes">
        <h1 className="questionnaire-themes-title">Chargement…</h1>
        <LoadingSkeleton variant="cards" />
      </div>
    );
  }

  if (error && step === 'themes' && themes.length === 0) {
    return (
      <div className="questionnaire">
        <h1 className="questionnaire-themes-title">Questionnaire</h1>
        <ApiErrorBlock
          message={error}
          onRetry={() => { setError(''); loadThemesAndSession(); }}
          backTo="/app"
          backLabel="Retour au tableau de bord"
        />
      </div>
    );
  }

  // Étape 1 : choix des thèmes (cartes)
  if (step === 'themes') {
    return (
      <div className="questionnaire questionnaire-themes">
        <h1 className="questionnaire-themes-title">Choisissez vos thèmes</h1>
        <p className="questionnaire-themes-subtitle">
          Sélectionnez un ou plusieurs thèmes pour personnaliser votre questionnaire.
        </p>
        {error && <div className="questionnaire-error">{error}</div>}
        <div className="theme-cards">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              className={`theme-card ${selectedThemeIds.includes(theme.id) ? 'theme-card--selected' : ''}`}
              onClick={() => toggleTheme(theme.id)}
            >
              <span className="theme-card__check">
                {selectedThemeIds.includes(theme.id) ? '✓' : ''}
              </span>
              <h3 className="theme-card__name">{theme.name}</h3>
              {theme.description && (
                <p className="theme-card__description">{theme.description}</p>
              )}
            </button>
          ))}
        </div>
        <div className="questionnaire-themes-actions">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartWithThemes}
            disabled={selectedThemeIds.length === 0 || starting}
          >
            {starting ? 'Démarrage…' : 'Démarrer le questionnaire'}
          </button>
        </div>
      </div>
    );
  }

  // Étape 2 : questionnaire (questions)
  if (!questions.length) {
    return (
      <div className="questionnaire-empty">
        Aucune question disponible. <button type="button" className="btn btn-outline" onClick={() => setStep('themes')}>Changer les thèmes</button>
      </div>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="questionnaire">
      {error && <div className="questionnaire-error">{error}</div>}
      <div className="questionnaire-progress">
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <span>{currentIndex + 1} / {questions.length}</span>
      </div>
      <div className="questionnaire-card">
        {q.theme && (
          <span className="pillar-badge theme-badge">{q.theme.name}</span>
        )}
        {!q.theme && <span className="pillar-badge">{q.pillar}</span>}
        <h2>{q.title}</h2>
        <div className="options">
          {q.options?.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`option-btn ${answers[q.id] === opt.id ? 'selected' : ''}`}
              onClick={() => handleOption(opt.id)}
            >
              <span className="option-label">{opt.label}</span>
              <span className="option-text">{opt.text}</span>
            </button>
          ))}
        </div>
        <div className="questionnaire-actions">
          {currentIndex > 0 && (
            <button type="button" className="btn btn-outline" onClick={() => setCurrentIndex((i) => i - 1)}>
              Précédent
            </button>
          )}
          {currentIndex === questions.length - 1 && Object.keys(answers).length === questions.length ? (
            <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Envoi…' : 'Envoyer mes réponses'}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setCurrentIndex((i) => Math.min(i + 1, questions.length - 1))}
              disabled={!answers[q.id]}
            >
              Suivant
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
