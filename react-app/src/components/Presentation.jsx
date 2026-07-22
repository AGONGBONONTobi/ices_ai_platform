import Reveal from "./Reveal";

export default function Presentation({ sectionRef }) {
  return (
    <section className="section" id="presentation" ref={sectionRef}>
      <div className="container">
        <Reveal as="div" className="section-head">
          <p className="eyebrow">Le dossier</p>
          <h2>Un parcours pensé pour s'adapter à chaque situation</h2>
        </Reveal>

        <div className="presentation-grid">
          <Reveal as="div" className="presentation-text">
            <blockquote className="pull-quote">
              <p>« Consciencieuse, à l'écoute et réactive, Maître Badirou défend vos intérêts avec rigueur et engagement. »</p>
            </blockquote>

            <p className="lede">
              Maître Badirou est titulaire d'un Mastère Spécialisé Juriste Manager International à l'EMLYON
              Business School et d'un Master&nbsp;2 en Droit des Relations Internationales et Européennes à
              l'Université de Cergy-Pontoise.
            </p>

            <p>
              Après plusieurs expériences auprès des directions juridiques de grandes entreprises, elle prête
              serment au barreau de Paris en février 2024 et intègre un cabinet dans lequel elle conseille des
              sociétés pharmaceutiques.
            </p>

            <p>
              Forte d'un parcours à la fois en entreprise, en cabinet et dans le secteur associatif, elle a
              développé une capacité d'adaptation, une vision stratégique et un sens de l'écoute qui guident
              aujourd'hui sa pratique d'avocate.
            </p>

            <p>
              Elle intervient principalement en droit commercial, en droit de la famille et en droit des
              étrangers, et parle couramment français, anglais et italien.
            </p>
          </Reveal>

          <Reveal as="aside" className="fiche">
            <p className="fiche-label">Formation</p>
            <ul className="fiche-list">
              <li>
                <span>Mastère Spécialisé Juriste Manager International</span>
                <small>EMLYON Business School</small>
              </li>
              <li>
                <span>Master 2 Droit des Relations Internationales et Européennes</span>
                <small>Université de Cergy-Pontoise</small>
              </li>
              <li>
                <span>Serment prêté au Barreau de Paris</span>
                <small>Février 2024</small>
              </li>
            </ul>
            <p className="fiche-label">Langues</p>
            <ul className="tag-row">
              <li>Français</li>
              <li>English</li>
              <li>Italiano</li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
