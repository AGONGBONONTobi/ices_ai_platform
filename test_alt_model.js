const Groq = require("groq-sdk").default;
require("dotenv").config({ path: ".env.local" });
const g = new Groq({ apiKey: process.env.GROQ_API_KEY });
g.chat.completions.create({
  messages: [{ role: "user", content: "Réponds juste: OK" }],
  model: "llama-3.1-8b-instant",
  max_tokens: 10
}).then(r => console.log("llama-3.1-8b-instant: OK -", r.choices[0].message.content))
  .catch(e => console.log("llama-3.1-8b-instant: FAILED -", e.message?.slice(0,100)));
