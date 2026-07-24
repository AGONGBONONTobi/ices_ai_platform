import LegalLayout, { Todo } from "./LegalLayout";

export default function Confidentialite() {
  return (
    <LegalLayout title="Politique de confidentialité" updated="2026">
      <section className="legal-section">
        <p className="legal-lead">
          La présente politique décrit la manière dont les données personnelles collectées sur ce site sont
          traitées, conformément au Règlement Général sur la Protection des Données (RGPD — Règlement UE 2016/679)
          et à la loi n° 78-17 du 6 janvier 1978 dite « Informatique et Libertés ».
        </p>
      </section>

      <section className="legal-section">
        <h2>Responsable du traitement</h2>
        <p>
          Le responsable du traitement des données est <strong>Maître Moradéké Badirou</strong>, avocate au
          Barreau de Paris, 2 Rue Mariotte, 75017 Paris —{" "}
          <a href="mailto:moradeke.badirou@avocat.fr">moradeke.badirou@avocat.fr</a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Données collectées</h2>
        <p>
          Les données personnelles sont collectées uniquement lorsque vous remplissez le formulaire de contact.
          Sont alors recueillis :
        </p>
        <ul className="legal-list">
          <li>votre nom complet ;</li>
          <li>votre adresse email ;</li>
          <li>votre numéro de téléphone (facultatif) ;</li>
          <li>l'objet de votre demande et le contenu de votre message.</li>
        </ul>
        <p>
          Aucune donnée n'est collectée à votre insu et le site n'utilise pas de profilage ni de décision
          automatisée.
        </p>
      </section>

      <section className="legal-section">
        <h2>Finalités et base légale</h2>
        <ul className="legal-list">
          <li>
            <strong>Répondre à votre demande de contact</strong> et, le cas échéant, organiser un premier
            rendez-vous — base légale : votre consentement et les mesures précontractuelles prises à votre demande
            (art. 6.1.a et 6.1.b du RGPD).
          </li>
        </ul>
        <p>
          Les informations transmises peuvent, si une relation client est établie, être couvertes par le
          <strong> secret professionnel de l'avocat</strong>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Destinataires et sous-traitants</h2>
        <p>
          Les données issues du formulaire sont destinées exclusivement à Maître Badirou et ne sont ni vendues,
          ni cédées, ni communiquées à des tiers à des fins commerciales.
        </p>
        <p>
          L'envoi du formulaire est techniquement assuré par le service <strong>EmailJS</strong> (EmailJS Inc.),
          qui achemine votre message vers la messagerie du cabinet en qualité de sous-traitant. À ce titre, les
          données saisies transitent par ce prestataire. Voir la politique de confidentialité d'EmailJS :{" "}
          <a href="https://www.emailjs.com/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">
            emailjs.com/legal/privacy-policy
          </a>.
        </p>
        <p className="legal-hint">
          Si le mode d'envoi du formulaire est modifié (ex. envoi direct par messagerie, autre prestataire),
          cette section doit être mise à jour en conséquence.
        </p>
      </section>

      <section className="legal-section">
        <h2>Durée de conservation</h2>
        <p>
          Les données transmises via le formulaire sont conservées le temps nécessaire au traitement de votre
          demande. En l'absence de suite, elles sont supprimées dans un délai maximal de <Todo>durée, ex. 3 ans</Todo>.
          En cas d'ouverture d'un dossier, les données sont conservées conformément aux obligations légales de
          conservation applicables à la profession d'avocat.
        </p>
      </section>

      <section className="legal-section">
        <h2>Transfert hors de l'Union européenne</h2>
        <p>
          Le prestataire d'envoi du formulaire pouvant être établi hors de l'Union européenne, un transfert de
          données hors UE est susceptible d'intervenir. Ces transferts sont encadrés par les garanties prévues
          par le RGPD (clauses contractuelles types). Aucun autre transfert hors UE n'est réalisé.
        </p>
      </section>

      <section className="legal-section">
        <h2>Vos droits</h2>
        <p>Conformément au RGPD, vous disposez des droits suivants sur vos données :</p>
        <ul className="legal-list">
          <li>droit d'accès, de rectification et d'effacement ;</li>
          <li>droit à la limitation et droit d'opposition au traitement ;</li>
          <li>droit à la portabilité de vos données ;</li>
          <li>droit de définir des directives relatives au sort de vos données après votre décès.</li>
        </ul>
        <p>
          Pour exercer ces droits, écrivez à{" "}
          <a href="mailto:moradeke.badirou@avocat.fr">moradeke.badirou@avocat.fr</a>. Une réponse vous sera
          apportée dans un délai d'un mois.
        </p>
        <p>
          Vous pouvez également introduire une réclamation auprès de la CNIL (Commission Nationale de
          l'Informatique et des Libertés) :{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>.
        </p>
      </section>

      <section className="legal-section">
        <h2>Cookies</h2>
        <p>
          En l'état, ce site <strong>n'utilise aucun cookie de mesure d'audience, de publicité ou de traçage</strong>,
          et ne dépose donc pas de traceur nécessitant votre consentement.
        </p>
        <p>
          Les polices de caractères sont chargées depuis Google Fonts, ce qui implique une connexion aux serveurs
          de Google (adresse IP). Si des outils de mesure d'audience (ex. Matomo, Google Analytics) sont ajoutés
          ultérieurement, un bandeau de consentement conforme aux recommandations de la CNIL sera mis en place et
          cette section mise à jour.
        </p>
      </section>

      <section className="legal-section">
        <h2>Sécurité</h2>
        <p>
          Le site est servi via une connexion chiffrée (HTTPS) et les mesures raisonnables sont prises pour
          protéger les données contre tout accès non autorisé.
        </p>
      </section>
    </LegalLayout>
  );
}
