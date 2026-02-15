import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import './ResultDetails.css';

export default function ResultDetails() {
  const { id } = useParams();
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

  if (loading) return <div className="result-details-loading">Chargement des détails…</div>;
  if (error) return <div className="result-details-error">{error}</div>;

  return (
    <div className="result-details">
      <h1>Détail des réponses</h1>
      <p className="result-details-legend">
        <span className="legend-you"><span className="legend-dot you" /> Vous</span>
        <span className="legend-partner"><span className="legend-dot partner" /> Partenaire</span>
      </p>

      <div className="details-list">
        {details.map((q) => (
          <article key={q.question_id} className="detail-card questionnaire-format">
            <span className="pillar-badge">{q.pillar}</span>
            <h2 className="detail-title">{q.title}</h2>
            <div className="options">
              {q.options?.map((opt) => (
                <div
                  key={opt.label}
                  className={`detail-option ${opt.chosen_by ? `chosen-${opt.chosen_by}` : ''}`}
                >
                  <span className="option-label">{opt.label}</span>
                  <span className="option-text">{opt.text}</span>
                  {opt.chosen_by && (
                    <span className="option-badges">
                      {(opt.chosen_by === 'me' || opt.chosen_by === 'both') && (
                        <span className="badge-you" title="Votre réponse">Vous</span>
                      )}
                      {(opt.chosen_by === 'partner' || opt.chosen_by === 'both') && (
                        <span className="badge-partner" title="Réponse du partenaire">Partenaire</span>
                      )}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="result-details-actions">
        <Link to={`/app/result/${id}`} className="btn btn-primary">Retour au résultat</Link>
        <Link to="/app" className="btn btn-outline">Tableau de bord</Link>
      </div>
    </div>
  );
}
