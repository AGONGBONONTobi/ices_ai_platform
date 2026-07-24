import Reveal from "./Reveal";

export default function Hero({ sectionRef }) {
  return (
    <section className="hero" id="accueil" ref={sectionRef}>
      <div className="hero-bg" aria-hidden="true">
        <div className="hero-glow" />
      </div>

      <div className="container hero-grid">
        <div className="hero-text">
          <Reveal as="p" className="eyebrow">
            Avocate — Barreau de Paris · Serment prêté en 2024
          </Reveal>

          <Reveal as="h1" className="hero-title" delay="1">
            Maître Moradéké Badirou
          </Reveal>

          <Reveal as="p" className="hero-lead" delay="2">
            Consciencieuse, à l'écoute et réactive, Maître Badirou défend vos
            intérêts avec rigueur et engagement.
          </Reveal>

          <Reveal as="div" className="hero-actions" delay="3">
            <a className="btn btn-primary" href="#contact">
              Prendre rendez-vous
            </a>
            <a className="btn btn-outline" href="tel:0671429695">
              <svg className="icon" aria-hidden="true">
                <use href="#icon-phone" />
              </svg>
              06 71 42 96 95
            </a>
          </Reveal>

          <Reveal as="ul" className="hero-tags" delay="4" aria-label="Domaines d'intervention">
            <li>Droit commercial</li>
            <li>Droit de la famille</li>
            <li>Droit des étrangers</li>
          </Reveal>
        </div>

        <Reveal as="figure" delay="2" className="hero-photo">
          <div className="hero-photo-frame">
            <img
              src="/assets/img/moradeke-badirou.jpg"
              alt="Portrait de Maître Moradéké Badirou"
            />
            <span className="hero-photo-accent" aria-hidden="true" />
          </div>
          <figcaption>
            Moradéké Badirou — Paris, 17<sup>e</sup>
          </figcaption>
        </Reveal>
      </div>
    </section>
  );
}
