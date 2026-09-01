"use client";

import { useState, useMemo } from "react";
import { ToolCard } from "./ToolCard";
import { SmartSearch } from "./SmartSearch";
import { ToolConfig } from "@/lib/schema/tool-schema";
import { MagnifyingGlass, SlidersHorizontal, CaretDown, SealCheck } from "@phosphor-icons/react/dist/ssr";
import { getCategoryStyle } from "@/lib/categoryStyles";
import { motion, AnimatePresence } from "framer-motion";
import { Locale } from "@/lib/i18n/getDictionary";

interface CatalogViewProps {
  tools: Pick<ToolConfig, "id" | "title" | "category" | "referentiel_code">[];
  dict: any;
  lang: Locale;
}

// Nombre d'outils visibles par section avant de devoir cliquer sur "Voir tout"
const SECTION_PREVIEW_COUNT = 8;

// Valeur de filtre réservée (ne peut pas collisionner avec un nom de catégorie réel) :
// isole les outils adossés à un référentiel officiel (clauses réelles injectées à
// l'exécution), au lieu de les laisser mélangés à leur catégorie thématique.
const VERIFIED_FILTER = "__referentiels_verifies__";

export function CatalogView({ tools, dict, lang }: CatalogViewProps) {
  const [search, setSearch] = useState("");
  const filterAllLabel = dict.catalog.filterAll;
  const [activeCategory, setActiveCategory] = useState(filterAllLabel);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const verifiedCount = useMemo(
    () => tools.filter((t) => t.referentiel_code).length,
    [tools]
  );

  const categories = useMemo(() => {
    const cats = Array.from(new Set(tools.map((t) => t.category))).sort();
    return [
      filterAllLabel,
      ...(verifiedCount > 0 ? [VERIFIED_FILTER] : []),
      ...cats,
    ];
  }, [tools, filterAllLabel, verifiedCount]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.title.toLowerCase().includes(search.toLowerCase()) ||
        tool.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === filterAllLabel ||
        (activeCategory === VERIFIED_FILTER
          ? !!tool.referentiel_code
          : tool.category === activeCategory);
      return matchesSearch && matchesCategory;
    });
  }, [tools, search, activeCategory, filterAllLabel]);

  // Regroupées par catégorie (comme les sections "ORGANIZE PDF" / "CONVERT PDF" d'iLovePDF),
  // triées par nombre d'outils décroissant pour mettre en avant les catégories les plus riches.
  // Le filtre "Référentiels vérifiés" fait exception : ces outils viennent de
  // catégories différentes mais partagent ce qui les distingue vraiment — on les
  // regroupe donc dans une section unique plutôt que de les re-fragmenter.
  const sections = useMemo(() => {
    if (activeCategory === VERIFIED_FILTER) {
      return filteredTools.length > 0
        ? [{ category: VERIFIED_FILTER, items: filteredTools }]
        : [];
    }

    const byCategory = new Map<string, typeof filteredTools>();
    for (const tool of filteredTools) {
      const list = byCategory.get(tool.category) || [];
      list.push(tool);
      byCategory.set(tool.category, list);
    }
    return Array.from(byCategory.entries())
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [filteredTools, activeCategory]);

  const resultLabel =
    filteredTools.length > 1
      ? dict.catalog.resultCountPlural
      : dict.catalog.resultCount;

  const toggleExpanded = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Search + count row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <MagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            id="tool-search"
            placeholder={dict.catalog.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white/80 backdrop-blur-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all duration-200 shadow-sm"
          />
        </div>

        <div className="flex items-center gap-2 text-sm text-slate-500 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-violet-500" />
          <span>
            <span className="font-semibold text-violet-600">{filteredTools.length}</span>{" "}
            {resultLabel}
          </span>
        </div>
      </div>

      {/* Assistant de recherche sémantique — coûte un appel LLM, distinct du filtre instantané ci-dessus */}
      <SmartSearch dict={dict} lang={lang} />

      {/* Category filter pills — rangée défilante pour ne pas noyer les sections */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const isVerified = cat === VERIFIED_FILTER;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                id={
                  isVerified
                    ? "filter-referentiels-verifies"
                    : `filter-${cat.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`
                }
                className={`relative shrink-0 whitespace-nowrap flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                  isActive
                    ? isVerified
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200"
                      : "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200"
                    : isVerified
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-300 hover:bg-emerald-100"
                    : "bg-white/80 text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50"
                }`}
              >
                {isVerified && <SealCheck className="w-3.5 h-3.5" weight="fill" />}
                {isVerified ? `Référentiels vérifiés (${verifiedCount})` : cat}
                {isActive && (
                  <motion.span
                    layoutId="active-pill"
                    className={`absolute inset-0 rounded-full -z-10 ${isVerified ? "bg-emerald-600" : "bg-violet-600"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
        {/* Fondu indiquant qu'on peut défiler horizontalement */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-[#faf9ff] to-transparent" />
      </div>

      {/* Sections par catégorie */}
      <AnimatePresence mode="wait">
        {sections.length > 0 ? (
          <motion.div
            key="sections"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-12"
          >
            {sections.map((section) => {
              const isVerifiedSection = section.category === VERIFIED_FILTER;
              const style = isVerifiedSection
                ? { from: "#059669", to: "#34d399", icon: SealCheck }
                : getCategoryStyle(section.category);
              const SectionIcon = style.icon;
              const isExpanded = expandedCategories.has(section.category);
              const visibleItems = isExpanded
                ? section.items
                : section.items.slice(0, SECTION_PREVIEW_COUNT);
              const hasMore = section.items.length > SECTION_PREVIEW_COUNT;

              return (
                <div key={section.category}>
                  {/* En-tête de section */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
                      style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
                    >
                      <SectionIcon className="w-4.5 h-4.5 text-white" weight="fill" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-slate-800 tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                        {isVerifiedSection ? "Outils adossés à un référentiel officiel" : section.category}
                      </h2>
                      {isVerifiedSection && (
                        <p className="text-xs text-slate-500">
                          Clauses réelles (ISO, RGPD…) injectées à l&apos;exécution — pas une analyse générique.
                        </p>
                      )}
                    </div>
                    <span className="text-xs font-medium text-slate-400">
                      {section.items.length}
                    </span>
                    <div className="flex-1 h-px bg-slate-200/80" />
                  </div>

                  {/* Grille d'outils de la section */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {visibleItems.map((tool, index) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        lang={lang}
                        dict={dict}
                        index={index}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <button
                      onClick={() => toggleExpanded(section.category)}
                      className="mt-4 flex items-center gap-1.5 text-sm font-medium text-violet-600 hover:text-violet-800 transition-colors"
                    >
                      {isExpanded
                        ? "Réduire"
                        : `Voir les ${section.items.length} outils`}
                      <CaretDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/30"
          >
            <MagnifyingGlass className="w-10 h-10 mb-4 text-violet-300" />
            <p className="font-semibold text-slate-700 text-lg">{dict.catalog.empty.title}</p>
            <p className="text-sm mt-2 text-slate-500 max-w-xs">{dict.catalog.empty.subtitle}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
