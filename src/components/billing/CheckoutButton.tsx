"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createCheckoutSession } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";

interface CheckoutButtonProps {
  lang: string;
  isPro: boolean;
}

/**
 * Déclenche la création d'une session Stripe Checkout côté FastAPI, puis
 * redirige vers l'URL renvoyée. Remplace l'ancienne Server Action qui
 * redirigeait vers la route Next `/api/stripe/checkout`.
 */
export function CheckoutButton({ lang, isPro }: CheckoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.push(`/${lang}/login?redirect=/${lang}/pricing`);
        return;
      }

      window.location.href = await createCheckoutSession(session.access_token);
    } catch (err: any) {
      setError(
        err instanceof ApiError && err.code === "stripe_not_configured"
          ? "Le paiement n'est pas encore configuré. Réessayez plus tard."
          : err?.message || "Impossible de démarrer le paiement."
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={isPro || isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 hover:shadow-lg hover:shadow-violet-300/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
        style={{
          background: isPro
            ? "#94a3b8"
            : "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
        }}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isPro ? "Déjà Abonné PRO" : "Passer à la version PRO"}
      </button>

      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
