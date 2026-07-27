const testApi = async () => {
  const toolConfig = {
    title: "Diagnostic de performance globale (BSC)",
    category: "RH",
    outputSchema: {
      type: "object",
      properties: {
        axes: {
          type: "array",
          items: {
            axe: "string",
            score: "number"
          }
        },
        score_global: {
          type: "number"
        },
        recommandations: {
          type: "array",
          items: "string"
        }
      }
    },
    promptTemplate: "Analysez les réponses fournies pour évaluer la performance globale de l'entreprise. Les objectifs stratégiques ({objectifs_strategiques}), les indicateurs de performance ({indicateurs_de_performance}), le suivi des résultats ({suivi_des_resultats}), et la mise en œuvre de plans d'action ({plan_d_action}) sont essentiels pour une évaluation complète."
  };
  
  const userInputs = {
    "objectifs_strategiques": "Oui, et ils sont partagés avec l'ensemble de l'équipe, mais pas nécessairement mis à jour régulièrement",
    "indicateurs_de_performance": "Oui, et ils sont liés à nos objectifs, mais pas nécessairement suivis régulièrement",
    "suivi_des_resultats": "Oui, de manière régulière, mais sans nécessairement ajuster nos stratégies en conséquence",
    "plan_d_action": "On fait des réunions mais ça ne suit pas."
  };

  const response = await fetch("http://localhost:3000/api/execute", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      toolConfig,
      userInputs,
      lang: "fr"
    })
  });
  
  const json = await response.json();
  console.log(JSON.stringify(json, null, 2));
};

testApi();
