import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { i18nConfig } from "@/lib/i18n/getDictionary";

const { locales, defaultLocale } = i18nConfig;

// Routes qui ne nécessitent PAS d'authentification
const PUBLIC_PATHS = ["/login", "/signup", "/auth/callback"];

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language") ?? "";
  const browserLangs = acceptLanguage
    .split(",")
    .map((lang) => lang.split(";")[0].trim().substring(0, 2).toLowerCase());

  for (const lang of browserLangs) {
    if ((locales as readonly string[]).includes(lang)) {
      return lang;
    }
  }
  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Ignorer les fichiers statiques, les routes API et les routes d'auth
  // (`/auth/callback`, `/auth/signout` vivent hors de `[lang]` : Google OAuth et
  // les liens de confirmation email y redirigent sans préfixe de locale).
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // --- Étape 1: Gestion de la locale (i18n) ---
  const pathnameHasLocale = (locales as readonly string[]).some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  let response = NextResponse.next();
  let localedPathname = pathname;

  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    const newUrl = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(newUrl);
  }

  // --- Étape 2: Auth Guard via Supabase SSR ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Récupérer la session (refresh automatique du token si expiré)
  const { data: { user } } = await supabase.auth.getUser();

  // Extraire la locale et le sous-chemin
  const locale = (locales as readonly string[]).find(
    (l) => pathname.startsWith(`/${l}/`) || pathname === `/${l}`
  ) || defaultLocale;

  const subPath = pathname.replace(`/${locale}`, "") || "/";

  // Vérifier si le sous-chemin est public
  const isPublicPath = PUBLIC_PATHS.some((p) => subPath.startsWith(p));

  // Si la route est protégée et l'utilisateur n'est pas connecté → Login
  if (!isPublicPath && subPath !== "/" && !user) {
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si l'utilisateur est connecté et tente d'accéder à login/signup → Catalog
  if (user && (subPath === "/login" || subPath === "/signup")) {
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
