const Groq = require("groq-sdk").default;
require("dotenv").config({ path: ".env.local" });
const g = new Groq({ apiKey: process.env.GROQ_API_KEY });
g.models.list().then(r => r.data.forEach(m => console.log(m.id)));
