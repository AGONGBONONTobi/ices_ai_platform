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
 *   npx tsx scripts/validate_tools.ts --update-baseline   # purger la dette réglée
 *
 * Sort en code 1 s'il reste au moins une erreur.
 *
 * ── Le cliquet ──────────────────────────────────────────────────────────────
 * Deux défauts touchent aujourd'hui la majorité du catalogue : le prompt resté
 * à l'état de souche (« Tu es un consultant expert. L'utilisateur a répondu :
 * … »), et l'absence totale d'aide sur les champs. Les passer en erreur d'un
 * coup ferait échouer la CI sur presque toutes les fiches, et la règle serait
 * désactivée dans la semaine.
 *
 * Les fiches déjà atteintes sont donc consignées dans `quality_baseline.json`
 * et signalées en avertissement — la dette reste visible. Toute fiche qui n'y
 * figure pas et qui présente le défaut est une **erreur bloquante** : le
 * catalogue ne peut plus se dégrader, il ne peut que s'assainir.
 *
 * La liste ne sait que rétrécir. `--update-baseline` retire les fiches
 * corrigées et refuse d'en ajouter : sans cela, il suffirait de relancer la
 * commande pour blanchir une régression.
 */

import fs from "fs";
import path from "path";
import { toolSchema } from "../src/lib/schema/tool-schema";
import { CATEGORY_STYLES } from "../src/lib/categoryStyles";

const TOOLS_DIR = path.join(__dirname, "../data/tools");
const BASELINE_FILE = path.join(__dirname, "quality_baseline.json");
const QUIET = process.argv.includes("--quiet");
const UPDATE_BASELINE = process.argv.includes("--update-baseline");

/** Règles soumises au cliquet : connues = avertissement, nouvelles = erreur. */
const RATCHETED = ["prompt-souche", "input-sans-aide"] as const;
type RatchetedRule = (typeof RATCHETED)[number];

type Baseline = Record<RatchetedRule, string[]>;

function loadBaseline(): { baseline: Baseline; existed: boolean } {
  if (!fs.existsSync(BASELINE_FILE)) {
    return {
      baseline: { "prompt-souche": [], "input-sans-aide": [] },
      existed: false,
    };
  }
  const raw = JSON.parse(fs.readFileSync(BASELINE_FILE, "utf-8"));
  return {
    baseline: {
      "prompt-souche": raw["prompt-souche"] ?? [],
      "input-sans-aide": raw["input-sans-aide"] ?? [],
    },
    existed: true,
  };
}

/**
 * Vrai si le prompt se borne à rappeler les réponses de l'utilisateur.
 *
 * Reprend à l'identique `est_souche()` de `rewrite_prompts.py`, qui décide
 * quelles fiches ce script réécrit. Les deux définitions doivent rester
 * alignées : sinon la CI refuserait des fiches que l'outil de reprise ne
 * traite pas, ou l'inverse.
 */
function estSouche(prompt: string): boolean {
  if (!prompt.includes("a répondu")) return false;
  const apres = prompt.split("a répondu").pop() ?? "";
  return prompt.trimEnd().endsWith(".") && apres.length < 400;
}

// Seule source de vérité des catégories : celles que le frontend sait styler.
// Une catégorie absente d'ici s'affiche avec l'icône et le dégradé par défaut.
const CANONICAL_CATEGORIES = new Set(Object.keys(CATEGORY_STYLES));

const { baseline, existed: baselineExisted } = loadBaseline();

/**
 * Réécrit la dette : retire les fiches corrigées, refuse d'en inscrire de
 * nouvelles. C'est ce refus qui fait du fichier un cliquet plutôt qu'un
 * blanc-seing renouvelable à la demande.
 */
function writeBaseline(): number {
  const next: Record<string, unknown> = {
    _commentaire:
      "Dette qualité connue. Géré par validate_tools.ts --update-baseline, " +
      "qui ne sait que retirer des entrées. Une fiche absente d'ici et en " +
      "infraction fait échouer la CI.",
  };

  let retirees = 0;
  const regressions: string[] = [];

  for (const rule of RATCHETED) {
    const enInfraction = new Set(violations[rule]);

    if (!baselineExisted) {
      next[rule] = violations[rule].slice().sort();
      continue;
    }

    const connues = new Set(baseline[rule]);
    for (const id of violations[rule]) {
      if (!connues.has(id)) regressions.push(`${rule} : ${id}`);
    }

    const conservees = baseline[rule].filter((id) => enInfraction.has(id));
    retirees += baseline[rule].length - conservees.length;
    next[rule] = conservees.sort();
  }

  if (regressions.length > 0) {
    console.error(
      `\n✖ ${regressions.length} nouvelle(s) infraction(s) — la dette ne peut pas être étendue.`
    );
    for (const r of regressions.slice(0, 10)) console.error(`    ${r}`);
    if (regressions.length > 10) console.error(`    … et ${regressions.length - 10} autres`);
    console.error("\nCorriger ces fiches plutôt que la liste. Rien n'a été écrit.");
    process.exit(1);
  }

  fs.writeFileSync(BASELINE_FILE, JSON.stringify(next, null, 2) + "\n");
  return retirees;
}

interface Issue {
  file: string;
  level: "error" | "warning";
  rule: string;
  message: string;
}

const issues: Issue[] = [];

/** Fiches en infraction sur les règles à cliquet, pour recalculer la dette. */
const violations: Record<RatchetedRule, string[]> = {
  "prompt-souche": [],
  "input-sans-aide": [],
};

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

    // --- Défauts de fond, soumis au cliquet ---
    //
    // Ces deux règles ne portent pas sur la structure de la fiche mais sur ce
    // qu'elle vaut : un prompt qui ne demande rien produit une paraphrase du
    // formulaire, et un champ sans aide laisse l'utilisateur deviner l'attendu.
    // C'est exactement ce que les référentiels apportent aux auto-diagnostics.
    const ratchet = (rule: RatchetedRule, message: string) => {
      violations[rule].push(tool.id);
      const connu = baseline[rule].includes(tool.id);
      add(file, connu ? "warning" : "error", rule, connu ? `${message} — dette connue` : message);
    };

    if (estSouche(tool.promptTemplate)) {
      ratchet(
        "prompt-souche",
        "le prompt se borne à rappeler les réponses saisies : ni tâche, ni méthode, ni livrable demandé"
      );
    }

    if (tool.inputs.length > 0 && !tool.inputs.some((i) => i.help)) {
      ratchet(
        "input-sans-aide",
        "aucun champ ne porte d'aide : l'utilisateur se positionne sans savoir ce qui est attendu"
      );
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

  if (UPDATE_BASELINE) {
    const retirees = writeBaseline();
    const total = RATCHETED.reduce((n, r) => n + violations[r].length, 0);
    console.log(
      baselineExisted
        ? `\nDette mise à jour : ${retirees} fiche(s) retirée(s), ${total} restante(s).`
        : `\nDette amorcée : ${total} fiche(s) consignée(s) dans ${path.basename(BASELINE_FILE)}.`
    );
    return;
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
