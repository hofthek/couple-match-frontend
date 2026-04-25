import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Heart,
  Sparkles,
  MessagesSquare,
  Compass,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Users,
} from 'lucide-react';
import ScoreRing from '../components/ScoreRing';
import RadarChart from '../components/RadarChart';
import './Landing.css';

const PILLARS = [
  { icon: Heart, label: 'Compatibilité amoureuse', tone: 'a' },
  { icon: HeartHandshake, label: 'Valeurs partagées', tone: 'b' },
  { icon: Compass, label: 'Vision du futur', tone: 'a' },
  { icon: MessagesSquare, label: 'Communication', tone: 'b' },
  { icon: Sparkles, label: 'Quotidien & rituels', tone: 'a' },
  { icon: Users, label: 'Vie sociale', tone: 'b' },
];

const STEPS = [
  {
    n: '01',
    title: 'Créez votre couple',
    text: "Inscrivez-vous, créez votre couple et envoyez un code à votre partenaire pour qu'il vous rejoigne.",
  },
  {
    n: '02',
    title: 'Répondez ensemble',
    text: 'Chacun de votre côté, choisissez vos thèmes et répondez à un questionnaire conçu par des spécialistes.',
  },
  {
    n: '03',
    title: 'Découvrez votre score',
    text: 'Score de compatibilité, analyse par pilier, forces communes, zones sensibles et conseils personnalisés.',
  },
];

const TESTIMONIALS = [
  {
    name: 'Léa & Antoine',
    text: "On pensait bien se connaître après 4 ans ensemble — le test nous a fait découvrir des accords qu'on n'avait jamais nommés.",
  },
  {
    name: 'Sofia & Mehdi',
    text: 'Les conseils sur nos zones sensibles nous ont donné des idées concrètes de discussion. Vraiment apaisant.',
  },
  {
    name: 'Camille & Julie',
    text: 'Le format ludique et les questions précises ont rendu le moment vraiment agréable, comme un jeu à deux.',
  },
];

const fade = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
};

export default function Landing() {
  return (
    <div className="landing">
      <div className="landing-aurora" aria-hidden="true" />

      <nav className="landing-nav">
        <Link to="/" className="logo">
          <span className="logo-mark"><Heart size={16} fill="currentColor" /></span>
          <span>CoupleMatch</span>
        </Link>
        <div className="nav-links">
          <Link to="/login">Connexion</Link>
          <Link to="/register" className="btn btn-primary btn-sm">
            S'inscrire <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <header className="hero">
        <motion.div className="hero-content" {...fade}>
          <span className="hero-eyebrow">
            <Sparkles size={14} /> Test de compatibilité de couple
          </span>
          <h1 className="display hero-title">
            Mesurez la <em>compatibilité</em><br />de votre couple en 10&nbsp;minutes.
          </h1>
          <p className="hero-sub">
            Répondez à un questionnaire ensemble, chacun de votre côté.
            Découvrez vos forces communes, vos zones sensibles et recevez
            des conseils personnalisés.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary btn-lg">
              Commencer gratuitement <ArrowRight size={18} />
            </Link>
            <Link to="/login" className="btn btn-ghost btn-lg">J'ai déjà un compte</Link>
          </div>
          <div className="hero-trust">
            <span><ShieldCheck size={14} /> 100 % privé</span>
            <span>·</span>
            <span>Pas de carte bancaire</span>
            <span>·</span>
            <span>10 min à deux</span>
          </div>
        </motion.div>

        <motion.div
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-card-mock">
            <div className="hero-card-mock__head">
              <span className="badge"><Sparkles size={12} /> Votre résultat</span>
              <span className="hero-card-mock__date">Aperçu</span>
            </div>
            <ScoreRing value={87} label="Très forte compatibilité" size={180} stroke={11} />
            <div className="hero-card-mock__radar">
              <RadarChart
                data={[
                  { label: 'Amour', value: 92 },
                  { label: 'Valeurs', value: 88 },
                  { label: 'Vision', value: 80 },
                  { label: 'Comm.', value: 84 },
                  { label: 'Quotidien', value: 78 },
                  { label: 'Social', value: 90 },
                ]}
                size={220}
              />
            </div>
          </div>
        </motion.div>
      </header>

      {/* PILIERS */}
      <section className="section pillars">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="section-head"
        >
          <span className="badge">6 piliers analysés</span>
          <h2 className="display section-title">
            Tout ce qui fait la <em>singularité</em> de votre couple.
          </h2>
          <p className="section-sub">
            Au-delà du score, on regarde chaque dimension qui compte vraiment dans une relation.
          </p>
        </motion.div>
        <div className="pillars-grid">
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.article
                key={p.label}
                className={`pillar-tile pillar-tile--${p.tone}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
              >
                <span className="pillar-tile__icon"><Icon size={20} /></span>
                <span className="pillar-tile__label">{p.label}</span>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="section steps-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="section-head"
        >
          <span className="badge">Comment ça marche</span>
          <h2 className="display section-title">
            Trois étapes, à <em>deux</em>.
          </h2>
        </motion.div>
        <div className="steps-grid">
          {STEPS.map((s, i) => (
            <motion.article
              key={s.n}
              className="step-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.1 }}
            >
              <span className="step-card__n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="section testimonials">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="section-head"
        >
          <span className="badge">Ils l'ont fait</span>
          <h2 className="display section-title">
            Des couples qui se <em>redécouvrent</em>.
          </h2>
        </motion.div>
        <div className="testimonials-grid">
          {TESTIMONIALS.map((t, i) => (
            <motion.article
              key={t.name}
              className="testimonial-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.55, delay: i * 0.08 }}
            >
              <p className="testimonial-card__text">« {t.text} »</p>
              <p className="testimonial-card__name">{t.name}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="cta-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="cta-inner"
        >
          <h2 className="display cta-title">
            Et vous, à <em>combien</em> êtes-vous compatibles&nbsp;?
          </h2>
          <p className="cta-sub">
            10 minutes à deux. Une lecture honnête de votre relation.
          </p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Lancer notre test <ArrowRight size={18} />
          </Link>
        </motion.div>
      </section>

      <footer className="landing-footer">
        <span className="logo">
          <span className="logo-mark"><Heart size={14} fill="currentColor" /></span>
          CoupleMatch
        </span>
        <p>© {new Date().getFullYear()} CoupleMatch — Compatibilité de couple.</p>
      </footer>
    </div>
  );
}
