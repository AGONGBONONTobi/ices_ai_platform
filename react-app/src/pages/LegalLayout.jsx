import { Link } from "react-router-dom";
import Footer from "../components/Footer";

/**
 * Gabarit commun aux pages légales : en-tête sobre + contenu + footer.
 */
export default function LegalLayout({ eyebrow = "Informations légales", title, updated, children }) {
  return (
    <>
      <header className="legal-header">
        <div className="container legal-header-inner">
          <Link className="brand" to="/">
            <span className="seal seal-logo" aria-hidden="true">
              <img src="/assets/img/moradeke-badirou-logo.png" alt="" width="48" height="48" />
            </span>
            <span className="brand-text">
              <span className="brand-name">Moradéké Badirou</span>
              <span className="brand-role">Avocate — Barreau de Paris</span>
            </span>
          </Link>
          <Link className="legal-back" to="/">← Retour à l'accueil</Link>
        </div>
      </header>

      <main className="legal" id="main">
        <div className="container legal-container">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          {updated && <p className="legal-updated">Dernière mise à jour : {updated}</p>}
          {children}
        </div>
      </main>

      <Footer />
    </>
  );
}

/** Marqueur d'information à renseigner par le cabinet avant mise en ligne. */
export function Todo({ children }) {
  return <span className="legal-todo">[À compléter : {children}]</span>;
}
