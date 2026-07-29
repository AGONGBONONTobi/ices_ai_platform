/**
 * Écran d'attente affiché pendant le chargement de la fiche d'outil.
 *
 * La page est en `force-dynamic` et interroge l'API : sans ce fichier, cliquer
 * sur un outil laissait l'utilisateur plusieurs secondes devant le catalogue
 * inchangé, sans aucun signe que quelque chose se passait.
 *
 * La silhouette reprend celle du formulaire réel — bandeau de catégorie, titre,
 * champs — pour que l'apparition du contenu ne provoque pas de saut de mise en
 * page.
 */
export default function Loading() {
  return (
    <div className="min-h-screen mesh-bg">
      {/* Barre de navigation, identique à celle de la page */}
      <nav className="sticky top-0 z-50 border-b border-white/60 glass-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <div className="h-4 w-20 rounded bg-slate-200 animate-pulse" />
          <div className="h-4 w-px bg-slate-200" />
          <div className="w-7 h-7 rounded-lg bg-violet-200/70 animate-pulse" />
          <div className="h-4 w-28 rounded bg-slate-200 animate-pulse" />
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="w-full max-w-2xl mx-auto animate-pulse">
          {/* Catégorie */}
          <div className="h-7 w-44 rounded-full bg-violet-100 mb-4" />
          {/* Titre */}
          <div className="h-8 w-3/4 rounded-lg bg-slate-200 mb-3" />
          <div className="h-4 w-2/3 rounded bg-slate-100 mb-6" />
          <div className="h-px bg-gradient-to-r from-violet-200 via-indigo-200 to-transparent mb-8" />

          {/* Champs du formulaire */}
          <div className="space-y-6">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 rounded bg-slate-200" style={{ width: `${70 - i * 8}%` }} />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-11 w-full rounded-xl bg-white/80 border border-slate-200" />
              </div>
            ))}
          </div>

          {/* Bouton */}
          <div className="h-14 w-full rounded-2xl bg-violet-200/60 mt-8" />
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">Chargement de l&apos;outil…</p>
      </main>
    </div>
  );
}
