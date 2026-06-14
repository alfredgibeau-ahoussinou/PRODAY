# ProDay V3 — Spécification produit par module

**Version** : 1.0 · **Date** : juin 2026  
**Statut** : document de référence avant implémentation  
**Périmètre** : application mobile React Native + Firebase (runtime actif = legacy ; cible = V3)

---

## Principes transverses (tous les modules)

| Principe | Règle V3 |
|----------|----------|
| **Shell UI** | `V3TabShell` : bandeau univers, titre, chips stats, panneau IA section, contenu |
| **Brain** | `useProDayBrain` agrège santé, géo, reco, calendrier, XP, notifs |
| **Multi-cerveaux** | `aiCore.engine` : experts health, geo, social, performance, product, growth, notification → fusion |
| **Événements** | Chaque action utilisateur émet un event analytics + dispatch XP (`actionDispatch`) |
| **Rôles / univers** | Man, Woman, Pro, Santé filtrent onglets, copy et recommandations (`poleExperience`) |
| **Invité** | Parcours Discover séparé ; pas de Brain tant que non connecté |

### Modules obligatoires (brief) vs onglets actuels

| Module brief | Onglet(s) app | Notes |
|--------------|---------------|-------|
| Accueil | `home` | + dashboards rôle (physio, sponsor) |
| Matchs | `matchs` | Hub événement + amicaux |
| Mercato | `recrutement` | Joueur vs staff |
| Réels | `reels` | Centre tab bar |
| Covoiturage | `covoiturage` | Lié `team_events` |
| Shop | `shop` | Stripe + catalogue |
| Profil | `profil` | Auth gate |
| Santé | `sante` | Joueur ; physio = univers Santé |

**Hors brief mais connectés V3** : `messages`, `feed` (Fil communauté).

---

## 1. Accueil

### Vision V3
Cockpit intelligent personnel : l’utilisateur ouvre l’app et sait **quoi faire maintenant** (match, récupération, candidature, message, trajet) sans explorer 7 onglets.

### Parcours utilisateur

| Persona | Parcours principal |
|---------|-------------------|
| **Joueur (Man/Woman)** | Ouverture → Hero IA (état du jour) → action CTA → module cible · scroll : carte santé, matchs proches, progression XP, aperçu réels, calendrier |
| **Staff (Pro)** | Ouverture → priorités staff (convocations, candidatures, annonces) → raccourcis Mercato / Matchs |
| **Physio (Santé)** | Dashboard cabinet : RDV jour, messages patients, agenda |
| **Sponsor** | Campagnes, analytics, raccourcis structures |
| **Invité** | Discover hero → parcours guidé → inscription / connexion (pas de Brain) |

### Écrans

| Écran | Statut actuel | Cible V3 |
|-------|---------------|----------|
| `DiscoverInteractiveHome` | ✅ Invité | Conserver ; CTA gradient univers |
| `DashboardScreen` (legacy) | ✅ Connecté joueur/staff | Remplacer par `HomeIaDashboard` (flag) |
| `HomeIaDashboard` | ⚠️ Existe, non branché | **Écran principal V3** |
| `PhysioDashboardScreen` | ✅ | Aligner shell V3 + Brain santé inversé (patients) |
| `SponsorDashboardScreen` | ✅ | Idem |

**Composants clés V3 (home)** : `HeroIaBlock`, `GeoMapPreview`, `MatchCarousel`, `HealthSummaryCard`, `ProgressionBlock`, `ReelsPreviewStrip`, `TransversalNavBar`, `SmartCalendarPeek`.

### KPIs produit

| KPI | Cible M+3 | Mesure |
|-----|-----------|--------|
| Taux d’action depuis le Hero IA (CTA cliqué / session) | ≥ 35 % | `home_hero_cta_tap` |
| Temps jusqu’à première action utile | < 15 s | funnel analytics |
| DAU avec ≥ 1 module visité via home | ≥ 60 % | parcours |
| Rétention J7 joueurs actifs home | +10 pts vs V2 | cohorte |
| Taux refresh home (pull) | 20–40 % | engagement |

### Dépendances IA

| Moteur | Rôle sur Accueil |
|--------|------------------|
| `aiCore.engine` | Décision Hero : match / repos / social / mercato |
| `healthState.engine` | Carte santé, blocage match intense |
| `recommendation.engine` | Carousel matchs scorés |
| `geoDiscovery` + `geoService` | Carte proximité, densité locale |
| `smartCalendar.engine` | Aperçu semaine unifié |
| `gamification.engine` | Bloc XP / niveau / streak |
| `intelligence.engine` | Briefing texte quotidien |
| `smartNotifications.engine` | Inbox priorisée (aperçu) |

**Experts multi-cerveaux actifs** : health, geo, social, performance, product, growth, notification.

**Données requises** : profil, convocations, matchs à proximité, messages non lus, candidatures, localisation, snapshot santé (charge, fatigue).

---

## 2. Matchs

### Vision V3
Centre de l’activité sportive : découverte, organisation, participation et analyse — avec **compatibilité IA** joueur ↔ match.

### Parcours utilisateur

| Persona | Parcours |
|---------|----------|
| **Joueur** | Onglet Matchs → stats chips → actions rapides → onglet Calendrier / Convocations / Amicaux → RSVP ou accepter match → hub événement (live, composition) |
| **Coach / club** | Créer convocation → gérer effectif → live score → stats saison |
| **Organisateur** | Matchs amicaux : proposer, rechercher, marquer joué |

### Écrans

| Écran | Statut | V3 |
|-------|--------|-----|
| `MatchHomeScreen` | ✅ | Migrer vers `V3TabShell` + `useSectionIntelligence` |
| `MatchPager` + chapitres | ✅ | Calendrier, Centre, Convocations, Stats, Amicaux |
| `MatchEventHubScreen` | ✅ | Live, lineup, effectif, stats |
| `ProposeMatchScreen` / `SearchMatchScreen` | ✅ | Garder ; préremplissage géo IA |
| `CreateTeamEventScreen` | ✅ | Staff |

### KPIs produit

| KPI | Cible M+3 |
|-----|-----------|
| Taux RSVP convocation (oui + peut-être) | ≥ 75 % |
| Matchs amicaux créés / semaine / club actif | baseline +20 % |
| Participation match recommandé par IA (clic → RSVP) | ≥ 25 % des reco |
| Temps hub live actif pendant match | ≥ 8 min |
| Taux no-show après RSVP oui | < 10 % |

### Dépendances IA

| Moteur | Rôle |
|--------|------|
| `recommendation.engine` | Score compatibilité : niveau, distance, charge santé, historique |
| `healthState.engine` | `validateMatchJoin` — bloque / alerte si surcharge ou blessure |
| `geoDiscovery` | Matchs et terrains proches |
| `aiCore` (expert performance, geo) | Priorise onglet Matchs dans Hero |
| `smartCalendar.engine` | Fusion événements équipe + amicaux + objectifs |
| `sectionIntelligence` | Insight section : « 2 convocations sans réponse » |

**Sorties vers autres modules** : déclenchement covoiturage auto, mise à jour charge santé, XP (`rsvp_yes`, `match_played`).

---

## 3. Mercato

### Vision V3
Place de marché sportive intelligente : mise en relation joueurs ↔ clubs ↔ recruteurs avec **scoring de fit** (niveau, perf, régularité, géo).

### Parcours utilisateur

| Persona | Parcours |
|---------|----------|
| **Joueur** | Mercato → annonces filtrées → candidature → suivi statut → messagerie club |
| **Recruteur / club** | Publier annonce → pipeline candidatures → recherche joueurs → favoris |
| **Agent / coach** | Explorer, détections, stages, outils staff |

### Écrans

| Écran | Statut | V3 |
|-------|--------|-----|
| `MercatoScreen` (router) | ✅ | Unifier navigation interne |
| `CandidatureScreen` (joueur) | ✅ | `V3TabShell` + reco annonces |
| `MercatoStaffHome` | ✅ | Staff — déjà modernisé partiellement |
| `RecruitmentPostScreen`, listes joueurs/clubs | ✅ | Garder |
| Alertes mercato | ✅ | `mercatoAlerts.service` |

### KPIs produit

| KPI | Cible M+3 |
|-----|-----------|
| Candidatures / joueur actif / mois | +30 % |
| Taux réponse club (≤ 7 j) | ≥ 40 % |
| Annonces vues → candidature | ≥ 8 % |
| Match IA annonce ↔ profil (score > seuil) → candidature | ≥ 15 % |
| Rétention recruteur (publication ≥ 1 annonce / mois) | ≥ 50 % actifs |

### Dépendances IA

| Moteur | Rôle |
|--------|------|
| `recommendation.engine` | Ranking annonces : poste, niveau, ville, Pulse/CV |
| `socialRecommendation.engine` | Joueurs similaires / clubs proches |
| `aiCore` (expert growth) | Pousse Mercato si 0 candidature |
| `sectionIntelligence` | « 3 annonces correspondent à votre profil » |
| Mistral (serveur) | Vérification documents staff — **hors ranking** |

**Données** : profil joueur, stats saison, `recruitment_posts`, `applications`, géolocalisation, `mercato_alerts`.

---

## 4. Réels

### Vision V3
Réseau de contenu sportif **utile** : motivation, technique, prévention — personnalisé par niveau, objectifs et comportement (pas divertissement seul).

### Parcours utilisateur

| Persona | Parcours |
|---------|----------|
| **Joueur** | Onglet Reels (centre) → flux vertical → like / save → profil auteur → filtre pôle (foot / mercato / santé) |
| **Staff** | Contenu pro / inspiration (sources curatées) |
| **Santé univers** | Pas d’onglet Reels (masqué) |

### Écrans

| Écran | Statut | V3 |
|-------|--------|-----|
| `ReelsScreen` | ✅ | Shell immersif |
| `ReelsFeed` + `ReelSlide` | ✅ | Poles, pagination |
| Résolveurs TikTok / YouTube / Instagram | ✅ | Externe |

**Écart V3** : pas d’UGC ; ranking = seed catalog + ordre fixe.

### KPIs produit

| KPI | Cible M+3 |
|-----|-----------|
| Réels vus / session | ≥ 5 |
| Taux complétion (> 50 % durée) | ≥ 45 % |
| Saves / 100 vues | ≥ 3 |
| Clic profil / source après reel | ≥ 8 % |
| Corrélation reel santé → ouverture module Santé | mesurer uplift |

### Dépendances IA

| Moteur | Rôle |
|--------|------|
| `recommendation.engine` (à étendre) | Score `usefulnessScore` par objectif utilisateur |
| `aiCore` (expert product) | Suggère reel si objectif = technique / récup |
| `healthState.engine` | Priorise contenus prévention si fatigue |
| `actionDispatch` | XP `reel_completed`, `reel_saved` |

**Évolution** : pipeline editorial Firestore + ranking comportemental (historique vues, skips, saves).

---

## 5. Covoiturage

### Vision V3
Mobilité connectée aux **événements** : regroupement automatique des trajets vers le même match / convocation.

### Parcours utilisateur

| Persona | Parcours |
|---------|----------|
| **Joueur convoqué** | Matchs → convocation → covoiturage événement OU onglet Covoit. → réserver place / proposer trajet |
| **Conducteur** | Proposer trajet → points de prise en charge → gestion passagers |
| **Invité** | Prompt connexion |

### Écrans

| Écran | Statut | V3 |
|-------|--------|-----|
| `CarpoolScreen` | ✅ | |
| `CarpoolHomeScreen` | ✅ | |
| `CarpoolEventDetailScreen` | ✅ | Lié event |
| `CarpoolRideCard`, `CarpoolProposeCard` | ✅ | |
| `CarpoolGuestPrompt` | ✅ | |

### KPIs produit

| KPI | Cible M+3 |
|-----|-----------|
| Trajets proposés / événement avec convocations | ≥ 20 % |
| Places réservées / places offertes | ≥ 70 % |
| Taux regroupement IA (suggestion acceptée) | ≥ 15 % (V3) |
| Annulations < 24 h | < 15 % |
| NPS covoiturage | ≥ 40 |

### Dépendances IA

| Moteur | Rôle |
|--------|------|
| `geoDiscovery` + `carpoolGeo` | Proximité conducteurs / passagers |
| `recommendation.engine` | Suggestion trajets optimaux (même event, sens route) |
| `smartCalendar.engine` | Rappel départ synchronisé convocation |
| `aiCore` (expert geo) | Notif « 2 coéquipiers cherchent un trajet » |
| `sectionIntelligence` | Bandeau « Covoit. disponible pour samedi » |

**Lien Matchs** : deep link `onOpenCarpoolForEvent` — **obligatoire** en V3.

---

## 6. Shop

### Vision V3
Boutique **contextuelle** : produits recommandés selon poste, niveau, fréquence, signaux santé (rééducation, prévention).

### Parcours utilisateur

| Persona | Parcours |
|---------|----------|
| **Joueur** | Shop → catalogue par univers → fiche produit → taille → précommande / panier → Stripe |
| **Staff / Santé** | Tenues pro / cabinet (copy adapté `prodayShop`) |
| **Invité** | Gate auth |

### Écrans

| Écran | Statut | V3 |
|-------|--------|-----|
| `ShopScreen` | ✅ | |
| `ShopHomeScreen`, détail, panier | ✅ | |
| `ShopCartSheet`, footer précommande | ✅ | |
| Catalogue `prodayShop.ts` | ⚠️ Statique TS | Cible : Firestore CMS |

### KPIs produit

| KPI | Cible M+3 |
|-----|-----------|
| Visite Shop / MAU | ≥ 25 % |
| Ajout panier / visite | ≥ 12 % |
| Conversion checkout | ≥ 4 % |
| Panier moyen | baseline +15 % avec reco IA |
| Recommandation cliquée → achat | ≥ 10 % |

### Dépendances IA

| Moteur | Rôle |
|--------|------|
| `recommendation.engine` (shop slice) | Produits par poste, univers, saison |
| `healthState.engine` | Bandeau rééducation / prévention |
| `aiCore` (expert product) | CTA shop si équipement manquant détecté |
| `actionDispatch` | XP premier achat |

**Hors scope immédiat** : pricing dynamique ML.

---

## 7. Profil

### Vision V3
Tableau de bord personnel : identité, performances, progression, objectifs, badges, résumé IA — **hub de confiance** (vérification, abonnement).

### Parcours utilisateur

| Persona | Parcours |
|---------|----------|
| **Tous** | Profil → onglets Aperçu / CV / Activité / Réglages → édition → profil public |
| **Joueur** | CV live, galerie, candidatures |
| **Mineur** | Paramètres parentaux, espace tuteur |
| **Staff** | Vérification document, badge vert |
| **Invité** | Redirect `AuthScreen` |

### Écrans

| Écran | Statut | V3 |
|-------|--------|-----|
| `ProfilTabScreen` | ✅ | Auth gate |
| `ProfileHomeScreen` + `ProfileIdentityHeader` | ✅ | Shell V3 |
| `ProfileScreen` (router édition) | ✅ | |
| CV, galerie, abonnement, parental | ✅ | |
| `GuardianPortalScreen` | ✅ | Tuteur |

### KPIs produit

| KPI | Cible M+3 |
|-----|-----------|
| Complétion profil ≥ 80 % | ≥ 55 % joueurs |
| Export CV / mois | +25 % |
| Conversion abonnement Pro depuis profil | baseline +10 % |
| Vérification staff complétée | ≥ 70 % staff actifs |
| Consultation résumé IA profil | ≥ 30 % MAU |

### Dépendances IA

| Moteur | Rôle |
|--------|------|
| `intelligence.engine` | Résumé IA : forces, axes progrès, prochaine action |
| `gamification.engine` | Badges, niveau, défis, streak |
| `healthState.engine` | Synthèse charge / récup (joueur) |
| Mistral | Vérification pièce d’identité / diplômes |
| `prodayPulse` (legacy) | Fusionner avec XP V3 |

**Persistance V3** : `users/{uid}/progression` (Firestore).

---

## 8. Santé

### Vision V3
Pôle le plus avancé : fatigue, récupération, charge, prévention blessures — **influence tout le produit** (matchs, réels, shop, home).

### Parcours utilisateur

| Persona | Parcours |
|---------|----------|
| **Joueur** | Santé → annuaire praticiens → filtre spécialité → RDV ou message → onglet Conseils |
| **Physio / praticien** | Univers Santé : agenda, patients, messagerie, profil cabinet |
| **Autres rôles** | Accès limité ou message pôle santé |

### Écrans

| Écran | Statut | V3 |
|-------|--------|-----|
| `HealthProfessionalsScreen` | ✅ | |
| `HealthHomeScreen` | ✅ | Onglets Annuaire / Conseils |
| `PhysioCarePanel` | ✅ | Shared dashboard + santé |
| `MedicalBookingScreen` | ✅ | |
| `PhysioDashboardScreen` | ✅ | Rôle physio |

### KPIs produit

| KPI | Cible M+3 |
|-----|-----------|
| RDV pris / joueur actif / trimestre | ≥ 15 % |
| Messages vers praticien | +20 % |
| Adhésion plan récupération IA (7 j) | ≥ 25 % |
| Blessure signalée → consultation < 72 h | mesurer délai |
| Corrélation état santé → matchs intenses évités | ≥ 10 % |

### Dépendances IA

| Moteur | Rôle |
|--------|------|
| `healthState.engine` | **Cœur** : OVERLOADED, INJURY_RISK, daily plan |
| `aiCore` (expert health, poids 1.4) | Peut dominer Hero → repos |
| `recommendation.engine` | Praticiens proches + spécialité blessure |
| `intelligence.engine` | Plan personnalisé 7 jours |
| `smartCalendar.engine` | Créneaux récup / RDV |
| `sectionIntelligence` | « Charge élevée — alléger cette semaine » |

**Effets globaux** : `validateMatchJoin`, ranking réels prévention, shop rééducation, notifs repos.

---

## Annexe A — Messages (transversal)

| Parcours | Écrans : `MessagesScreen`, `ChatScreen` |
| KPIs | Taux réponse < 24 h, threads actifs / MAU, conversion message → RDV / candidature |
| IA | expert social, priorité notif, modération mineurs (rules), suggestion réponse rapide (V3+) |

---

## Annexe B — Fil communauté (`feed`)

| Parcours | `FeedTabScreen` → `FeedHomeScreen`, `platform_feed` Firestore |
| KPIs | Posts lus, engagement (like, comment), rétention fil |
| IA | ranking contenu local + intérêts, lien vers Mercato / Matchs |

---

## Annexe C — Calendrier intelligent (transversal)

| Composant | `smartCalendar.engine`, `calendarSync.engine`, `SmartCalendarPeek` |
| Sources | team_events, friendly_matches, RDV médical, objectifs XP |
| KPI | % événements issus de modules synchronisés, rappels utiles (non ignorés) |
| IA | Réorganisation semaine si surcharge santé ; sync device (V3+) |

---

## Matrice dépendances IA × modules

| Moteur | Accueil | Matchs | Mercato | Réels | Covoit. | Shop | Profil | Santé |
|--------|:-------:|:------:|:-------:|:-----:|:-------:|:----:|:------:|:-----:|
| aiCore | ● | ○ | ○ | ○ | ○ | ○ | ○ | ● |
| healthState | ● | ● | ○ | ○ | ○ | ○ | ● | ● |
| recommendation | ● | ● | ● | ● | ● | ● | ○ | ● |
| geoDiscovery | ● | ● | ○ | ○ | ● | ○ | ○ | ○ |
| gamification | ● | ● | ● | ● | ● | ● | ● | ○ |
| smartCalendar | ● | ● | ○ | ○ | ● | ○ | ○ | ● |
| sectionIntelligence | ● | ● | ● | ● | ● | ● | ● | ● |
| smartNotifications | ● | ○ | ○ | ○ | ○ | ○ | ○ | ○ |

● = critique · ○ = contributif

---

## Ordre d’implémentation recommandé (après validation doc)

1. **Socle** : `core/index.ts`, analytics events, feature flag `V3_SHELL`
2. **Accueil** : brancher `HomeIaDashboard`
3. **Matchs + Santé** : boucle health → match (valeur immédiate)
4. **Mercato + Profil** : progression + reco
5. **Covoiturage + Réels + Shop** : graphe complet
6. **Scale** : tests charge, persistance Brain Firestore

---

## Validation

| Rôle | Statut |
|------|--------|
| Produit | Analyse complète : `PRODAY_V3_PRODUCT_ANALYSIS.md` |
| UX / Design | Références apps : `PRODAY_V3_REFERENCE_APPS.md` |
| QA | Checklist : `PRODAY_V3_QA.md` |
| Ops | Déploiement : `PRODAY_V3_DEPLOY.md` |
| Product | ☐ |
| Design | ☐ |
| Tech lead | ☐ |
| Métier sport / santé | ☐ |

**Prochaine étape après validation** : Phase 0 technique (socle `core/`) puis pilote Accueil + Matchs.
