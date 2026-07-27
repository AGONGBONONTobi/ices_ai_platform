import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function main() {
  const { data, error } = await supabase
    .from("tools")
    .select("id, title, config")
    .order("id");

  if (error) { console.error(error); return; }

  console.log(`\n📋 ${data.length} outils dans Supabase:\n`);
  for (const tool of data) {
    const inputs = (tool.config as any)?.inputs ?? [];
    const types = inputs.map((i: any) => i.type).join(", ");
    const hasQuestion = inputs.some((i: any) => i.question);
    const hasScoreOptions = inputs.some((i: any) => 
      Array.isArray(i.options) && i.options.length > 0 && typeof i.options[0] === "object"
    );
    console.log(`  ${hasQuestion ? "✅" : "❌"} ${tool.id}`);
    console.log(`     → ${inputs.length} champs [${types}] | question: ${hasQuestion} | scoreMapping: ${hasScoreOptions}`);
  }
}

main();
