import { AuthForm } from "@/components/auth/AuthForm";
import { getDictionary, Locale } from "@/lib/i18n/getDictionary";
import { Cpu, Sparkles } from "lucide-react";
import Link from "next/link";
import { fetchToolCount } from "@/lib/api/tools";

interface LoginPageProps {
  params: { lang: Locale };
  searchParams: { redirect?: string; error?: string };
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { lang } = params;
  
  const toolCount = await fetchToolCount();

  return (
    <div className="min-h-screen mesh-bg flex items-center justify-center px-4 py-12">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #7c3aed, transparent)" }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-20" style={{ background: "radial-gradient(circle, #4f46e5, transparent)" }} />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href={`/${lang}`} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-900 group-hover:text-violet-700 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
              Plateforme IA
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="glass-light rounded-3xl shadow-2xl shadow-violet-100/50 border border-white/60 p-8">
          {/* Header */}
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200/60 text-xs font-semibold text-violet-700 mb-4">
              <Sparkles className="w-3 h-3" />
              Accès à {toolCount} outils IA
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
              Bon retour ! 👋
            </h1>
            <p className="text-sm text-slate-500">
              Connectez-vous pour accéder à votre espace
            </p>
          </div>

          {/* Error from OAuth */}
          {searchParams.error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex gap-2">
              <span>⚠️</span>
              Erreur lors de la connexion. Veuillez réessayer.
            </div>
          )}

          <AuthForm
            mode="login"
            lang={lang}
            redirectTo={searchParams.redirect || `/${lang}`}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6">
          En vous connectant, vous acceptez nos{" "}
          <span className="text-violet-600 cursor-pointer hover:underline">Conditions d&apos;utilisation</span>
          {" "}et notre{" "}
          <span className="text-violet-600 cursor-pointer hover:underline">Politique de confidentialité</span>
        </p>
      </div>
    </div>
  );
}
