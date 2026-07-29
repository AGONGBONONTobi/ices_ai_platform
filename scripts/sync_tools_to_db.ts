/**
 * Synchronise data/tools/*.json vers la table `tools`.
 *
 * Le script de génération se contente d'un upsert : les fiches supprimées ou
 * renommées localement restaient donc servies en base. Ce script fait la
 * synchronisation complète, y compris les suppressions.
 *
 * Les fiches sont validées avant envoi : on ne pousse jamais en base un
 * catalogue que validate_tools.ts rejette.
 *
 * Usage :
 *   npx tsx scripts/sync_tools_to_db.ts                    # aperçu
 *   npx tsx scripts/sync_tools_to_db.ts --write            # applique
 *   npx tsx scripts/sync_tools_to_db.ts --write --publish  # publie les nouvelles
 *
 * La colonne `status` a pour défaut 'draft' : une fiche insérée pour la première
 * fois n'est donc pas servie par le catalogue. C'est voulu — le banc de tests
 * décidera de la publication — mais cela surprend lors d'un simple renommage,
 * où l'outil était publié sous son ancien identifiant. `--publish` publie les
 * fiches nouvellement insérées.
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { toolSchema } from "../src/lib/schema/tool-schema";

dotenv.config({ path: ".env.local" });

const TOOLS_DIR = path.join(__dirname, "../data/tools");
const WRITE = process.argv.includes("--write");
const PUBLISH_NEW = process.argv.includes("--publish");
const BATCH_SIZE = 200;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // --- Fiches locales, validées ---
  const files = fs.readdirSync(TOOLS_DIR).filter((f) => f.endsWith(".json"));
  const local = [];

  for (const file of files) {
    const parsed = toolSchema.safeParse(
      JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, file), "utf-8"))
    );
    if (!parsed.success) {
      console.error(`✖ ${file} invalide — corriger avant de synchroniser.`);
      console.error("  Lancer : npx tsx scripts/validate_tools.ts");
      process.exit(1);
    }
    local.push(parsed.data);
  }

  const localIds = new Set(local.map((t) => t.id));
  console.log(`${local.length} fiches locales valides.`);

  // --- Ids en base (paginés : PostgREST plafonne à 1000 lignes) ---
  const remoteIds: string[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase
      .from("tools")
      .select("id")
      .range(offset, offset + 999);
    if (error) {
      console.error("Lecture de la table `tools` impossible :", error.message);
      process.exit(1);
    }
    remoteIds.push(...(data ?? []).map((r) => r.id));
    if ((data ?? []).length < 1000) break;
  }

  const remoteSet = new Set(remoteIds);
  const stale = remoteIds.filter((id) => !localIds.has(id));
  const created = local.filter((t) => !remoteSet.has(t.id)).map((t) => t.id);

  console.log(`${remoteIds.length} fiches en base, dont ${stale.length} obsolète(s).`);
  if (created.length > 0) {
    console.log(
      `${created.length} fiche(s) à insérer` +
        (PUBLISH_NEW ? " — publiées (--publish)." : " — en `draft`, donc invisibles au catalogue.")
    );
  }

  if (!WRITE) {
    if (stale.length > 0) {
      console.log("\nÀ supprimer :");
      for (const id of stale.slice(0, 20)) console.log(`  - ${id}`);
      if (stale.length > 20) console.log(`  … et ${stale.length - 20} autres`);
    }
    console.log("\nAperçu — relancer avec --write pour appliquer.");
    return;
  }

  // --- Upsert par lots ---
  //
  // Deux passes, et non une seule avec un `status` conditionnel : un upsert en
  // masse exige que tous les objets envoyés portent les mêmes colonnes, les
  // absentes étant écrites à NULL. Mélanger des fiches avec statut et des
  // fiches sans faisait donc écrire `status = NULL` sur les secondes, ce que la
  // contrainte NOT NULL rejetait — et le lot entier échouait.
  //
  // On ne touche jamais au statut d'une fiche déjà en base : la dépublier
  // silencieusement serait pire que de ne rien faire. Sans statut explicite,
  // une insertion prend le défaut 'draft'.
  const nouvelles = local.filter((tool) => !remoteSet.has(tool.id));
  const existantes = local.filter((tool) => remoteSet.has(tool.id));

  const colonnes = (tool: (typeof local)[number]) => ({
    id: tool.id,
    title: tool.title,
    category: tool.category,
    config: tool as any,
  });

  const passes: { fiches: typeof local; statut?: string }[] = [
    { fiches: existantes },
    { fiches: nouvelles, ...(PUBLISH_NEW ? { statut: "published" } : {}) },
  ];

  let traitees = 0;
  for (const { fiches, statut } of passes) {
    for (let i = 0; i < fiches.length; i += BATCH_SIZE) {
      const batch = fiches
        .slice(i, i + BATCH_SIZE)
        .map((tool) => (statut ? { ...colonnes(tool), status: statut } : colonnes(tool)));

      const { error } = await supabase.from("tools").upsert(batch);
      if (error) {
        console.error(`✖ Upsert (${batch.length} fiches) :`, error.message);
        process.exit(1);
      }
      traitees += batch.length;
      console.log(`  ${traitees}/${local.length} synchronisées`);
    }
  }

  // --- Suppression des obsolètes ---
  if (stale.length > 0) {
    const { error } = await supabase.from("tools").delete().in("id", stale);
    if (error) {
      console.error("✖ Suppression des fiches obsolètes :", error.message);
      process.exit(1);
    }
    console.log(`${stale.length} fiche(s) obsolète(s) supprimée(s).`);
  }

  console.log("Synchronisation terminée.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
