import { apiFetch } from "./client";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  plan: string;
  tools_used_count: number;
}

/** Profil de l'utilisateur connecté. `null` si le jeton est absent ou invalide. */
export async function fetchProfile(
  token: string | null | undefined
): Promise<Profile | null> {
  if (!token) return null;
  try {
    return await apiFetch<Profile>("/api/me", { token });
  } catch (error) {
    console.error("Impossible de charger le profil depuis l'API:", error);
    return null;
  }
}

/** Crée une session Stripe Checkout et renvoie l'URL vers laquelle rediriger. */
export async function createCheckoutSession(token: string): Promise<string> {
  const { url } = await apiFetch<{ url: string }>("/api/stripe/checkout", {
    method: "POST",
    token,
  });
  return url;
}
