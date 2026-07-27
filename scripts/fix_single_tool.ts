/**
 * fix_single_tool.ts — Re-enrichit un outil spécifique
 */

import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `Tu es un expert en conception de formulaires d'audit et de diagnostic professionnel.
Ta mission : transformer une ligne de catalogue (nom d'un outil IA + sa catégorie + sa description courte) en une fiche JSON structurée, conforme au schéma ci-dessous.

RÈGLE ABSOLUE — INTERDICTION DE L'AUTO-NOTATION :
Il est strictement interdit de demander à l'utilisateur de s'auto-évaluer ou de s'auto-noter sur une échelle abstraite (ex. "notez de 0 à 5", "quel est votre niveau de maturité en...", "évaluez votre performance sur..."). L'utilisateur ne doit JAMAIS juger un niveau : c'est le rôle de l'outil de le déduire à sa place.

Pour chaque critère à évaluer, reformule en question FACTUELLE, OBSERVABLE et VÉRIFIABLE :
1. Existence / présence d'un document, process, outil, rôle
2. Fréquence observable avec options concrètes
3. Quantité ou proportion mesurable
4. Oui/Non factuel sur une pratique concrète
5. Choix parmi des situations concrètes mutuellement exclusives avec scoreMapping

SCHÉMA DE SORTIE (JSON strict uniquement) :
{
  "id": "slug-unique",
  "title": "Nom de l'outil",
  "category": "catégorie",
  "inputs": [
    {
      "name": "nom_technique",
      "type": "select | textarea | text",
      "question": "Question factuelle ?",
      "required": true,
      "options": [ { "label": "Situation concrète observée", "score": 0 } ]
    }
  ],
  "promptTemplate": "Texte avec variables {nom_technique}",
  "outputSchema": {
    "type": "object",
    "properties": {
      "score_global": { "type": "number" },
      "axes": { "type": "array" },
      "recommandations": { "type": "array" }
    }
  }
}

3 à 6 champs maximum. RÉPONDS UNIQUEMENT AVEC DU JSON VALIDE.`;

async function main() {
  const toolId = "diagnostic-des-systemes-d-information";

  const { data: tool, error } = await supabase
    .from("tools")
    .select("id, title, category, config")
    .eq("id", toolId)
    .single();

  if (error || !tool) {
    console.error("Outil non trouvé:", error?.message);
    return;
  }

  console.log(`🔄 Re-traitement de "${tool.title}"...`);

  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Ligne de catalogue :\n- ID: ${tool.id}\n- Titre: ${tool.title}\n- Catégorie: ${tool.category}\n\nGénère la fiche JSON avec questions factuelles.`,
      },
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.3,
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) throw new Error("Réponse vide.");

  const enriched = JSON.parse(content);

  const newConfig = {
    ...(tool.config as object),
    inputs: enriched.inputs,
    promptTemplate: enriched.promptTemplate,
    outputSchema: enriched.outputSchema,
  };

  const { error: updateError } = await supabase
    .from("tools")
    .update({ config: newConfig })
    .eq("id", toolId);

  if (updateError) {
    console.error("❌ Erreur Supabase:", updateError.message);
  } else {
    console.log(`✅ "${tool.title}" mis à jour avec ${enriched.inputs.length} questions.`);
  }
}

main().catch(console.error);
