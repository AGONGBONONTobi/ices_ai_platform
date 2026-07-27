"use client";

import { useState, useMemo } from "react";
import { ToolCard } from "./ToolCard";
import { ToolConfig } from "@/lib/schema/tool-schema";
import { Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Locale } from "@/lib/i18n/getDictionary";

interface CatalogViewProps {
  tools: Pick<ToolConfig, "id" | "title" | "category">[];
  dict: any;
  lang: Locale;
}

export function CatalogView({ tools, dict, lang }: CatalogViewProps) {
  const [search, setSearch] = useState("");
  const filterAllLabel = dict.catalog.filterAll;
  const [activeCategory, setActiveCategory] = useState(filterAllLabel);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(tools.map((t) => t.category))).sort();
    return [filterAllLabel, ...cats];
  }, [tools, filterAllLabel]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchesSearch =
        tool.title.toLowerCase().includes(search.toLowerCase()) ||
        tool.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === filterAllLabel || tool.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [tools, search, activeCategory, filterAllLabel]);

  const resultLabel =
    filteredTools.length > 1
      ? dict.catalog.resultCountPlural
      : dict.catalog.resultCount;

  return (
    <div className="space-y-8">
      {/* Search + count row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
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

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              id={`filter-${cat.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
              className={`relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                isActive
                  ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200"
                  : "bg-white/80 text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-700 hover:bg-violet-50"
              }`}
            >
              {cat}
              {isActive && (
                <motion.span
                  layoutId="active-pill"
                  className="absolute inset-0 rounded-full bg-violet-600 -z-10"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tool Grid */}
      <AnimatePresence mode="wait">
        {filteredTools.length > 0 ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredTools.map((tool, index) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                lang={lang}
                dict={dict}
                index={index}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-dashed border-violet-200 bg-violet-50/30"
          >
            <div className="text-5xl mb-4">🔍</div>
            <p className="font-semibold text-slate-700 text-lg">{dict.catalog.empty.title}</p>
            <p className="text-sm mt-2 text-slate-500 max-w-xs">{dict.catalog.empty.subtitle}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
