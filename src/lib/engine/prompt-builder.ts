/**
 * Remplace les variables dans le template (ex: {nom_variable}) par les valeurs utilisateur.
 */
export function buildPrompt(template: string, userInputs: Record<string, any>): string {
  let finalPrompt = template;

  for (const [key, value] of Object.entries(userInputs)) {
    // Crée une regex pour trouver {key} globalement dans la string
    const regex = new RegExp(`{${key}}`, "g");
    
    // Si la valeur est un tableau ou objet, on la stringify, sinon on convertit en string
    let stringValue = "";
    if (value !== null && value !== undefined) {
       stringValue = typeof value === "object" ? JSON.stringify(value) : String(value);
    }

    finalPrompt = finalPrompt.replace(regex, stringValue);
  }

  return finalPrompt;
}
