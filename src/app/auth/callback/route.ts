import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { i18nConfig } from "@/lib/i18n/getDictionary";

/**
 * Route de callback OAuth / Confirmation Email.
 * Supabase redirige ici après Google OAuth ou clic sur le lien de confirmation e-mail.
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") ?? "/fr";
  const origin = requestUrl.origin;

  // Locale déduite de `next` (ex: "/en" → "en"), pour rediriger vers le bon
  // login si l'échange de code échoue.
  const nextLocale = (i18nConfig.locales as readonly string[]).find(
    (locale) => next === `/${locale}` || next.startsWith(`/${locale}/`)
  ) ?? i18nConfig.defaultLocale;

  if (code) {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // En cas d'erreur, rediriger vers le login avec un message
  return NextResponse.redirect(`${origin}/${nextLocale}/login?error=auth_callback_failed`);
}
