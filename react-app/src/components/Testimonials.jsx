import React, { useRef } from "react";
import { ScrollImageTunnel } from "@/components/ui/scroll-image-tunnel";

const TESTIMONIALS = [
  {
    src: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=2000&auto=format&fit=crop",
    alt: "Justice scales",
    quote: "Maître Badirou a fait preuve d'un professionnalisme exceptionnel. Son écoute et sa stratégie ont été déterminantes pour l'issue de mon affaire.",
    author: "Jean M., Chef d'entreprise"
  },
  {
    src: "https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2000&auto=format&fit=crop",
    alt: "Law books",
    quote: "Une avocate brillante, rigoureuse et toujours disponible. Je me suis senti soutenu et informé à chaque étape de la procédure.",
    author: "Sophie T."
  },
  {
    src: "https://images.unsplash.com/photo-1453728013993-6d66e9c9123a?q=80&w=2000&auto=format&fit=crop",
    alt: "Architecture",
    quote: "Grâce à ses conseils avisés, nous avons pu éviter un long procès et trouver un accord favorable. Une vraie main de fer dans un gant de velours.",
    author: "Marc L."
  }
];

export default function Testimonials({ sectionRef }) {
  const containerRef = useRef(null);
 
  return (
    <section ref={sectionRef} className="bg-background relative py-20 lg:py-32">
      <div className="w-full max-w-7xl mx-auto px-4 mb-16 text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-normal tracking-tight text-foreground">
          Ils nous font confiance
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Découvrez les retours de nos clients sur la qualité de notre accompagnement et de nos plaidoiries.
        </p>
      </div>
      
      <div
        ref={containerRef}
        data-scroll-image-tunnel-demo
        className="relative w-full h-[150vh] overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `[data-scroll-image-tunnel-demo]::-webkit-scrollbar{display:none}`,
          }}
        />
        <ScrollImageTunnel
          images={TESTIMONIALS}
          container={containerRef}
          stepHeight="120vh"
          hint="Faites défiler pour lire les témoignages"
        />
      </div>
    </section>
  );
}
