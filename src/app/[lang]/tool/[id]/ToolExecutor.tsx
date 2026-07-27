"use client";

import { useState } from "react";
import { ToolConfig } from "@/lib/schema/tool-schema";
import { DynamicToolForm } from "@/components/engine/DynamicToolForm";
import { PdfDownloadButton } from "@/components/engine/PdfDownloadButton";
import { CheckCircle, ArrowClockwise, TrendUp, Lightbulb, ChartBar, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Locale } from "@/lib/i18n/getDictionary";
import { executeTool } from "@/lib/api/tools";
import { ApiError } from "@/lib/api/client";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import CircularProgress from "@/components/ui/circular-progress";
import { motion, AnimatePresence } from "framer-motion";

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

function getScoreColor(score: number) {
  if (score >= 75) return { color: "#059669", label: "Excellent" };
  if (score >= 55) return { color: "#d97706", label: "Bon" };
  return { color: "#dc2626", label: "À améliorer" };
}

export default function ToolExecutor({ tool, dict, lang }: ToolExecutorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (userInputs: Record<string, any>) => {
    setIsGenerating(true);
    setError(null);

    try {
      // Le backend FastAPI authentifie via le jeton Supabase du navigateur
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = `/${lang}/login?redirect=/${lang}/tool/${tool.id}`;
        return;
      }

      const aiResult = await executeTool(
        { toolConfig: tool, userInputs, lang },
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
    const pdfText = typeof result === "string"
      ? result
      : `# Score Global: ${result.score_global || 0} / 100\n\n## Axes d'analyse\n${(result.axes || []).map((a: any) => `- **${a.axe}**: ${a.score}/100`).join("\n")}\n\n## Recommandations\n${(result.recommandations || []).map((r: string) => `- ${r}`).join("\n")}`;

    const scoreInfo = typeof result !== "string" && result.score_global !== undefined
      ? getScoreColor(result.score_global)
      : null;

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

        {typeof result === "string" ? (
          <div className="prose prose-slate max-w-none text-sm leading-relaxed p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Global Score */}
            {result.score_global !== undefined && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="relative overflow-hidden rounded-2xl border p-6 flex items-center justify-between"
                style={{ borderColor: `${scoreInfo?.color}30`, background: `linear-gradient(135deg, ${scoreInfo?.color}08 0%, #4f46e508 100%)` }}
              >
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 blur-2xl" style={{ background: scoreInfo?.color }} />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <TrendUp className="w-4 h-4" style={{ color: scoreInfo?.color }} weight="bold" />
                    <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Score Global</h3>
                  </div>
                  <p className="text-sm text-slate-500">Évaluation globale de votre situation</p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border" style={{ color: scoreInfo?.color, borderColor: `${scoreInfo?.color}40`, backgroundColor: `${scoreInfo?.color}10` }}>
                    {scoreInfo?.label}
                  </div>
                </div>
                <CircularProgress value={result.score_global} size={90} strokeWidth={9} />
              </motion.div>
            )}

            {/* Axes */}
            {result.axes && Array.isArray(result.axes) && result.axes.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="flex items-center gap-2 mb-4">
                  <ChartBar className="w-4 h-4 text-violet-600" weight="bold" />
                  <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Analyse par axe</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.axes.map((axe: any, idx: number) => {
                    const axeInfo = getScoreColor(axe.score);
                    return (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.25 + idx * 0.06 }}
                        className="flex justify-between items-center p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
                        style={{ borderColor: `${axeInfo.color}20` }}
                      >
                        <span className="text-sm font-medium text-slate-700 pr-3 leading-snug">{axe.axe}</span>
                        <CircularProgress value={axe.score} size={52} strokeWidth={5} />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Recommandations */}
            {result.recommandations && Array.isArray(result.recommandations) && result.recommandations.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-4 h-4 text-amber-500" weight="fill" />
                  <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>Recommandations stratégiques</h3>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-orange-50/30 p-5">
                  <ul className="space-y-3">
                    {result.recommandations.map((rec: string, idx: number) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + idx * 0.07 }}
                        className="flex gap-3 text-sm text-slate-700 leading-relaxed"
                      >
                        <span className="mt-0.5 flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs font-bold">
                          {idx + 1}
                        </span>
                        {rec}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
          <PdfDownloadButton toolTitle={tool.title} category={tool.category} resultText={pdfText} />
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
