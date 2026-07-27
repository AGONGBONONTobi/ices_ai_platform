import { createSupabaseServerClient, getAccessToken } from "@/lib/supabase/server";
import { fetchTools } from "@/lib/api/tools";
import { fetchProfile } from "@/lib/api/account";
import { CatalogView } from "@/components/catalog/CatalogView";
import { getDictionary, i18nConfig, Locale } from "@/lib/i18n/getDictionary";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { Diamond, FolderOpen, Globe, GearSix, Wrench } from "@phosphor-icons/react/dist/ssr";
import { UserMenu } from "@/components/auth/UserMenu";
import { CheckoutStatusBanner } from "@/components/billing/CheckoutStatusBanner";
import Link from "next/link";

interface HomePageProps {
  params: { lang: Locale };
  searchParams: { success?: string };
}

export const dynamic = "force-dynamic";

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const { lang } = params;
  const dict = await getDictionary(lang);

  // Le backend applique déjà les traductions en cache pour la locale demandée
  const toolsList = await fetchTools(lang);

  const isRtl = lang === "ar";
  const categoryCount = new Set(toolsList.map((t) => t.category)).size;

  // Session utilisateur (cookies Supabase) + profil servi par l'API
  const supabaseAuth = createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  const profile = user ? await fetchProfile(await getAccessToken()) : null;

  return (
    <div className="min-h-screen mesh-bg text-foreground" dir={isRtl ? "rtl" : "ltr"}>
      {/* Navigation Glassmorphism */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/60 glass-light">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-2">
          <Link href={`/${lang}`} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <Diamond className="w-4 h-4 text-white" weight="fill" />
            </div>
            <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 group-hover:text-violet-700 transition-colors whitespace-nowrap">
              {dict.nav.brand}
            </span>
          </Link>

          <div className="flex items-center gap-1.5 sm:gap-3">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-violet-200 bg-violet-50 text-violet-700">
              <Wrench className="w-3 h-3" />
              <span>{toolsList.length} {dict.nav.toolsCount}</span>
            </div>
            <LanguageSwitcher currentLang={lang} />
            {user ? (
              <UserMenu
                user={{
                  email: user.email ?? null,
                  full_name: profile?.full_name ?? null,
                  plan: profile?.plan ?? "free",
                }}
                lang={lang}
              />
            ) : (
              <Link
                href={`/${lang}/login`}
                id="login-cta-btn"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-md hover:shadow-violet-300/40 hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container max-w-7xl mx-auto px-4 pt-20 pb-12">
        <CheckoutStatusBanner success={searchParams.success === "true"} />

        <div className="flex flex-col items-center text-center mb-16 space-y-6 relative">
          {/* Top badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-200/60 bg-white/80 backdrop-blur-sm text-xs font-semibold text-violet-700 shadow-sm shadow-violet-100">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            {dict.hero.badge}
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance max-w-3xl leading-[1.1]" style={{ fontFamily: "Outfit, sans-serif" }}>
            {dict.hero.title}{" "}
            <span className="gradient-text">{dict.hero.titleHighlight}</span>
          </h1>

          <p className="text-lg text-slate-500 max-w-xl mx-auto text-balance leading-relaxed">
            {dict.hero.subtitle}
          </p>

          {/* Stats Row */}
          <div className="flex flex-wrap items-center justify-center gap-6 pt-4">
            {[
              { icon: Wrench, value: toolsList.length, label: "Outils IA" },
              { icon: FolderOpen, value: categoryCount, label: "Catégories" },
              { icon: Globe, value: "5+", label: "Langues" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/80 border border-slate-200/80 shadow-sm backdrop-blur-sm">
                <stat.icon className="w-5 h-5 text-violet-600" weight="bold" />
                <div className="text-left">
                  <div className="text-base font-bold text-slate-800">{stat.value}</div>
                  <div className="text-xs text-slate-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Catalog */}
        {toolsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-2xl border-dashed border-violet-200 bg-violet-50/30">
            <GearSix className="w-10 h-10 mb-4 text-violet-300" />
            <h3 className="text-lg font-semibold text-slate-800">{dict.catalog.emptyDb.title}</h3>
            <p className="text-sm text-slate-500 mt-1 mb-6">{dict.catalog.emptyDb.subtitle}</p>
            <code className="text-xs bg-slate-900 text-slate-100 px-4 py-2 rounded-lg font-mono border border-slate-700">
              npx tsx scripts/generate_tools_from_catalog.ts
            </code>
          </div>
        ) : (
          <CatalogView tools={toolsList} dict={dict} lang={lang} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 mt-12">
        <div className="container max-w-7xl mx-auto px-4 py-6 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3" />
            <span>Plateforme IA — {new Date().getFullYear()}</span>
          </div>
          <span>Vos données sont traitées de façon sécurisée</span>
        </div>
      </footer>
    </div>
  );
}
