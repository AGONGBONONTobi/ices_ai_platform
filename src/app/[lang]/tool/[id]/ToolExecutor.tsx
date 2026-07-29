"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ToolConfig } from "@/lib/schema/tool-schema";
import { DynamicToolForm } from "@/components/engine/DynamicToolForm";
import { ResultView } from "@/components/engine/ResultView";
import { CheckCircle, ArrowClockwise, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Locale } from "@/lib/i18n/getDictionary";
import { executeTool } from "@/lib/api/tools";
import { ApiError } from "@/lib/api/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { FREE_TIER_LIMIT } from "@/lib/quota";
import { motion } from "framer-motion";

/**
 * `@react-pdf/renderer` n'est pas compatible avec le rendu serveur : son seul
 * import dans l'arbre de la page la faisait échouer en 500 — « Element type is
 * invalid » — et donc aucun outil ne s'ouvrait. On la charge uniquement dans le
 * navigateur.
 */
const PdfDownloadButton = dynamic(
  () => import("@/components/engine/PdfDownloadButton").then((m) => m.PdfDownloadButton),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-11 rounded-xl bg-slate-100 animate-pulse" />
    ),
  }
);


interface ToolExecutorProps {
  tool: ToolConfig;
  dict: any;
  lang: Locale;
}

/**
 * Silhouette du résultat pendant la génération. Elle suit le type de sortie de
 * l'outil : afficher un score en attente sur un modèle de document ou un test de
 * personnalité annoncerait un résultat qui ne viendra pas.
 */
function ResultSkeleton({ kind }: { kind?: string }) {
  const bars = (n: number, widths: string[]) => (
    <div className="space-y-3">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-10 rounded-xl bg-slate-100" style={{ width: widths[i % widths.length] }} />
      ))}
    </div>
  );

  if (kind === "table") {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-10 rounded-t-xl bg-violet-200/60" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 rounded bg-slate-100" />
        ))}
      </div>
    );
  }

  if (kind === "document" || kind === "analysis") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-1/2 rounded-lg bg-slate-200" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-1/3 rounded bg-violet-200/50" />
            {bars(3, ["100%", "95%", "70%"])}
          </div>
        ))}
      </div>
    );
  }

  if (kind === "profile") {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 rounded-2xl bg-violet-50 border border-violet-100" />
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-1/3 rounded bg-slate-200" />
              <div className="h-1.5 rounded-full bg-violet-100" style={{ width: `${80 - i * 12}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // assessment : score global, axes, recommandations
  return (
    <div className="space-y-6 animate-pulse">
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded-lg bg-violet-200/60" />
          <div className="h-4 w-48 rounded-lg bg-violet-100" />
        </div>
        <div className="w-20 h-20 rounded-full bg-violet-200/60" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100" />
        ))}
      </div>
      {bars(3, ["100%", "92%", "80%"])}
    </div>
  );
}

/**
 * Bandeau d'attente. Les diagnostics adossés à un référentiel passent par un
 * modèle plus capable et peuvent demander une trentaine de secondes : sans
 * compteur ni explication, l'utilisateur croit que rien ne se passe.
 */
function GeneratingBanner({ hasReferentiel }: { hasReferentiel: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const message = hasReferentiel
    ? "Analyse de vos réponses au regard du référentiel…"
    : "L'IA analyse votre situation…";

  return (
    <div className="text-center py-8 space-y-3">
      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-violet-50 border border-violet-200 text-violet-700 font-medium text-sm">
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span>{message}</span>
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </span>
      </div>
      <p className="text-xs text-slate-400 tabular-nums">
        {seconds}s
        {seconds >= 12 && " — les diagnostics normatifs demandent parfois une trentaine de secondes"}
      </p>
    </div>
  );
}




export default function ToolExecutor({ tool, dict, lang }: ToolExecutorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [answers, setAnswers] = useState<{ label: string; value: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (userInputs: Record<string, any>) => {
    setIsGenerating(true);
    setError(null);

    // Le rapport PDF rappelle les éléments déclarés : sans eux, le score ne se
    // rattache à rien de vérifiable.
    setAnswers(
      tool.inputs.map((input) => ({
        label: input.question || input.label || input.name,
        value:
          userInputs[input.name] === undefined || userInputs[input.name] === ""
            ? ""
            : String(userInputs[input.name]),
      }))
    );

    try {
      // Le backend FastAPI authentifie via le jeton Supabase du navigateur
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = `/${lang}/login?redirect=/${lang}/tool/${tool.id}`;
        return;
      }

      const aiResult = await executeTool(
        { toolId: tool.id, userInputs, lang },
        session.access_token
      );
      setResult(aiResult);
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "QUOTA_EXCEEDED") {
        setError("QUOTA_EXCEEDED");
      } else {
        setError(err?.message || dict.tool.error);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <div className="space-y-6">
        <GeneratingBanner hasReferentiel={Boolean(tool.referentiel_code)} />
        <ResultSkeleton kind={tool.output_kind} />
      </div>
    );
  }

  // Results View
  if (error === "QUOTA_EXCEEDED") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-8 px-4 rounded-3xl border-2 border-violet-100 bg-white shadow-xl shadow-violet-100/50">
        <div className="w-16 h-16 mx-auto bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
          Limite gratuite atteinte
        </h3>
        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
          Vous avez utilisé vos {FREE_TIER_LIMIT} analyses gratuites. Passez à la version PRO pour un accès illimité à tous nos outils.
        </p>
        <Button onClick={() => window.location.href = `/${lang}/pricing`} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl px-8 shadow-lg shadow-violet-200">
          Découvrir les offres
        </Button>
      </motion.div>
    );
  }

  if (result) {
    return (
      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Success header */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" weight="fill" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">{dict.tool.result}</p>
            <p className="text-xs text-emerald-600">Analyse générée par IA — {new Date().toLocaleTimeString()}</p>
          </div>
        </div>

        <ResultView tool={tool} result={result} />

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
          <PdfDownloadButton
            toolTitle={tool.title}
            category={tool.category}
            result={result}
            answers={answers}
            outputKind={tool.output_kind}
            lang={lang}
          />
          <Button
            variant="outline"
            onClick={() => setResult(null)}
            className="gap-2 rounded-xl border-slate-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50 transition-all"
          >
            <ArrowClockwise className="w-4 h-4" />
            {dict.tool.restart}
          </Button>
        </div>
      </motion.div>
    );
  }

  // Form View
  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex gap-2">
          <WarningCircle className="w-4 h-4 shrink-0 mt-0.5" weight="fill" />
          {error}
        </div>
      )}
      <DynamicToolForm tool={tool} onSubmit={handleSubmit} isLoading={isGenerating} />
    </div>
  );
}
