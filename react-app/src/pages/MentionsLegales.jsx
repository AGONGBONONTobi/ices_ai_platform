import LegalLayout, { Todo } from "./LegalLayout";

export default function MentionsLegales() {
  return (
    <LegalLayout title="Mentions légales" updated="2026">
      <section className="legal-section">
        <h2>Éditeur du site</h2>
        <p>
          Le présent site est édité par <strong>Maître Moradéké Badirou</strong>, avocate au Barreau de Paris,
          exerçant à titre individuel.
        </p>
        <dl className="legal-dl">
          <div><dt>Adresse professionnelle</dt><dd>2 Rue Mariotte, 75017 Paris</dd></div>
          <div><dt>Téléphone</dt><dd><a href="tel:0671429695">06 71 42 96 95</a></dd></div>
          <div><dt>Email</dt><dd><a href="mailto:moradeke.badirou@avocat.fr">moradeke.badirou@avocat.fr</a></dd></div>
          <div><dt>Forme d'exercice</dt><dd>Exercice individuel — profession libérale</dd></div>
          <div><dt>SIRET</dt><dd><Todo>numéro SIRET</Todo></dd></div>
          <div><dt>TVA intracommunautaire</dt><dd><Todo>n° TVA</Todo> (l'avocat est assujetti à la TVA)</dd></div>
          <div><dt>Directrice de la publication</dt><dd>Maître Moradéké Badirou</dd></div>
        </dl>
      </section>

      <section className="legal-section">
        <h2>Profession réglementée</h2>
        <p>
          Maître Moradéké Badirou est inscrite au <strong>Barreau de Paris</strong>
          {" "}(toque <Todo>numéro de toque</Todo>) et a prêté serment en février 2024.
          En sa qualité d'avocate, elle est soumise aux règles professionnelles et déontologiques de la profession :
        </p>
        <ul className="legal-list">
          <li>le <strong>Règlement Intérieur National</strong> (RIN) de la profession d'avocat ;</li>
          <li>le Règlement Intérieur du Barreau de Paris ;</li>
          <li>l'autorité de contrôle : l'<strong>Ordre des avocats de Paris</strong>, 11 place Dauphine, 75001 Paris.</li>
        </ul>
        <p>Le titre d'avocat est protégé et régi par la loi n° 71-1130 du 31 décembre 1971.</p>
      </section>

      <section className="legal-section">
        <h2>Assurances</h2>
        <p>
          Conformément à la réglementation, Maître Badirou bénéficie, par l'intermédiaire du Barreau de Paris,
          d'une <strong>assurance de responsabilité civile professionnelle</strong> et d'une garantie de
          représentation des fonds. Assureur et couverture géographique (France) : <Todo>coordonnées de l'assureur</Todo>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Hébergement</h2>
        <p>Le site est hébergé par :</p>
        <dl className="legal-dl">
          <div><dt>Hébergeur</dt><dd><Todo>nom de l'hébergeur</Todo></dd></div>
          <div><dt>Adresse</dt><dd><Todo>adresse de l'hébergeur</Todo></dd></div>
          <div><dt>Contact</dt><dd><Todo>téléphone / site de l'hébergeur</Todo></dd></div>
        </dl>
      </section>

      <section className="legal-section">
        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble des contenus présents sur ce site (textes, éléments graphiques, logo, mise en page) est
          protégé par le droit de la propriété intellectuelle. Toute reproduction ou représentation, totale ou
          partielle, sans autorisation écrite préalable, est interdite.
        </p>
      </section>

      <section className="legal-section">
        <h2>Médiation de la consommation</h2>
        <p>
          Conformément aux articles L.612-1 et suivants du Code de la consommation, tout client consommateur
          a le droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution
          amiable d'un litige qui l'opposerait à son avocat.
        </p>
        <p>Le médiateur compétent pour la profession d'avocat est :</p>
        <dl className="legal-dl">
          <div>
            <dt>Médiateur</dt>
            <dd>Médiateur de la consommation de la profession d'avocat</dd>
          </div>
          <div><dt>Adresse</dt><dd>180 boulevard Haussmann, 75008 Paris</dd></div>
          <div>
            <dt>Site</dt>
            <dd>
              <a href="https://mediateur-consommation-avocat.fr" target="_blank" rel="noopener noreferrer">
                mediateur-consommation-avocat.fr
              </a>
            </dd>
          </div>
        </dl>
        <p className="legal-hint">
          À vérifier avant mise en ligne : le médiateur désigné par le Conseil National des Barreaux (CNB) peut
          évoluer — confirmer le nom et les coordonnées à jour sur le site du CNB.
        </p>
      </section>

      <section className="legal-section">
        <h2>Données personnelles</h2>
        <p>
          Le traitement des données collectées via ce site est détaillé dans la{" "}
          <a href="/confidentialite">Politique de confidentialité</a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Droit applicable</h2>
        <p>Le présent site et ses mentions légales sont soumis au droit français.</p>
      </section>
    </LegalLayout>
  );
}
