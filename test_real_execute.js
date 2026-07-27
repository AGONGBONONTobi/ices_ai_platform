const main = async () => {
  const req = {
    "toolConfig": {
      "id": "diagnostic-de-performance-globale",
      "title": "Diagnostic de performance globale (BSC)",
      "category": "RH",
      "inputs": [
        {
          "name": "objectifs_strategiques",
          "type": "select",
          "options": [
            { "label": "Non", "score": 0 },
            { "label": "Oui", "score": 3 }
          ],
          "question": "Question 1"
        }
      ],
      "outputSchema": {
        "type": "object",
        "properties": {
          "axes": {
            "type": "array",
            "items": { "axe": "string", "score": "number" }
          },
          "score_global": { "type": "number" },
          "recommandations": { "type": "array", "items": "string" }
        }
      },
      "promptTemplate": "Analysez..."
    },
    "userInputs": {
      "objectifs_strategiques": "Oui"
    },
    "lang": "fr"
  };

  const res = await fetch("http://localhost:3000/api/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req)
  });
  console.log(res.status, await res.text());
};
main();
