import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ApiErrorBlock from '../components/ApiErrorBlock';
import './History.css';

const LEVEL_LABELS = { strong: 'Très forte', solid: 'Solide', fragile: 'Fragile', weak: 'Faible' };

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

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="history">
        <h1>Historique des tests</h1>
        <div className="history-loading">Chargement…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="history">
        <h1>Historique des tests</h1>
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
      <h1>Historique des tests</h1>
      {list.length === 0 ? (
        <p className="history-empty">Aucun test complété pour le moment.</p>
      ) : (
        <ul className="history-list">
          {list.map((s) => (
            <li key={s.id} className="history-item">
              <div className="history-item-main">
                <span className="history-date">
                  {s.completed_at ? new Date(s.completed_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' }) : '—'}
                </span>
                <span className="history-pct">{s.percentage}%</span>
                <span className="history-level">{LEVEL_LABELS[s.level] || s.level}</span>
                {s.theme_names?.length > 0 && (
                  <span className="history-themes" title={s.theme_names.join(', ')}>
                    {s.theme_names.join(', ')}
                  </span>
                )}
              </div>
              <Link to={`/app/result/${s.id}`} className="btn btn-outline btn-sm">Voir le détail</Link>
            </li>
          ))}
        </ul>
      )}
      <p className="history-back">
        <Link to="/app">← Tableau de bord</Link>
      </p>
    </div>
  );
}
