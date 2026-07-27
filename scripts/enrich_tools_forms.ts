/**
 * enrich_tools_forms.ts — v2
 *
 * Script d'enrichissement des formulaires avec des questions FACTUELLES et OBSERVABLES.
 * Utilise le prompt d'ingénierie fourni par l'utilisateur :
 * - Interdit absolu de l'auto-notation.
 * - Options select avec scoreMapping {label, score}.
 * - outputSchema structuré (score_global, axes, recommandations).
 */

import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Service role pour bypasser le RLS
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ──────────────────────────────────────────────────────────────────────────────
// Prompt système — Exact comme fourni par l'utilisateur
// ──────────────────────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es un expert en conception de formulaires d'audit et de diagnostic professionnel.
Ta mission : transformer une ligne de catalogue (nom d'un outil IA + sa catégorie + sa description courte) en une fiche JSON structurée, conforme au schéma ci-dessous.

RÈGLE ABSOLUE — INTERDICTION DE L'AUTO-NOTATION :
Il est strictement interdit de demander à l'utilisateur de s'auto-évaluer ou de s'auto-noter sur une échelle abstraite (ex. "notez de 0 à 5", "quel est votre niveau de maturité en...", "évaluez votre performance sur..."). L'utilisateur ne doit JAMAIS juger un niveau : c'est le rôle de l'outil de le déduire à sa place. Si l'utilisateur savait déjà se noter sur ce critère, l'outil n'aurait aucune valeur.

Pour chaque critère à évaluer, tu dois le reformuler en une question FACTUELLE, OBSERVABLE et VÉRIFIABLE, répondant à l'un de ces types :
1. Existence / présence d'un document, process, outil, rôle ("Avez-vous un document écrit qui liste... ?", "Existe-t-il une personne responsable de... ?")
2. Fréquence observable ("À quelle fréquence ce document est-il mis à jour ?" avec options concrètes : Jamais / Occasionnellement / 1x par an / Trimestriellement...)
3. Quantité ou proportion mesurable ("Combien de vos employés ont reçu une formation sur X au cours des 12 derniers mois ?", "Quel pourcentage de vos process sont documentés ?")
4. Oui/Non factuel sur une pratique concrète ("Utilisez-vous un outil de suivi des tickets client ?" Oui / Non / En projet)
5. Choix parmi des situations concrètes et mutuellement exclusives, chacune décrivant un état réel observable de l'entreprise (voir format scoreMapping ci-dessous)

Quand un critère nécessite un score continu (0 à 4 par exemple), utilise le format "select" avec un champ options contenant des objets {label, score} : chaque option de réponse décrit une SITUATION CONCRÈTE (pas un niveau abstrait) et porte un score prédéfini. Le score n'est jamais choisi par l'utilisateur — il est déterminé automatiquement par la situation qu'il a sélectionnée.

Mauvais exemple (interdit) :
{ "name": "maturite_risques", "type": "number", "question": "Notez votre maîtrise des risques de 0 à 4" }

Bon exemple (attendu) :
{
  "name": "doc_risques",
  "type": "select",
  "question": "Avez-vous un document formalisé listant les risques de votre activité ?",
  "options": [
    { "label": "Non, rien d'écrit", "score": 0 },
    { "label": "Une liste informelle, non partagée", "score": 1 },
    { "label": "Un document existe mais rarement mis à jour", "score": 2 },
    { "label": "Document formalisé, mis à jour au moins 1x/an", "score": 3 },
    { "label": "Document formalisé, revu régulièrement, responsable désigné", "score": 4 }
  ]
}

Pour les champs qui appellent une réponse plus riche que oui/non (ex. description d'un process), utilise un "textarea" avec une question factuelle précise ("Décrivez en quelques lignes comment un nouveau client est actuellement intégré chez vous") plutôt qu'un jugement ("Votre onboarding client est-il efficace ?").

SCHÉMA DE SORTIE ATTENDU (JSON strict, rien d'autre en dehors du JSON) :
{
  "id": "slug-unique",
  "title": "Nom de l'outil",
  "category": "catégorie du catalogue",
  "inputs": [
    {
      "name": "nom_technique_du_champ",
      "type": "select | number | textarea | text",
      "question": "Question factuelle posée à l'utilisateur",
      "required": true,
      "options": [ { "label": "...", "score": 0 } ],
      "placeholder": "exemple optionnel"
    }
  ],
  "promptTemplate": "Prompt système injecté au LLM au moment de la génération, utilisant les variables {nom_technique_du_champ}",
  "outputSchema": {
    "type": "object",
    "properties": {
      "score_global": { "type": "number" },
      "axes": { "type": "array", "items": { "axe": "string", "score": "number" } },
      "recommandations": { "type": "array", "items": "string" }
    }
  }
}

AVANT DE RENDRE TA RÉPONSE, VÉRIFIE TOI-MÊME :
- Aucun champ ne contient les mots "notez", "évaluez", "sur une échelle de", "quel est votre niveau de" dans sa question.
- Chaque champ de type select lié à un score a des options qui décrivent des faits observables, pas des niveaux abstraits ("faible/moyen/fort" est interdit sans description factuelle associée).
- 3 à 6 champs maximum par outil (pas plus, pour rester rapide à remplir).
- Le promptTemplate ne demande jamais au LLM de "faire confiance" à une auto-évaluation utilisateur ; il raisonne à partir des faits fournis.

RÉPONDS UNIQUEMENT AVEC UN JSON VALIDE. Rien d'autre.`;

// ──────────────────────────────────────────────────────────────────────────────
// Traitement d'un outil
// ──────────────────────────────────────────────────────────────────────────────
async function enrichTool(tool: {
  id: string;
  title: string;
  category: string;
  config: Record<string, unknown>;
}): Promise<void> {
  console.log(`\n🔄 "${tool.title}" ...`);

  const userMessage = `Ligne de catalogue à traiter :
- ID : ${tool.id}
- Titre : ${tool.title}
- Catégorie : ${tool.category}

Génère la fiche JSON complète avec des questions factuelles et observables.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Réponse IA vide.");

    const enriched = JSON.parse(content);

    if (!enriched.inputs || !Array.isArray(enriched.inputs) || enriched.inputs.length < 2) {
      throw new Error(`JSON invalide (moins de 2 inputs) pour "${tool.title}".`);
    }
    if (!enriched.promptTemplate) {
      throw new Error(`Pas de promptTemplate pour "${tool.title}".`);
    }

    // Vérification rapide : aucune auto-notation dans les questions
    const hasBadQuestion = enriched.inputs.some((inp: any) => {
      const q = (inp.question || inp.label || "").toLowerCase();
      return q.includes("notez") || q.includes("évaluez") || q.includes("sur une échelle");
    });
    if (hasBadQuestion) {
      console.warn(`  ⚠️  Auto-notation détectée dans "${tool.title}", on ré-essaie...`);
      await new Promise((r) => setTimeout(r, 2000));
      return enrichTool(tool);
    }

    // Construire la nouvelle config
    const newConfig = {
      ...(tool.config as object),
      inputs: enriched.inputs,
      promptTemplate: enriched.promptTemplate,
      outputSchema: enriched.outputSchema || tool.config.outputSchema,
    };

    const { error } = await supabase
      .from("tools")
      .update({ config: newConfig })
      .eq("id", tool.id);

    if (error) {
      console.error(`  ❌ Supabase: ${error.message}`);
    } else {
      console.log(`  ✅ ${enriched.inputs.length} questions factuelles — mis à jour.`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ Erreur: ${msg}`);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("📋 Récupération des outils depuis Supabase...");

  const { data: tools, error } = await supabase
    .from("tools")
    .select("id, title, category, config");

  if (error) {
    console.error("Erreur Supabase:", error.message);
    return;
  }

  console.log(`✅ ${tools.length} outils à enrichir.\n`);

  for (const tool of tools) {
    const hasQuestion = (tool.config as any)?.inputs?.some((i: any) => i.question);
    if (hasQuestion) {
      console.log(`✅ Outil "${tool.title}" déjà enrichi, on passe.`);
      continue;
    }
    await enrichTool(tool as {
      id: string;
      title: string;
      category: string;
      config: Record<string, unknown>;
    });
    // Pause entre chaque appel pour respecter le rate limit de Groq
    await new Promise((r) => setTimeout(r, 2500));
  }

  console.log("\n\n🎉 Tous les formulaires ont été transformés en questionnaires factuels !");
}

main().catch(console.error);
