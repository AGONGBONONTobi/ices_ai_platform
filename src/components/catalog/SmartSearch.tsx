"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Sparkle,
  CircleNotch,
  X,
  ArrowRight,
  SealCheck,
} from "@phosphor-icons/react/dist/ssr";
import { searchTools, SmartSearchResult } from "@/lib/api/tools";
import { getCategoryStyle } from "@/lib/categoryStyles";
import { Locale } from "@/lib/i18n/getDictionary";
import { toolAvailabilityLabels } from "@/lib/i18n/toolAvailability";
import { motion, AnimatePresence } from "framer-motion";

interface SmartSearchProps {
  dict: any;
  lang: Locale;
}

export function SmartSearch({ dict, lang }: SmartSearchProps) {
  const t = dict.catalog.smartSearch;
  const availability = toolAvailabilityLabels(lang);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SmartSearchResult[] | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      setResults(await searchTools(query.trim()));
    } catch {
      setError(t.error);
    } finally {
      setIsLoading(false);
    }
  };

  const close = () => {
    setOpen(false);
    setResults(null);
    setError(null);
    setQuery("");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        id="smart-search-open"
        className="w-full flex items-center justify-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors"
      >
        <Sparkle className="w-4 h-4" weight="fill" />
        {t.cta}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50/80 to-indigo-50/50 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-violet-700">
          <Sparkle className="w-4 h-4" weight="fill" />
          {t.cta}
        </div>
        <button
          type="button"
          onClick={close}
          id="smart-search-close"
          aria-label={t.close}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          id="smart-search-input"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.placeholder}
          className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-violet-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all duration-200"
        />
        <button
          type="submit"
          id="smart-search-submit"
          disabled={isLoading || !query.trim()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60 hover:shadow-md hover:shadow-violet-300/40"
          style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
        >
          {isLoading ? <CircleNotch className="w-4 h-4 animate-spin" /> : t.button}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-sm text-violet-500 flex items-center gap-2"
          >
            <CircleNotch className="w-3.5 h-3.5 animate-spin" />
            {t.loading}
          </motion.p>
        )}

        {!isLoading && error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}

        {!isLoading && results && results.length === 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-sm text-slate-500"
          >
            {t.noResults}
          </motion.p>
        )}

        {!isLoading && results && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 space-y-2.5"
          >
            <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider">
              {t.resultsIntro}
            </p>
            {results.map((result) => {
              const style = getCategoryStyle(result.category);
              const Icon = style.icon;
              return (
                <Link
                  key={result.id}
                  href={`/${lang}/tool/${result.id}`}
                  id={`smart-search-result-${result.id}`}
                  className="group flex items-start gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 hover:border-violet-300 hover:shadow-md transition-all duration-200"
                >
                  <div
                    className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
                    style={{ background: `linear-gradient(135deg, ${style.from}22, ${style.to}22)` }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: style.from }} weight="bold" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-sm font-semibold text-slate-800 group-hover:text-violet-700 transition-colors truncate">
                        {result.title}
                      </h4>
                      {result.referentiel_code && (
                        <SealCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" weight="fill" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{result.reason}</p>
                    {result.execution && (
                      <p className="mt-1 text-xs font-medium text-violet-700">
                        {availability[result.execution.mode]}
                      </p>
                    )}
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-2.5" />
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
