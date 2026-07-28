"use client";

/**
 * Rendu du résultat selon le type de sortie de l'outil (`output_kind`).
 *
 * Le catalogue rendait auparavant un score de maturité pour tous les outils,
 * y compris ceux qui n'en produisent pas — un modèle de fiche de poste, une
 * matrice des risques ou un test de personnalité.
 *
 * Chaque vue reste défensive : le moteur valide la sortie contre le schéma de
 * l'outil, mais une fiche peut avoir été classée dans un type qui ne correspond
 * pas à la forme réellement produite. On retombe alors sur `GenericResult`
 * plutôt que d'afficher un succès vide.
 */

import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { ChartBar, Lightbulb, TrendUp, ListBullets, FileText, Table as TableIcon, Compass } from "@phosphor-icons/react/dist/ssr";
import CircularProgress from "@/components/ui/circular-progress";
import { ToolConfig } from "@/lib/schema/tool-schema";

/* ------------------------------------------------------------------ */

function scoreColor(score: number) {
  if (score >= 75) return { color: "#059669", label: "Excellent" };
  if (score >= 55) return { color: "#d97706", label: "Bon" };
  return { color: "#dc2626", label: "À améliorer" };
}

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { delay },
});

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="text-base font-bold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
        {children}
      </h3>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">{children}</div>
  );
}

/* ------------------------------------------------------------------ */
/*  assessment — le seul type qui porte un jugement de valeur          */
/* ------------------------------------------------------------------ */

function AssessmentResult({ result }: { result: any }) {
  const info = result.score_global !== undefined ? scoreColor(result.score_global) : null;

  return (
    <div className="space-y-6">
      {result.score_global !== undefined && (
        <motion.div
          {...fade(0.1)}
          className="relative overflow-hidden rounded-2xl border p-6 flex items-center justify-between"
          style={{
            borderColor: `${info?.color}30`,
            background: `linear-gradient(135deg, ${info?.color}08 0%, #4f46e508 100%)`,
          }}
        >
          <div
            className="absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-10 blur-2xl"
            style={{ background: info?.color }}
          />
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TrendUp className="w-4 h-4" style={{ color: info?.color }} weight="bold" />
              <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: "Outfit, sans-serif" }}>
                Score global
              </h3>
            </div>
            <p className="text-sm text-slate-500">Évaluation globale de votre situation</p>
            <div
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
              style={{ color: info?.color, borderColor: `${info?.color}40`, backgroundColor: `${info?.color}10` }}
            >
              {info?.label}
            </div>
          </div>
          <CircularProgress value={result.score_global} size={90} strokeWidth={9} />
        </motion.div>
      )}

      {Array.isArray(result.axes) && result.axes.length > 0 && (
        <motion.div {...fade(0.2)}>
          <SectionTitle icon={<ChartBar className="w-4 h-4 text-violet-600" weight="bold" />}>
            Analyse par axe
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {result.axes.map((axe: any, idx: number) => (
              <motion.div
                key={idx}
                {...fade(0.25 + idx * 0.06)}
                className="flex justify-between items-center p-4 rounded-xl border bg-white shadow-sm"
                style={{ borderColor: `${scoreColor(axe.score).color}20` }}
              >
                <span className="text-sm font-medium text-slate-700 pr-3 leading-snug">{axe.axe}</span>
                <CircularProgress value={axe.score} size={52} strokeWidth={5} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {Array.isArray(result.recommandations) && result.recommandations.length > 0 && (
        <motion.div {...fade(0.35)}>
          <SectionTitle icon={<Lightbulb className="w-4 h-4 text-amber-500" weight="fill" />}>
            Recommandations
          </SectionTitle>
          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 to-orange-50/30 p-5">
            <ol className="space-y-3">
              {result.recommandations.map((rec: string, idx: number) => (
                <motion.li key={idx} {...fade(0.4 + idx * 0.06)} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                  <span className="mt-0.5 shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-amber-100 text-amber-600 text-xs font-bold">
                    {idx + 1}
                  </span>
                  {rec}
                </motion.li>
              ))}
            </ol>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  profile — dimensions, jamais de jugement                           */
/* ------------------------------------------------------------------ */

function ProfileResult({ result }: { result: any }) {
  return (
    <div className="space-y-6">
      {result.synthese && (
        <motion.div {...fade(0.1)} className="p-5 rounded-2xl border border-violet-100 bg-violet-50/50">
          <SectionTitle icon={<Compass className="w-4 h-4 text-violet-600" weight="bold" />}>Synthèse</SectionTitle>
          <p className="text-sm text-slate-700 leading-relaxed">{result.synthese}</p>
        </motion.div>
      )}

      {Array.isArray(result.dimensions) && result.dimensions.length > 0 && (
        <motion.div {...fade(0.2)}>
          <SectionTitle icon={<ChartBar className="w-4 h-4 text-violet-600" weight="bold" />}>
            Vos dimensions
          </SectionTitle>
          <div className="space-y-3">
            {result.dimensions.map((d: any, idx: number) => (
              <motion.div key={idx} {...fade(0.25 + idx * 0.06)} className="p-4 rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-semibold text-slate-800">{d.dimension}</span>
                  {/* Couleur unique et neutre : une intensité n'est ni bonne ni mauvaise. */}
                  <span className="text-xs font-bold text-violet-600 tabular-nums">{d.intensite}</span>
                </div>
                <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{ width: `${Math.max(0, Math.min(100, Number(d.intensite) || 0))}%` }}
                  />
                </div>
                {d.interpretation && (
                  <p className="text-xs text-slate-600 leading-relaxed">{d.interpretation}</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {Array.isArray(result.pistes) && result.pistes.length > 0 && (
        <motion.div {...fade(0.35)}>
          <SectionTitle icon={<Lightbulb className="w-4 h-4 text-violet-500" weight="fill" />}>
            Pistes de développement
          </SectionTitle>
          <ul className="space-y-2">
            {result.pistes.map((p: string, idx: number) => (
              <li key={idx} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
                <span className="text-violet-400 mt-0.5">•</span>
                {p}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  analysis / document — sections rédigées                            */
/* ------------------------------------------------------------------ */

function SectionsResult({ result, kind }: { result: any; kind: "analysis" | "document" }) {
  const sections = Array.isArray(result.sections) ? result.sections : [];

  return (
    <div className="space-y-6">
      {kind === "document" && result.titre && (
        <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>
          {result.titre}
        </h2>
      )}

      {kind === "analysis" && result.synthese && (
        <motion.div {...fade(0.1)} className="p-5 rounded-2xl border border-violet-100 bg-violet-50/50">
          <SectionTitle icon={<FileText className="w-4 h-4 text-violet-600" weight="bold" />}>Synthèse</SectionTitle>
          <p className="text-sm text-slate-700 leading-relaxed">{result.synthese}</p>
        </motion.div>
      )}

      {sections.map((s: any, idx: number) => (
        <motion.div key={idx} {...fade(0.15 + idx * 0.05)}>
          <Card>
            <h3 className="text-sm font-bold text-slate-800 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
              {s.titre}
            </h3>
            <div className="prose prose-slate max-w-none text-sm leading-relaxed">
              <ReactMarkdown>{String(s.contenu ?? "")}</ReactMarkdown>
            </div>
          </Card>
        </motion.div>
      ))}

      {Array.isArray(result.points_cles) && result.points_cles.length > 0 && (
        <motion.div {...fade(0.4)}>
          <SectionTitle icon={<ListBullets className="w-4 h-4 text-amber-500" weight="bold" />}>
            Points clés
          </SectionTitle>
          <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5">
            <ul className="space-y-2">
              {result.points_cles.map((p: string, idx: number) => (
                <li key={idx} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  table                                                              */
/* ------------------------------------------------------------------ */

function TableResult({ result }: { result: any }) {
  const columns: string[] = Array.isArray(result.colonnes) ? result.colonnes : [];
  const rows: any[] = Array.isArray(result.lignes) ? result.lignes : [];

  return (
    <motion.div {...fade(0.1)}>
      <SectionTitle icon={<TableIcon className="w-4 h-4 text-violet-600" weight="bold" />}>Résultat</SectionTitle>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((c, i) => (
                <th key={i} className="text-left font-semibold text-slate-700 px-4 py-3 border-b border-slate-200 whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, r: number) => {
              const cells: any[] = Array.isArray(row) ? row : columns.map((c) => row?.[c] ?? "");
              return (
                <tr key={r} className={r % 2 ? "bg-slate-50/50" : ""}>
                  {cells.map((cell, c) => (
                    <td key={c} className="px-4 py-3 text-slate-700 align-top border-b border-slate-100">
                      {typeof cell === "object" ? JSON.stringify(cell) : String(cell ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Repli                                                              */
/* ------------------------------------------------------------------ */

export function GenericResult({ result }: { result: Record<string, any> }) {
  return (
    <div className="space-y-4">
      {Object.entries(result).map(([key, value]) => (
        <Card key={key}>
          <h3 className="text-sm font-bold text-slate-800 mb-2 capitalize" style={{ fontFamily: "Outfit, sans-serif" }}>
            {key.replace(/_/g, " ")}
          </h3>
          {typeof value === "string" ? (
            <div className="prose prose-slate max-w-none text-sm leading-relaxed">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          ) : Array.isArray(value) ? (
            <ul className="space-y-2 text-sm text-slate-700">
              {value.map((item, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-violet-400">•</span>
                  {typeof item === "object" ? JSON.stringify(item) : String(item)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-700">{String(value)}</p>
          )}
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Le type déclaré ne fait foi que si le résultat en a bien la forme. */
function matches(kind: string, result: any): boolean {
  switch (kind) {
    case "assessment":
      return result?.score_global !== undefined || Array.isArray(result?.axes);
    case "profile":
      return Array.isArray(result?.dimensions);
    case "analysis":
    case "document":
      return Array.isArray(result?.sections);
    case "table":
      return Array.isArray(result?.colonnes) && Array.isArray(result?.lignes);
    default:
      return false;
  }
}

export function ResultView({ tool, result }: { tool: ToolConfig; result: any }) {
  if (typeof result === "string") {
    return (
      <div className="prose prose-slate max-w-none text-sm leading-relaxed p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <ReactMarkdown>{result}</ReactMarkdown>
      </div>
    );
  }

  if (!result || typeof result !== "object") return null;

  const kind = tool.output_kind ?? "analysis";

  if (matches(kind, result)) {
    switch (kind) {
      case "assessment":
        return <AssessmentResult result={result} />;
      case "profile":
        return <ProfileResult result={result} />;
      case "table":
        return <TableResult result={result} />;
      case "analysis":
      case "document":
        return <SectionsResult result={result} kind={kind} />;
    }
  }

  // Le type ne correspond pas à ce qui a été produit : on tente les autres
  // formes connues avant de retomber sur le rendu générique.
  for (const candidate of ["assessment", "profile", "table", "analysis"] as const) {
    if (matches(candidate, result)) {
      return candidate === "assessment" ? (
        <AssessmentResult result={result} />
      ) : candidate === "profile" ? (
        <ProfileResult result={result} />
      ) : candidate === "table" ? (
        <TableResult result={result} />
      ) : (
        <SectionsResult result={result} kind="analysis" />
      );
    }
  }

  return <GenericResult result={result} />;
}
