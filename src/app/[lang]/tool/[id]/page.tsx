import { fetchTool } from "@/lib/api/tools";
import { getDictionary, Locale } from "@/lib/i18n/getDictionary";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Diamond } from "@phosphor-icons/react/dist/ssr";
import ToolExecutor from "./ToolExecutor";
import { toolAvailabilityLabels } from "@/lib/i18n/toolAvailability";

interface ToolPageProps {
  params: { lang: Locale; id: string };
}

export const dynamic = "force-dynamic";

export default async function ToolPage({ params }: ToolPageProps) {
  const { lang, id } = params;
  const dict = await getDictionary(lang);

  // Le backend renvoie la config déjà traduite dans la locale demandée
  const tool = await fetchTool(id, lang);

  if (!tool) {
    notFound();
  }

  const isRtl = lang === "ar";
  const availability = toolAvailabilityLabels(lang);

  return (
    <div className="min-h-screen mesh-bg text-foreground" dir={isRtl ? "rtl" : "ltr"}>
      {/* Nav Glassmorphism */}
      <nav className="sticky top-0 z-50 border-b border-white/60 glass-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={`/${lang}`}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-violet-700 transition-colors font-medium"
              id="back-to-catalog"
            >
              <ArrowLeft className="w-4 h-4" />
              {dict.nav.back}
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}
              >
                <Diamond className="w-3.5 h-3.5 text-white" weight="fill" />
              </div>
              <span className="font-bold text-sm text-slate-900">{dict.nav.brand}</span>
            </div>
          </div>
          <LanguageSwitcher currentLang={lang} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {tool.execution && (
          <section className="mb-8 space-y-3 rounded-2xl border border-violet-200 bg-white/80 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
              {availability[tool.execution.mode]}
            </p>
            {tool.execution.mode === "reference" && (
              <h1 className="text-2xl font-bold text-slate-900">{tool.title}</h1>
            )}
            <p className="text-sm leading-relaxed text-slate-700">
              {tool.execution.mode === "reference" ? availability.referenceNotice : availability.preparationNotice}
            </p>
            <p lang="fr" className="text-sm leading-relaxed text-slate-600">{tool.execution.notice}</p>
          </section>
        )}
        {tool.provenance && (
          <details className="mb-8 rounded-2xl border border-slate-200 bg-white/80 p-5">
            <summary className="cursor-pointer font-semibold text-slate-800 focus-visible:outline-violet-600">
              {availability.source} · {tool.provenance.code}
            </summary>
            <div className="mt-4 space-y-4 text-sm">
              <p className="text-slate-500">{availability.original}</p>
              <p lang="fr" className="break-words text-slate-600">
                {availability.lot} {tool.provenance.batch} · {tool.provenance.document}<br />
                {tool.provenance.domain}
                {tool.provenance.stage && ` · ${tool.provenance.stage}`}
              </p>
              <dl className="space-y-4">
                {Object.entries(tool.provenance.blocks).map(([key, value]) => (
                  <div key={key}>
                    <dt className="font-semibold text-slate-800">
                      {availability.blocks[key as keyof typeof availability.blocks] ?? key}
                    </dt>
                    <dd lang="fr" className="mt-1 whitespace-pre-line leading-relaxed text-slate-600">{value}</dd>
                  </div>
                ))}
              </dl>
              {(tool.provenance.related_codes?.length ?? 0) > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-800">{availability.related}</p>
                  <ul className="flex flex-wrap gap-2">
                    {tool.provenance.related_codes?.map((code) => (
                      <li key={code}>
                        <Link
                          href={`/${lang}/tool/psy-${code.toLowerCase().replace(".", "-")}`}
                          className="inline-block rounded-lg border border-violet-200 px-3 py-1 text-violet-700 underline-offset-2 hover:underline focus-visible:outline-violet-600"
                        >
                          {code}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </details>
        )}
        <ToolExecutor tool={tool} dict={dict} lang={lang} />
      </main>
    </div>
  );
}
