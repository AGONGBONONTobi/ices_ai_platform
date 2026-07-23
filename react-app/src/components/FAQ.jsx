import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";

export default function FAQ({ sectionRef }) {
  return (
    <section ref={sectionRef} className="bg-background relative py-20 lg:py-32">
      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-12 items-start">
          {/* Left Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="md:w-1/3 md:sticky md:top-32"
          >
            <h2 className="text-3xl md:text-4xl font-serif font-normal tracking-tight mb-4 text-foreground">
              Questions Fréquentes
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Retrouvez ici les réponses aux questions les plus courantes sur le fonctionnement du cabinet. Si vous avez d'autres interrogations, n'hésitez pas à{" "}
              <a href="#contact" className="underline hover:text-primary transition-colors">
                nous contacter
              </a>
              .
            </p>
          </motion.div>

          {/* Right Column */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:w-2/3 space-y-12"
          >
            {/* General Section */}
            <div>
              <h3 className="text-sm uppercase tracking-widest font-semibold text-primary mb-4">
                Le Premier Rendez-vous
              </h3>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="gen-1">
                  <AccordionTrigger>
                    Comment se déroule le premier rendez-vous ?
                  </AccordionTrigger>
                  <AccordionContent>
                    Le premier rendez-vous est une prise de contact essentielle. Il permet d'exposer votre situation en détail, de cerner les enjeux de votre dossier et d'envisager ensemble les premières stratégies à adopter. C'est également l'occasion d'établir une relation de confiance.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="gen-2">
                  <AccordionTrigger>
                    Quels documents dois-je préparer ?
                  </AccordionTrigger>
                  <AccordionContent>
                    Il est conseillé de réunir toutes les pièces relatives à votre affaire (contrats, courriers, jugements précédents, mises en demeure) ainsi qu'une pièce d'identité. Une liste plus précise pourra vous être communiquée lors de la prise de rendez-vous selon la nature de votre dossier.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Billing Section */}
            <div>
              <h3 className="text-sm uppercase tracking-widest font-semibold text-primary mb-4">
                Honoraires & Facturation
              </h3>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="bill-1">
                  <AccordionTrigger>
                    Combien coûte une procédure ?
                  </AccordionTrigger>
                  <AccordionContent>
                    Le coût dépend de la complexité de l'affaire et des diligences à accomplir. Dès le premier rendez-vous, une convention d'honoraires transparente vous sera proposée, détaillant le mode de facturation (au temps passé ou forfaitaire) pour éviter toute mauvaise surprise.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="bill-2">
                  <AccordionTrigger>
                    Acceptez-vous l'Aide Juridictionnelle ?
                  </AccordionTrigger>
                  <AccordionContent>
                    Le cabinet accepte d'intervenir au titre de l'aide juridictionnelle sous certaines conditions, selon la nature du litige. N'hésitez pas à nous poser la question lors de la prise de rendez-vous pour vérifier votre éligibilité.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="bill-3">
                  <AccordionTrigger>
                    Mon assurance protection juridique peut-elle prendre en charge les frais ?
                  </AccordionTrigger>
                  <AccordionContent>
                    Oui, si vous avez souscrit une garantie protection juridique (souvent incluse dans votre assurance multirisque habitation ou carte bancaire), vos frais d'avocat peuvent être pris en charge totalement ou partiellement par votre assurance. Vous gardez cependant le libre choix de votre avocat.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* Procedures Section */}
            <div>
              <h3 className="text-sm uppercase tracking-widest font-semibold text-primary mb-4">
                Procédure & Délais
              </h3>
              <Accordion type="multiple" className="w-full">
                <AccordionItem value="tech-1">
                  <AccordionTrigger>
                    Combien de temps dure une procédure judiciaire ?
                  </AccordionTrigger>
                  <AccordionContent>
                    La durée d'une procédure varie considérablement selon la juridiction saisie, la complexité du dossier et l'encombrement des tribunaux. Une affaire peut durer de quelques mois à plusieurs années. Le cabinet privilégie toujours, lorsque cela est possible et dans votre intérêt, une résolution amiable plus rapide.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="tech-2">
                  <AccordionTrigger>
                    Serais-je informé(e) de l'avancée de mon dossier ?
                  </AccordionTrigger>
                  <AccordionContent>
                    Absolument. La transparence est une de nos valeurs fondamentales. Vous serez informé(e) de chaque étape de la procédure, recevrez copie de tous les actes rédigés en votre nom, et aucune décision stratégique ne sera prise sans votre accord préalable.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
