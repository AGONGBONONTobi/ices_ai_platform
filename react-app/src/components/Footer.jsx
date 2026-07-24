import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <a className="brand" href="#accueil">
            <span className="seal seal-logo" aria-hidden="true">
              <img src="/assets/img/moradeke-badirou-logo.png" alt="" width="48" height="48" />
            </span>
            <span className="brand-text">
              <span className="brand-name">Moradéké Badirou</span>
              <span className="brand-role">Avocate — Barreau de Paris</span>
            </span>
          </a>
          <p>Droit commercial, droit de la famille et droit des étrangers. Chaque dossier suivi personnellement.</p>
        </div>

        <div className="footer-col">
          <p className="fiche-label">Navigation</p>
          <ul>
            <li><a href="#presentation">Présentation</a></li>
            <li><a href="#competences">Compétences</a></li>
            <li><a href="#honoraires">Honoraires</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <p className="fiche-label">Compétences</p>
          <ul>
            <li><a href="#competences">Droit commercial</a></li>
            <li><a href="#competences">Droit de la famille</a></li>
            <li><a href="#competences">Droit des étrangers</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <p className="fiche-label">Coordonnées</p>
          <ul className="footer-contact">
            <li>2 Rue Mariotte, 75017 Paris</li>
            <li><a href="tel:0671429695">06 71 42 96 95</a></li>
            <li><a href="mailto:moradeke.badirou@avocat.fr">moradeke.badirou@avocat.fr</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>&copy; {year} Maître Moradéké Badirou — Avocate au Barreau de Paris.</p>
          <span className="footer-legal-links">
            <Link to="/mentions-legales">Mentions légales</Link>
            <Link to="/confidentialite">Politique de confidentialité</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
