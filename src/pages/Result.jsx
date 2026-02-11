import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import './Result.css';

const LEVEL_LABELS = {
  strong: 'Très forte compatibilité',
  solid: 'Solide',
  fragile: 'Fragile',
  weak: 'Faible',
};

export default function Result() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/session/${id}/result`)
      .then((r) => {
        if (r.data?.success) setResult(r.data.data);
        else setError(r.data?.message || 'Résultat non trouvé');
      })
      .catch((e) => setError(e.response?.data?.message || 'Erreur'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="result-loading">Chargement du résultat…</div>;
  if (error || !result) return <div className="result-error">{error || 'Résultat non disponible.'}</div>;

  return (
    <div className="result">
      <h1>Résultat de compatibilité</h1>
      <div className="result-score-card">
        <div className="score-circle">
          <span className="score-value">{result.percentage}%</span>
        </div>
        <p className="score-level">{LEVEL_LABELS[result.level] || result.level}</p>
      </div>

      {result.pillar_results?.length > 0 && (
        <section className="result-section">
          <h2>Par pilier</h2>
          <ul className="pillar-list">
            {result.pillar_results.map((p) => (
              <li key={p.pillar}>
                <span className="pillar-name">{p.pillar}</span>
                <span className="pillar-pct">{p.percentage}%</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.strengths && (result.strengths.pillars?.length > 0 || result.strengths.messages?.length > 0) && (
        <section className="result-section strengths">
          <h2>Forces communes</h2>
          {result.strengths.pillars?.length > 0 && (
            <p>Piliers forts : {result.strengths.pillars.map((x) => x.pillar).join(', ')}</p>
          )}
          {result.strengths.messages?.map((msg, i) => <p key={i}>{msg}</p>)}
        </section>
      )}

      {result.sensitive_zones && (result.sensitive_zones.pillars?.length > 0 || result.sensitive_zones.messages?.length > 0) && (
        <section className="result-section sensitive">
          <h2>Zones sensibles</h2>
          {result.sensitive_zones.pillars?.length > 0 && (
            <p>Piliers à renforcer : {result.sensitive_zones.pillars.map((x) => x.pillar).join(', ')}</p>
          )}
          {result.sensitive_zones.messages?.map((msg, i) => <p key={i}>{msg}</p>)}
        </section>
      )}

      {result.advice?.length > 0 && (
        <section className="result-section advice">
          <h2>Conseils</h2>
          <ul>
            {result.advice.map((text, i) => <li key={i}>{text}</li>)}
          </ul>
        </section>
      )}

      <div className="result-actions">
        <Link to={`/app/result/${id}/details`} className="btn btn-primary">Détails des réponses</Link>
        <Link to="/app" className="btn btn-outline">Tableau de bord</Link>
        <Link to="/app/history" className="btn btn-outline">Historique</Link>
      </div>
    </div>
  );
}
