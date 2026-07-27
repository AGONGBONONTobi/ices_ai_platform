import React from "react";
import { Page, Text, View, Document, StyleSheet, Font } from "@react-pdf/renderer";

// Styles pour le PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: "#1e293b",
    paddingBottom: 10,
    marginBottom: 20,
  },
  headerText: {
    fontSize: 12,
    color: "#64748b",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 20,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
    marginTop: 10,
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.5,
    color: "#334155",
    marginBottom: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 10,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
});

export interface GenericReportProps {
  toolTitle: string;
  category: string;
  resultText: string;
}

export const GenericReportDocument = ({ toolTitle, category, resultText }: GenericReportProps) => {
  // On sépare le texte par doubles retours à la ligne pour recréer des paragraphes
  const paragraphs = resultText.split(/\n\n+/);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Plateforme IA Outils</Text>
          <Text style={styles.headerText}>Confidentiel</Text>
        </View>

        {/* Titre Principal */}
        <Text style={styles.title}>{toolTitle}</Text>
        <Text style={styles.subtitle}>Catégorie : {category}</Text>

        {/* Contenu généré */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résultat de l'Audit / Analyse :</Text>
          {paragraphs.map((para, index) => (
            <Text key={index} style={styles.paragraph}>
              {para.trim()}
            </Text>
          ))}
        </View>

        {/* Pied de page */}
        <Text
          style={styles.footer}
          render={({ pageNumber, totalPages }) =>
            `Généré le ${new Date().toLocaleDateString("fr-FR")} - Page ${pageNumber} sur ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  );
};
