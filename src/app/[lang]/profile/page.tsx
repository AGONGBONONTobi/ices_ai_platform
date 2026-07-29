import Link from "next/link";
import { ArrowLeft, ArrowRight, Diamond, Star, Wrench } from "@phosphor-icons/react/dist/ssr";
import { getDictionary, Locale } from "@/lib/i18n/getDictionary";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ManageSubscriptionButton } from "@/components/billing/ManageSubscriptionButton";
import { CheckoutButton } from "@/components/billing/CheckoutButton";
import { createSupabaseServerClient, getAccessToken } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/api/account";
import { FREE_TIER_LIMIT } from "@/lib/quota";

interface ProfilePageProps {
  params: { lang: Locale };
}

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { lang } = params;
  const dict = await getDictionary(lang);

  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const profile = user ? await fetchProfile(await getAccessToken()) : null;

  const isPro = profile?.plan === "pro";
  const displayName = profile?.full_name || profile?.email || "Utilisateur";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const usedCount = profile?.tools_used_count ?? 0;
  const usagePct = Math.min(100, (usedCount / FREE_TIER_LIMIT) * 100);

  return (
    <div className="min-h-screen mesh-bg text-foreground">
      {/* Nav Glassmorphism */}
      <nav className="sticky top-0 z-50 border-b border-white/60 glass-light">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/${lang}`}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-700 transition-colors font-medium"
              id="back-to-catalog"
            >
              <ArrowLeft className="w-4 h-4" />
              {dict.nav.back}
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                <Diamond className="w-3.5 h-3.5 text-white" weight="fill" />
              </div>
              <span className="font-bold text-sm text-slate-900">{dict.nav.brand}</span>
            </div>
          </div>
          <LanguageSwitcher currentLang={lang} />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6">
        {/* En-tête profil */}
        <div className="glass-light rounded-3xl shadow-xl shadow-violet-100/50 border border-white/60 p-8 flex items-center gap-5">
          <div
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0"
            style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
          >
            {initials}
            {isPro && (
              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                <Star className="w-2.5 h-2.5 text-white" weight="fill" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-slate-900 truncate" style={{ fontFamily: "Outfit, sans-serif" }}>
              {profile?.full_name || "Utilisateur"}
            </h1>
            <p className="text-sm text-slate-500 truncate">{profile?.email}</p>
            <span
              className={`inline-flex mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isPro ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
              }`}
            >
              {isPro ? "Pro" : "Free"}
            </span>
          </div>
        </div>

        {/* Utilisation */}
        <div className="glass-light rounded-3xl shadow-xl shadow-violet-100/50 border border-white/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-4 h-4 text-violet-600" weight="bold" />
            <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
              Utilisation
            </h2>
          </div>

          {isPro ? (
            <p className="text-sm text-slate-600">
              Exécutions illimitées grâce à votre abonnement PRO.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${usagePct}%`,
                    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  }}
                />
              </div>
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{usedCount} / {FREE_TIER_LIMIT}</span>{" "}
                analyses gratuites utilisées
              </p>
            </div>
          )}
        </div>

        {/* Abonnement */}
        <div className="glass-light rounded-3xl shadow-xl shadow-violet-100/50 border border-white/60 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-violet-600" weight="fill" />
            <h2 className="text-base font-bold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
              Abonnement
            </h2>
          </div>

          {isPro ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Vous êtes abonné à l&apos;offre PRO — accès illimité à tous les outils.
              </p>
              <ManageSubscriptionButton lang={lang} />
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Passez à la version PRO pour des exécutions illimitées et un accès en avant-première aux nouveaux outils.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <CheckoutButton lang={lang} />
              </div>
              <Link
                href={`/${lang}/pricing`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-600 hover:text-violet-800 transition-colors"
              >
                Voir le détail des offres
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>

        {/* Déconnexion */}
        <div className="flex justify-center pt-2">
          <SignOutButton lang={lang} />
        </div>
      </main>
    </div>
  );
}
