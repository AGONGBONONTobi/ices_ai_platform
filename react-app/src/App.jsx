import { useRef } from "react";
import IconSprite from "./components/IconSprite";
import { AnimatedNavFramer } from "./components/ui/navigation-menu";
import Hero from "./components/Hero";
import Presentation from "./components/Presentation";
import PortraitReveal from "./components/PortraitReveal";
import Competences from "./components/Competences";
import Honoraires from "./components/Honoraires";
import Contact from "./components/Contact";
import FAQ from "./components/FAQ";
import Testimonials from "./components/Testimonials";
import Footer from "./components/Footer";
import MobileBar from "./components/MobileBar";
import BackToTop from "./components/BackToTop";
import { useScrollEffects } from "./hooks/useScrollEffects";
import { useScrollSpy } from "./hooks/useScrollSpy";

function App() {
  const backToTopRef = useRef(null);

  const heroSectionRef = useRef(null);
  const presentationSectionRef = useRef(null);
  const competencesSectionRef = useRef(null);
  const testimonialsSectionRef = useRef(null);
  const faqSectionRef = useRef(null);
  const honorairesSectionRef = useRef(null);
  const contactSectionRef = useRef(null);

  useScrollEffects({ backToTopRef });
  const activeSection = useScrollSpy([
    heroSectionRef,
    presentationSectionRef,
    competencesSectionRef,
    testimonialsSectionRef,
    faqSectionRef,
    honorairesSectionRef,
    contactSectionRef,
  ]);

  return (
    <>
      <IconSprite />
      <a className="skip-link" href="#main">Aller au contenu</a>

      <AnimatedNavFramer activeSection={activeSection} />

      <main id="main">
        <Hero sectionRef={heroSectionRef} />
        <Presentation sectionRef={presentationSectionRef} />
        <PortraitReveal />
        <Competences sectionRef={competencesSectionRef} />
        <Testimonials sectionRef={testimonialsSectionRef} />
        <FAQ sectionRef={faqSectionRef} />
        <Honoraires sectionRef={honorairesSectionRef} />
        <Contact sectionRef={contactSectionRef} />
      </main>

      <Footer />
      <MobileBar />
      <BackToTop backToTopRef={backToTopRef} />
    </>
  );
}

export default App;
