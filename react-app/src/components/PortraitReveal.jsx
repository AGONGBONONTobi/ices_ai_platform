import Reveal from "./Reveal";

export default function PortraitReveal() {
  return (
    <section className="portrait-editorial">
      <div className="portrait-editorial-inner">

        {/* LEFT — text block */}
        <Reveal className="portrait-editorial-text">
          <div className="portrait-band-divider" style={{ marginBottom: "2rem" }}>
            <span />
            <i />
            <span />
          </div>

          <p className="portrait-band-quote" style={{ marginBottom: "2.5rem" }}>
            « Défendre avec <strong>rigueur</strong>, conseiller avec{" "}
            <strong>clarté</strong> et agir avec <strong>détermination</strong>. »
          </p>

          <div className="portrait-stats-inline">
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
          </div>
        </Reveal>

        {/* RIGHT — portrait image */}
        <Reveal variant="clip" className="portrait-editorial-image-wrap">
          <div className="portrait-editorial-frame">
            <img
              src="/assets/img/moradeke-badirou-portrait.jpg"
              alt="Portrait de Maître Moradéké Badirou"
              className="portrait-editorial-img"
            />
            {/* gold accent bar */}
            <div className="portrait-editorial-accent" />
          </div>
        </Reveal>

      </div>
    </section>
  );
}
