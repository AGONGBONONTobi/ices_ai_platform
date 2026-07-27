/**
 * Client HTTP du backend FastAPI.
 *
 * Toute la logique métier (catalogue, traduction, exécution IA, Stripe) vit
 * désormais dans `fast_api/`. Ce module est le seul point d'entrée du frontend
 * vers cette API.
 *
 * - `API_BASE_URL`            : utilisé côté navigateur (doit être public).
 * - `INTERNAL_API_BASE_URL`   : utilisé côté serveur, permet de viser une URL
 *                               interne (réseau Docker, service mesh) sans
 *                               exposer l'API publiquement.
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const INTERNAL_API_BASE_URL =
  process.env.API_BASE_URL ?? API_BASE_URL;

function baseUrl(): string {
  return typeof window === "undefined" ? INTERNAL_API_BASE_URL : API_BASE_URL;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
  /** Jeton d'accès Supabase, pour les routes authentifiées. */
  token?: string | null;
  /** Par défaut on ne met rien en cache : le catalogue est dynamique. */
  cache?: RequestCache;
}

/**
 * FastAPI renvoie ses erreurs sous la forme `{ detail: string | object }`.
 * On aplatit ça en `ApiError` avec un `code` exploitable (ex: QUOTA_EXCEEDED).
 */
function parseError(status: number, payload: any): ApiError {
  const detail = payload?.detail ?? payload;

  if (typeof detail === "string") {
    return new ApiError(status, detail);
  }
  if (detail && typeof detail === "object") {
    return new ApiError(
      status,
      detail.details ?? detail.error ?? "Une erreur est survenue.",
      detail.error
    );
  }
  return new ApiError(status, "Une erreur est survenue.");
}

export async function apiFetch<T>(
  path: string,
  { method = "GET", body, token, cache = "no-store" }: RequestOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${baseUrl()}${path}`, {
    method,
    headers,
    cache,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    let payload: any = null;
    try {
      payload = await response.json();
    } catch {
      // Réponse non-JSON (502, timeout du proxy…)
    }
    throw parseError(response.status, payload);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
