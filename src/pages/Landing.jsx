import { Link } from 'react-router-dom';
import './Landing.css';

export default function Landing() {
  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="logo">CoupleMatch</span>
        <div className="nav-links">
          <Link to="/login">Connexion</Link>
          <Link to="/register" className="btn btn-primary">S'inscrire</Link>
        </div>
      </nav>

      <header className="hero">
        <h1>
          Découvrez votre <em>compatibilité</em> à deux
        </h1>
        <p className="hero-sub">
          Répondez au questionnaire ensemble, analysez vos forces et vos zones de croissance,
          et recevez des conseils personnalisés pour votre couple.
        </p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">Commencer gratuitement</Link>
          <Link to="/login" className="btn btn-outline btn-lg">J'ai déjà un compte</Link>
        </div>
      </header>

      <section className="features">
        <h2>Comment ça marche ?</h2>
        <div className="features-grid">
          <article className="feature-card">
            <span className="feature-icon">💑</span>
            <h3>Créez votre couple</h3>
            <p>Inscrivez-vous, créez un couple et partagez un code d'invitation à votre partenaire.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon">📝</span>
            <h3>Répondez au questionnaire</h3>
            <p>40 questions sur 4 piliers : émotions, valeurs, vision et quotidien. Chacun répond de son côté.</p>
          </article>
          <article className="feature-card">
            <span className="feature-icon">📊</span>
            <h3>Obtenez vos résultats</h3>
            <p>Score de compatibilité, analyse par pilier, forces communes, zones sensibles et conseils personnalisés.</p>
          </article>
        </div>
      </section>

      <section className="cta-section">
        <h2>Prêt à mieux vous comprendre ?</h2>
        <Link to="/register" className="btn btn-primary btn-lg">Créer un compte</Link>
      </section>

      <footer className="landing-footer">
        <p>© CoupleMatch – Compatibilité de couple</p>
      </footer>
    </div>
  );
}
