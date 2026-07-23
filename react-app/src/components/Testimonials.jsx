import React from "react";
import { AnimatedTestimonials } from "@/components/ui/testimonial";

const testimonials = [
  {
    quote: "Maître Badirou a fait preuve d'un professionnalisme exceptionnel. Son écoute et sa stratégie ont été déterminantes pour l'issue de mon affaire.",
    name: "Jean M.",
    designation: "Chef d'entreprise",
    src: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1887&auto=format&fit=crop",
  },
  {
    quote: "Une avocate brillante, rigoureuse et toujours disponible. Je me suis sentie soutenue et informée à chaque étape de la procédure.",
    name: "Sophie T.",
    designation: "Particulier",
    src: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1888&auto=format&fit=crop",
  },
  {
    quote: "Grâce à ses conseils avisés, nous avons pu éviter un long procès et trouver un accord favorable. Une vraie main de fer dans un gant de velours.",
    name: "Marc L.",
    designation: "Dirigeant",
    src: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=1887&auto=format&fit=crop",
  },
];

export default function Testimonials({ sectionRef }) {
  return (
    <section ref={sectionRef} className="bg-background relative py-20 lg:py-32 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-normal tracking-tight text-foreground">
          Ils nous font confiance
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto mb-10">
          Découvrez les retours de nos clients sur la qualité de notre accompagnement et de nos plaidoiries.
        </p>
      </div>
      
      <div className="w-full relative z-10">
        <AnimatedTestimonials testimonials={testimonials} />
      </div>
    </section>
  );
}
