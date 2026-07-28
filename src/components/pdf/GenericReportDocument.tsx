import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Svg,
  Polygon,
  Line,
  Circle,
} from "@react-pdf/renderer";

/* -------------------------------------------------------------------------- */
/*  Palette — alignée sur l'interface (violet/indigo + slate)                  */
/* -------------------------------------------------------------------------- */

const BRAND = "#6d28d9";
const BRAND_LIGHT = "#8b5cf6";
const INK = "#0f172a";
const BODY = "#334155";
const MUTED = "#64748b";
const HAIRLINE = "#e2e8f0";
const SURFACE = "#f8fafc";

const GOOD = "#059669";
const FAIR = "#d97706";
const POOR = "#dc2626";

function scoreColor(score: number): string {
  if (score >= 75) return GOOD;
  if (score >= 55) return FAIR;
  return POOR;
}

/* -------------------------------------------------------------------------- */
/*  Libellés — le rapport suit la langue de la génération                      */
/* -------------------------------------------------------------------------- */

type Labels = {
  brand: string;
  confidential: string;
  reportKind: string;
  category: string;
  globalScore: string;
  outOf: string;
  byAxis: string;
  recommendations: string;
  yourAnswers: string;
  notProvided: string;
  generatedOn: string;
  page: string;
  of: string;
  disclaimer: string;
  levels: { high: string; mid: string; low: string };
  readings: { high: string; mid: string; low: string };
};

const LABELS: Record<string, Labels> = {
  fr: {
    brand: "Plateforme IA",
    confidential: "Confidentiel",
    reportKind: "Rapport d'auto-évaluation",
    category: "Catégorie",
    globalScore: "Score global",
    outOf: "sur 100",
    byAxis: "Analyse par axe",
    recommendations: "Plan d'actions recommandé",
    yourAnswers: "Éléments déclarés",
    notProvided: "(non renseigné)",
    generatedOn: "Généré le",
    page: "Page",
    of: "sur",
    disclaimer:
      "Rapport d'auto-évaluation généré automatiquement à partir des éléments déclarés ci-dessus. Il ne constitue ni un audit certifié ni un avis de conformité.",
    levels: { high: "Niveau avancé", mid: "Niveau intermédiaire", low: "Niveau à consolider" },
    readings: {
      high: "Les pratiques déclarées sont structurées et suivies. L'enjeu porte désormais sur l'optimisation et le maintien dans la durée.",
      mid: "Les fondamentaux sont en place mais leur application reste inégale. Les axes les plus bas ci-dessous sont les leviers prioritaires.",
      low: "Plusieurs pratiques essentielles sont absentes ou informelles. Le plan d'actions ci-dessous vise d'abord à les formaliser.",
    },
  },
  en: {
    brand: "Plateforme IA",
    confidential: "Confidential",
    reportKind: "Self-assessment report",
    category: "Category",
    globalScore: "Overall score",
    outOf: "out of 100",
    byAxis: "Analysis by axis",
    recommendations: "Recommended action plan",
    yourAnswers: "Declared information",
    notProvided: "(not provided)",
    generatedOn: "Generated on",
    page: "Page",
    of: "of",
    disclaimer:
      "Report automatically generated from the information declared above. It is neither a certified audit nor a statement of conformity.",
    levels: { high: "Advanced", mid: "Intermediate", low: "Needs strengthening" },
    readings: {
      high: "Declared practices are structured and monitored. The focus now shifts to optimisation and long-term consistency.",
      mid: "Fundamentals are in place but applied inconsistently. The lowest-scoring axes below are the priority levers.",
      low: "Several essential practices are missing or informal. The action plan below aims first at formalising them.",
    },
  },
};

function levelFor(score: number, t: Labels): { name: string; reading: string; color: string } {
  if (score >= 75) return { name: t.levels.high, reading: t.readings.high, color: GOOD };
  if (score >= 55) return { name: t.levels.mid, reading: t.readings.mid, color: FAIR };
  return { name: t.levels.low, reading: t.readings.low, color: POOR };
}

const LOCALE_TAG: Record<string, string> = {
  fr: "fr-FR",
  en: "en-GB",
  es: "es-ES",
  de: "de-DE",
  pt: "pt-BR",
};

function labelsFor(lang: string): Labels {
  return LABELS[lang] ?? LABELS.fr;
}

/* -------------------------------------------------------------------------- */
/*  Normalisation du résultat                                                  */
/* -------------------------------------------------------------------------- */

export interface ReportAxis {
  axe: string;
  score: number;
}

export interface ReportSection {
  heading: string;
  lines: string[];
}

interface NormalizedResult {
  scoreGlobal: number | null;
  axes: ReportAxis[];
  recommendations: string[];
  /** Outils non-diagnostic : chaque clé du résultat devient une section. */
  sections: ReportSection[];
  /** Contenu non reconnu : rendu en texte, pour ne jamais produire un PDF vide. */
  fallbackText: string | null;
}

const TITLE_CASE = (key: string) =>
  key.replace(/_/g, " ").replace(/^[a-zà-ÿ]/, (c) => c.toUpperCase());

function toLines(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        item && typeof item === "object"
          ? Object.entries(item as Record<string, unknown>)
              .map(([k, v]) => `${TITLE_CASE(k)} : ${String(v)}`)
              .join(" — ")
          : String(item)
      )
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).map(
      ([k, v]) => `${TITLE_CASE(k)} : ${String(v)}`
    );
  }
  const text = String(value ?? "").trim();
  return text ? [text] : [];
}

function clampScore(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Le moteur valide déjà la sortie contre l'`outputSchema` de l'outil, mais tous
 * les outils ne partagent pas le même schéma : on accepte donc ce qu'on sait
 * rendre et on retombe sur du texte pour le reste.
 */
export function normalizeResult(result: unknown): NormalizedResult {
  if (typeof result === "string") {
    return { scoreGlobal: null, axes: [], recommendations: [], sections: [], fallbackText: result };
  }

  if (!result || typeof result !== "object") {
    return { scoreGlobal: null, axes: [], recommendations: [], sections: [], fallbackText: null };
  }

  const record = result as Record<string, unknown>;

  const axes: ReportAxis[] = Array.isArray(record.axes)
    ? record.axes
        .map((entry) => {
          if (!entry || typeof entry !== "object") return null;
          const item = entry as Record<string, unknown>;
          const score = clampScore(item.score);
          const axe = item.axe ?? item.name ?? item.label;
          if (score === null || typeof axe !== "string") return null;
          return { axe, score };
        })
        .filter((a): a is ReportAxis => a !== null)
    : [];

  const recommendations: string[] = Array.isArray(record.recommandations ?? record.recommendations)
    ? ((record.recommandations ?? record.recommendations) as unknown[])
        .map((r) => (typeof r === "string" ? r : typeof r === "object" && r ? String((r as any).texte ?? (r as any).text ?? "") : String(r)))
        .map((r) => r.trim())
        .filter(Boolean)
    : [];

  const scoreGlobal = clampScore(record.score_global ?? record.scoreGlobal);

  const isDiagnostic = scoreGlobal !== null || axes.length > 0 || recommendations.length > 0;

  // Outils non-diagnostic (templates, reporting, analyses) : chaque clé du
  // résultat devient une section titrée, plutôt qu'un JSON brut.
  const sections: ReportSection[] = isDiagnostic
    ? []
    : Object.entries(record)
        .map(([key, value]) => ({ heading: TITLE_CASE(key), lines: toLines(value) }))
        .filter((s) => s.lines.length > 0);

  const fallbackText =
    isDiagnostic || sections.length > 0
      ? null
      : typeof record.result === "string"
        ? record.result
        : JSON.stringify(result, null, 2);

  return { scoreGlobal, axes, recommendations, sections, fallbackText };
}

/* -------------------------------------------------------------------------- */
/*  Styles                                                                     */
/* -------------------------------------------------------------------------- */

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 58,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
    color: BODY,
    fontSize: 10,
  },

  /* Bandeau de marque, pleine largeur */
  band: {
    backgroundColor: BRAND,
    paddingVertical: 12,
    paddingHorizontal: 42,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 26,
  },
  bandBrand: { color: "#ffffff", fontSize: 11, fontFamily: "Helvetica-Bold", letterSpacing: 0.4 },
  bandNote: {
    color: "#ddd6fe",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1.1,
  },

  body: { paddingHorizontal: 42 },

  chip: {
    alignSelf: "flex-start",
    backgroundColor: "#f5f3ff",
    color: BRAND,
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 9,
    marginBottom: 9,
  },
  title: { fontSize: 21, fontFamily: "Helvetica-Bold", color: INK, lineHeight: 1.2 },
  meta: { fontSize: 8.5, color: MUTED, marginTop: 6, marginBottom: 20 },

  rule: { height: 2, backgroundColor: INK, marginBottom: 20 },

  /* Bloc score global */
  scoreCard: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: HAIRLINE,
    borderLeftWidth: 4,
    borderRadius: 6,
    backgroundColor: SURFACE,
    padding: 16,
    marginBottom: 24,
  },
  scoreValue: { fontSize: 42, fontFamily: "Helvetica-Bold", lineHeight: 1 },
  scoreUnit: { fontSize: 8, color: MUTED, marginTop: 4 },
  scoreLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: MUTED,
    letterSpacing: 0.9,
    marginBottom: 5,
  },
  levelName: { fontSize: 13, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  reading: { fontSize: 8.5, lineHeight: 1.5, color: BODY, marginTop: 9 },
  track: { height: 7, backgroundColor: "#e5e7eb", borderRadius: 3.5 },
  trackFill: { height: 7, borderRadius: 3.5 },

  /* Éléments déclarés */
  answerRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: HAIRLINE,
    paddingVertical: 6,
  },
  answerLabel: { width: "52%", fontSize: 8.5, color: MUTED, paddingRight: 12, lineHeight: 1.4 },
  answerValue: { flex: 1, fontSize: 8.5, color: INK, lineHeight: 1.4 },

  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: INK,
    marginBottom: 12,
  },
  section: { marginBottom: 22 },

  /* Axes */
  axisRow: { marginBottom: 11 },
  axisHead: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  axisName: { fontSize: 9.5, color: BODY, flex: 1, paddingRight: 10 },
  axisScore: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  axisTrack: { height: 6, backgroundColor: "#eef2f7", borderRadius: 3 },
  axisFill: { height: 6, borderRadius: 3 },

  /* Radar */
  radarWrap: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  legend: { flex: 1, paddingLeft: 20 },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  legendIndex: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: BRAND,
    color: "#ffffff",
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 3.5,
    marginRight: 7,
  },
  legendText: { fontSize: 8.5, color: BODY, flex: 1 },
  legendScore: { fontSize: 8.5, fontFamily: "Helvetica-Bold", marginLeft: 6 },

  /* Recommandations */
  recoRow: { flexDirection: "row", marginBottom: 9 },
  recoIndex: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: "#f5f3ff",
    color: BRAND,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    paddingTop: 3.6,
    marginRight: 9,
  },
  recoText: { fontSize: 9.5, lineHeight: 1.5, color: BODY, flex: 1 },

  bulletRow: { flexDirection: "row", marginBottom: 6 },
  bulletDot: { width: 12, fontSize: 9.5, color: BRAND, paddingLeft: 2 },

  mono: { fontSize: 8.5, lineHeight: 1.45, color: BODY },

  /* Pied de page */
  footer: {
    position: "absolute",
    bottom: 26,
    left: 42,
    right: 42,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
    paddingTop: 8,
  },
  footerText: { fontSize: 7, color: MUTED, textAlign: "center" },
  footerNote: { fontSize: 6.5, color: "#94a3b8", textAlign: "center", marginTop: 3 },
});

/* -------------------------------------------------------------------------- */
/*  Radar de maturité                                                          */
/* -------------------------------------------------------------------------- */

const RADAR_SIZE = 168;

function radarPoint(cx: number, cy: number, radius: number, index: number, count: number) {
  const angle = (-90 + (360 / count) * index) * (Math.PI / 180);
  return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
}

function polygonPoints(cx: number, cy: number, radii: number[], count: number) {
  return radii
    .map((r, i) => {
      const p = radarPoint(cx, cy, r, i, count);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");
}

/** Radar SVG. Les axes ne sont pas légendés dans le graphique (react-pdf ne
 *  place pas de texte SVG de façon fiable) : la légende numérotée est à droite. */
function RadarChart({ axes }: { axes: ReportAxis[] }) {
  const n = axes.length;
  const cx = RADAR_SIZE / 2;
  const cy = RADAR_SIZE / 2;
  const max = RADAR_SIZE / 2 - 16;

  const grids = [0.25, 0.5, 0.75, 1];

  return (
    <Svg width={RADAR_SIZE} height={RADAR_SIZE}>
      {/* Toile de fond : anneaux concentriques */}
      {grids.map((g, i) => (
        <Polygon
          key={`g${i}`}
          points={polygonPoints(cx, cy, Array(n).fill(max * g), n)}
          fill={i === grids.length - 1 ? "#fbfaff" : "none"}
          stroke={HAIRLINE}
          strokeWidth={0.7}
        />
      ))}

      {/* Rayons */}
      {axes.map((_, i) => {
        const p = radarPoint(cx, cy, max, i, n);
        return (
          <Line key={`a${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={HAIRLINE} strokeWidth={0.7} />
        );
      })}

      {/* Aire des scores */}
      <Polygon
        points={polygonPoints(cx, cy, axes.map((a) => (max * a.score) / 100), n)}
        fill={BRAND_LIGHT}
        fillOpacity={0.22}
        stroke={BRAND}
        strokeWidth={1.4}
      />

      {/* Sommets */}
      {axes.map((a, i) => {
        const p = radarPoint(cx, cy, (max * a.score) / 100, i, n);
        return <Circle key={`p${i}`} cx={p.x} cy={p.y} r={2.6} fill={BRAND} />;
      })}
    </Svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Document                                                                   */
/* -------------------------------------------------------------------------- */

export interface ReportAnswer {
  label: string;
  value: string;
}

export interface GenericReportProps {
  toolTitle: string;
  category: string;
  /** Résultat structuré renvoyé par le moteur (ou texte brut). */
  result: unknown;
  /** Réponses saisies : sans elles, le score n'est rattaché à rien. */
  answers?: ReportAnswer[];
  lang?: string;
}

export const GenericReportDocument = ({
  toolTitle,
  category,
  result,
  answers = [],
  lang = "fr",
}: GenericReportProps) => {
  const t = labelsFor(lang);
  const { scoreGlobal, axes, recommendations, sections, fallbackText } = normalizeResult(result);

  const generatedOn = new Date().toLocaleDateString(LOCALE_TAG[lang] ?? "fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const showRadar = axes.length >= 3 && axes.length <= 8;

  return (
    <Document
      title={`${t.brand} — ${toolTitle}`}
      author={t.brand}
      subject={category}
      creator={t.brand}
    >
      <Page size="A4" style={styles.page}>
        {/* Bandeau répété sur chaque page */}
        <View style={styles.band} fixed>
          <Text style={styles.bandBrand}>{t.brand}</Text>
          <Text style={styles.bandNote}>{t.confidential.toUpperCase()}</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.chip}>{category.toUpperCase()}</Text>
          <Text style={styles.title}>{toolTitle}</Text>
          <Text style={styles.meta}>
            {t.generatedOn} {generatedOn}
          </Text>
          <View style={styles.rule} />

          {/* --- Score global + lecture --- */}
          {scoreGlobal !== null && (
            <View
              style={[styles.scoreCard, { borderLeftColor: levelFor(scoreGlobal, t).color }]}
              wrap={false}
            >
              <View style={{ width: 92, alignItems: "center", paddingTop: 2 }}>
                <Text style={[styles.scoreValue, { color: levelFor(scoreGlobal, t).color }]}>
                  {scoreGlobal}
                </Text>
                <Text style={styles.scoreUnit}>{t.outOf}</Text>
              </View>
              <View style={{ flex: 1, paddingLeft: 16 }}>
                <Text style={styles.scoreLabel}>{t.globalScore.toUpperCase()}</Text>
                <Text style={[styles.levelName, { color: levelFor(scoreGlobal, t).color }]}>
                  {levelFor(scoreGlobal, t).name}
                </Text>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.trackFill,
                      {
                        width: `${scoreGlobal}%`,
                        backgroundColor: levelFor(scoreGlobal, t).color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.reading}>{levelFor(scoreGlobal, t).reading}</Text>
              </View>
            </View>
          )}

          {/* --- Axes : radar + barres --- */}
          {axes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.byAxis}</Text>

              {showRadar && (
                <View style={styles.radarWrap} wrap={false}>
                  <RadarChart axes={axes} />
                  <View style={styles.legend}>
                    {axes.map((a, i) => (
                      <View key={i} style={styles.legendRow}>
                        <Text style={styles.legendIndex}>{i + 1}</Text>
                        <Text style={styles.legendText}>{a.axe}</Text>
                        <Text style={[styles.legendScore, { color: scoreColor(a.score) }]}>
                          {a.score}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {!showRadar &&
                axes.map((a, i) => (
                  <View key={i} style={styles.axisRow} wrap={false}>
                    <View style={styles.axisHead}>
                      <Text style={styles.axisName}>{a.axe}</Text>
                      <Text style={[styles.axisScore, { color: scoreColor(a.score) }]}>
                        {a.score}/100
                      </Text>
                    </View>
                    <View style={styles.axisTrack}>
                      <View
                        style={[
                          styles.axisFill,
                          { width: `${a.score}%`, backgroundColor: scoreColor(a.score) },
                        ]}
                      />
                    </View>
                  </View>
                ))}
            </View>
          )}

          {/* --- Recommandations --- */}
          {recommendations.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.recommendations}</Text>
              {recommendations.map((r, i) => (
                <View key={i} style={styles.recoRow} wrap={false}>
                  <Text style={styles.recoIndex}>{i + 1}</Text>
                  <Text style={styles.recoText}>{r}</Text>
                </View>
              ))}
            </View>
          )}

          {/* --- Outils non-diagnostic : sections titrées --- */}
          {sections.map((s, i) => (
            <View key={i} style={styles.section}>
              <Text style={styles.sectionTitle}>{s.heading}</Text>
              {s.lines.map((line, j) => (
                <View key={j} style={styles.bulletRow} wrap={false}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.recoText}>{line}</Text>
                </View>
              ))}
            </View>
          ))}

          {/* --- Contexte : ce sur quoi l'analyse s'appuie --- */}
          {answers.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t.yourAnswers}</Text>
              {answers.map((a, i) => (
                <View key={i} style={styles.answerRow} wrap={false}>
                  <Text style={styles.answerLabel}>{a.label}</Text>
                  <Text style={styles.answerValue}>{a.value || t.notProvided}</Text>
                </View>
              ))}
            </View>
          )}

          {/* --- Repli : contenu non structuré --- */}
          {fallbackText && (
            <View style={styles.section}>
              {fallbackText.split(/\n\n+/).map((para, i) => (
                <Text key={i} style={[styles.mono, { marginBottom: 6 }]}>
                  {para.trim()}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Pied de page répété */}
        <View style={styles.footer} fixed>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) =>
              `${t.brand}  ·  ${toolTitle}  ·  ${t.page} ${pageNumber} ${t.of} ${totalPages}`
            }
          />
          <Text style={styles.footerNote}>{t.disclaimer}</Text>
        </View>
      </Page>
    </Document>
  );
};
