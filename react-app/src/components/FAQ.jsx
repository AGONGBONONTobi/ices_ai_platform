import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

const FAQ_DATA = [
  {
    category: "Le Premier Rendez-vous",
    items: [
      {
        value: "gen-1",
        question: "Comment se déroule le premier rendez-vous ?",
        answer:
          "Le premier rendez-vous est une prise de contact essentielle. Il permet d'exposer votre situation en détail, de cerner les enjeux de votre dossier et d'envisager ensemble les premières stratégies à adopter. C'est également l'occasion d'établir une relation de confiance.",
      },
      {
        value: "gen-2",
        question: "Quels documents dois-je préparer ?",
        answer:
          "Il est conseillé de réunir toutes les pièces relatives à votre affaire (contrats, courriers, jugements précédents, mises en demeure) ainsi qu'une pièce d'identité. Une liste plus précise pourra vous être communiquée lors de la prise de rendez-vous selon la nature de votre dossier.",
      },
    ],
  },
  {
    category: "Honoraires & Facturation",
    items: [
      {
        value: "bill-1",
        question: "Combien coûte une procédure ?",
        answer:
          "Le coût dépend de la complexité de l'affaire et des diligences à accomplir. Dès le premier rendez-vous, une convention d'honoraires transparente vous sera proposée, détaillant le mode de facturation (au temps passé ou forfaitaire) pour éviter toute mauvaise surprise.",
      },
      {
        value: "bill-2",
        question: "Acceptez-vous l'Aide Juridictionnelle ?",
        answer:
          "Le cabinet accepte d'intervenir au titre de l'aide juridictionnelle sous certaines conditions, selon la nature du litige. N'hésitez pas à nous poser la question lors de la prise de rendez-vous pour vérifier votre éligibilité.",
      },
      {
        value: "bill-3",
        question: "Mon assurance protection juridique peut-elle prendre en charge les frais ?",
        answer:
          "Oui, si vous avez souscrit une garantie protection juridique (souvent incluse dans votre assurance multirisque habitation ou carte bancaire), vos frais d'avocat peuvent être pris en charge totalement ou partiellement par votre assurance. Vous gardez cependant le libre choix de votre avocat.",
      },
    ],
  },
  {
    category: "Procédure & Délais",
    items: [
      {
        value: "tech-1",
        question: "Combien de temps dure une procédure judiciaire ?",
        answer:
          "La durée d'une procédure varie considérablement selon la juridiction saisie, la complexité du dossier et l'encombrement des tribunaux. Une affaire peut durer de quelques mois à plusieurs années. Le cabinet privilégie toujours, lorsque cela est possible et dans votre intérêt, une résolution amiable plus rapide.",
      },
      {
        value: "tech-2",
        question: "Serais-je informé(e) de l'avancée de mon dossier ?",
        answer:
          "Absolument. La transparence est une de nos valeurs fondamentales. Vous serez informé(e) de chaque étape de la procédure, recevrez copie de tous les actes rédigés en votre nom, et aucune décision stratégique ne sera prise sans votre accord préalable.",
      },
    ],
  },
];

export default function FAQ({ sectionRef }) {
  return (
    <section ref={sectionRef} className="bg-background py-20 lg:py-32">
      <div className="w-full max-w-6xl mx-auto px-6">

        {/* ── Header (full-width, always on top) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-12 lg:mb-16"
        >
          <p className="font-mono text-xs tracking-[0.18em] uppercase text-[#8A6E2A] mb-3">
            Foire Aux Questions
          </p>
          <h2 className="text-3xl md:text-4xl font-serif font-normal tracking-tight text-foreground mb-4">
            Questions Fréquentes
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed max-w-xl">
            Retrouvez ici les réponses aux questions les plus courantes sur le
            fonctionnement du cabinet. Si vous avez d'autres interrogations,
            n'hésitez pas à{" "}
            <a href="#contact" className="underline hover:text-foreground transition-colors">
              nous contacter
            </a>
            .
          </p>
        </motion.div>

        {/* ── Accordion groups ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="space-y-10"
        >
          {FAQ_DATA.map((group) => (
            <div key={group.category}>
              <p className="text-xs font-mono uppercase tracking-[0.16em] font-semibold text-[#8A6E2A] mb-4 pb-3 border-b border-border">
                {group.category}
              </p>
              <Accordion type="multiple" className="w-full">
                {group.items.map((item) => (
                  <AccordionItem key={item.value} value={item.value}>
                    <AccordionTrigger className="text-left text-base font-normal">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground leading-relaxed">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
