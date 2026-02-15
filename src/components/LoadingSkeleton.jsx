import './LoadingSkeleton.css';

/**
 * Skeleton de chargement pour cartes / blocs.
 * variant: 'cards' (plusieurs cartes) | 'single' (une carte large)
 */
export default function LoadingSkeleton({ variant = 'single' }) {
  if (variant === 'cards') {
    return (
      <div className="loading-skeleton loading-skeleton--cards">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    );
  }
  return (
    <div className="loading-skeleton">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line" />
      <div className="skeleton-line skeleton-short" />
      <div className="skeleton-block" />
    </div>
  );
}
