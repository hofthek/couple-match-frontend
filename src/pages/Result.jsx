import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, AlertCircle, Lightbulb, Share2, ChevronLeft, ChevronRight, Clock, MessagesSquare } from 'lucide-react';
import api from '../api/client';
import ScoreRing from '../components/ScoreRing';
import RadarChart from '../components/RadarChart';
import Confetti from '../components/Confetti';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ApiErrorBlock from '../components/ApiErrorBlock';
import { useToast } from '../components/useToast';
import './Result.css';

const LEVEL_LABELS = {
  strong: 'Très forte compatibilité',
  solid: 'Solide',
  fragile: 'Fragile',
  weak: 'Faible',
};

const LEVEL_TONES = {
  strong: 'tone-strong',
  solid: 'tone-solid',
  fragile: 'tone-fragile',
  weak: 'tone-weak',
};

export default function Result() {
  const { id } = useParams();
  const toast = useToast();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adviceIndex, setAdviceIndex] = useState(0);
  const [confettiActive, setConfettiActive] = useState(false);

  useEffect(() => {
    document.title = 'Résultat — CoupleMatch';
    return () => { document.title = 'CoupleMatch'; };
  }, [id]);

  useEffect(() => {
    api.get(`/session/${id}/result`)
      .then((r) => {
        if (r.data?.success) {
          setResult(r.data.data);
          if ((r.data.data?.percentage ?? 0) >= 80) {
            setTimeout(() => setConfettiActive(true), 600);
          }
        } else setError(r.data?.message || 'Résultat non trouvé');
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleShare() {
    const text = `Notre compatibilité de couple : ${result.percentage}% — ${LEVEL_LABELS[result.level] || result.level}`;
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title: 'CoupleMatch', text, url });
      } catch { /* user cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        toast.success('Résultat copié dans le presse-papier');
      } catch {
        toast.error('Impossible de copier');
      }
    }
  }

  if (loading) {
    return (
      <div className="result">
        <LoadingSkeleton variant="cards" />
      </div>
    );
  }
  if (error || !result) {
    return (
      <div className="result">
        <ApiErrorBlock message={error || 'Résultat non disponible.'} backTo="/app" backLabel="Tableau de bord" />
      </div>
    );
  }

  const tone = LEVEL_TONES[result.level] || 'tone-solid';
  const radarData = (result.pillar_results || []).map((p) => ({
    label: p.pillar,
    value: Math.round(p.percentage),
  }));
  const advices = result.advice || [];

  return (
    <div className={`result ${tone}`}>
      <Confetti active={confettiActive} />

      {/* HERO SCORE */}
      <motion.section
        className="result-hero"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="badge result-hero__badge">
          <Sparkles size={12} /> Votre compatibilité
        </span>
        <h1 className="display result-hero__title">
          Vous êtes <em>{result.percentage}%</em> compatibles.
        </h1>
        <p className="result-hero__level">{LEVEL_LABELS[result.level] || result.level}</p>

        <div className="result-hero__ring">
          <ScoreRing value={result.percentage} size={240} stroke={14} />
        </div>

        <div className="result-hero__actions">
          <button type="button" className="btn btn-primary" onClick={handleShare}>
            <Share2 size={16} /> Partager
          </button>
          <Link to={`/app/result/${id}/details`} className="btn btn-outline">
            Détails des réponses
          </Link>
        </div>
      </motion.section>

      {/* RADAR */}
      {radarData.length > 0 && (
        <motion.section
          className="card result-card"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          <header className="result-card__head">
            <h2>Vos piliers en un coup d'œil</h2>
            <p>Visualisation de chaque dimension analysée.</p>
          </header>
          <RadarChart data={radarData} size={320} />
          <ul className="pillar-bars">
            {result.pillar_results.map((p) => (
              <li key={p.pillar}>
                <span className="pillar-bars__name">{p.pillar}</span>
                <span className="pillar-bars__track">
                  <span
                    className="pillar-bars__fill"
                    style={{ width: `${Math.max(0, Math.min(100, p.percentage))}%` }}
                  />
                </span>
                <span className="pillar-bars__pct">{Math.round(p.percentage)}%</span>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {/* FORCES */}
      {result.strengths && (result.strengths.pillars?.length > 0 || result.strengths.messages?.length > 0) && (
        <motion.section
          className="card result-card result-card--strengths"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          <header className="result-card__head">
            <span className="result-card__icon strengths"><Heart size={18} /></span>
            <div>
              <h2>Vos forces communes</h2>
              <p>Là où vous résonnez naturellement.</p>
            </div>
          </header>
          {result.strengths.pillars?.length > 0 && (
            <div className="chip-row">
              {result.strengths.pillars.map((x) => (
                <span key={x.pillar} className="chip chip--success">{x.pillar}</span>
              ))}
            </div>
          )}
          {result.strengths.messages?.map((msg, i) => (
            <p key={i} className="result-card__msg">{msg}</p>
          ))}
        </motion.section>
      )}

      {/* SENSITIVE */}
      {result.sensitive_zones && (result.sensitive_zones.pillars?.length > 0 || result.sensitive_zones.messages?.length > 0) && (
        <motion.section
          className="card result-card result-card--sensitive"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          <header className="result-card__head">
            <span className="result-card__icon sensitive"><AlertCircle size={18} /></span>
            <div>
              <h2>À explorer ensemble</h2>
              <p>Des zones à creuser, sans jugement.</p>
            </div>
          </header>
          {result.sensitive_zones.pillars?.length > 0 && (
            <div className="chip-row">
              {result.sensitive_zones.pillars.map((x) => (
                <span key={x.pillar} className="chip chip--warning">{x.pillar}</span>
              ))}
            </div>
          )}
          {result.sensitive_zones.messages?.map((msg, i) => (
            <p key={i} className="result-card__msg">{msg}</p>
          ))}
        </motion.section>
      )}

      {/* CONSEILS — carrousel */}
      {advices.length > 0 && (
        <motion.section
          className="card result-card result-card--advice"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.55 }}
        >
          <header className="result-card__head">
            <span className="result-card__icon advice"><Lightbulb size={18} /></span>
            <div>
              <h2>Conseils personnalisés</h2>
              <p>{advices.length} idée{advices.length > 1 ? 's' : ''} pour cultiver votre lien.</p>
            </div>
          </header>
          <div className="advice-carousel">
            <AnimatePresence mode="wait">
              <motion.div
                key={adviceIndex}
                className="advice-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <span className="advice-card__n">
                  <Clock size={12} /> {String(adviceIndex + 1).padStart(2, '0')} / {String(advices.length).padStart(2, '0')}
                </span>
                <p>{advices[adviceIndex]}</p>
              </motion.div>
            </AnimatePresence>
            {advices.length > 1 && (
              <div className="advice-carousel__nav">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm icon-btn"
                  onClick={() => setAdviceIndex((i) => (i - 1 + advices.length) % advices.length)}
                  aria-label="Conseil précédent"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="advice-dots">
                  {advices.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`advice-dot ${i === adviceIndex ? 'is-active' : ''}`}
                      onClick={() => setAdviceIndex(i)}
                      aria-label={`Conseil ${i + 1}`}
                    />
                  ))}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm icon-btn"
                  onClick={() => setAdviceIndex((i) => (i + 1) % advices.length)}
                  aria-label="Conseil suivant"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </motion.section>
      )}

      <div className="result-coach-cta">
        <div>
          <h3>Envie d'en parler ?</h3>
          <p>Le coach IA peut vous aider à explorer un sujet précis de ce résultat, à deux.</p>
        </div>
        <Link to="/app/coach" className="btn btn-primary">
          <MessagesSquare size={16} /> Parler au coach
        </Link>
      </div>

      <div className="result-footer-actions">
        <Link to="/app" className="btn btn-ghost">Tableau de bord</Link>
        <Link to="/app/history" className="btn btn-ghost">Historique</Link>
      </div>
    </div>
  );
}
