/**
 * Quota du palier gratuit, côté interface.
 *
 * La valeur était recopiée à la main dans la page profil et dans l'écran de
 * blocage de l'exécuteur. Un changement de quota n'en mettait à jour qu'une
 * partie : la jauge annonçait une limite, le message d'erreur une autre.
 *
 * Cette constante est la seule source côté front. Elle doit rester alignée sur
 * `FREE_TIER_LIMIT` du backend (`fast_api/app/config.py`), qui reste seul juge
 * du blocage réel : ce qui est défini ici n'est qu'un affichage.
 */
export const FREE_TIER_LIMIT = 50;
