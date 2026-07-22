import Reveal from "./Reveal";
import DomainCards from "./DomainCards";

export default function Competences({ sectionRef }) {
  return (
    <section className="section section-alt" id="competences" ref={sectionRef}>
      <div className="container">
        <Reveal as="div" className="section-head">
          <p className="eyebrow">Domaines d'intervention</p>
          <h2>Trois pratiques, une même exigence</h2>
          <p className="section-intro">
            Consciente que chaque situation est singulière, le cabinet vous accompagne avec une écoute attentive
            et un suivi personnalisé, afin de répondre au mieux à vos besoins.
          </p>
        </Reveal>
        
        <DomainCards />
      </div>
    </section>
  );
}
