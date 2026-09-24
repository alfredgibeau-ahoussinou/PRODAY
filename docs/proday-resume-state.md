# ProDay — État de reprise (checkpoint)

> Mis à jour avant chaque interruption pour reprendre sans refaire l'audit.

## Session 2026-09-21 — répétition d'acceptance (après audit page-par-page)

### État de départ (vérifié)
- Baseline : `tsc --noEmit` clean · jest **390/390 suites, 2729/2729 tests** green (1 régression hook-order de la session précédente corrigée dans App.tsx : `handleMultiClubChoice` remonté au-dessus de la porte `multi_club`).
- Branche `feat/admin-menu-minimal`, changements d'autres flux préservés.
- Audit antérieur : Zones A–F couvertes (voir `proday-quality-inventory.md`) ; findings corrigés : F-001 (57 accessible names / 41 fichiers), F-004 (tokens typo), multi-club selector livré.
- Test Suites : 1 fichier, X tests... Voir détails dans le journal.
- Préview live : http://localhost:8901 (serveur python3 détaché sur scratch/web-export-current, export Expo web de la session audit — code courant).

### Infrastructure de répétition (en place)
- Club test : `proday_demo_club` « FC ProDay Démo » (mécanisme sanctionné, comptes `isSyntheticUser` isolés).
- Comptes Auth+users rehearsal (`Reh!Accept2026x`) : `rehearsal_player_01`, `rehearsal_coach_01`, `rehearsal_parent_01`, `rehearsal_noclub_01`, `rehearsal_other_01` — **routing réel, jamais vers le club démo** (la règle « aucun vrai compte → SC ProDay Demo » est respectée : `isSyntheticUser` = emails contenant 'demo').
- 3 memberships **pending** répliqués (forme exacte `requestJoin`) : joueur `uO6oKcPGAfpIwC7ihIYR`, coach `V738VgVIWVYI1WPHHM4J`, parent `K2EW9bSLXbgno9gEMTQ4` — équipe Seniors A (`proday_demo_team_seniors`).
- Admin approbation UI : `club.demo@proday.app` (uid `proday_demo_club_owner`, mot de passe démo sanctionné).
- Cleanup ciblé prévu : manifest `scratch/rehearsal-manifest.json` + 3 membership IDs ci-dessus, via le service-account (jamais de suppression large).

### Parcours
1. **Inscription→approbation** : EN COURS — demandes créées (isolation : le wizard in-app cherche dans le registre FFF réel par design ; les demandes sont répliquées avec la forme exacte du service, puis approbation/refus exercés pour de vrai dans l'UI admin).
2. **Séance d'entraînement** : à venir
3. **Match complet** : à venir
4. **Communication/transport** : à venir
5. **Vidéo/AI** : à venir (intégrations Veo/AI réelles attendues bloquées sans accès — à enregistrer honnêtement)
6. **Finances club** : à venir
7. **Navigation/interruptions/cross-device** : à venir
8. **Rapport readiness + démo reproductible** : à venir

### Pièges connus
- `jest.config.js` pinne `maxWorkers: 1` — ne pas paralléliser.
- Ne pas committer, ne pas push, ne pas toucher `.env`, `credentials.json`, `google-services.json`.
- `expo-screen-orientation` mock globalement dans `jest.setup.js`.
- Preview : screenshot non capturable dans cet environnement (pas de compositing de frames) — inspecter via `preview_evaluate`/`preview_snapshot` (DOM+aria) et logs.
- RN-web Pressable ignore les `.click()` synthétiques JS — passer par `preview_click` (pointer events réels) sur les uids du snapshot.
