import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Client Supabase SSR côté SERVEUR — **authentification uniquement**.
 *
 * L'accès aux données (outils, traductions, profils, facturation) est passé sur
 * le backend FastAPI ; ce client ne sert plus qu'à lire/rafraîchir la session
 * depuis les cookies et à en extraire le jeton transmis à l'API.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignoré dans les Server Components (cookies read-only)
          }
        },
      },
    }
  );
}

/**
 * Jeton d'accès Supabase de la session courante, à passer en `Authorization:
 * Bearer` aux routes authentifiées du backend FastAPI.
 */
export async function getAccessToken(): Promise<string | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
