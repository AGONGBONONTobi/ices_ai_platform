import React from "react";
import DisplayCards from "@/components/ui/display-cards";
import { Quote, Scale, Gavel } from "lucide-react";

const testimonialCards = [
  {
    icon: <Quote className="size-4 text-[#B8975A]" />,
    title: "Jean M.",
    description: "Maître Badirou a fait preuve d'un professionnalisme exceptionnel. Son écoute et sa stratégie ont été déterminantes pour l'issue de mon affaire.",
    date: "Chef d'entreprise",
    titleClassName: "text-[#B8975A]",
    className:
      "[grid-area:stack] hover:-translate-y-10 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 hover:before:opacity-0 before:transition-opacity before:duration-700 before:left-0 before:top-0",
  },
  {
    icon: <Scale className="size-4 text-[#B8975A]" />,
    title: "Sophie T.",
    description: "Une avocate brillante, rigoureuse et toujours disponible. Je me suis sentie soutenue et informée à chaque étape de la procédure.",
    date: "Particulier",
    titleClassName: "text-[#B8975A]",
    className:
      "[grid-area:stack] translate-x-12 translate-y-10 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-xl before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-background/50 hover:before:opacity-0 before:transition-opacity before:duration-700 before:left-0 before:top-0",
  },
  {
    icon: <Gavel className="size-4 text-[#B8975A]" />,
    title: "Marc L.",
    description: "Grâce à ses conseils avisés, nous avons pu éviter un long procès et trouver un accord favorable. Une vraie main de fer dans un gant de velours.",
    date: "Dirigeant",
    titleClassName: "text-[#B8975A]",
    className:
      "[grid-area:stack] translate-x-24 translate-y-20 hover:translate-y-10",
  },
];

export default function Testimonials({ sectionRef }) {
  return (
    <section ref={sectionRef} className="bg-background relative py-20 lg:py-32 overflow-hidden">
      <div className="w-full max-w-7xl mx-auto px-4 mb-24 text-center">
        <h2 className="text-3xl md:text-4xl font-serif font-normal tracking-tight text-foreground">
          Ils nous font confiance
        </h2>
        <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
          Découvrez les retours de nos clients sur la qualité de notre accompagnement et de nos plaidoiries.
        </p>
      </div>
      
      <div className="flex w-full items-center justify-center pb-20 pr-12 md:pr-24">
        <div className="w-full max-w-3xl flex justify-center">
          <DisplayCards cards={testimonialCards} />
        </div>
      </div>
    </section>
  );
}
