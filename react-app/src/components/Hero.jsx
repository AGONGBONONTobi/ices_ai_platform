import { Phone } from "lucide-react";
import Hero07 from "./ui/hero-07";

export default function Hero({ sectionRef }) {
  return (
    <div id="accueil" ref={sectionRef}>
      <Hero07
        animation="subtle"
        tagline="Avocate — Barreau de Paris · Serment prêté en 2024"
        title="Maître Moradéké Badirou"
        description="Consciencieuse, à l'écoute et réactive, Maître Badirou défend vos intérêts avec rigueur et engagement."
        landscapeImage="/assets/img/hero-stairs.jpg"
        landscapeAlt=""
      />
    </div>
  );
}
