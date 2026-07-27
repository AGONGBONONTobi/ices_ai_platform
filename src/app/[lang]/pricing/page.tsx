import { Locale } from "@/lib/i18n/getDictionary";
import { CheckCircle2, Zap } from "lucide-react";
import Link from "next/link";
import { createSupabaseServerClient, getAccessToken } from "@/lib/supabase/server";
import { fetchProfile } from "@/lib/api/account";
import { CheckoutButton } from "@/components/billing/CheckoutButton";

interface PricingPageProps {
  params: { lang: Locale };
}

export const dynamic = "force-dynamic";

export default async function PricingPage({ params }: PricingPageProps) {
  const { lang } = params;
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Le plan vient du backend ; le bouton d'abonnement est désactivé si déjà PRO.
  const profile = user ? await fetchProfile(await getAccessToken()) : null;
  const isPro = profile?.plan === "pro";

  return (
    <div className="min-h-screen mesh-bg py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-slate-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
            Passez à la vitesse supérieure 🚀
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            Débloquez la puissance totale de nos outils d&apos;analyse IA. Plus de limites, plus de résultats, plus d&apos;impact.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan Gratuit */}
          <div className="glass-light rounded-3xl p-8 border border-white/60 shadow-xl shadow-slate-200/50 flex flex-col">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Découverte</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-slate-900">0€</span>
              <span className="text-slate-500">/ mois</span>
            </div>
            <p className="text-sm text-slate-600 mb-8">Pour tester la plateforme et découvrir nos outils.</p>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                <span>3 exécutions d&apos;outils par mois</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                <span>Accès à l&apos;ensemble du catalogue</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-slate-400 shrink-0" />
                <span>Résultats standards</span>
              </li>
            </ul>

            <Link
              href={user ? `/${lang}` : `/${lang}/signup`}
              className="w-full py-3.5 px-6 rounded-xl text-center font-semibold text-sm border-2 border-slate-200 text-slate-700 hover:border-violet-300 hover:text-violet-700 transition-colors"
            >
              {user ? "Continuer gratuitement" : "Créer un compte gratuit"}
            </Link>
          </div>

          {/* Plan PRO */}
          <div className="relative glass-light rounded-3xl p-8 border-2 border-violet-400 shadow-2xl shadow-violet-200/50 flex flex-col transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-lg">
                <Zap className="w-3.5 h-3.5" /> Recommandé
              </span>
            </div>

            <h3 className="text-xl font-semibold text-violet-900 mb-2">Pro</h3>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-4xl font-bold text-slate-900">15€</span>
              <span className="text-slate-500">/ mois</span>
            </div>
            <p className="text-sm text-slate-600 mb-8">Pour les professionnels qui ont besoin de résultats constants.</p>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
                <span className="font-semibold text-violet-900">Exécutions illimitées</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
                <span>Accès en avant-première aux nouveaux outils</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <CheckCircle2 className="w-5 h-5 text-violet-600 shrink-0" />
                <span>Support prioritaire</span>
              </li>
            </ul>

            <CheckoutButton lang={lang} isPro={isPro} />
          </div>
        </div>
      </div>
    </div>
  );
}
