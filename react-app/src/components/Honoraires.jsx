import Reveal from "./Reveal";

const BILLING_MODES = [
  {
    title: "Facturation au temps passé",
    text: "Honoraires calculés sur la base du temps effectivement consacré au dossier.",
  },
  {
    title: "Facturation au forfait",
    text: "Montant global défini à l'avance pour une prestation clairement délimitée.",
  },
  {
    title: "Honoraires de résultat",
    text: "Complément d'honoraires convenu en fonction du résultat obtenu.",
  },
  {
    title: "Abonnement",
    text: "Accompagnement juridique régulier, adapté aux besoins récurrents.",
  },
];
export default function Honoraires({ sectionRef }) {
  return (
    <section className="pt-16 pb-12 lg:pt-24 lg:pb-16" id="honoraires" ref={sectionRef}>
      <div className="container">
        <Reveal as="div" className="section-panel">
          <div className="section-head">
            <p className="eyebrow">Note d'honoraires</p>
            <h2>Une facturation claire, expliquée avant chaque mission</h2>
            <p className="section-intro">
              Le montant des honoraires varie en fonction de la nature de la prestation, de la complexité de
              l'affaire et des enjeux du litige. Les honoraires sont fixés en toute transparence dès le premier
              rendez-vous, et une convention d'honoraires est systématiquement conclue avec le client avant le
              début des diligences.
            </p>
          </div>

          <div className="honoraires-grid">
            <div className="billing-modes">
              <p className="fiche-label">Modes de facturation</p>
              <ul className="billing-list">
                {BILLING_MODES.map((mode) => (
                  <li key={mode.title}>
                    <strong>{mode.title}</strong>
                    <span>{mode.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="fee-slip">
              <p className="fee-slip-label">Consultation juridique</p>
              <p className="fee-slip-text">
                Le client expose sa problématique de manière exhaustive afin d'obtenir les premiers conseils et
                les solutions envisageables.
              </p>
              <div className="fee-slip-price">
                <span className="price">130&nbsp;€</span>
                <span className="price-detail">
                  TTC · 1 heure<br />Présentiel ou visioconférence
                </span>
              </div>
              <a className="btn btn-primary btn-block" href="#contact">Réserver ma consultation</a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
