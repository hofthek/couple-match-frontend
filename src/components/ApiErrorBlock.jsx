import { Link } from 'react-router-dom';
import './ApiErrorBlock.css';

/**
 * Bloc d'erreur API réutilisable avec message et bouton Réessayer.
 * @param {{ message: string, onRetry?: () => void, backTo?: string, backLabel?: string }} props
 */
export default function ApiErrorBlock({ message, onRetry, backTo, backLabel }) {
  return (
    <div className="api-error-block" role="alert">
      <p className="api-error-message">{message}</p>
      <div className="api-error-actions">
        {onRetry && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Réessayer
          </button>
        )}
        {backTo && (
          <Link to={backTo} className="btn btn-outline">
            {backLabel ?? 'Retour'}
          </Link>
        )}
      </div>
    </div>
  );
}
