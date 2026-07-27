import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  const { data } = await supabaseAdmin.from("tools").select("id, config");
  const missingInputs = data?.filter(t => !t.config.inputs) || [];
  console.log("Missing inputs count:", missingInputs.length);
  if (missingInputs.length > 0) console.log("Example:", missingInputs[0].id);
}
main();
