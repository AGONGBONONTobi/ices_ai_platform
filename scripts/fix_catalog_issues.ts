/**
 * Correction ponctuelle des défauts du catalogue relevés par validate_tools.ts.
 *
 * Ces défauts viennent tous de la génération en masse non supervisée. Ils étaient
 * jusqu'ici sans effet visible puisque le `promptTemplate` n'était pas exécuté ;
 * ils deviennent bloquants maintenant qu'il l'est.
 *
 * Quatre corrections :
 *  1. suffixe « -kebab-case » dans l'id (instruction du générateur fuitée) ;
 *  2. noms d'inputs contenant des espaces ;
 *  3. placeholders du prompt ne correspondant à aucun input (accents, fautes) ;
 *  4. selects dont l'unique option est en réalité une liste « a, b, c ».
 *
 * Usage :
 *   npx tsx scripts/fix_catalog_issues.ts --dry-run   # aperçu (défaut)
 *   npx tsx scripts/fix_catalog_issues.ts --write     # applique
 *
 * N'écrit que dans data/tools/. La base est mise à jour ensuite par
 * scripts/sync_tools_to_db.ts.
 */

import fs from "fs";
import path from "path";

const TOOLS_DIR = path.join(__dirname, "../data/tools");
const WRITE = process.argv.includes("--write");

/** Clé de comparaison insensible aux accents, à la casse et aux séparateurs. */
function normalizeKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function levenshtein(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) rows[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      rows[i][j] = Math.min(
        rows[i - 1][j] + 1,
        rows[i][j - 1] + 1,
        rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return rows[a.length][b.length];
}

/** Remplace `{from}` par `{to}` dans un template. */
function renamePlaceholder(template: string, from: string, to: string): string {
  return template.split(`{${from}}`).join(`{${to}}`);
}

const changes: string[] = [];
const renamedFiles: { from: string; to: string }[] = [];

function main() {
  const files = fs.readdirSync(TOOLS_DIR).filter((f) => f.endsWith(".json")).sort();
  const existingIds = new Set(
    files.map((f) => JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, f), "utf-8")).id)
  );

  for (const file of files) {
    const filePath = path.join(TOOLS_DIR, file);
    const tool = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    let touched = false;
    let newFileName = file;

    // --- 1. Suffixe « -kebab-case » dans l'id ---
    if (/-kebab-case$/.test(tool.id)) {
      const candidate = tool.id.replace(/-kebab-case$/, "");
      if (existingIds.has(candidate)) {
        changes.push(`SKIP  ${file} : « ${candidate} » est déjà pris, renommage manuel requis`);
      } else {
        existingIds.delete(tool.id);
        existingIds.add(candidate);
        changes.push(`id    ${tool.id} → ${candidate}`);
        tool.id = candidate;
        newFileName = `${candidate}.json`;
        touched = true;
      }
    }

    // --- 2. Noms d'inputs mal formés (espaces) ---
    for (const input of tool.inputs) {
      const cleaned = input.name.trim().replace(/\s+/g, "_");
      if (cleaned !== input.name) {
        changes.push(`input ${tool.id} : « ${input.name} » → « ${cleaned} »`);
        tool.promptTemplate = renamePlaceholder(tool.promptTemplate, input.name, cleaned);
        input.name = cleaned;
        touched = true;
      }
    }

    // --- 3. Placeholders orphelins ---
    const names: string[] = tool.inputs.map((i: any) => i.name);
    const byNormalized = new Map(names.map((n) => [normalizeKey(n), n]));
    const used: string[] = Array.from(tool.promptTemplate.matchAll(/\{([^{}]+)\}/g), (m: any) => m[1]);

    for (const variable of Array.from(new Set(used))) {
      if (names.includes(variable)) continue;

      // a. même nom aux accents / séparateurs près
      let match = byNormalized.get(normalizeKey(variable));

      // b. sinon, faute de frappe proche (une lettre en trop, en moins, inversée)
      if (!match) {
        const key = normalizeKey(variable);
        const candidates = names
          .map((n) => ({ name: n, distance: levenshtein(key, normalizeKey(n)) }))
          .filter((c) => c.distance <= 2)
          .sort((a, b) => a.distance - b.distance);
        if (candidates.length > 0) match = candidates[0].name;
      }

      if (match) {
        changes.push(`var   ${tool.id} : {${variable}} → {${match}}`);
        tool.promptTemplate = renamePlaceholder(tool.promptTemplate, variable, match);
        touched = true;
      } else {
        changes.push(`TODO  ${tool.id} : {${variable}} sans correspondance — à traiter à la main`);
      }
    }

    // --- 4. Selects dont l'unique option est une liste ---
    for (const input of tool.inputs) {
      if (input.type !== "select") continue;
      const options = input.options ?? [];
      if (options.length !== 1 || typeof options[0] !== "string") continue;

      const split = options[0]
        .split(/\s*,\s*/)
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (split.length > 1) {
        changes.push(`opts  ${tool.id} : « ${input.name} » → ${split.length} options`);
        input.options = split;
        touched = true;
      }
    }

    if (touched && WRITE) {
      fs.writeFileSync(filePath, JSON.stringify(tool, null, 2) + "\n");
      if (newFileName !== file) {
        fs.renameSync(filePath, path.join(TOOLS_DIR, newFileName));
        renamedFiles.push({ from: file, to: newFileName });
      }
    }
  }

  for (const change of changes) console.log(change);
  console.log(`\n${"─".repeat(60)}`);
  console.log(`${changes.length} correction(s)${WRITE ? " appliquée(s)" : " (aperçu — relancer avec --write)"}`);

  if (WRITE && renamedFiles.length > 0) {
    console.log(
      `\n${renamedFiles.length} fichier(s) renommé(s). Les anciens id ne sont plus servis :\n` +
        `penser à supprimer les lignes correspondantes en base, puis relancer\n` +
        `  npx tsx scripts/sync_tools_to_db.ts --write`
    );
  }
}

main();
