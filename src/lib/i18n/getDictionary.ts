export const i18nConfig = {
  defaultLocale: "fr",
  locales: ["fr", "en", "es", "de", "ar", "zh", "pt"],
  localeLabels: {
    fr: "🇫🇷 Français",
    en: "🇬🇧 English",
    es: "🇪🇸 Español",
    de: "🇩🇪 Deutsch",
    ar: "🇸🇦 العربية",
    zh: "🇨🇳 中文",
    pt: "🇧🇷 Português",
  },
  // Nom complet de la langue pour injecter dans le prompt IA
  localeToLanguageName: {
    fr: "French",
    en: "English",
    es: "Spanish",
    de: "German",
    ar: "Arabic",
    zh: "Chinese (Simplified)",
    pt: "Portuguese (Brazilian)",
  },
} as const;

export type Locale = (typeof i18nConfig.locales)[number];

const dictionaries: Record<Locale, () => Promise<any>> = {
  fr: () => import("@/dictionaries/fr.json").then((m) => m.default),
  en: () => import("@/dictionaries/en.json").then((m) => m.default),
  es: () => import("@/dictionaries/es.json").then((m) => m.default),
  de: () => import("@/dictionaries/de.json").then((m) => m.default),
  ar: () => import("@/dictionaries/ar.json").then((m) => m.default),
  zh: () => import("@/dictionaries/zh.json").then((m) => m.default),
  pt: () => import("@/dictionaries/pt.json").then((m) => m.default),
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]?.() ?? dictionaries["fr"]();
};
