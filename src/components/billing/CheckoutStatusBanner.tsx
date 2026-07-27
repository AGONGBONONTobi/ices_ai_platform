import { CheckCircle, XCircle } from "@phosphor-icons/react/dist/ssr";

interface CheckoutStatusBannerProps {
  success?: boolean;
  canceled?: boolean;
}

/** Message affiché au retour de Stripe Checkout (`?success=true` / `?canceled=true`). */
export function CheckoutStatusBanner({ success, canceled }: CheckoutStatusBannerProps) {
  if (!success && !canceled) return null;

  if (success) {
    return (
      <div className="max-w-2xl mx-auto mb-8 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-emerald-800">
        <CheckCircle className="w-5 h-5 shrink-0" weight="fill" />
        <p className="text-sm">
          Paiement confirmé, bienvenue dans l&apos;offre PRO ! Un reçu vous a été envoyé par e-mail.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mb-8 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-slate-700">
      <XCircle className="w-5 h-5 shrink-0" weight="fill" />
      <p className="text-sm">Paiement annulé, aucune somme n&apos;a été débitée.</p>
    </div>
  );
}
