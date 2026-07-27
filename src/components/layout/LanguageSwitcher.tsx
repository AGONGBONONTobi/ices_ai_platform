"use client";

import { useRouter } from "next/navigation";
import { i18nConfig, Locale } from "@/lib/i18n/getDictionary";
import { Globe } from "@phosphor-icons/react/dist/ssr";

interface LanguageSwitcherProps {
  currentLang: Locale;
}

export function LanguageSwitcher({ currentLang }: LanguageSwitcherProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value as Locale;
    // Remplace la locale dans le pathname
    const currentPath = window.location.pathname;
    const segments = currentPath.split("/");
    // segments[0] = "", segments[1] = lang actuel
    segments[1] = newLang;
    router.push(segments.join("/"));
  };

  return (
    <div className="flex items-center gap-1.5 text-sm text-slate-600 shrink-0">
      <Globe className="w-4 h-4 text-violet-500 shrink-0" />
      <select
        value={currentLang}
        onChange={handleChange}
        className="max-w-[4.5rem] sm:max-w-none bg-transparent border-none outline-none cursor-pointer text-sm font-medium text-slate-600 hover:text-violet-600 transition-colors pr-1 truncate"
      >
        {i18nConfig.locales.map((locale) => (
          <option key={locale} value={locale}>
            {i18nConfig.localeLabels[locale]}
          </option>
        ))}
      </select>
    </div>
  );
}
