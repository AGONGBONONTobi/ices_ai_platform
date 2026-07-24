import Reveal from "./Reveal";

/**
 * Engagements — remplace les témoignages clients.
 * La déontologie de l'avocat (RIN art. 10) encadre strictement l'usage de
 * témoignages et de mentions laudatives : on présente ici la méthode et les
 * engagements du cabinet plutôt que des avis clients.
 */
const ENGAGEMENTS = [
  {
    title: "Écoute & disponibilité",
    text: "Chaque dossier est suivi personnellement. Vous disposez d'un interlocuteur unique, joignable et réactif, du premier rendez-vous à la dernière audience.",
  },
  {
    title: "Transparence des honoraires",
    text: "Une convention d'honoraires claire est établie avant toute diligence. Le mode de facturation et les coûts prévisibles vous sont exposés dès le premier rendez-vous.",
  },
  {
    title: "Rigueur & stratégie",
    text: "Une analyse précise de votre situation et une stratégie adaptée à vos enjeux, en privilégiant la résolution amiable lorsqu'elle sert votre intérêt.",
  },
];

export default function Testimonials({ sectionRef }) {
  return (
    <section className="section section-alt" id="engagements" ref={sectionRef}>
      <div className="container">
        <Reveal as="div" className="section-head">
          <p className="eyebrow">Nos engagements</p>
          <h2>Une relation de confiance, à chaque étape</h2>
          <p className="section-intro">
            Le cabinet s'engage sur une méthode de travail claire : une écoute
            attentive, une information constante et une stratégie construite avec
            vous.
          </p>
        </Reveal>

        <div className="engagements-grid">
          {ENGAGEMENTS.map((e, i) => (
            <Reveal as="article" key={e.title} className="engagement" delay={String(i + 1)}>
              <span className="engagement-num">{String(i + 1).padStart(2, "0")}</span>
              <h3>{e.title}</h3>
              <p>{e.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
