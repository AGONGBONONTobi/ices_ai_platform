/**
 * Aperçu hors-ligne du rapport PDF, un exemplaire par type de sortie.
 * Ne consomme aucun appel LLM.
 *
 *   npx tsx scripts/preview_report.tsx [dossier de sortie]
 */
import React from "react";
import { renderToFile } from "@react-pdf/renderer";
import { GenericReportDocument } from "../src/components/pdf/GenericReportDocument";

const answers = [
  { label: "Dans quelle zone géographique opérez-vous ?", value: "Afrique de l'Ouest (UEMOA)" },
  { label: "Quel est votre effectif ?", value: "40" },
  { label: "Décrivez vos pratiques actuelles.", value: "Procédures écrites partiellement appliquées, pas de revue périodique." },
];

const SAMPLES: Record<string, { title: string; category: string; result: unknown }> = {
  assessment: {
    title: "Audit de la biodiversité & capital naturel",
    category: "AUDITS & CONFORMITÉ",
    result: {
      score_global: 65,
      axes: [
        { axe: "Zone géographique", score: 80 },
        { axe: "Type d'habitat", score: 90 },
        { axe: "Biodiversité observée", score: 70 },
        { axe: "Menaces identifiées", score: 40 },
        { axe: "Actions de protection", score: 60 },
      ],
      recommandations: [
        "Créer des zones protégées pour préserver les habitats sensibles",
        "Mettre en place des mesures de lutte contre la pollution plastique",
        "Sensibiliser la population locale à la conservation",
      ],
    },
  },
  profile: {
    title: "Test de motivation intrinsèque & extrinsèque",
    category: "PERSONNALITÉ & COMPORTEMENT PROFESSIONNEL",
    result: {
      synthese:
        "Votre motivation s'appuie principalement sur l'autonomie et le sens donné au travail. La reconnaissance externe joue un rôle secondaire mais réel.",
      dimensions: [
        { dimension: "Autonomie", intensite: 82, interpretation: "Vous vous engagez davantage lorsque vous choisissez vos méthodes de travail." },
        { dimension: "Maîtrise & progression", intensite: 74, interpretation: "L'apprentissage continu soutient votre engagement dans la durée." },
        { dimension: "Reconnaissance externe", intensite: 41, interpretation: "Les signaux de reconnaissance vous importent sans être déterminants." },
        { dimension: "Sécurité matérielle", intensite: 35, interpretation: "La stabilité compte peu par rapport au contenu des missions." },
      ],
      pistes: [
        "Négocier des marges d'autonomie explicites sur vos projets",
        "Formaliser un objectif d'apprentissage par trimestre",
      ],
    },
  },
  document: {
    title: "Template de fiche de poste",
    category: "RH & CAPITAL HUMAIN",
    result: {
      titre: "Fiche de poste — Responsable qualité",
      sections: [
        { titre: "Raison d'être du poste", contenu: "Garantir la conformité des produits et des процессus aux exigences internes et réglementaires, et animer l'amélioration continue sur l'ensemble des sites." },
        { titre: "Missions principales", contenu: "Piloter le système de management de la qualité. Préparer et conduire les audits internes. Traiter les non-conformités et suivre les actions correctives. Former les équipes aux exigences qualité." },
        { titre: "Compétences requises", contenu: "Maîtrise des référentiels ISO 9001. Conduite d'audit. Analyse de causes racines. Capacité à faire adhérer sans autorité hiérarchique." },
      ],
    },
  },
  table: {
    title: "Matrice des risques projet",
    category: "GESTION DE PROJETS & PMO",
    result: {
      colonnes: ["Risque", "Probabilité", "Impact", "Mesure de maîtrise"],
      lignes: [
        ["Retard fournisseur critique", "Élevée", "Fort", "Double sourcing et stock tampon de 4 semaines"],
        ["Départ d'une compétence clé", "Moyenne", "Fort", "Documentation et binômage systématique"],
        ["Dérive budgétaire", "Moyenne", "Moyen", "Revue budgétaire mensuelle en comité"],
        ["Non-conformité réglementaire", "Faible", "Très fort", "Veille trimestrielle et audit externe annuel"],
      ],
    },
  },
  analysis: {
    title: "Analyse des flux de trésorerie",
    category: "FINANCE & GESTION",
    result: {
      synthese:
        "La trésorerie reste positive mais son amplitude saisonnière expose l'entreprise à une tension au troisième trimestre.",
      sections: [
        { titre: "Structure des encaissements", contenu: "Les encaissements sont concentrés sur deux clients représentant 58 % du chiffre d'affaires, ce qui accroît la sensibilité du besoin en fonds de roulement à leurs délais de paiement." },
        { titre: "Saisonnalité", contenu: "Le creux observé entre juillet et septembre correspond à un décalage entre le paiement des approvisionnements et l'encaissement des ventes." },
      ],
      points_cles: [
        "Concentration client à surveiller : 58 % sur deux comptes",
        "Tension de trésorerie prévisible au T3",
        "Levier principal : réduction du délai de règlement client",
      ],
    },
  },
};

const outDir = process.argv[2] ?? ".";

async function main() {
  for (const [kind, sample] of Object.entries(SAMPLES)) {
    const path = `${outDir}/apercu_${kind}.pdf`;
    await renderToFile(
      React.createElement(GenericReportDocument, {
        toolTitle: sample.title,
        category: sample.category,
        result: sample.result,
        answers,
        outputKind: kind,
        lang: "fr",
      }) as any,
      path
    );
    console.log("écrit :", path);
  }
}

main();
