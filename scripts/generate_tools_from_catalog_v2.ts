import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import dotenv from "dotenv";
import { toolSchema } from "../src/lib/schema/tool-schema";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const CATALOG_PATH = path.join(__dirname, "../v2_catalogue.txt");
const OUT_DIR = path.join(__dirname, "../data/tools");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

// System prompt for a single tool (v2 catalogue: auto-évaluation de conformité / maturité)
const SYSTEM_PROMPT = `
Tu es un ingénieur produit IA. Ta mission est de générer la configuration JSON d'un outil d'auto-évaluation de conformité ou de maturité (référentiels ISO, labels, bailleurs de fonds, etc.).
On te donne un Nom d'outil, sa Catégorie, et une Description de sa méthodologie (nombre de questions, chapitres couverts, niveaux de maturité, etc. tirés du cahier des charges).

Tu dois générer un objet JSON respectant CE SCHÉMA EXACT pour cet outil :
{
  "id": "identifiant-unique-kebab-case",
  "title": "Nom de l'outil",
  "category": "La catégorie",
  "inputs": [
    {
      "name": "variable1",
      "type": "text|textarea|number|select",
      "options": ["choix1", "choix2"], // Seulement si type=select
      "label": "Question claire posée à l'utilisateur",
      "placeholder": "Exemple de réponse",
      "required": true
    }
  ],
  "promptTemplate": "Tu es un auditeur/consultant expert du référentiel concerné. L'utilisateur a répondu : Variable1: {variable1}, etc. Analyse ces informations selon la méthodologie décrite (chapitres/piliers du référentiel, niveaux de maturité 0=Inexistant/1=Initié/2=Formalisé/3=Optimisé le cas échéant) et donne un score global sur 100, une évaluation par axe, et des recommandations priorisées.",
  "outputSchema": {
    "type": "object",
    "properties": {
      "score_global": { "type": "number", "description": "Score sur 100" },
      "axes": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "axe": { "type": "string" },
            "score": { "type": "number", "description": "Score sur 100" }
          }
        }
      },
      "recommandations": {
        "type": "array",
        "items": { "type": "string" }
      }
    }
  }
}

Règles pour la génération :
1. Crée 3 à 6 \`inputs\` pertinents qui reflètent la méthodologie décrite (ex: si la description mentionne des chapitres/piliers/dimensions précis, les \`axes\` du promptTemplate doivent s'en inspirer). Varie les types (au moins un \`select\` et un \`textarea\`).
2. Si la description mentionne des "niveaux de maturité" (0 à 3), inclus un input de type \`select\` permettant à l'utilisateur de s'auto-positionner par dimension clé, ou mentionne ces niveaux dans le promptTemplate.
3. Rédige un \`promptTemplate\` de très haute qualité, spécifique au référentiel cité (ISO, label, bailleur...), qui mentionne toutes les variables d'input en utilisant les accolades {variable}.
4. L'\`outputSchema\` doit TOUJOURS correspondre exactement à l'exemple donné ci-dessus (score_global, axes avec axe et score, et recommandations), ne change pas cette structure.
5. L'ID doit être unique et en kebab-case.
6. Renvoie UNIQUEMENT l'objet JSON valide. Pas de markdown, pas de \`\`\`json, juste l'objet brut.
`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log("Lecture du catalogue v2 TXT...");
  let text = "";
  try {
    text = fs.readFileSync(CATALOG_PATH, "utf-8");
  } catch (e) {
    console.error("Erreur de lecture du TXT:", e);
    return;
  }

  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);

  const extractedTools: { title: string; category: string; description: string }[] = [];
  let currentCategory = "";
  let inCatalogSection = false;

  for (const line of lines) {
    if (/^Architecture technique recommandée/.test(line)) break;

    const catMatch = line.match(/^CATÉGORIE\s*\d+\s*—\s*(.+)$/);
    if (catMatch) {
      currentCategory = catMatch[1].trim();
      inCatalogSection = true;
      continue;
    }
    if (!inCatalogSection) continue;

    const idx = line.indexOf(" : ");
    if (idx > 0 && currentCategory) {
      extractedTools.push({
        title: line.slice(0, idx).trim(),
        description: line.slice(idx + 3).trim(),
        category: currentCategory,
      });
    }
  }

  console.log(`Nombre total d'outils détectés (v2) : ${extractedTools.length}`);

  const existingTitles = new Set(
    fs.readdirSync(OUT_DIR)
      .filter(f => f.endsWith(".json"))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(OUT_DIR, f), "utf-8")).title?.trim().toLowerCase();
        } catch {
          return null;
        }
      })
      .filter(Boolean)
  );

  const toolsToProcess = extractedTools.filter(t => !existingTitles.has(t.title.trim().toLowerCase()));

  console.log(`Déjà générés : ${extractedTools.length - toolsToProcess.length} — Restants à générer : ${toolsToProcess.length}`);

  for (let i = 0; i < toolsToProcess.length; i++) {
    const tool = toolsToProcess[i];
    console.log(`[${i + 1}/${toolsToProcess.length}] Génération pour : ${tool.title} (${tool.category})`);

    await generateTool(tool.title, tool.category, tool.description, 3);

    await delay(3500);
  }

  console.log("Génération v2 terminée.");
}

async function generateTool(title: string, category: string, description: string, retries: number) {
  try {
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Génère le JSON pour l'outil suivant :\nTitre: ${title}\nCatégorie: ${category}\nDescription/méthodologie: ${description}`,
        },
      ],
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content;
    if (!responseContent) throw new Error("Réponse vide");

    const toolData = JSON.parse(responseContent);
    const parseResult = toolSchema.safeParse(toolData);

    if (parseResult.success) {
      const data = parseResult.data;

      const filePath = path.join(OUT_DIR, `${data.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

      const { error } = await supabase.from("tools").upsert({
        id: data.id,
        title: data.title,
        category: data.category,
        config: data as any,
      });

      if (error) {
        console.error(`❌ Erreur Supabase pour l'outil "${data.title}" :`, error.message);
      } else {
        console.log(`✅ Outil inséré avec succès !`);
      }
    } else {
      console.warn(`⚠️ Erreur de validation Zod pour "${title}" :`);
      parseResult.error.issues.forEach(issue => console.warn(`  - ${issue.path.join(".")}: ${issue.message}`));
      throw new Error("Schéma invalide");
    }
  } catch (error: any) {
    console.error(`❌ Erreur pour ${title} :`, error.message || error);
    if (retries > 0) {
      console.log(`Nouvelle tentative dans 5 secondes (${retries} restantes)...`);
      await delay(5000);
      await generateTool(title, category, description, retries - 1);
    } else {
      console.log(`⏭️ Abandon de l'outil ${title}`);
    }
  }
}

main().catch(console.error);
