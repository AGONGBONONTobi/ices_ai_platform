import {
  ChartBar,
  ChartLineUp,
  ChatCircleText,
  Certificate,
  ClipboardText,
  Compass,
  CurrencyCircleDollar,
  FileText,
  GearSix,
  GraduationCap,
  HandCoins,
  Kanban,
  Leaf,
  MagnifyingGlass,
  Recycle,
  RocketLaunch,
  Scales,
  SealCheck,
  Shield,
  Stethoscope,
  Toolbox,
  Truck,
  UserFocus,
  Users,
  Warning,
  Wrench,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon } from "@phosphor-icons/react/lib";

// Map catégories (nom exact) → icône + dégradé de couleur
export const CATEGORY_STYLES: Record<string, { from: string; to: string; icon: Icon }> = {
  "OUTILS SECTORIELS SPÉCIALISÉS": { from: "#7c3aed", to: "#4f46e5", icon: Toolbox },
  "TEMPLATES & MODÈLES PRÊTS À L'EMPLOI": { from: "#0ea5e9", to: "#4f46e5", icon: FileText },
  "AUDITS & CONFORMITÉ": { from: "#4f46e5", to: "#059669", icon: ClipboardText },
  "RH & CAPITAL HUMAIN": { from: "#059669", to: "#0ea5e9", icon: Users },
  "DIAGNOSTICS & ÉVALUATIONS": { from: "#7c3aed", to: "#4f46e5", icon: Stethoscope },
  "MARKETING & COMMERCIAL": { from: "#db2777", to: "#f97316", icon: ChartLineUp },
  "FINANCE & GESTION": { from: "#d97706", to: "#dc2626", icon: CurrencyCircleDollar },
  "REPORTING & ANALYTICS DASHBOARD": { from: "#4f46e5", to: "#0ea5e9", icon: ChartBar },
  "STRATÉGIE & MANAGEMENT": { from: "#4f46e5", to: "#0ea5e9", icon: Compass },
  "RSE & DÉVELOPPEMENT DURABLE": { from: "#059669", to: "#34d399", icon: Leaf },
  "PERSONNALITÉ & COMPORTEMENT PROFESSIONNEL": { from: "#db2777", to: "#7c3aed", icon: UserFocus },
  "GESTION DE PROJETS & PMO": { from: "#0ea5e9", to: "#4f46e5", icon: Kanban },
  "TRANSFORMATION DIGITALE & IA": { from: "#7c3aed", to: "#db2777", icon: RocketLaunch },
  "GESTION DES RISQUES": { from: "#dc2626", to: "#d97706", icon: Warning },
  "INNOVATION & R&D": { from: "#7c3aed", to: "#0ea5e9", icon: RocketLaunch },
  "PROFILS APPRENANTS & PÉDAGOGIE": { from: "#0ea5e9", to: "#059669", icon: GraduationCap },
  "JURIDIQUE & CONFORMITÉ": { from: "#4f46e5", to: "#059669", icon: Scales },
  "QUALITÉ & EXCELLENCE OPÉRATIONNELLE": { from: "#059669", to: "#0ea5e9", icon: SealCheck },
  "SUPPLY CHAIN & ACHATS": { from: "#0ea5e9", to: "#059669", icon: Truck },
  "COMMUNICATION & RELATIONS EXTÉRIEURES": { from: "#db2777", to: "#4f46e5", icon: ChatCircleText },
  "ÉTUDES DE PROJETS & FAISABILITÉ": { from: "#4f46e5", to: "#7c3aed", icon: Kanban },
  "INTELLIGENCE ÉCONOMIQUE & VEILLE": { from: "#7c3aed", to: "#4f46e5", icon: MagnifyingGlass },
  "Systèmes de Management ISO": { from: "#4f46e5", to: "#059669", icon: GearSix },
  "Labels ESG / RSE / Durabilité": { from: "#059669", to: "#34d399", icon: SealCheck },
  "Certification de Produits & Services": { from: "#d97706", to: "#dc2626", icon: Certificate },
  "Certification de Compétences & Personnes": { from: "#db2777", to: "#7c3aed", icon: Certificate },
  "Conformité Bailleurs & Projets Financés": { from: "#d97706", to: "#dc2626", icon: HandCoins },
  "Économie Circulaire & Déchets": { from: "#059669", to: "#34d399", icon: Recycle },
  "Gouvernance, Éthique & Anti-Corruption": { from: "#4f46e5", to: "#059669", icon: Shield },
  "Inspection Technique & Vérification": { from: "#0ea5e9", to: "#4f46e5", icon: MagnifyingGlass },
};

export const DEFAULT_CATEGORY_STYLE = { from: "#7c3aed", to: "#4f46e5", icon: Wrench };

export function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] || DEFAULT_CATEGORY_STYLE;
}
