import type { Locale } from "./getDictionary";

// Les documents source restent en français ; ces libellés expliquent leur
// statut dans toutes les langues de l'interface, sans prétendre les étalonner.
const labels = {
  fr: {
    preparation: "Guide de préparation", reference: "Fiche de référence", consult: "Consulter",
    preparationNotice: "Ce guide prépare votre démarche à partir du contexte déclaré. Il ne fait pas passer de test et ne produit aucun score psychométrique ni diagnostic.",
    referenceNotice: "Cette fiche décrit une épreuve ou une étape à mettre en place avec les professionnels concernés. La passation et la génération de résultats ne sont pas disponibles ici.",
    source: "Méthode et source", original: "Document source en français", lot: "Lot", related: "Guides associés du catalogue",
    blocks: { mesure: "Mesure", format: "Format", contenu: "Contenu", scoring: "Scoring cible", decision: "Décision éclairée", avance: "Options avancées", passerelle: "Passerelle" },
  },
  en: {
    preparation: "Preparation guide", reference: "Reference sheet", consult: "View",
    preparationNotice: "This guide prepares your next steps from your stated context. It does not administer a test or produce psychometric scores or diagnoses.",
    referenceNotice: "This sheet describes an assessment or step to arrange with the appropriate professionals. Test administration and results are not available here.",
    source: "Method and source", original: "Original source document in French", lot: "Batch", related: "Related catalogue guides",
    blocks: { mesure: "Measure", format: "Format", contenu: "Content", scoring: "Target scoring", decision: "Decision supported", avance: "Advanced options", passerelle: "Next step" },
  },
  es: {
    preparation: "Guía de preparación", reference: "Ficha de referencia", consult: "Consultar",
    preparationNotice: "Esta guía prepara sus próximos pasos a partir del contexto declarado. No administra pruebas ni produce puntuaciones psicométricas o diagnósticos.",
    referenceNotice: "Esta ficha describe una evaluación o etapa que debe organizarse con los profesionales adecuados. Aquí no se administran pruebas ni se generan resultados.",
    source: "Método y fuente", original: "Documento fuente original en francés", lot: "Lote", related: "Guías relacionadas del catálogo",
    blocks: { mesure: "Medida", format: "Formato", contenu: "Contenido", scoring: "Puntuación prevista", decision: "Decisión informada", avance: "Opciones avanzadas", passerelle: "Siguiente etapa" },
  },
  de: {
    preparation: "Vorbereitungsleitfaden", reference: "Referenzblatt", consult: "Ansehen",
    preparationNotice: "Dieser Leitfaden bereitet anhand Ihrer Angaben die nächsten Schritte vor. Er führt keinen Test durch und erzeugt keine psychometrischen Werte oder Diagnosen.",
    referenceNotice: "Dieses Blatt beschreibt eine Untersuchung oder einen Schritt, der mit Fachpersonen organisiert werden muss. Testdurchführung und Ergebnisse sind hier nicht verfügbar.",
    source: "Methode und Quelle", original: "Französisches Originaldokument", lot: "Paket", related: "Zugehörige Katalogleitfäden",
    blocks: { mesure: "Messziel", format: "Format", contenu: "Inhalt", scoring: "Vorgesehene Auswertung", decision: "Unterstützte Entscheidung", avance: "Erweiterte Optionen", passerelle: "Nächster Schritt" },
  },
  ar: {
    preparation: "دليل تحضيري", reference: "بطاقة مرجعية", consult: "عرض",
    preparationNotice: "يساعد هذا الدليل على التحضير للخطوات التالية بناءً على السياق المصرّح به. ولا يجري اختباراً ولا ينتج درجات سيكومترية أو تشخيصات.",
    referenceNotice: "تصف هذه البطاقة تقييماً أو مرحلة تُنظّم مع المختصين المناسبين. إجراء الاختبار وإصدار النتائج غير متاحين هنا.",
    source: "المنهج والمصدر", original: "الوثيقة الأصلية باللغة الفرنسية", lot: "الحزمة", related: "أدلة ذات صلة من الكتالوج",
    blocks: { mesure: "ما يُقاس", format: "الصيغة", contenu: "المحتوى", scoring: "التقييم المستهدف", decision: "القرار المدعوم", avance: "خيارات متقدمة", passerelle: "المرحلة التالية" },
  },
  zh: {
    preparation: "准备指南", reference: "参考资料", consult: "查看",
    preparationNotice: "本指南根据您提供的背景帮助准备下一步行动，不实施测验，也不生成心理测量分数或诊断。",
    referenceNotice: "本资料描述需与相关专业人员安排的评估或步骤。此处不提供测验实施或结果生成。",
    source: "方法与来源", original: "法语原始文档", lot: "批次", related: "相关目录指南",
    blocks: { mesure: "测量目标", format: "形式", contenu: "内容", scoring: "目标评分方法", decision: "辅助决策", avance: "高级选项", passerelle: "下一阶段" },
  },
  pt: {
    preparation: "Guia de preparação", reference: "Ficha de referência", consult: "Consultar",
    preparationNotice: "Este guia prepara os próximos passos a partir do contexto informado. Não aplica testes nem produz pontuações psicométricas ou diagnósticos.",
    referenceNotice: "Esta ficha descreve uma avaliação ou etapa a organizar com profissionais adequados. A aplicação de testes e a geração de resultados não estão disponíveis aqui.",
    source: "Método e fonte", original: "Documento original em francês", lot: "Lote", related: "Guias relacionados do catálogo",
    blocks: { mesure: "Medida", format: "Formato", contenu: "Conteúdo", scoring: "Pontuação prevista", decision: "Decisão apoiada", avance: "Opções avançadas", passerelle: "Próxima etapa" },
  },
} satisfies Record<Locale, unknown>;

export function toolAvailabilityLabels(lang: Locale) {
  return labels[lang] ?? labels.fr;
}
