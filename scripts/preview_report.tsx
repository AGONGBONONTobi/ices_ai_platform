/**
 * Aperçu hors-ligne du rapport PDF : rend un exemplaire de démonstration sans
 * passer par le navigateur ni consommer d'appel LLM.
 *   npx tsx scripts/preview_report.tsx [chemin de sortie]
 */
import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import { GenericReportDocument } from "../src/components/pdf/GenericReportDocument";

const result = {
  score_global: 65,
  axes: [
    { axe: "Zone géographique", score: 80 },
    { axe: "Type d'habitat", score: 90 },
    { axe: "Biodiversité observée", score: 70 },
    { axe: "Menaces pour la biodiversité", score: 40 },
    { axe: "Actions de protection", score: 60 },
  ],
  recommandations: [
    "Créer des zones protégées pour préserver la biodiversité",
    "Mettre en place des mesures de lutte contre la pollution",
    "Sensibiliser la population locale à l'importance de la conservation de la biodiversité",
    "Effectuer des études de suivi pour évaluer l'efficacité des actions de conservation",
  ],
};

const answers = [
  { label: "Dans quelle zone géographique se situe le site étudié ?", value: "Zone côtière ouest-africaine" },
  { label: "Quel est le type d'habitat dominant ?", value: "Mangrove" },
  { label: "Quelles espèces remarquables avez-vous observées ?", value: "Lamantin d'Afrique, plusieurs espèces de palétuviers, avifaune migratrice." },
  { label: "Quelles menaces identifiez-vous sur le site ?", value: "Coupe de bois, pollution plastique, pression foncière." },
  { label: "Combien d'hectares sont concernés ?", value: "1200" },
];

const out = process.argv[2] ?? "apercu_rapport.pdf";

renderToFile(
  React.createElement(GenericReportDocument, {
    toolTitle: "Audit de la biodiversité & capital naturel",
    category: "AUDITS & CONFORMITÉ",
    result,
    answers,
    lang: "fr",
  }) as any,
  out
).then(() => console.log("PDF écrit :", out));
