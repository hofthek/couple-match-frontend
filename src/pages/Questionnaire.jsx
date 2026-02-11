import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import './Questionnaire.css';

export default function Questionnaire() {
  const [questions, setQuestions] = useState([]);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          api.get('/questions'),
          api.get('/session/current'),
        ]);
        if (qRes.data?.success && Array.isArray(qRes.data.data)) setQuestions(qRes.data.data);
        const sess = sRes.data?.data?.session;
        if (sess) {
          setSession(sess);
          if (sess.result) {
            navigate(`/app/result/${sess.id}`, { replace: true });
            return;
          }
        }
      } catch (e) {
        setError(e.response?.data?.message || 'Erreur chargement');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  useEffect(() => {
    if (questions.length === 0 || session?.id) return;
    api.post('/session/start')
      .then((r) => {
        if (r.data?.success && r.data?.data?.session?.id) {
          setSession((prev) => ({ ...(prev || {}), id: r.data.data.session.id }));
        }
      })
      .catch(() => setError('Impossible de démarrer la session. Avez-vous un couple actif ?'));
  }, [questions.length, session?.id]);

  if (loading) return <div className="questionnaire-loading">Chargement du questionnaire…</div>;
  if (error) return <div className="questionnaire-error">{error}</div>;
  if (!questions.length) return <div className="questionnaire-empty">Aucune question disponible.</div>;

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  function handleOption(optionId) {
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
      setError(err.response?.data?.message || 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="questionnaire">
      <div className="questionnaire-progress">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
        <span>{currentIndex + 1} / {questions.length}</span>
      </div>
      <div className="questionnaire-card">
        <span className="pillar-badge">{q.pillar}</span>
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
