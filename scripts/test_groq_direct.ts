import "dotenv/config";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const toolConfig = {
  title: "Diagnostic de performance globale (BSC)",
  category: "RH",
  outputSchema: {
    type: "object",
    properties: {
      axes: { type: "array", items: { axe: "string", score: "number" } },
      score_global: { type: "number" },
      recommandations: { type: "array", items: "string" },
    },
  },
  promptTemplate:
    "Analysez les réponses : objectifs={objectifs_strategiques}, KPIs={indicateurs_de_performance}, suivi={suivi_des_resultats}, plan d'action={plan_d_action}.",
};

const userInputs = {
  objectifs_strategiques: "Oui, partagés mais pas mis à jour régulièrement",
  indicateurs_de_performance: "Oui, liés aux objectifs mais suivis occasionnellement",
  suivi_des_resultats: "Oui, régulier, mais sans ajustement stratégique",
  plan_d_action: "On fait des réunions mais ça ne suit pas.",
};

const systemPrompt = `You are an elite Management & Strategy Consultant.
Tool: "${toolConfig.title}" | Category: "${toolConfig.category}"

INSTRUCTIONS:
1. LANGUAGE: Respond entirely in French.
2. FORMAT: Return ONLY a valid raw JSON object matching this schema exactly: ${JSON.stringify(toolConfig.outputSchema)}
   - "score_global": an integer from 0 to 100
   - "axes": array of objects with "axe" (string) and "score" (0-100)
   - "recommandations": array of actionable strings (at least 5, detailed)
3. No markdown, no code blocks, no explanation outside the JSON.`;

const userPrompt = `USER INPUTS:\n${Object.entries(userInputs)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}\n\nGenerate the diagnostic result now.`;

async function main() {
  const res = await groq.chat.completions.create({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.4,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });

  const raw = res.choices[0]?.message?.content ?? "";
  console.log("=== RAW OUTPUT ===");
  console.log(raw);
  console.log("=== PARSED ===");
  console.log(JSON.stringify(JSON.parse(raw), null, 2));
}

main().catch(console.error);
