"use client";

import { useState } from "react";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createPortalSession } from "@/lib/api/account";

interface ManageSubscriptionButtonProps {
  lang: string;
}

/**
 * Ouvre le portail de facturation Stripe : l'abonné y gère son moyen de
 * paiement et résilie lui-même son abonnement (conformité "résiliation en
 * 3 clics", art. L215-1-1 s. du Code de la consommation).
 */
export function ManageSubscriptionButton({ lang }: ManageSubscriptionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      window.location.href = await createPortalSession(session.access_token, lang);
    } catch (err: any) {
      setError(err?.message || "Impossible d'ouvrir la gestion de l'abonnement.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-violet-700 border-2 border-violet-200 transition-colors hover:border-violet-400 disabled:opacity-70"
      >
        {isLoading && <CircleNotch className="w-4 h-4 animate-spin" />}
        Gérer mon abonnement / résilier
      </button>

      {error && <p className="text-xs text-red-600 text-center">{error}</p>}
    </div>
  );
}
