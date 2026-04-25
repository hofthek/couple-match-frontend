import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight, Sparkles } from 'lucide-react';
import api from '../api/client';
import ApiErrorBlock from '../components/ApiErrorBlock';
import LoadingSkeleton from '../components/LoadingSkeleton';
import './History.css';

const LEVEL_LABELS = { strong: 'Très forte', solid: 'Solide', fragile: 'Fragile', weak: 'Faible' };
const LEVEL_TONES = { strong: 'tone-strong', solid: 'tone-solid', fragile: 'tone-fragile', weak: 'tone-weak' };

export default function History() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api.get('/session/history')
      .then((r) => {
        if (r.data?.success && Array.isArray(r.data.data)) setList(r.data.data);
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    document.title = 'Historique des tests — CoupleMatch';
    return () => { document.title = 'CoupleMatch'; };
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="history">
        <h1 className="display history-title">Historique</h1>
        <LoadingSkeleton variant="cards" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="history">
        <h1 className="display history-title">Historique</h1>
        <ApiErrorBlock
          message={error}
          onRetry={() => { setError(''); load(); }}
          backTo="/app"
          backLabel="Tableau de bord"
        />
      </div>
    );
  }

  return (
    <div className="history">
      <header className="history-head">
        <h1 className="display history-title">Vos résultats</h1>
        <p>L'évolution de votre compatibilité au fil du temps.</p>
      </header>

      {list.length === 0 ? (
        <div className="history-empty">
          <span className="history-empty__icon"><Sparkles size={28} /></span>
          <h2>Aucun test pour le moment</h2>
          <p>Lancez votre premier test ensemble pour découvrir votre compatibilité.</p>
          <Link to="/app/questionnaire" className="btn btn-primary">Commencer un test</Link>
        </div>
      ) : (
        <ul className="history-list">
          {list.map((s, i) => (
            <motion.li
              key={s.id}
              className={`history-item ${LEVEL_TONES[s.level] || ''}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Link to={`/app/result/${s.id}`} className="history-item__link">
                <div className="history-item__score" aria-hidden="true">
                  <span>{s.percentage}</span><sup>%</sup>
                </div>
                <div className="history-item__info">
                  <p className="history-item__date">
                    {s.completed_at ? new Date(s.completed_at).toLocaleDateString('fr-FR', { dateStyle: 'long' }) : '—'}
                  </p>
                  <p className="history-item__level">{LEVEL_LABELS[s.level] || s.level}</p>
                  {s.theme_names?.length > 0 && (
                    <p className="history-item__themes">{s.theme_names.join(' · ')}</p>
                  )}
                </div>
                <ChevronRight size={18} className="history-item__chevron" />
              </Link>
            </motion.li>
          ))}
        </ul>
      )}

      <p className="history-back">
        <Link to="/app"><ArrowLeft size={14} /> Tableau de bord</Link>
      </p>
    </div>
  );
}
