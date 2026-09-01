"use client";

import { useRef, useState } from "react";
import { ToolConfig } from "@/lib/schema/tool-schema";
import { InputFactory } from "./InputFactory";
import { Tag, ArrowRight, Paperclip, CircleNotch, CheckCircle, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { extractFormValues } from "@/lib/api/tools";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Locale } from "@/lib/i18n/getDictionary";

interface DynamicToolFormProps {
  tool: ToolConfig;
  lang: Locale;
  onSubmit: (data: Record<string, any>) => void;
  isLoading?: boolean;
}

type ExtractStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "success"; count: number }
  | { state: "error"; message: string };

const ACCEPTED_EXTENSIONS = ".pdf,.docx,.txt";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export function DynamicToolForm({ tool, lang, onSubmit, isLoading = false }: DynamicToolFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [extractStatus, setExtractStatus] = useState<ExtractStatus>({ state: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // permet de resélectionner le même fichier après une erreur
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      setExtractStatus({ state: "error", message: "Fichier trop volumineux (10 Mo max)." });
      return;
    }

    setExtractStatus({ state: "loading" });

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = `/${lang}/login?redirect=/${lang}/tool/${tool.id}`;
        return;
      }

      const values = await extractFormValues(tool.id, file, session.access_token);
      const count = Object.keys(values).length;

      if (count > 0) {
        setFormData((prev) => ({ ...prev, ...values }));
      }
      setExtractStatus({ state: "success", count });
    } catch (err: any) {
      setExtractStatus({
        state: "error",
        message: err?.message || "L'analyse du document a échoué.",
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Tool header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200/60 text-xs font-semibold text-violet-600 mb-4">
          <Tag className="w-3 h-3" weight="fill" />
          {tool.category}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
          {tool.title}
        </h1>
        <p className="text-sm text-slate-500">
          Renseignez les informations ci-dessous pour générer votre analyse IA personnalisée.
        </p>

        {/* Pré-remplissage depuis un document */}
        <div className="mt-4 p-3.5 rounded-xl border border-dashed border-violet-200 bg-violet-50/40 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            id="document-upload-input"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            id="document-upload-trigger"
            onClick={() => fileInputRef.current?.click()}
            disabled={extractStatus.state === "loading"}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold text-violet-700 bg-white border border-violet-200 hover:border-violet-300 hover:bg-violet-50 transition-colors disabled:opacity-60 shrink-0"
          >
            {extractStatus.state === "loading" ? (
              <CircleNotch className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Paperclip className="w-3.5 h-3.5" />
            )}
            Importer un document
          </button>

          <div className="text-xs min-w-0">
            {extractStatus.state === "idle" && (
              <span className="text-slate-500">
                PDF, DOCX ou TXT — pré-remplit les champs que le document permet de déduire.
              </span>
            )}
            {extractStatus.state === "loading" && (
              <span className="text-violet-600">Analyse du document en cours…</span>
            )}
            {extractStatus.state === "success" && extractStatus.count > 0 && (
              <span className="text-emerald-600 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" weight="fill" />
                {extractStatus.count} champ{extractStatus.count > 1 ? "s" : ""} pré-rempli{extractStatus.count > 1 ? "s" : ""} — vérifiez avant de générer.
              </span>
            )}
            {extractStatus.state === "success" && extractStatus.count === 0 && (
              <span className="text-slate-500">
                Aucune information exploitable trouvée dans ce document.
              </span>
            )}
            {extractStatus.state === "error" && (
              <span className="text-red-600 flex items-center gap-1.5">
                <WarningCircle className="w-3.5 h-3.5 shrink-0" weight="fill" />
                {extractStatus.message}
              </span>
            )}
          </div>
        </div>

        {/* Divider line */}
        <div className="mt-4 h-px bg-gradient-to-r from-violet-200 via-indigo-200 to-transparent" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {tool.inputs.map((input, index) => (
          <div
            key={input.name}
            className="group"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <InputFactory
              input={input}
              value={formData[input.name]}
              onChange={(val) => handleChange(input.name, val)}
            />
          </div>
        ))}

        {/* Premium Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            id="generate-result-btn"
            disabled={isLoading}
            className={`relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold text-sm text-white transition-all duration-300 overflow-hidden ${
              isLoading
                ? "opacity-80 cursor-not-allowed"
                : "hover:shadow-xl hover:shadow-violet-300/40 hover:-translate-y-0.5 active:translate-y-0"
            }`}
            style={{
              background: isLoading
                ? "linear-gradient(135deg, #8b5cf6, #6366f1)"
                : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)",
              backgroundSize: "200% 200%",
            }}
          >
            {/* Shimmer overlay */}
            {!isLoading && (
              <div className="absolute inset-0 shimmer opacity-30" />
            )}

            {isLoading ? (
              <>
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Analyse en cours...</span>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white/70 animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </span>
              </>
            ) : (
              <>
                <span>Générer l&apos;analyse IA</span>
                <ArrowRight className="w-4 h-4" weight="bold" />
              </>
            )}
          </button>
          <p className="text-center text-xs text-slate-400 mt-3">
            Résultats en quelques secondes
          </p>
        </div>
      </form>
    </div>
  );
}
