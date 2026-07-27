import { fetchTool } from "@/lib/api/tools";
import { getDictionary, Locale } from "@/lib/i18n/getDictionary";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Cpu } from "lucide-react";
import ToolExecutor from "./ToolExecutor";

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
                <Cpu className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold text-sm text-slate-900">{dict.nav.brand}</span>
            </div>
          </div>
          <LanguageSwitcher currentLang={lang} />
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <ToolExecutor tool={tool} dict={dict} lang={lang} />
      </main>
    </div>
  );
}
