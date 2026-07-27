"use client";

import { useState } from "react";
import { ToolConfig } from "@/lib/schema/tool-schema";
import { InputFactory } from "./InputFactory";
import { Tag, ArrowRight } from "@phosphor-icons/react/dist/ssr";

interface DynamicToolFormProps {
  tool: ToolConfig;
  onSubmit: (data: Record<string, any>) => void;
  isLoading?: boolean;
}

export function DynamicToolForm({ tool, onSubmit, isLoading = false }: DynamicToolFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
