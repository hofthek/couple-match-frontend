import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Check } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ApiErrorBlock from '../components/ApiErrorBlock';
import Avatar from '../components/Avatar';
import './ResultDetails.css';

export default function ResultDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const [details, setDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Détail des réponses — CoupleMatch';
    return () => { document.title = 'CoupleMatch'; };
  }, [id]);

  useEffect(() => {
    api.get(`/session/${id}/details`)
      .then((r) => {
        if (r.data?.success && Array.isArray(r.data.data)) setDetails(r.data.data);
        else setError(r.data?.message || 'Détails non trouvés');
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="result-details">
        <LoadingSkeleton />
      </div>
    );
  }
  if (error) {
    return (
      <div className="result-details">
        <ApiErrorBlock message={error} backTo={`/app/result/${id}`} backLabel="Retour au résultat" />
      </div>
    );
  }

  return (
    <div className="result-details">
      <header className="rd-head">
        <Link to={`/app/result/${id}`} className="rd-back">
          <ArrowLeft size={14} /> Résultat
        </Link>
        <h1 className="display rd-title">Détail de vos réponses</h1>
        <div className="rd-legend">
          <span className="rd-legend__item">
            <Avatar name={user?.name} variant="a" size={20} />
            <span>Vous</span>
          </span>
          <span className="rd-legend__item">
            <Avatar name="Partenaire" variant="b" size={20} />
            <span>Partenaire</span>
          </span>
          <span className="rd-legend__item rd-legend__match">
            <span className="rd-dot rd-dot--match" /> Accord
          </span>
        </div>
      </header>

      <div className="rd-list">
        {details.map((q, i) => (
          <motion.article
            key={q.question_id}
            className="rd-card card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.03 }}
          >
            {q.pillar && <span className="badge rd-card__pillar">{q.pillar}</span>}
            <h2 className="rd-card__title">{q.title}</h2>
            <div className="rd-options">
              {q.options?.map((opt) => {
                const me = opt.chosen_by === 'me' || opt.chosen_by === 'both';
                const partner = opt.chosen_by === 'partner' || opt.chosen_by === 'both';
                const both = opt.chosen_by === 'both';
                return (
                  <div
                    key={opt.label}
                    className={`rd-option ${both ? 'is-match' : me ? 'is-me' : partner ? 'is-partner' : ''}`}
                  >
                    <span className="rd-option__key">{opt.label}</span>
                    <span className="rd-option__text">{opt.text}</span>
                    <span className="rd-option__avatars">
                      {me && (
                        <span className="rd-pill rd-pill--me">
                          <Check size={10} strokeWidth={3} /> Vous
                        </span>
                      )}
                      {partner && (
                        <span className="rd-pill rd-pill--partner">
                          <Check size={10} strokeWidth={3} /> Partenaire
                        </span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.article>
        ))}
      </div>

      <div className="rd-actions">
        <Link to={`/app/result/${id}`} className="btn btn-outline"><ArrowLeft size={16} /> Retour au résultat</Link>
        <Link to="/app" className="btn btn-ghost">Tableau de bord</Link>
      </div>
    </div>
  );
}
