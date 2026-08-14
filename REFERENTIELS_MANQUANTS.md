# Référentiels manquants — état et liste de travail

Mesuré le 12 août 2026 sur `data/tools/` (1 084 fiches) et `data/referentiels/`
(19 référentiels), branche `chantier-a-moteur-et-qualite`.

## 1. Le constat arithmétique

Un référentiel ne peut pas adosser n'importe quelle fiche. Il ne produit du
sens que pour les outils dont le livrable est une **évaluation par rapport à
un attendu** — c'est-à-dire `output_kind: assessment`, et éventuellement les
variantes dérivées du même fichier source (plan d'actions, checklist d'audit,
revue de direction, matrice de conformité) prévues au chantier P1.

Répartition mesurée du catalogue :

| `output_kind` | Fiches | Adossable à un référentiel |
| --- | ---: | --- |
| `analysis` | 404 | Non — analyse de situation, pas de conformité |
| `document` | 293 | Seulement en dérivé d'un référentiel existant |
| `assessment` | 228 | **Oui — c'est la cible** |
| `table` | 86 | Seulement en dérivé |
| `profile` | 73 | Non — mesure d'intensité, aucun attendu normatif |

Sur les 228 `assessment` :

- **19 sont adossées** (`referentiel_code` renseigné) ;
- **209 ne le sont pas** ;
- parmi ces 209, **54 nomment explicitement une norme** dans leur titre ou
  leur prompt, **155 n'en nomment aucune**.

Conséquence directe : **« 1 080 outils prêts » n'est pas atteignable par les
référentiels.** Même en écrivant tous les référentiels listés ci-dessous et en
tirant les 4 variantes de livrable prévues au chantier P1, on obtient de
l'ordre de **300 fiches normatives solides**, soit environ 28 % du catalogue.
Les 780 autres relèvent d'une grille éditoriale propriétaire ou de la décision
de non-publication (chantier P1 « trancher la taille du catalogue vendu »).

---

## 2. Vague 1 — réclamés par des outils déjà écrits

Ces normes sont **nommées dans le titre ou le prompt** de fiches existantes.
Écrire le référentiel améliore immédiatement une fiche déjà au catalogue, sans
décision éditoriale préalable. Le chiffre est le nombre d'`assessment`
concernés (mesuré).

| Référentiel | Fiches | Remarque |
| --- | ---: | --- |
| **SYSCOHADA / OHADA** | 6 | Le plus rentable du lot, et le plus pertinent pour le marché visé |
| **Code des marchés publics (UEMOA / national)** | 4 | Attention : référentiel juridique national, pas normatif |
| **GHG Protocol + ISO 14064-1** | 2 | Bilan carbone, audit énergétique |
| **GRI Standards** | 2 | Reporting de durabilité |
| **CSRD / ESRS** | 2 | Reporting extra-financier européen |
| **CSDDD / devoir de vigilance** | 2 | Se combine avec UNGP et OIT |
| **GAFI — AML / KYC** | 2 | Audit anti-blanchiment |
| **IFRS / IAS** | 2 | Audit légal, commissariat aux comptes |
| **AI Act + ISO 42001** | 2 | Gouvernance de l'IA — les deux vont ensemble |
| **B Corp (BIA)** | 2 | Fiche `auto-evaluation-bcorp` déjà présente |
| **HACCP / Codex Alimentarius** | 2 | Complète ISO 22000 déjà fait |
| **GPEC / GEPP** | 2 | Référentiel juridique français, à vérifier en pertinence |
| **COSO ERM** | 1 | Fiche « Audit de la gestion des risques (ERM — COSO) » |
| **ISO 31000** | 1 | Se combine avec COSO sur la même fiche |
| **SROI** | 1 | Audit d'impact social |
| **OCDE / BEPS — prix de transfert** | 1 | Audit des prix de transfert |
| **Lean / Six Sigma (DMAIC)** | 1 | Grille de maturité, pas une norme |
| **PMBOK** | 1 | |
| **PRINCE2** | 1 | |
| **P3M3 / OPM3** | 1 | Maturité PMO — deux fiches existantes |
| **SEVESO III** | 1 | Risques industriels |
| **Solvabilité II** | 1 | Assurance |
| **Halal (GSO / SMIIC)** | 1 | Fiche `auto-evaluation-conformite-halal` existante |
| **Bio — Ecocert / AB** | 1 | |
| **IGP / AOP** | 1 | |
| **AFD — dispositif de maîtrise E&S** | 1 | Fiche `outil-diagnostic-conformite-afd` existante |
| **BAD — Système de sauvegardes intégré** | 0 | Fiche `checklist-conformite-bad` existante |
| **ODD / Pacte mondial** | 1 | |
| **TCFD** | 0 | 2 fiches non-assessment |
| **TNFD** | 0 | Biodiversité — 2 fiches non-assessment |
| **SASB** | 0 | |
| **Bâle III** | 0 | |
| **CIMA** | 0 | Assurance zone CIMA |
| **SBTi** | 0 | |
| **BRCGS**, **IFS Food** | 0 | Agroalimentaire, avec FSSC 22000 |
| **LEED / BREEAM / EDGE** | 0 | Bâtiment |

**Sous-total : environ 36 référentiels, ~45 fiches `assessment` directement
concernées.**

---

## 3. Vague 2 — débloquent une catégorie entière

Aucune fiche ne les nomme, mais des fiches existent qui **devraient** s'y
adosser. Écrire le référentiel suppose de réécrire la fiche correspondante.

| Référentiel | Fiche(s) visée(s) |
| --- | --- |
| **ISO 55001** — gestion d'actifs | Audit des équipements, maintenance & GMAO |
| **ISO 20400** — achats responsables | Audit des achats responsables & supply chain |
| **ISO 30414** — reporting capital humain | Audit RH complet & social ; Diagnostic RH |
| **ISO 10002** — traitement des réclamations | Audit satisfaction client & expérience |
| **ISO 56002** — management de l'innovation | Diagnostic de l'innovation & de la créativité |
| **ISO 21001** — organismes de formation | Audit de la formation professionnelle |
| **Qualiopi** — RNQ | Audit de la formation professionnelle (France) |
| **ISO 28000** — sûreté de la chaîne logistique | Audit de la chaîne logistique |
| **ISO 41001** — facility management | Audit de sécurité physique & protection des biens |
| **ISO 19011** — audit de systèmes | Audit de maturité ISO ; Audit interne |
| **ISO 30401** — management des connaissances | Audit des systèmes documentaires |
| **ISO 21502** — management de projet | Diagnostic de maturité PM & gouvernance projets |
| **ISO 44001** — partenariats collaboratifs | Outil de qualification des fournisseurs |
| **ISO 39001** — sécurité routière | (aucune fiche — à créer ou à écarter) |
| **ISO 46001** — usage efficient de l'eau | (aucune fiche — à créer ou à écarter) |
| **ISO 27005** — gestion du risque SI | Audit cybersécurité |
| **ISO 27701** — vie privée | Guide lois données personnelles africaines |
| **ISO 27017 / 27018** — cloud | Audit de l'infrastructure IT |
| **NIST CSF 2.0** | Audit cybersécurité & pentest |
| **SOC 2** | Audit de l'infrastructure IT |
| **PCI DSS 4.0** | Audit de conformité sectorielle (bancaire) |
| **NIS 2** | Audit cybersécurité (UE) |
| **DORA** | Audit de conformité sectorielle (finance) |
| **COBIT 2019** | Audit des SIG ; Diagnostic SI/DSI |
| **ITIL 4** | Complète ISO 20000-1 déjà fait |
| **TOGAF** | Audit & modernisation des systèmes legacy |
| **CMMI** | Audit de processus & procédures |
| **DAMA-DMBOK** | Audit de gouvernance des données ; data governance |
| **EFQM 2025** | Diagnostic organisationnel 360° ; performance globale |
| **DIGCOMP 2.2** | Outil d'évaluation des compétences numériques |
| **RGAA / WCAG 2.2 / EN 301 549** | Outil d'audit de l'accessibilité numérique |
| **ITIE** | Outil de conformité ITIE (transparence minière) |
| **Taxonomie verte UE** | Outil de conformité taxonomie verte |
| **Label Engagé RSE (AFNOR)** | Outil de préparation label Engagé RSE |
| **Index Egapro** | Audit de l'égalité femmes-hommes |
| **IFC Performance Standards** | Complète le CES Banque mondiale déjà fait |
| **Conventions fondamentales OIT** | Audit des droits humains ; SMETA |
| **UNGP / Principes de Ruggie** | Audit des droits humains |
| **SMETA / Sedex** | Audit qualité fournisseurs |
| **FSC / PEFC / RSPO** | Audit de traçabilité & chaîne de contrôle |

**Sous-total : environ 40 référentiels.**

---

## 4. Vague 3 — famille accréditation, à compléter

La famille 17000 est entamée (17020, 17025). La compléter donne une offre
cohérente pour un marché identifié — les organismes d'évaluation de la
conformité — et le catalogue a déjà une catégorie dédiée.

| Référentiel | Objet |
| --- | --- |
| **ISO/IEC 17065** | Organismes de certification de produits |
| **ISO/IEC 17021-1** | Organismes de certification de systèmes |
| **ISO/IEC 17024** | Organismes de certification de personnes |
| **ISO 15189** | Laboratoires de biologie médicale |
| **ISO/IEC 17043** | Essais d'aptitude |
| **BPF / GMP** | Bonnes pratiques de fabrication (pharma) |
| **MDR 2017/745 · IVDR 2017/746** | Marquage CE dispositifs médicaux — complète ISO 13485 |
| **FSSC 22000** | Complète ISO 22000 et HACCP |
| **GlobalG.A.P.** | Production agricole |

**Sous-total : 9 référentiels.**

---

## 5. Ce qui ne relèvera d'aucun référentiel

Environ **85 à 90 fiches `assessment`** évaluent une pratique de gestion pour
laquelle il n'existe aucun texte opposable : diagnostic du business model
(BMC), SWOT, matrice BCG, chaîne de valeur de Porter, leadership et styles
managériaux, climat social, marque employeur, culture d'entreprise, engagement
collaborateurs, expérience client omnicanal, styles d'apprentissage…

Pour celles-ci, deux voies seulement :

1. **Écrire une grille propriétaire** au même format que `data/referentiels/`
   — chapitres, critères, échelle de maturité — mais assumée comme une
   méthode maison et non comme une norme. Le générateur
   `generate_tool_from_referentiel.py` fonctionnerait sans modification.
2. **Ne pas les publier** — statut `draft`, conformément au chantier P1.

Ce qu'il ne faut pas faire : leur inventer un rattachement normatif. C'est
exactement la promesse que le document de cadrage identifie comme le risque
juridique nº 1.

---

## 6. Ce que ça donne

| | Référentiels | Fiches `assessment` adossées | Avec les 4 variantes P1 |
| --- | ---: | ---: | ---: |
| Aujourd'hui | 19 | 19 | 76 |
| + Vague 1 | 55 | ~64 | ~256 |
| + Vague 2 | 95 | ~105 | ~420 |
| + Vague 3 | 104 | ~114 | ~456 |

Le plafond réaliste est de l'ordre de **450 fiches défendables sur 1 084**, et
il suppose d'écrire une centaine de référentiels — au rythme observé (19 en
trois semaines, sans relecture juridique), c'est un chantier de plusieurs mois
auquel s'ajoute la relecture par un praticien, qui est déjà le point bloquant
sur les 19 existants.

**Recommandation :** ne pas viser la couverture du catalogue. Traiter la
vague 1 (36 référentiels, fiches déjà écrites, aucune décision éditoriale
requise), mesurer l'usage, et laisser les vagues 2 et 3 dépendre de ce que la
mesure montre.
