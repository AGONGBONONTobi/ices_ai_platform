import { ScrollImageTunnel } from "./ui/scroll-image-tunnel";
import Reveal from "./Reveal";

const PORTRAIT = [
  {
    src: "/assets/img/moradeke-badirou-portrait.jpg",
    alt: "Portrait de Maître Moradéké Badirou",
  },
];

export default function PortraitReveal() {
  return (
    <>
      <section className="portrait-band">
        <div className="portrait-band-inner">
          <Reveal variant="clip">
            <div className="portrait-band-divider">
              <span />
              <i />
              <span />
            </div>
          </Reveal>
          <Reveal>
            <p className="portrait-band-quote">
              « Défendre avec <strong>rigueur</strong>, conseiller avec <strong>clarté</strong> et agir avec <strong>détermination</strong>. »
            </p>
          </Reveal>
        </div>
      </section>

      <ScrollImageTunnel
        images={PORTRAIT}
        hint="Faites défiler pour faire apparaître le portrait"
        stepHeight="120vh"
      />

      <section className="portrait-stats">
        <div className="portrait-stat">
          <span className="portrait-stat-value">2024</span>
          <span className="portrait-stat-label">Prestation de Serment</span>
        </div>
        <div className="portrait-stat">
          <span className="portrait-stat-value">Paris</span>
          <span className="portrait-stat-label">Barreau d'exercice</span>
        </div>
        <div className="portrait-stat">
          <span className="portrait-stat-value">3</span>
          <span className="portrait-stat-label">Langues Parlées</span>
        </div>
      </section>
    </>
  );
}
