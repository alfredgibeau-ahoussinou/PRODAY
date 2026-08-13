# ProDay V3 — Plan de test manuel

> **Documentation complète** : chaque test doit être **documenté, analysé et justifié** — voir `PRODAY_V3_PRODUCT_ANALYSIS.md` (§8–10).  
> **Références UX** : fusion Strava / TikTok / Uber / WHOOP / Discord — voir `PRODAY_V3_REFERENCE_APPS.md`.

Activation : `EXPO_PUBLIC_V3_SHELL=1` dans `.env`, puis `npx expo start -c`.

Compte test : `alfredgibeauahoussinou@gmail.com` (bypass onboarding si configuré).

## Parcours joueur

1. **Accueil** — bannière bienvenue (1×), Hero IA, matchs scorés, calendrier, notifications, réels.
2. **Matchs** — shell V3, rejoindre un match (+XP `join_match`).
3. **Santé** — réserver un RDV kiné (+XP `book_health`).
4. **Mercato** — candidater, voir score IA sur annonce, mes candidatures (shell V3).
5. **Profil** — compléter à 80 %+ (+XP `complete_profile` une fois).
6. **Réels** — scroll (+XP `view_reel` par vidéo/session).
7. **Messages / Chat** — envoyer un message (+XP `send_message`).
8. **Profil → Réglages** — toggle sync calendrier, « Sync maintenant » (dev build).

## Parcours staff (coach / club / recruteur)

1. **Accueil** — priorités staff (convocations, candidatures, annonces).
2. **Mercato** — shell staff, publier annonce (+XP `publish_mercato`).
3. **Joueurs** — liste triée IA, ouvrir profil (score scouting).
4. **Annonce** — traiter candidature (+XP `review_application`).
5. **Coachs / Agents** — shell V3 liste staff.
6. **Détections** — shell V3, créer/ouvrir une session.
7. **Stages** — shell V3 liste stages.
8. **Favoris** — shell V3 avec scores joueurs.

## Rôles dédiés (hors HomeIaDashboard joueur)

- **Kiné** — `PhysioDashboardScreen` shell V3.
- **Partenaire** — `SponsorOverviewPage` via `SponsorAppShell`.
- **Invité** — Discover + teaser V3 (pas de Brain).

## Persistance Brain

- XP visible après redémarrage app (AsyncStorage + Firestore `users/{uid}/v3_brain/state`).
- Cloud Function `onV3BrainWrite` empêche la régression XP multi-appareils (voir `PRODAY_V3_DEPLOY.md`).

## Critères de sortie

- [ ] Typecheck + tests Jest verts
- [ ] Flag OFF = UI legacy inchangée
- [ ] Flag ON = tous les onglets principaux en shell V3
- [ ] Aucune régression auth / paiement / Firebase
- [ ] Rapport de validation rempli (`PRODAY_V3_PRODUCT_ANALYSIS.md` §10)
