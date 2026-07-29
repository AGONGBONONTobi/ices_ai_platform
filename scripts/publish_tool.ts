/**
 * Publie ou dépublie une fiche, sans repasser par une synchronisation complète.
 *
 * `sync_tools_to_db.ts` ne touche jamais au statut d'une fiche déjà en base —
 * c'est voulu, mais cela laissait sans recours le cas courant : une fiche
 * insérée en `draft`, relue, puis validée. Il fallait alors éditer la ligne à la
 * main dans Supabase.
 *
 * Usage :
 *   npx tsx scripts/publish_tool.ts <id> [<id>...]      # publie
 *   npx tsx scripts/publish_tool.ts --draft <id>        # repasse en brouillon
 *   npx tsx scripts/publish_tool.ts --list-drafts       # liste les brouillons
 */

import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const args = process.argv.slice(2);
  const toDraft = args.includes("--draft");
  const listDrafts = args.includes("--list-drafts");
  const ids = args.filter((a) => !a.startsWith("--"));

  if (listDrafts) {
    const { data, error } = await supabase
      .from("tools")
      .select("id,title")
      .eq("status", "draft")
      .order("id");
    if (error) throw new Error(error.message);
    if (!data?.length) {
      console.log("Aucune fiche en brouillon.");
      return;
    }
    console.log(`${data.length} fiche(s) en brouillon :`);
    for (const row of data) console.log(`  ${row.id}  —  ${row.title}`);
    return;
  }

  if (ids.length === 0) {
    console.error("Aucun identifiant fourni. Voir l'en-tête du script.");
    process.exit(1);
  }

  const status = toDraft ? "draft" : "published";
  const { error } = await supabase
    .from("tools")
    .update({ status })
    .in("id", ids);
  if (error) {
    console.error("✖", error.message);
    process.exit(1);
  }

  // On relit plutôt que de faire confiance à l'absence d'erreur : un identifiant
  // inexistant ne fait pas échouer un update, il ne touche simplement rien.
  const { data } = await supabase
    .from("tools")
    .select("id,status")
    .in("id", ids)
    .order("id");

  const vus = new Set((data ?? []).map((r) => r.id));
  for (const row of data ?? []) console.log(`  ${row.status.padEnd(9)} ${row.id}`);
  for (const id of ids) {
    if (!vus.has(id)) console.error(`  introuvable ${id}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
