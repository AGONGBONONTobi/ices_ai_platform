"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CircleNotch } from "@phosphor-icons/react/dist/ssr";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createCheckoutSession } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";

interface CheckoutButtonProps {
  lang: string;
}

/**
 * Déclenche la création d'une session Stripe Checkout côté FastAPI, puis
 * redirige vers l'URL renvoyée. Remplace l'ancienne Server Action qui
 * redirigeait vers la route Next `/api/stripe/checkout`.
 *
 * Le libellé du bouton indique le montant et la récurrence : le droit de la
 * consommation (art. L221-14) impose qu'un bouton déclenchant un paiement
 * exprime sans ambiguïté l'obligation de payer.
 */
export function CheckoutButton({ lang }: CheckoutButtonProps) {
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

      window.location.href = await createCheckoutSession(session.access_token, lang);
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
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 hover:shadow-lg hover:shadow-violet-300/40 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
        style={{ background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)" }}
      >
        {isLoading && <CircleNotch className="w-4 h-4 animate-spin" />}
        S&apos;abonner — 15 € / mois
      </button>

      <p className="text-xs text-slate-500 text-center">
        Facturation mensuelle récurrente par carte bancaire, via Stripe.
        Résiliable à tout moment depuis votre compte.
      </p>

      {error && (
        <p className="text-xs text-red-600 text-center">{error}</p>
      )}
    </div>
  );
}
