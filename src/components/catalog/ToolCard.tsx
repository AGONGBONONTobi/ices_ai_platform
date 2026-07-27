"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { ToolConfig } from "@/lib/schema/tool-schema";
import { Locale } from "@/lib/i18n/getDictionary";
import { Badge } from "@/components/ui/badge";
import { getCategoryStyle } from "@/lib/categoryStyles";
import { motion } from "framer-motion";

interface ToolCardProps {
  tool: Pick<ToolConfig, "id" | "title" | "category">;
  lang: Locale;
  dict: any;
  index: number;
}

export function ToolCard({ tool, lang, dict, index }: ToolCardProps) {
  const style = getCategoryStyle(tool.category);
  const CategoryIcon = style.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.04, 0.8), ease: "easeOut" }}
      className="h-full"
    >
      <Link
        href={`/${lang}/tool/${tool.id}`}
        className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 rounded-2xl"
        id={`tool-card-${tool.id}`}
      >
        <div className="relative h-full flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white/70 backdrop-blur-sm p-5 card-hover gradient-border overflow-hidden">
          {/* Subtle gradient top-left corner glow */}
          <div
            className="absolute -top-8 -left-8 w-24 h-24 rounded-full opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-2xl"
            style={{ background: `radial-gradient(circle, ${style.from}, transparent)` }}
          />

          {/* Header: Icon + Category badge */}
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 shadow-sm"
                style={{ background: `linear-gradient(135deg, ${style.from}22, ${style.to}22)` }}
              >
                <CategoryIcon className="w-5 h-5" style={{ color: style.from }} weight="bold" />
              </div>
              <Badge
                className="font-medium text-[10px] uppercase tracking-wider border-0 shrink"
                style={{
                  background: `linear-gradient(135deg, ${style.from}18, ${style.to}18)`,
                  color: style.from,
                }}
              >
                {tool.category.split("&")[0].trim()}
              </Badge>
            </div>

            {/* Title */}
            <h3 className="text-sm font-semibold leading-snug text-slate-800 group-hover:text-violet-700 transition-colors duration-200 line-clamp-3">
              {tool.title}
            </h3>
          </div>

          {/* Footer CTA */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
            <span className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200 font-medium">
              {dict.tool?.launch || "Lancer"}
            </span>
            <div
              className="flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5"
              style={{ background: `linear-gradient(135deg, ${style.from}, ${style.to})` }}
            >
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
