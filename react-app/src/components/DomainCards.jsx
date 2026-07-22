import Reveal from "./Reveal";

const DOSSIERS = [
  {
    id: "commercial",
    domain: "Droit commercial",
    subtitle: "Contrats · créances · contentieux",
    points: [
      "Rédaction et négociation de contrats commerciaux",
      "Recouvrement de créances et rupture abusive",
      "Contentieux judiciaire et médiation",
    ],
    img: "/assets/img/droit-commerce.jpg",
  },
  {
    id: "famille",
    domain: "Droit de la famille",
    subtitle: "Divorce · garde · violences conjugales",
    points: [
      "Divorce contentieux et à l'amiable",
      "Garde des enfants et pension alimentaire",
      "Protection face aux violences conjugales",
    ],
    img: "/assets/img/droit-famille.jpg",
  },
  {
    id: "etrangers",
    domain: "Droit des étrangers",
    subtitle: "Visa · naturalisation · OQTF",
    points: [
      "Demandes de titre de séjour et renouvellement",
      "Recours contre OQTF et refus de visa",
      "Procédures de naturalisation",
    ],
    img: "/assets/img/notre-dame.jpg",
  },
];

function DomainCard({ domain, subtitle, points, img, delay }) {
  return (
    <Reveal as="article" className="domain-card" delay={delay}>
      <div className="domain-card-img" aria-hidden="true">
        <img src={img} alt="" loading="lazy" />
        <div className="domain-card-overlay" />
        <div className="domain-card-shine" />
      </div>
      <div className="domain-card-body">
        <p className="eyebrow domain-card-eyebrow">{subtitle}</p>
        <h3 className="domain-card-title">{domain}</h3>
        <ul className="domain-card-points">
          {points.map((p) => (
            <li key={p}>
              <span className="domain-card-bullet" aria-hidden="true">—</span>
              {p}
            </li>
          ))}
        </ul>
        <a href="#contact" className="domain-card-cta">
          Consulter
          <svg className="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>
    </Reveal>
  );
}

export default function DomainCards({ dossiers = DOSSIERS }) {
  return (
    <div className="domain-cards-grid">
      {dossiers.map((d, i) => (
        <DomainCard key={d.id} {...d} delay={String(i + 1)} />
      ))}
    </div>
  );
}
