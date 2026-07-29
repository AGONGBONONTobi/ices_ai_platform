/**
 * Validation structurelle du catalogue (niveau 1 du filtre qualité).
 *
 * Le générateur valide déjà chaque fiche contre le schéma Zod au moment de sa
 * création. Ce script ajoute ce que le cadrage demandait explicitement et qui
 * manquait : « les variables du prompt correspondent bien aux inputs déclarés ».
 * C'est devenu bloquant depuis que le `promptTemplate` est réellement injecté
 * dans l'appel LLM — une variable non déclarée fuite désormais telle quelle
 * dans le prompt.
 *
 * Usage :
 *   npx tsx scripts/validate_tools.ts          # rapport complet
 *   npx tsx scripts/validate_tools.ts --quiet  # erreurs uniquement (CI)
 *
 * Sort en code 1 s'il reste au moins une erreur.
 */

import fs from "fs";
import path from "path";
import { toolSchema } from "../src/lib/schema/tool-schema";
import { CATEGORY_STYLES } from "../src/lib/categoryStyles";

const TOOLS_DIR = path.join(__dirname, "../data/tools");
const QUIET = process.argv.includes("--quiet");

// Seule source de vérité des catégories : celles que le frontend sait styler.
// Une catégorie absente d'ici s'affiche avec l'icône et le dégradé par défaut.
const CANONICAL_CATEGORIES = new Set(Object.keys(CATEGORY_STYLES));

interface Issue {
  file: string;
  level: "error" | "warning";
  rule: string;
  message: string;
}

const issues: Issue[] = [];

function add(file: string, level: Issue["level"], rule: string, message: string) {
  issues.push({ file, level, rule, message });
}

/** Placeholders `{...}` présents dans un template. */
function placeholders(template: string): string[] {
  return Array.from(template.matchAll(/\{([^{}]+)\}/g), (m) => m[1]);
}

function main() {
  const files = fs.readdirSync(TOOLS_DIR).filter((f) => f.endsWith(".json")).sort();

  const idsSeen = new Map<string, string>();
  const titlesSeen = new Map<string, string>();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(TOOLS_DIR, file), "utf-8");

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e: any) {
      add(file, "error", "json", `JSON illisible : ${e.message}`);
      continue;
    }

    const result = toolSchema.safeParse(parsed);
    if (!result.success) {
      for (const issue of result.error.issues) {
        add(file, "error", "schema", `${issue.path.join(".")}: ${issue.message}`);
      }
      continue;
    }

    const tool = result.data;

    // --- Unicité ---
    const previousId = idsSeen.get(tool.id);
    if (previousId) {
      add(file, "error", "duplicate-id", `id « ${tool.id} » déjà utilisé par ${previousId}`);
    }
    idsSeen.set(tool.id, file);

    const titleKey = tool.title.trim().toLowerCase();
    const previousTitle = titlesSeen.get(titleKey);
    if (previousTitle) {
      add(file, "warning", "duplicate-title", `titre identique à ${previousTitle}`);
    }
    titlesSeen.set(titleKey, file);

    // --- Artefacts de génération ---
    if (/-kebab-case\b/.test(tool.id)) {
      add(
        file,
        "error",
        "generator-artifact",
        `l'id contient « -kebab-case » (instruction du générateur fuitée dans une URL publique)`
      );
    }

    // --- Catégorie ---
    if (!CANONICAL_CATEGORIES.has(tool.category)) {
      add(
        file,
        "error",
        "unknown-category",
        `catégorie « ${tool.category} » absente de CATEGORY_STYLES (affichage par défaut)`
      );
    }

    // --- Cohérence prompt ↔ inputs (la règle qui manquait) ---
    const declared = new Set(tool.inputs.map((i) => i.name));
    const used = new Set(placeholders(tool.promptTemplate));

    for (const variable of Array.from(used)) {
      if (!declared.has(variable)) {
        add(
          file,
          "error",
          "undeclared-variable",
          `le prompt référence {${variable}}, qui n'est pas un input déclaré`
        );
      }
    }
    // Un champ coté (options {label, score}, rattaché à un chapitre ou à un axe)
    // alimente le moteur de scoring, pas le template : son absence du prompt est
    // normale. Ses réponses sont de toute façon transmises au modèle sous forme
    // de rappel factuel, et son score est calculé côté serveur.
    const feedsScoring = new Set(
      tool.inputs
        .filter(
          (i: any) =>
            i.chapitre ||
            i.axe ||
            (i.options ?? []).some((o: any) => typeof o === "object" && o.score !== undefined)
        )
        .map((i: any) => i.name)
    );

    for (const name of Array.from(declared)) {
      if (!used.has(name) && !feedsScoring.has(name)) {
        add(
          file,
          "warning",
          "unused-input",
          `l'input « ${name} » est saisi par l'utilisateur mais absent du prompt`
        );
      }
    }

    // --- Inputs ---
    for (const input of tool.inputs) {
      if (input.type === "select") {
        const options = input.options ?? [];
        if (options.length < 2) {
          add(
            file,
            "error",
            "select-options",
            `le select « ${input.name} » a moins de 2 options`
          );
        }
      }
      if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(input.name)) {
        add(
          file,
          "warning",
          "input-name",
          `« ${input.name} » n'est pas un identifiant simple (accents, tirets)`
        );
      }
    }

    // --- outputSchema ---
    const properties = (tool.outputSchema as any)?.properties;
    if (!properties || typeof properties !== "object" || Object.keys(properties).length === 0) {
      add(file, "error", "output-schema", "outputSchema sans `properties` exploitables");
    } else {
      // Cas observé : `recommandations` imbriqué par erreur dans `axes.items`,
      // ce qui le sort du contrat de sortie sans que rien ne le signale.
      for (const [name, definition] of Object.entries<any>(properties)) {
        if (definition?.type === "array" && definition?.items?.recommandations) {
          add(
            file,
            "error",
            "output-schema",
            `« recommandations » est imbriqué dans ${name}.items au lieu d'être une propriété racine`
          );
        }
      }
    }
  }

  report(files.length);
}

function report(fileCount: number) {
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warning");

  const shown = QUIET ? errors : issues;
  const byFile = new Map<string, Issue[]>();
  for (const issue of shown) {
    byFile.set(issue.file, [...(byFile.get(issue.file) ?? []), issue]);
  }

  for (const [file, fileIssues] of Array.from(byFile.entries())) {
    console.log(`\n${file}`);
    for (const issue of fileIssues) {
      const mark = issue.level === "error" ? "✖" : "⚠";
      console.log(`  ${mark} [${issue.rule}] ${issue.message}`);
    }
  }

  const byRule = new Map<string, number>();
  for (const issue of issues) {
    const key = `${issue.level}:${issue.rule}`;
    byRule.set(key, (byRule.get(key) ?? 0) + 1);
  }

  console.log(`\n${"─".repeat(60)}`);
  console.log(`${fileCount} fiches analysées`);
  console.log(`${errors.length} erreur(s), ${warnings.length} avertissement(s)`);
  if (byRule.size > 0) {
    console.log("\nPar règle :");
    for (const [key, count] of Array.from(byRule.entries()).sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(count).padStart(5)}  ${key}`);
    }
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
