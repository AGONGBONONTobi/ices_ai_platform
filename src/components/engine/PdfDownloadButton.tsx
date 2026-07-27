"use client";

import { useEffect, useState } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { GenericReportDocument, GenericReportProps } from "../pdf/GenericReportDocument";
import { Button } from "@/components/ui/button";
import { DownloadSimple, CircleNotch } from "@phosphor-icons/react/dist/ssr";

export function PdfDownloadButton(props: GenericReportProps) {
  const [isClient, setIsClient] = useState(false);

  // Évite les problèmes de SSR (Server-Side Rendering) avec react-pdf
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  return (
    <PDFDownloadLink
      document={<GenericReportDocument {...props} />}
      fileName={`Rapport_${props.toolTitle.replace(/\s+/g, "_")}.pdf`}
      className="w-full"
    >
      {({ blob, url, loading, error }) =>
        <Button 
          disabled={loading || !!error} 
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {loading ? (
            <>
              <CircleNotch className="mr-2 h-4 w-4 animate-spin" />
              Génération du PDF...
            </>
          ) : (
            <>
              <DownloadSimple className="mr-2 h-4 w-4" />
              Télécharger le Rapport Complet (PDF)
            </>
          )}
        </Button>
      }
    </PDFDownloadLink>
  );
}
