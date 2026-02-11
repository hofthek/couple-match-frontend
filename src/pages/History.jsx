import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import './History.css';

const LEVEL_LABELS = { strong: 'Très forte', solid: 'Solide', fragile: 'Fragile', weak: 'Faible' };

export default function History() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/session/history')
      .then((r) => {
        if (r.data?.success && Array.isArray(r.data.data)) setList(r.data.data);
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="history-loading">Chargement…</div>;
  if (error) return <div className="history-error">{error}</div>;

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
