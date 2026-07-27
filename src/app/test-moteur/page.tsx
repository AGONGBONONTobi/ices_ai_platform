"use client";

import { useState } from "react";
import { ToolBuilder } from "@/lib/builders/ToolBuilder";
import { DynamicToolForm } from "@/components/engine/DynamicToolForm";
import { PdfDownloadButton } from "@/components/engine/PdfDownloadButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { executeTool } from "@/lib/api/tools";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

// Nous utilisons notre ToolBuilder pour simuler une fiche JSON
const mockTool = new ToolBuilder("dmi-001")
  .setTitle("Diagnostic de Maturité Digitale (DMI)")
  .setCategory("Stratégie & Innovation")
  .addInput({
    name: "secteur",
    label: "Secteur d'activité",
    type: "select",
    options: ["Industrie", "Services", "Commerce", "ONG", "Autre"],
    placeholder: "Sélectionnez votre secteur",
    required: true,
  })
  .addInput({
    name: "taille_equipe",
    label: "Taille de l'entreprise (nombre d'employés)",
    type: "number",
    placeholder: "Ex: 50",
    required: true,
  })
  .addInput({
    name: "outils_actuels",
    label: "Outils digitaux actuellement utilisés",
    type: "textarea",
    placeholder: "Ex: Excel, WhatsApp, ERP...",
    required: false,
  })
  .setPromptTemplate("Tu es consultant... Évalue la maturité...")
  .setOutputSchema({ type: "object" }) 
  .build();

export default function TestMoteurPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [mockAiResult, setMockAiResult] = useState<string | null>(null);

  const handleGenerate = async (data: Record<string, any>) => {
    setIsGenerating(true);
    console.log("Données envoyées à l'IA :", data);
    
    try {
      // Le backend FastAPI exige une session authentifiée
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Connectez-vous pour tester le moteur.");
      }

      const result = await executeTool(
        { toolConfig: mockTool, userInputs: data, lang: "fr" },
        session.access_token
      );

      // On formate le JSON en joli texte pour le composant PDF (ou on pourrait l'afficher sous forme structurée)
      setMockAiResult(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("Erreur:", error);
      alert("Une erreur est survenue lors de la génération.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-3xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
            Plateforme IA : Moteur Générique
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Ceci est un test de la Factory et du Rendu PDF.
          </p>
        </div>

        {/* Le moteur de formulaire dynamique (généré depuis le JSON) */}
        {!mockAiResult ? (
          <DynamicToolForm tool={mockTool} onSubmit={handleGenerate} isLoading={isGenerating} />
        ) : (
          <div className="space-y-6">
            <Card className="border-t-4 border-t-green-500 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl text-green-700">Audit Terminé avec Succès</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-slate-100 p-4 rounded-md whitespace-pre-wrap text-sm text-slate-700">
                  {mockAiResult}
                </div>
                
                {/* Le bouton de génération de PDF qui prend les props */}
                <PdfDownloadButton 
                  toolTitle={mockTool.title}
                  category={mockTool.category}
                  resultText={mockAiResult}
                />

                <div className="text-center mt-4">
                  <button 
                    className="text-sm text-slate-500 hover:underline"
                    onClick={() => setMockAiResult(null)}
                  >
                    Refaire un audit
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
