import { apiFetch, ApiError } from "./client";
import { ToolConfig } from "@/lib/schema/tool-schema";
import { Locale } from "@/lib/i18n/getDictionary";

export type ToolSummary = Pick<ToolConfig, "id" | "title" | "category">;

/**
 * Catalogue complet, déjà traduit côté backend avec les traductions en cache.
 * Renvoie une liste vide plutôt que de lever si l'API est injoignable : la page
 * affiche alors son état vide au lieu de rendre une 500.
 */
export async function fetchTools(lang: Locale): Promise<ToolSummary[]> {
  try {
    return await apiFetch<ToolSummary[]>(`/api/tools?lang=${lang}`);
  } catch (error) {
    console.error("Impossible de charger le catalogue depuis l'API:", error);
    return [];
  }
}

/** Nombre d'outils au catalogue. Renvoie 0 si l'API est injoignable. */
export async function fetchToolCount(): Promise<number> {
  try {
    const { count } = await apiFetch<{ count: number }>("/api/tools/count");
    return count;
  } catch (error) {
    console.error("Impossible de compter les outils depuis l'API:", error);
    return 0;
  }
}

/** Configuration complète d'un outil, traduite dans `lang`. `null` si introuvable. */
export async function fetchTool(
  id: string,
  lang: Locale
): Promise<ToolConfig | null> {
  try {
    return await apiFetch<ToolConfig>(
      `/api/tools/${encodeURIComponent(id)}?lang=${lang}`
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export interface ExecuteResult {
  result: any;
}

export async function executeTool(
  payload: { toolConfig: ToolConfig; userInputs: Record<string, any>; lang: Locale },
  token: string
): Promise<any> {
  const { result } = await apiFetch<ExecuteResult>("/api/execute", {
    method: "POST",
    body: payload,
    token,
  });
  return result;
}
