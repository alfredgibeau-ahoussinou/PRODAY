# ProDay V3 — Analyse produit, documentation et validation complète

**Version** : 1.0 · **Date** : juin 2026  
**Statut** : document de référence équipe produit senior  
**Complète** : `PRODAY_V3_MODULES.md` (spec), `PRODAY_V3_QA.md` (tests), `PRODAY_V3_DEPLOY.md` (ops)  
**Périmètre** : application mobile React Native + Firebase, flag `EXPO_PUBLIC_V3_SHELL=1`

---

# EXIGENCE DE DOCUMENTATION, D’ANALYSE ET DE VALIDATION COMPLÈTE

Je ne souhaite pas uniquement que les fonctionnalités soient développées et testées.

Je souhaite que chaque fonctionnalité, chaque écran, chaque composant, chaque service backend, chaque API, chaque algorithme d’intelligence artificielle et chaque système de l’application fasse l’objet d’une analyse détaillée, documentée et justifiée.

Aucune décision ne doit être prise sans explication.

Aucune fonctionnalité ne doit être créée sans justification.

Aucune amélioration ne doit être proposée sans démontrer son intérêt réel pour l’utilisateur, pour le produit et pour la croissance future de la plateforme.

Pour chaque écran développé, je souhaite obtenir une explication complète comprenant :

* son objectif ;
* le problème qu’il résout ;
* les profils utilisateurs concernés ;
* les actions principales ;
* les actions secondaires ;
* les indicateurs de succès ;
* les risques potentiels ;
* les améliorations possibles ;
* les dépendances avec les autres modules.

Pour chaque fonctionnalité développée, je souhaite connaître :

* pourquoi elle existe ;
* comment elle fonctionne ;
* quels sont les bénéfices utilisateurs ;
* quels sont les bénéfices produit ;
* quelles sont les contraintes techniques ;
* quelles sont les limites actuelles ;
* quelles sont les évolutions futures envisageables.

---

# OBLIGATION D’ANALYSER LES CAS RÉELS D’UTILISATION

Chaque fonctionnalité doit être confrontée à des situations réelles.

Par exemple :

Un utilisateur qui découvre l’application.

Un utilisateur qui n’a jamais joué au football.

Un joueur amateur.

Un joueur confirmé.

Un joueur semi-professionnel.

Un joueur professionnel.

Un recruteur.

Un coach.

Un responsable de club.

Une association sportive.

Une équipe locale.

Pour chaque profil, analyser :

* la compréhension ;
* la simplicité ;
* l’utilité ;
* la rapidité d’exécution ;
* les risques de blocage ;
* les risques d’abandon.

---

# SIMULATION DE VIE COMPLÈTE DE L’APPLICATION

Je souhaite que l’application soit analysée comme si elle existait déjà depuis plusieurs années.

Le système doit être capable de simuler :

* un utilisateur après 1 jour ;
* un utilisateur après 1 semaine ;
* un utilisateur après 1 mois ;
* un utilisateur après 6 mois ;
* un utilisateur après 1 an ;
* un utilisateur après plusieurs années.

L’objectif est d’identifier :

* les problèmes de rétention ;
* les problèmes de lassitude ;
* les problèmes de surcharge ;
* les problèmes de compréhension ;
* les fonctionnalités qui deviennent inutiles ;
* les fonctionnalités qui deviennent essentielles.

---

# ANALYSE DES SCÉNARIOS DE CROISSANCE

Le projet doit être étudié comme s’il allait connaître une forte croissance.

Je souhaite des simulations détaillées avec :

* 100 utilisateurs ;
* 1 000 utilisateurs ;
* 10 000 utilisateurs ;
* 20 000 utilisateurs ;
* 50 000 utilisateurs ;
* 100 000 utilisateurs ;
* 500 000 utilisateurs ;
* 1 million d’utilisateurs.

Pour chaque niveau :

* identifier les limites ;
* identifier les risques ;
* identifier les points de saturation ;
* identifier les besoins techniques futurs ;
* identifier les optimisations nécessaires.

---

# ANALYSE DE TOUS LES ÉCRANS

Je souhaite que chaque écran de l’application soit traité individuellement.

Pas uniquement les écrans principaux.

Je souhaite également l’analyse :

* des écrans de connexion ;
* des écrans d’inscription ;
* des écrans de paramètres ;
* des écrans de notifications ;
* des écrans de recherche ;
* des écrans de filtres ;
* des écrans d’erreurs ;
* des écrans vides ;
* des écrans hors connexion ;
* des écrans de chargement ;
* des écrans de validation ;
* des écrans de paiement ;
* des écrans de profil ;
* des écrans d’administration ;
* des écrans de modération ;
* des écrans de support.

Si un écran nécessaire n’existe pas encore, il doit être proposé et intégré.

---

# ANALYSE DES ÉCHECS POSSIBLES

Je souhaite que le système cherche activement ce qui pourrait échouer.

Par exemple :

* une fonctionnalité peu utilisée ;
* une fonctionnalité mal comprise ;
* un écran trop complexe ;
* une navigation confuse ;
* un système IA peu pertinent ;
* une surcharge de notifications ;
* une baisse de performance ;
* une surcharge serveur ;
* une mauvaise expérience mobile.

Chaque risque identifié doit être accompagné :

* d’une explication ;
* d’un niveau de gravité ;
* d’une solution recommandée.

---

# ANALYSE CONTINUE ET AMÉLIORATION PERMANENTE

Le projet ne doit jamais être considéré comme terminé.

Chaque fonctionnalité doit être conçue pour être mesurée, analysée et améliorée dans le temps.

Le système doit toujours chercher :

* ce qui peut être simplifié ;
* ce qui peut être accéléré ;
* ce qui peut être automatisé ;
* ce qui peut être rendu plus intelligent ;
* ce qui peut être rendu plus utile.

---

# CONSIGNE FINALE ABSOLUE

Je souhaite que ProDay V3 soit conçu comme si une équipe composée des meilleurs Product Managers, UX Designers, UI Designers, Architectes Logiciels, Développeurs Seniors, Experts IA, Experts Data, Experts Scalabilité, Experts Mobile et Experts Performance travaillait sur le projet à temps plein.

Ne vous limitez jamais à ce qui est explicitement écrit.

Analysez l’ensemble du produit.

Détectez les éléments manquants.

Ajoutez les systèmes nécessaires.

Proposez des améliorations.

Testez toutes les hypothèses.

Simulez tous les scénarios réalistes.

Documentez toutes les décisions.

Justifiez toutes les recommandations.

Optimisez chaque détail.

Et construisez ProDay V3 comme un produit capable de devenir une référence mondiale dans le domaine du sport, de la performance, de la santé, du social, de la géolocalisation et de l’intelligence artificielle.

---

# PARTIE APPLIQUÉE — ANALYSE PRODAY V3 (ÉTAT JUIN 2026)

> Cette section applique le cadre ci-dessus au code réellement livré (phases 0–14), avec justifications, limites et recommandations mesurables.

## 1. Synthèse exécutive

| Dimension | État actuel | Justification |
|-----------|-------------|---------------|
| **Architecture V3** | Socle Brain + shell UI unifié (`V3TabShell`) derrière flag | Réduit la fragmentation UX legacy ; activation progressive sans casser la prod |
| **IA produit** | 10 experts simulés (`aiCore.engine`) + moteurs sectionnels | Décisions explicables (poids, raison, onglet cible) — pas de boîte noire opaque |
| **Gamification** | 8 actions XP tracées + persistance AsyncStorage/Firestore | Rétention early-stage ; Cloud Function anti-régression (non déployée : plan Blaze requis) |
| **Couverture écrans** | ~100 écrans ; 8 onglets principaux en shell V3 ; sous-écrans Mercato/staff en cours de convergence | Suffisant pour bêta fermée ; lacunes sur erreur/offline/modération |
| **Tests automatisés** | 201 tests Jest, typecheck OK | Couvre moteurs et règles métier ; pas de E2E Detox/Maestro |
| **Frontend web** | Expo web fonctionnel ; Reels corrigés (iframe vs WebView) | Web = vitrine QA, pas canal principal ; natif recommandé |

**Décision clé documentée** : le flag `EXPO_PUBLIC_V3_SHELL=1` isole V3 du legacy. **Pourquoi** : permettre QA parallèle, rollback instantané, déploiement progressif. **Risque** : double maintenance temporaire. **Mitigation** : critères de sortie QA (voir §8).

---

## 2. Architecture système — justification des choix

### 2.1 Brain (`useProDayBrain` + `brainState.service`)

| Question | Réponse documentée |
|----------|-------------------|
| **Pourquoi** | Unifier santé, géo, reco, calendrier, XP, notifs en un état cohérent pour le Hero IA et les panneaux section |
| **Comment** | Agrégation locale + snapshot Firestore `users/{uid}/v3_brain/state` ; mapper `brainState.mapper` |
| **Bénéfice utilisateur** | Une seule « voix » produit : « repos », « match proche », « candidature en attente » |
| **Bénéfice produit** | Funnel analytics centralisé ; base pour personnalisation future |
| **Contraintes** | Latence Firestore ; dépendance profil complet ; géo optionnelle |
| **Limites** | Pas de ML entraîné ; heuristiques + poids experts |
| **Évolution** | Modèles supervisés sur events `trackV3Event` ; A/B sur poids experts |

### 2.2 Multi-cerveaux (`aiCore.engine`)

| Expert | Poids | Justification du poids |
|--------|-------|------------------------|
| health | 1.4 | Prévention blessure = confiance plateforme ; risque réputation si ignoré |
| performance | 1.2 | Match = cœur métier foot |
| geo | 1.1 | Densité locale = activation territoriale |
| product / social / notification / growth / data / ux / ui | 0.7–1.0 | Influence contextuelle, jamais dominante seule |

**Décision** : en cas d’égalité, priorité santé > match > mercato. **Justification** : alignement éthique sport-santé et différenciation vs apps « match only ».

### 2.3 Dispatch XP (`actionDispatch` + `recordV3Action`)

| Action | Pourquoi récompensée | KPI associé |
|--------|---------------------|-------------|
| `join_match` | Activation sportive | RSVP / match rejoint |
| `book_health` | Boucle santé | RDV kiné / trimestre |
| `complete_profile` | Qualité données Mercato | % profils > 80 % |
| `publish_mercato` | Offre côté staff | Annonces actives |
| `review_application` | Réactivité recrutement | Délai traitement candidature |
| `view_reel` | Engagement contenu | Reels/session |
| `send_message` | Graphe social | Threads actifs |
| `open_mercato` | Intent recrutement | Entrées Mercato |

**Limite actuelle** : pas de plafond anti-farming sur `view_reel`. **Recommandation** : 1 XP/reel unique/jour (gravité moyenne, voir registre §7).

### 2.4 Services backend (inventaire critique)

| Service | Rôle | Dépendances modules |
|---------|------|---------------------|
| `recruitment.service` | Annonces, candidatures | Mercato, messages |
| `teamEvents.service` | Convocations, live | Matchs, calendrier |
| `medicalAppointments.service` | RDV kiné | Santé, notifications |
| `friendlyMatches.service` | Matchs amicaux | Matchs, géo |
| `platformFeed.service` | Fil communauté | Feed, social |
| `brainState.service` | Persistance Brain | Tous onglets V3 |
| `deviceCalendar.service` | Sync calendrier natif | Matchs, santé (dev build) |
| `shopPayment.service` / `shopOrders.service` | Stripe | Shop |
| `reelResolver.service` | Playback multi-source | Réels |

---

## 3. Fiches écrans — onglets principaux V3

> Format : objectif · problème · personas · actions · KPI · risques · améliorations · dépendances

### 3.1 Accueil — `HomeIaDashboard`

| Champ | Analyse |
|-------|---------|
| **Objectif** | Cockpit « quoi faire maintenant » en < 15 s |
| **Problème résolu** | Dispersion entre 8 onglets ; charge cognitive |
| **Personas** | Joueur Man/Woman, staff Pro, physio, sponsor |
| **Actions principales** | CTA Hero IA, carousel matchs, carte santé, priorités staff |
| **Actions secondaires** | Pull refresh, rayon géo, aperçu réels/calendrier/notifs |
| **KPI succès** | `home_hero_cta_tap` ≥ 35 %, première action < 15 s |
| **Risques** | Hero trop verbeux ; staff/joueur même layout partiel | **Gravité** : moyenne |
| **Améliorations** | Segmentation Hero par rôle plus stricte ; empty states guidés |
| **Dépendances** | `aiCore`, `healthState`, `recommendation`, `staffHome`, `smartCalendar`, `smartNotifications` |

**Justification livraison** : remplace `DashboardScreen` legacy — seul écran où la valeur V3 est immédiatement perceptible.

### 3.2 Matchs — `MatchsScreen` + pager

| Champ | Analyse |
|-------|---------|
| **Objectif** | Découvrir, organiser, participer à l’activité sportive |
| **Problème** | Coordination convocations + amicaux + stats éparpillés |
| **Personas** | Joueur, coach, club, organisateur |
| **Actions principales** | RSVP, rejoindre match, hub événement live |
| **Actions secondaires** | Proposer/rechercher match, créer convocation |
| **KPI** | RSVP ≥ 75 %, match rejoint/session |
| **Risques** | `validateMatchJoin` bloque sans explication claire | **Gravité** : haute |
| **Améliorations** | Modal explicative santé avant blocage ; preview lineup |
| **Dépendances** | `healthState`, `teamEvents`, `friendlyMatches`, XP `join_match` |

### 3.3 Mercato — `MercatoScreen` + sous-écrans

| Champ | Analyse |
|-------|---------|
| **Objectif** | Mettre en relation offre (staff) et talent (joueur) |
| **Problème** | Recrutement amateur fragmenté (WhatsApp, bouche-à-oreille) |
| **Personas** | Joueur amateur→semi-pro, recruteur, coach, agent, club |
| **Actions principales** | Candidater, publier annonce, traiter candidature, scouting |
| **Actions secondaires** | Favoris, stages, détections, coachs/agents |
| **KPI** | Candidatures/post, délai review, conversion message |
| **Risques** | Score IA scouting perçu comme « boîte noire » | **Gravité** : moyenne |
| **Améliorations** | Tooltip critères scoring (`playerScouting.engine`) ; filtres sauvegardés |
| **Dépendances** | `mercatoStaff`, `mercatoPostDetail`, `playerScouting`, `recruitment.service` |

**Sous-écrans V3 shell (staff)** : `CoachesListScreen`, `FavoritesListScreen`, `DetectionEventsScreen`, `StagesListScreen`, `CoachProfileScreen`, `PlayersListScreen`, `CreateRecruitmentPostScreen`, `RecruitmentPostScreen`.

**Sous-écrans V3 shell (joueur)** : `MyApplicationsScreen`, `PlayerProfileScreen`, `CandidatureScreen`.

### 3.4 Réels — `ReelsScreen` / `ReelsFeed`

| Champ | Analyse |
|-------|---------|
| **Objectif** | Inspiration, culture foot, rétention session |
| **Problème** | Absence de contenu natif à l’échelle d’un club local |
| **Personas** | Tous ; particulièrement joueur 16–28 ans |
| **Actions principales** | Scroll vertical, like, bookmark, partage |
| **Actions secondaires** | Filtre pôle (Foot/Mercato/Santé), ouverture profil source |
| **KPI** | Reels vus/session, `view_reel` XP, bookmark rate |
| **Risques** | Dépendance sources externes (IG/YT/TikTok) ; CORS web | **Gravité** : moyenne |
| **Améliorations** | Catalogue Pexels propriétaire ; upload club (UGC modéré) |
| **Dépendances** | `reelsRanking.engine`, `reelResolver`, `footballReels` seed |

**Décision documentée (juin 2026)** : iframe natif sur web au lieu de `WebView`. **Justification** : compatibilité `react-native-web` ; **limite** : autoplay variable selon navigateur.

### 3.5 Santé — `MedicalBookingScreen` + `PhysioDashboardScreen`

| Champ | Analyse |
|-------|---------|
| **Objectif** | Accès soins et prévention blessures |
| **Problème** | Fracture entre performance et récupération |
| **Personas** | Joueur, kiné, blessé, parent U13 |
| **Actions principales** | Réserver RDV, gérer agenda cabinet |
| **KPI** | RDV/trimestre, corrélation repos→match évité |
| **Risques** | Peu de kinés inscrits = empty state | **Gravité** : haute (cold start) |
| **Améliorations** | Onboarding B2B praticiens ; téléconsultation |
| **Dépendances** | `healthState.engine` (poids 1.4), `medicalAppointments` |

### 3.6 Covoiturage — `CarpoolScreen`

| Champ | Analyse |
|-------|---------|
| **Objectif** | Réduire friction logistique vers matchs/événements |
| **Problème** | No-show, retards, coût transport jeunes |
| **Personas** | Joueur, parent, coach |
| **KPI** | Trajets proposés/acceptés, complétion |
| **Risques** | Responsabilité légale covoit | **Gravité** : haute juridique |
| **Améliorations** | CGU trajet + assurance partenaire ; trust score |
| **Dépendances** | `carpoolGeo.engine`, `team_events` |

### 3.7 Shop — `ShopScreen` / `ShopHomeScreen`

| Champ | Analyse |
|-------|---------|
| **Objectif** | Monétisation et équipement officiel |
| **Problème** | Découverte produits dispersée |
| **KPI** | Conversion, panier, réachat |
| **Risques** | Shop perçu hors-sujet pour joueur amateur | **Gravité** : moyenne |
| **Dépendances** | `shopRecommendation.engine`, Stripe |

### 3.8 Profil — `ProfilTabScreen` + satellites

| Champ | Analyse |
|-------|---------|
| **Objectif** | Identité, réglages, progression, conformité |
| **Problème** | Profils incomplets = Mercato inutile |
| **Actions** | Édition, CV, vérification, abonnement, `V3PreferencesCard` |
| **KPI** | Complétion ≥ 80 %, rétention réglages |
| **Dépendances** | XP `complete_profile`, `v3Preferences.service` |

### 3.9 Invité — `DiscoverScreen` + deck

| Champ | Analyse |
|-------|---------|
| **Objectif** | Convertir visiteur → compte |
| **Problème** | Churn avant inscription |
| **Décision** | Pas de Brain invité — **justification** : pas de données pour personnaliser ; évite fausses promesses IA |
| **KPI** | Taux inscription depuis Discover, temps jusqu’à signup |
| **Risques** | Teaser IA sans personnalisation = déception post-login | **Gravité** : moyenne |

---

## 4. Fiches écrans — transversaux et secondaires

### 4.1 Auth & onboarding

| Écran | Objectif | Risque principal | Gravité | Recommandation |
|-------|----------|------------------|---------|----------------|
| `AuthScreen` | Connexion email/Google | Friction OAuth web | Moyenne | Bouton Apple natif iOS |
| `SignupFlow` (12 étapes) | Qualification rôle/espace | Abandon long funnel | **Haute** | Progress bar + sauvegarde brouillon |
| `ForgotPasswordScreen` | Récupération compte | Email non reçu | Moyenne | Statut envoi explicite |
| `EmailVerificationScreen` | Conformité | Blocage compte test | Faible | Bypass bêta documenté |
| `OnboardingDocumentsScreen` | KYC mineurs/staff | Complexité perçue | Haute | Checklist par rôle |

### 4.2 Messages & social

| Écran | KPI | Risque | Recommandation |
|-------|-----|--------|----------------|
| `MessagesScreen` | Réponse < 24 h | Boîte noire | Priorité notif `notificationPriority.engine` |
| `ChatScreen` | Conversion RDV/candidature | Modération | Filtres mineurs + signalement |
| `FeedTabScreen` | Engagement fil | Bruit faible | Ranking `feedRanking.engine` |

### 4.3 Paiement & abonnement

| Écran | Risque | Gravité |
|-------|--------|---------|
| `SubscriptionScreen` | Confusion plans multi-univers | Moyenne |
| `MyPaymentsScreen` | Historique incomplet | Moyenne |

### 4.4 Admin & conformité

| Écran | État | Lacune |
|-------|------|--------|
| `AdminGateScreen` + pages | Existe | Pas de shell V3 ; usage interne OK |
| `LegalDocumentScreen` | Existe | Pas de version trackée par user |
| `ParentalControlScreen` | Existe | UX dense pour parent non-tech |

### 4.5 États système — lacunes identifiées

| Type d’écran | Existe ? | Proposition |
|--------------|----------|-------------|
| Erreur réseau global | Partiel (`DataState`) | **`NetworkErrorScreen`** dédié avec retry |
| Hors ligne | Non | **`OfflineModeScreen`** + queue actions |
| Empty générique | Partiel | **`EmptyStateCatalog`** unifié par module |
| Chargement skeleton | Oui (`SkeletonList`) | Étendre à Mercato listes |
| Modération contenu | Non (signalement mailto) | **`ReportContentScreen`** in-app |
| Support | Non | **`HelpCenterScreen`** + chat support |
| Notifications inbox | Aperçu (`SmartNotificationsPeek`) | **`NotificationsCenterScreen`** plein écran |
| Recherche globale | Par module | **`GlobalSearchScreen`** cross-modules |

---

## 5. Analyse par personas — cas réels d’utilisation

Légende : Compréhension / Simplicité / Utilité / Rapidité (1–5) · Blocage / Abandon (Faible/Moyen/Élevé)

| Persona | Parcours type | C | S | U | R | Blocage | Abandon | Commentaire justifié |
|---------|---------------|---|---|---|---|---------|---------|----------------------|
| **Découverte (invité)** | Discover → Reels guest → signup | 4 | 4 | 3 | 5 | Moyen | Moyen | Valeur claire ; signup encore long |
| **Jamais joué** | Signup → Home → Santé | 3 | 3 | 2 | 3 | **Élevé** | **Élevé** | Copy foot-centric ; besoin onboarding « découverte sport » |
| **Joueur amateur** | Home → Matchs amicaux → Mercato | 4 | 4 | 5 | 4 | Faible | Faible | Sweet spot produit actuel |
| **Joueur confirmé** | Mercato + CV + messages | 4 | 3 | 5 | 3 | Moyen | Moyen | Profil/CV trop longs sans aide IA |
| **Semi-pro** | Scouting + stages + vérif | 3 | 3 | 5 | 3 | Moyen | Moyen | Crédibilité = vérification + données |
| **Professionnel** | Réseau staff + messages | 3 | 2 | 4 | 4 | Moyen | **Élevé** | Attentes LinkedIn-level non couvertes |
| **Recruteur** | Staff home → review candidatures | 4 | 4 | 5 | 4 | Faible | Faible | Priorités staff = bon levier |
| **Coach** | Convocations + détections | 4 | 3 | 5 | 3 | Moyen | Faible | Hub match dense mais complet |
| **Responsable club** | Annonces + stages + finance | 3 | 3 | 4 | 3 | Moyen | Moyen | Finance club peu visible |
| **Association / équipe locale** | Événements équipe | 4 | 4 | 4 | 4 | Faible | Faible | Covoit + convocations = ROI local |
| **Kiné** | Physio dashboard | 4 | 4 | 4 | 4 | Faible | Faible | Univers Santé cohérent |
| **Sponsor** | Campagnes | 3 | 3 | 3 | 3 | Moyen | Moyen | Besoin ROI campagne plus visible |
| **Parent U13** | Contrôle parental + gardien | 3 | 2 | 4 | 2 | **Élevé** | Moyen | Parcours sécurité critique mais dense |

**Synthèse** : ProDay V3 est **optimal** pour joueur amateur→confirmé et staff local. **Sous-optimisé** pour non-footballeur, pro élite, parent — nécessite parcours dédiés (roadmap §9).

---

## 6. Simulation de vie — rétention dans le temps

| Horizon | État utilisateur | Fonctionnalités essentielles | Fonctionnalités lassantes | Risque rétention | Action recommandée |
|---------|------------------|------------------------------|---------------------------|------------------|-------------------|
| **J1** | Onboarding, exploration | Hero IA, Réels, signup | Documents KYC | Abandon funnel | Raccourcir signup ; différer docs non critiques |
| **J7** | Première convocation ou candidature | Matchs, Mercato, notifs | Shop | Si aucune action sociale → churn | Push « première action » personnalisée |
| **M1** | Habitude hebdo | Calendrier, messages, XP | Réels répétitifs (mêmes seeds) | Lassitude contenu | Rotation seeds + UGC club |
| **M6** | Routine établie | Santé + matchs + réseau | XP sans récompense tangible | Gamification stérile | Récompenses réelles (badges, visibilité Mercato) |
| **An 1** | Power user ou dormant | Convocations récurrentes | Trop de notifs | Surcharge | Digests hebdo ; mute granulaire |
| **An 3+** | Alumni / staff | Historique carrière, stats | IA heuristique identique | Perte confiance IA | ML personnalisé ; « bilan saison » |

**Fonctionnalités qui deviennent essentielles avec le temps** : calendrier unifié, messages, réputation (avis coach), historique matchs.

**Fonctionnalités qui peuvent devenir inutiles** : bannière bienvenue V3, XP si pas de progression visible, réels génériques sans lien local.

---

## 7. Scénarios de croissance — limites et saturation

| Échelle | MAU estimé | Limite actuelle | Risque | Besoin technique | Optimisation |
|---------|------------|-----------------|--------|------------------|--------------|
| **100** | 100 | Aucune | Faible | — | QA manuelle suffisante |
| **1 000** | 1k | Firestore reads Brain/user | Faible | Cache local Brain | Batch writes snapshot |
| **10 000** | 10k | Liste joueurs Mercato non paginée côté UI | Moyenne | Pagination + index composites | Lazy load `PlayersListScreen` |
| **20 000** | 20k | Résolution reels (API externes) | Moyenne | CDN proxy reels | Cache `reelResolver` |
| **50 000** | 50k | `onV3BrainWrite` non déployé | **Haute** | Déployer CF + règles | Plan Blaze Firebase |
| **100 000** | 100k | Feed `platform_feed` full scan | Haute | Fan-out / ranking serveur | Cloud Function ranking |
| **500 000** | 500k | Stripe + stock shop | Haute | Webhooks idempotents | Queue commandes |
| **1 M** | 1M | Firestore hot documents (stats) | **Critique** | Sharding régional ; BQ analytics | Migrer analytics → BigQuery |

**Point de saturation le plus proche** : **50k users** sans Cloud Functions Brain et pagination aggressive. **Justification** : writes concurrents sur `v3_brain/state` + listes Mercato complètes en mémoire.

---

## 8. Registre des échecs possibles

| ID | Risque | Explication | Gravité | Solution | Owner |
|----|--------|-------------|---------|----------|-------|
| R01 | IA peu pertinente | Heuristiques statiques | Moyenne | Feedback « Cette reco utile ? » + tuning poids | Produit + Data |
| R02 | Signup trop long | 12 étapes | **Haute** | Signup progressif 3 temps + complétion in-app | UX |
| R03 | Notif fatigue | `smartNotifications` sans cap | Moyenne | Max 2 push/jour + digest | Mobile |
| R04 | Mercato vide (région) | Cold start géo | **Haute** | Seed annonces + partenariats ligues | Growth |
| R05 | Réels dépendance IG/YT | API / embed fragile | Moyenne | Pexels + upload modéré | Contenu |
| R06 | Web ≠ mobile | Expo web limité (calendrier, biométrie) | Faible | Doc « dev build requis » | Docs |
| R07 | XP farming | `view_reel` répété | Moyenne | Unicité journalière | Backend |
| R08 | Performance FlatList | 100+ items Mercato | Moyenne | `getItemLayout` + memo | Mobile |
| R09 | RGPD covoit | Responsabilité trajets | **Haute** | CGU + assurance | Juridique |
| R10 | Double UI legacy/V3 | Flag mal géré | Moyenne | Checklist release QA § `PRODAY_V3_QA.md` | QA |

---

## 9. Décisions documentées — phases 0 à 14

| Phase | Livrable | Pourquoi | Alternative écartée | Preuve |
|-------|----------|----------|---------------------|--------|
| 0 | Socle Brain + flag | Activation sans risque | Big bang rewrite | `corePhase0.test.ts` |
| 1–2 | Home + matchs/santé | Boucle valeur immédiate | Mercato d’abord | `phase1HealthMatch.test.ts` |
| 3–5 | Mercato, persistance, feed | Graphe social-recrutement | — | `phase5Modules.test.ts` |
| 6–8 | Staff, chat IA, social | Rétention B2B staff | — | `phase8SocialDiscover.test.ts` |
| 9 | Polish XP + notifs | Mesure engagement | — | `phase9Polish.test.ts` |
| 10–11 | Staff Mercato + XP staff | Monétisation B2B future | — | `phase10/11*.test.ts` |
| 12 | Création annonce + calendrier | Fermer boucle staff | — | `phase12MercatoCalendar.test.ts` |
| 13 | Scouting IA | Différenciation Mercato | Tri manuel seul | `phase13StaffScouting.test.ts` |
| 14 | Sous-écrans shell + docs QA | Cohérence UX V3 | Laisser legacy sous-écrans | `phase14V3Closure.test.ts` |

---

## 10. Obligation de validation — critères mesurables

Chaque release V3 doit produire un **rapport de validation** (template) :

```markdown
## Release V3.x — Rapport de validation
- Date / version / flag ON-OFF
- Tests auto : Jest ___/___ · tsc OK/KO
- Parcours joueur : ___/8 OK (détail par étape)
- Parcours staff : ___/8 OK
- Régressions : liste
- KPI spot-check : hero CTA, RSVP, candidatures
- Risques ouverts : IDs R__
- Décision : GO / NO-GO + justification
```

**État juin 2026** :

| Critère | Résultat | Justification |
|---------|----------|---------------|
| Jest + tsc | ✅ 201 tests, tsc OK | CI locale verte |
| Flag OFF legacy | ✅ Non régressé par design | Branchement conditionnel |
| Flag ON shell principal | ✅ 8 onglets | `V3TabShell` sur tabs |
| Sous-écrans Mercato | ✅ Convergés staff/joueur | Phase 14 |
| Cloud Function Brain | ❌ Non déployé | Plan Blaze requis |
| QA manuelle connectée | ⏳ En attente | Compte test — mot de passe hors repo |

---

## 11. Améliorations priorisées — avec justification ROI

| Priorité | Amélioration | Utilisateur | Produit | Croissance | Effort |
|----------|--------------|-------------|---------|------------|--------|
| P0 | Déployer `onV3BrainWrite` | XP fiable multi-device | Confiance | Rétention | Faible |
| P0 | Signup en 3 temps | -60 % abandon estimé | +conversion | +MAU | Moyen |
| P1 | `NotificationsCenterScreen` | Contrôle notifs | -churn | Engagement | Moyen |
| P1 | Pagination Mercato | Perf listes | Scale 10k+ | Rétention staff | Faible |
| P1 | Explication score scouting | Transparence IA | Confiance Mercato | Différenciation | Faible |
| P2 | UGC reels club | Contenu local | Temps session | Viralité locale | Élevé |
| P2 | `GlobalSearchScreen` | Découverte | Cross-sell modules | SEO in-app | Élevé |
| P3 | ML ranking (vs heuristiques) | Pertinence | LTV | Scale 100k+ | Très élevé |

---

## 12. Analyse continue — métriques à instrumenter

| Module | Event clé | Dashboard |
|--------|-----------|-----------|
| Accueil | `home_hero_cta_tap` | Amplitude / Firebase |
| Matchs | `match_join`, `rsvp_submit` | idem |
| Mercato | `application_submit`, `review_application` | idem |
| Réels | `reel_view`, `reel_saved` | idem |
| Santé | `health_booking` | idem |
| Brain | `brain_snapshot_write` | Monitoring CF |

**Règle** : aucune feature V3+ sans event analytics et hypothèse KPI documentée dans ce fichier ou `PRODAY_V3_MODULES.md`.

---

## 13. Références croisées

| Document | Rôle |
|----------|------|
| `PRODAY_V3_MODULES.md` | Spec fonctionnelle par module + KPI cibles |
| `PRODAY_V3_QA.md` | Checklist exécution tests manuels |
| `PRODAY_V3_DEPLOY.md` | Flag, Cloud Functions, build natif |
| `PRODAY_V3_REFERENCE_APPS.md` | Fusion UX Strava/TikTok/Uber/WHOOP/Discord… |
| **Ce document** | Analyse, justification, personas, croissance, risques |

---

## 14. Consigne opérationnelle pour l’équipe

1. **Avant chaque PR V3** : mettre à jour la fiche écran concernée (§3 ou §4) si comportement ou KPI change.
2. **Avant chaque release** : remplir le rapport §10.
3. **Chaque mois** : revue registre risques §7 + simulation rétention §6.
4. **Chaque trimestre** : revue scénarios croissance §7 et révision priorités §11.

*ProDay V3 n’est pas un livrable figé — c’est un système produit mesuré, expliqué et amélioré en continu.*
