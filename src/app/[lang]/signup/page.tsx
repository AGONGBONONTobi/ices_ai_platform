import { AuthForm } from "@/components/auth/AuthForm";
import { Locale } from "@/lib/i18n/getDictionary";
import { Diamond, Wrench, CheckCircle, Briefcase, Laptop, ChalkboardTeacher } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { fetchToolCount } from "@/lib/api/tools";

interface SignupPageProps {
  params: { lang: Locale };
}



export default async function SignupPage({ params }: SignupPageProps) {
  const { lang } = params;

  const toolCount = await fetchToolCount();

  const FEATURES = [
    `Accès à ${toolCount} outils d'analyse IA`,
    "Résultats personnalisés et téléchargeables",
    "Historique de vos diagnostics",
    "Traductions automatiques multilingues",
  ];

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #0ea5e9, transparent)" }} />
      </div>

      <div className="relative w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left: Value proposition */}
        <div className="hidden lg:block space-y-6 pr-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <Diamond className="w-5 h-5 text-white" weight="fill" />
            </div>
            <span className="font-bold text-xl text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
              Plateforme IA
            </span>
          </div>

          <div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>
              L&apos;intelligence artificielle au service de votre{" "}
              <span className="gradient-text">croissance</span>
            </h2>
            <p className="text-slate-500 text-base leading-relaxed">
              Rejoignez des milliers d&apos;entrepreneurs et consultants qui utilisent nos outils IA pour prendre de meilleures décisions.
            </p>
          </div>

          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-slate-700">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #7c3aed22, #4f46e522)", border: "1px solid #7c3aed33" }}>
                  <CheckCircle className="w-3 h-3 text-violet-600" weight="fill" />
                </div>
                {f}
              </li>
            ))}
          </ul>

          <div className="p-4 rounded-2xl border border-violet-100 bg-white/60 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex -space-x-2">
                {[Briefcase, Laptop, ChalkboardTeacher].map((AvatarIcon, i) => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-200 to-indigo-200 border-2 border-white flex items-center justify-center">
                    <AvatarIcon className="w-4 h-4 text-violet-700" weight="fill" />
                  </div>
                ))}
              </div>
              <span className="text-sm font-semibold text-slate-700">+1 200 utilisateurs actifs</span>
            </div>
            <p className="text-xs text-slate-500">&ldquo;Un outil incontournable pour mes missions de conseil.&rdquo;</p>
          </div>
        </div>

        {/* Right: Signup form */}
        <div className="w-full">
          {/* Mobile logo */}
          <div className="flex justify-center mb-8 lg:hidden">
            <Link href={`/${lang}`} className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
                <Diamond className="w-5 h-5 text-white" weight="fill" />
              </div>
              <span className="font-bold text-xl text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
                Plateforme IA
              </span>
            </Link>
          </div>

          <div className="glass-light rounded-3xl shadow-2xl shadow-violet-100/50 border border-white/60 p-8">
            <div className="text-center mb-7">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200/60 text-xs font-semibold text-violet-700 mb-4">
                <Wrench className="w-3 h-3" />
                Inscription gratuite
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
                Créez votre compte
              </h1>
              <p className="text-sm text-slate-500">
                Accédez à tous vos outils en quelques secondes
              </p>
            </div>

            <AuthForm mode="signup" lang={lang} />
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            En vous inscrivant, vous acceptez nos{" "}
            <span className="text-violet-600 cursor-pointer hover:underline">Conditions d&apos;utilisation</span>
          </p>
        </div>
      </div>
    </div>
  );
}
