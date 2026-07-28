"use client";

import { useState } from "react";
import { ToolConfig } from "@/lib/schema/tool-schema";
import { DynamicToolForm } from "@/components/engine/DynamicToolForm";
import { PdfDownloadButton } from "@/components/engine/PdfDownloadButton";
import { ResultView } from "@/components/engine/ResultView";
import { CheckCircle, ArrowClockwise, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Locale } from "@/lib/i18n/getDictionary";
import { executeTool } from "@/lib/api/tools";
import { ApiError } from "@/lib/api/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface ToolExecutorProps {
  tool: ToolConfig;
  dict: any;
  lang: Locale;
}

// Skeleton loader for the results section
function ResultSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Score skeleton */}
      <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded-lg bg-violet-200/60" />
          <div className="h-4 w-48 rounded-lg bg-violet-100" />
        </div>
        <div className="w-20 h-20 rounded-full bg-violet-200/60" />
      </div>
      {/* Axes skeleton */}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-slate-100" />
        ))}
      </div>
      {/* Reco skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-10 rounded-xl bg-slate-100" />
        ))}
      </div>
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

  // Show skeleton while loading
  if (isGenerating) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-violet-50 border border-violet-200 text-violet-700 font-medium text-sm">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>L&apos;IA analyse votre situation...</span>
            <span className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
          </div>
        </div>
        <ResultSkeleton />
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
          Vous avez utilisé vos 3 analyses gratuites. Passez à la version PRO pour un accès illimité à tous nos outils.
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
