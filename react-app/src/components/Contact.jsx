import { useState } from "react";
import emailjs from "@emailjs/browser";
import Reveal from "./Reveal";

// Configuration EmailJS - Remplacer avec les vraies valeurs
const EMAILJS_SERVICE_ID = "YOUR_SERVICE_ID";
const EMAILJS_TEMPLATE_ID = "YOUR_TEMPLATE_ID";
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY";

export default function Contact({ sectionRef }) {
  const [status, setStatus] = useState({ text: "", kind: "" });
  const [isLoading, setIsLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const message = form.message.value.trim();

    if (!name || !email || !message) {
      setStatus({ text: "Merci de renseigner votre nom, votre email et votre message.", kind: "is-error" });
      return;
    }

    if (
      EMAILJS_SERVICE_ID === "YOUR_SERVICE_ID" ||
      EMAILJS_TEMPLATE_ID === "YOUR_TEMPLATE_ID" ||
      EMAILJS_PUBLIC_KEY === "YOUR_PUBLIC_KEY"
    ) {
      setStatus({
        text: "Configuration requise : Veuillez configurer vos identifiants EmailJS dans Contact.jsx.",
        kind: "is-error",
      });
      return;
    }

    setIsLoading(true);
    setStatus({ text: "Envoi en cours...", kind: "" });

    emailjs
      .sendForm(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        form,
        EMAILJS_PUBLIC_KEY
      )
      .then(
        () => {
          setIsLoading(false);
          setStatus({ text: "Votre message a bien été envoyé. Merci !", kind: "is-success" });
          form.reset();
        },
        (error) => {
          setIsLoading(false);
          setStatus({
            text: "Une erreur est survenue lors de l'envoi. Veuillez réessayer ou envoyer un mail directement.",
            kind: "is-error",
          });
          console.error("EmailJS Error:", error);
        }
      );
  }

  return (
    <section className="section-photo-shared" id="contact" ref={sectionRef}>
      <div className="container">
        <Reveal as="div" className="section-panel">
          <div className="section-head">
            <p className="eyebrow">Prendre rendez-vous</p>
            <h2>Contact</h2>
            <p className="section-intro">
              Une question, une situation à exposer&nbsp;? Contactez le cabinet par téléphone, par email ou via
              le formulaire ci-dessous.
            </p>
          </div>

          <div className="contact-grid">
            <Reveal as="div" className="contact-info">
              <ul className="info-list">
                <li>
                  <div className="icon-wrapper">
                    <svg className="icon" aria-hidden="true"><use href="#icon-pin"></use></svg>
                  </div>
                  <div>
                    <strong>Adresse</strong>
                    <span>2 Rue Mariotte, 75017 Paris</span>
                  </div>
                </li>
                <li>
                  <div className="icon-wrapper">
                    <svg className="icon" aria-hidden="true"><use href="#icon-phone"></use></svg>
                  </div>
                  <div>
                    <strong>Téléphone</strong>
                    <span><a href="tel:0671429695">06 71 42 96 95</a></span>
                  </div>
                </li>
                <li>
                  <div className="icon-wrapper">
                    <svg className="icon" aria-hidden="true"><use href="#icon-mail"></use></svg>
                  </div>
                  <div>
                    <strong>Email</strong>
                    <span><a href="mailto:moradeke.badirou@avocat.fr">moradeke.badirou@avocat.fr</a></span>
                  </div>
                </li>
                <li>
                  <div className="icon-wrapper">
                    <svg className="icon" aria-hidden="true"><use href="#icon-clock"></use></svg>
                  </div>
                  <div>
                    <strong>Horaires</strong>
                    <span className="hours-table">
                      <span>Lundi – Vendredi</span><span>9h – 19h</span>
                      <span>Samedi</span><span>Fermé</span>
                      <span>Dimanche</span><span>Fermé</span>
                    </span>
                  </div>
                </li>
              </ul>
            </Reveal>

            <Reveal as="form" className="contact-form" onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <label htmlFor="name">Nom complet</label>
                <input type="text" id="name" name="name" required autoComplete="name" />
              </div>
              <div className="form-row form-row-split">
                <div>
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" required autoComplete="email" />
                </div>
                <div>
                  <label htmlFor="phone">Téléphone</label>
                  <input type="tel" id="phone" name="phone" autoComplete="tel" />
                </div>
              </div>
              <div className="form-row">
                <label htmlFor="subject">Sujet</label>
                <select id="subject" name="subject" defaultValue="Droit commercial">
                  <option>Droit commercial</option>
                  <option>Droit de la famille</option>
                  <option>Droit des étrangers</option>
                  <option>Autre demande</option>
                </select>
              </div>
              <div className="form-row">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="5" required></textarea>
              </div>
              <p className="form-note">
                En envoyant ce formulaire, votre demande sera directement transmise à Maître Badirou.
              </p>
              <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                {isLoading ? (
                  <span>Envoi en cours...</span>
                ) : (
                  <>
                    <svg className="icon" aria-hidden="true"><use href="#icon-send"></use></svg>
                    Envoyer ma demande
                  </>
                )}
              </button>
              <p className={`form-status ${status.kind}`} role="status" aria-live="polite">
                {status.text}
              </p>
            </Reveal>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
