# ProDay — Assignations & Coordination (Audit qualité)

> Statut : **pas de sous-agents disponibles** dans cet environnement (outil Task absent).
> L'orchestrateur exécute donc les 6 zones **séquentiellement**, dans l'ordre ci-dessous,
> en respectant la règle « un seul propriétaire par composant partagé ».

## Règles de coordination

1. **Un seul propriétaire par système partagé** : tokens/typo → Zone A ; toute autre zone
   consomme, ne redéfinit pas. Aucune nouvelle famille de boutons/espacements nulle part.
2. Avant de modifier un composant partagé, grep de tous les consommateurs + suites qui l'épinglent.
3. Toute correction passe par : reproduction → cause → correctif focalisé → `tsc` → suites liées → inspection live.
4. Les gardes de tests statiques existants (ex: `coachProDesignAlignment`, `videoWorkspaceShared`) sont la mémoire du repo — les étendre plutôt que les contourner.
5. Travail en cours d'autres sessions préservé (~648 changements) : ne toucher que mes fichiers, jamais `desktop/app-dist` (suppressions préexistantes d'un autre flux).

## Zones (exécution séquentielle)

| # | Zone | Périmètre | Propriétaire | Composants partagés à ne pas casser | État |
|---|---|---|---|---|---|
| A | Design system | `src/theme/*`, typo Apple, tokens, icônes/emojis | orchestrateur | `appleTypography.ts`, `typography.ts`, `proDayTextStyle.ts`, `Icon` | En cours |
| B | Coach & Club | `src/features/coach`, `src/features/club`, screens coach/club | orchestrateur | `PressableSpring`, `DataState`, cartes partagées | À venir |
| C | Joueur & Parent | `src/features/joueur`, `src/features/parent`, screens joueur | orchestrateur | shells joueur, `ProfileCompletionBar` | À venir |
| D | Admin plateforme | `src/features/admin`, `src/features/president` (≠ club admin) | orchestrateur | `AdminText`/tokens admin, `OpsDeskStrip` | À venir |
| E | Auth & nav | `src/features/auth`, `src/navigation/*`, membership routing | orchestrateur | `membershipRouting.ts`, `authOverlay.ts` | À venir |
| F | Apparence & responsive | glass/opaque, dark/light, breakpoints | orchestrateur | `liquidGlass.ts`, `useAppearance` | À venir |

## Brief type appliqué à chaque zone

- **Références** : `DESIGN.md`, interfaces Coach/Club approuvées, `docs/proday-quality-inventory.md`.
- **Livrable** : findings `F-XXX` horodatés + corrections + preuve (`tsc`, jest, live).
- **Interdits** : introduire un 2e framework de style, contourner un garde de test, « simuler » un succès, modifier des données réelles.
