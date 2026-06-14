# ProDay V3 — Applications références et fusion UX intelligente

**Version** : 1.0 · **Date** : juin 2026  
**Statut** : document de référence design produit + architecture UX  
**Complète** : `PRODAY_V3_MODULES.md`, `PRODAY_V3_PRODUCT_ANALYSIS.md`  
**Vision** : *« Strava + TikTok + Uber + WHOOP + Discord, centré football et sport réel »*

---

## Règle absolue — ce qu’on copie (et ce qu’on ne copie pas)

| ✅ À reprendre | ❌ À ne pas reprendre |
|---------------|----------------------|
| Logiques UX | Identité visuelle (couleurs, logos, layouts pixel-perfect) |
| Patterns d’usage | Composants propriétaires (kudos Strava, stories IG…) |
| Mécaniques d’engagement | Marque déposée / copy exacte |
| Systèmes de recommandation | Fonctionnalités hors périmètre foot/sport réel |

**Justification** : ProDay doit être **reconnaissable** (Neo Sport, univers Man/Woman/Pro/Santé) tout en bénéficiant des meilleures mécaniques produit mondiales. La différenciation = football local + staff vérifié + santé intégrée.

---

## Matrice de fusion — référence → ProDay V3

Légende **maturité** : 🟢 Implémenté · 🟡 Partiel · 🔴 À construire

| Référence | Pattern clé | Module ProDay | Code / composant actuel | Maturité | Écart principal |
|-----------|-------------|---------------|-------------------------|----------|-----------------|
| **Strava** | Feed activité, cartes perf, progression | Matchs + Accueil + Profil | `MatchCarousel`, `ProgressionBlock`, `gamification.engine` | 🟡 | Pas de « fil d’activités » unifié post-match |
| **Nike Training Club** | Programmes guidés par objectif | Santé | `healthState.engine` (hints), `MedicalBookingScreen` | 🟡 | Pas de parcours 7/14/30 jours structuré |
| **WHOOP** | Recovery score, readiness, reco auto | Santé + Brain | `fatigueScore`, `recoveryScore`, `aiCore` (poids 1.4) | 🟡 | Données biométriques absentes ; heuristiques |
| **Instagram** | Scroll vertical, interactions rapides | Réels | `ReelsFeed`, `ReelSlide`, like/bookmark/share | 🟢 | Contenu majoritairement externe (embed) |
| **TikTok** | Reco IA, scroll infini, personnalisation | Réels + Brain | `reelsRanking.engine`, `useReelsPlaylist` | 🟡 | Pas de ML ; pas de feedback loop utilisateur |
| **OneFootball** | Matchs temps réel, données structurées | Matchs | `MatchEventHubScreen`, `EventLiveStatsScreen` | 🟡 | Live score limité aux événements internes |
| **Playtomic** | Matchmaking + réservation + géo | Matchs + Covoit. | `SearchMatchScreen`, `ProposeMatchScreen`, `friendlyMatches` | 🟡 | Pas de réservation terrain intégrée |
| **Uber** | Matching géo, ETA, UX trajet | Covoiturage | `CarpoolScreen`, `carpoolGeo.engine` (stub) | 🔴 | Moteur géo covoit vide ; pas d’ETA |
| **Google Maps** | Carte fluide, clustering, recherche locale | Accueil + Géo | `GeoMapPreview`, `geoService.buildGeoMarkers` | 🟡 | Pas de clustering ; marqueurs basiques |
| **WhatsApp** | Chat instantané simple | Messages | `ChatScreen`, `messages.service` | 🟢 | Groupes équipe perfectibles |
| **Discord** | Communautés / serveurs structurés | Feed + Équipes | `FeedTabScreen`, `TeamManagementScreen` | 🟡 | Pas de « serveurs » par club/ligue |
| **Notion** | Dashboard modulaire structuré | Profil joueur | `PlayerProfileScreen`, `PlayerCvEditorScreen` | 🟡 | CV riche mais pas modulaire type blocs |

---

## 1. 🏃 Sport / Performance / Santé

### Strava → Matchs = activités · Progression = performance tracking

**Patterns à reprendre**

| Pattern Strava | Traduction ProDay | Justification utilisateur | Justification produit |
|----------------|-------------------|---------------------------|----------------------|
| Feed d’activités | Timeline « Mes matchs / convocations / stats » | Sentiment de progression visible | Rétention J7+ ; contenu pour le fil |
| Cartes de performance | Fiche post-match (buts, passes, note) | Valorisation effort | Données Mercato (preuve niveau) |
| Segments / défis | Défis locaux (ex. « 3 matchs ce mois ») | Gamification sociale | XP + engagement récurrent |
| Aspect social | Kudos équipe → « Respect » / « MVP » | Renforcement lien équipe | Viralité intra-club |

**État code**

- ✅ `ProgressionBlock` (XP, niveau, streak)
- ✅ `MatchCarousel` + `buildMatchRecommendations`
- ✅ Stats saison profil joueur
- 🔴 Feed activité unifié post-match
- 🔴 Défis / segments géolocalisés

**Recommandation P1** : `ActivityFeedEngine` — agrège `team_events`, `friendly_matches`, stats → cartes type Strava dans Accueil + Profil. **ROI** : +rétention, alimente Mercato (CV vivant).

---

### Nike Training Club → Santé = coach IA structuré

**Patterns à reprendre**

| Pattern NTC | Traduction ProDay | Module |
|-------------|-------------------|--------|
| Programmes par objectif | « Retour blessure », « Prépa match », « Mobilité » | Santé |
| Routines courtes | Plans 10–20 min guidés | Santé + Réels pôle Santé |
| UX motivante | Progression jour 1/7, coche séance | `HealthSummaryCard` étendu |

**État code**

- ✅ `healthState.engine` → `dailyPlanHint`, `coachMessage`
- ✅ `MedicalBookingScreen` (RDV kiné)
- 🔴 Parcours multi-jours avec contenu structuré
- 🔴 Vidéos exercices propriétaires (vs seeds reels)

**Recommandation P1** : `HealthProgramEngine` — 3 programmes MVP (récup / prépa / prévention) × 7 jours, liés à `recoveryScore`. **ROI** : différenciation WHOOP-lite accessible amateur.

---

### WHOOP → Santé = IA prédictive · Fatigue = score central

**Patterns à reprendre**

| Pattern WHOOP | Traduction ProDay | État |
|---------------|-------------------|------|
| Score récupération | `recoveryScore` (0–100) | 🟢 `healthState.engine` |
| Readiness | `HealthState` (OPTIMAL → INJURY_RISK) | 🟢 |
| Recommandations auto | Hero IA santé + `validateMatchJoin` | 🟢 |
| Analyse continue | Snapshot recalculé à chaque Brain refresh | 🟡 |

**Écart critique** : WHOOP utilise HRV, sommeil, strain. ProDay utilise **proxy** : matchs récents, convocations, streak, complétion profil.

**Justification du proxy** : pas de wearable obligatoire → accessibilité joueur amateur. **Limite documentée** : précision inférieure ; risque faux positifs surcharge.

**Évolution P2** : intégration Apple Health / Google Fit (sommeil, pas) pour affiner `fatigueScore`. **Évolution P3** : partenariat wearable.

**Règle produit** : le score fatigue doit être **explicable** (écran « Pourquoi ce score ? ») — transparence vs WHOOP black box perçue.

---

## 2. 📱 Social / Feed / Engagement

### Instagram → Réels + interactions rapides

**Patterns à reprendre**

| Pattern IG | ProDay | État |
|------------|--------|------|
| Scroll vertical plein écran | `ReelsFeed` paging | 🟢 |
| Double-tap like | `ReelSlide` + `ReelLikeBurst` | 🟢 |
| Sidebar actions | like, save, share, report, mute | 🟢 |
| Profil auteur | lien source externe | 🟡 |

**Ne pas copier** : stories, reels musique trending, filtres AR.

**Recommandation P1** : profils ProDay internes (joueur/club) comme destination reel — pas seulement IG/YT.

---

### TikTok → IA pilote réels et contenus sportifs

**Patterns à reprendre**

| Pattern TikTok | ProDay | État |
|----------------|--------|------|
| Algorithme personnalisé | `rankReelSeeds` + `healthState` + pôle | 🟡 |
| Scroll infini | `useReelsPlaylist` + `onNearEnd` | 🟢 |
| Engagement rapide | XP `view_reel`, bookmark | 🟢 |
| Feedback loop | — | 🔴 |

**Écart** : TikTok optimise sur watch time + interactions massives. ProDay optimise sur **utilité** (`usefulnessMin`) et santé — choix **justifié** (sport responsable vs addiction vide).

**Recommandation P2** :

- Events : `reel_skip_fast`, `reel_rewatch`, `reel_profile_tap`
- Réentraînement pondération tags par cohorte
- **Garde-fou** : plafond session (ex. 20 min) — éthique sport jeunes

---

## 3. ⚽ Football / Matchmaking / Sport réel

### OneFootball → Matchs = version sociale + matchmaking

**Patterns à reprendre**

| Pattern OneFootball | ProDay | État |
|---------------------|--------|------|
| Matchs temps réel | Hub événement live | 🟡 |
| Infos structurées | Convocations, lineup, stats | 🟢 |
| Navigation simple | `MatchPager` chapitres | 🟢 |

**Différenciation ProDay** : pas que consommer l’info — **participer** (RSVP, rejoindre, covoit).

**Recommandation P2** : widget « Matchs autour de moi ce week-end » (carte + liste) — fusion OneFootball × Playtomic.

---

### Playtomic → Matchmaking + terrains + groupes

**Patterns à reprendre**

| Pattern Playtomic | ProDay | État |
|-------------------|--------|------|
| Recherche match/terrain | `SearchMatchScreen`, `ProposeMatchScreen` | 🟢 |
| Géolocalisation forte | `geoService`, rayon Accueil | 🟡 |
| Logique de groupe | `team_events`, effectif | 🟢 |
| Réservation créneau | — | 🔴 |

**Recommandation P1** : partenariats terrains (API ou saisie club) → créneaux réservables depuis `SearchMatchScreen`. **ROI** : monétisation B2B terrains + rétention locale.

---

## 4. 🧭 Géolocalisation / Mobilité

### Uber → Covoiturage vers matchs

**Patterns à reprendre**

| Pattern Uber | ProDay | État |
|--------------|--------|------|
| Matching conducteur/passager | `CarpoolScreen` | 🟡 |
| Distance / temps estimé | — | 🔴 |
| UX trajet en 3 taps | — | 🔴 |

**État code** : `carpoolGeo.engine` = **stub vide** — écart majeur documenté.

**Recommandation P0** :

1. Implémenter `buildCarpoolGeoMarkers` (events + slots)
2. ETA via `distanceBetween` + vitesse moyenne
3. Flow : événement → « Besoin d’un trajet » → match conducteur même club/rayon

**Risque juridique** (voir `PRODAY_V3_PRODUCT_ANALYSIS.md` R09) : CGU trajet obligatoires avant scale.

---

### Google Maps → Carte dynamique joueurs + matchs

**Patterns à reprendre**

| Pattern Maps | ProDay | État |
|--------------|--------|------|
| Carte fluide | `GeoMapPreview` | 🟡 |
| Clustering | — | 🔴 |
| Recherche locale | Filtres Mercato/Matchs par ville | 🟡 |
| Navigation intuitive | Tap marqueur → module | 🟢 |

**Recommandation P1** : clustering marqueurs > 20 dans rayon ; légende densité (`summarizeDensity` existe). **Code** : `geoService.ts` prêt à étendre.

---

## 5. 💬 Chat / Social temps réel

### WhatsApp → Messages instantanés

**Patterns** : rapidité, groupes simples, statut lu.

**État** : `ChatScreen` + `MessagesScreen` 🟢 — Firestore realtime.

**Amélioration P1** : groupes auto par convocation/équipe (création à l’acceptation RSVP).

---

### Discord → Équipes / clubs / communautés locales

**Patterns** : serveurs, salons thématiques, rôles.

**Traduction ProDay**

| Discord | ProDay |
|---------|--------|
| Serveur | Club / équipe / association |
| Salon #général | Fil équipe |
| Salon #mercato | Annonces club |
| Salon #covoit | Trajets match |

**État** : `FeedTabScreen` + `TeamManagementScreen` 🟡 — pas de structure « salons ».

**Recommandation P2** : `ClubHubScreen` — hub Discord-like par club (annonces, chat, convocations, effectif). **ROI** : rétention staff + joueurs liés à une structure.

---

## 6. 🧩 Productivité / UX clean

### Notion → Profil joueur = dashboard structuré

**Patterns** : blocs modulaires, réorganisation, densité maîtrisée.

**État** : `PlayerProfileScreen` (V3 scouting staff) + `PlayerCvEditorScreen` 🟡

**Recommandation P1** : CV joueur en **blocs drag** (stats, vidéos, palmarès, dispo) — export PDF existant (`docs:cv`) comme sortie Notion-like.

---

## 7. Synthèse — formule ProDay V3

```
ProDay V3 =
  Strava     (activité match + progression)
+ WHOOP      (fatigue / récup / readiness IA)
+ TikTok     (reco réels par utilité)
+ Instagram  (format reel + interactions)
+ Uber       (covoit géo — à finaliser)
+ Google Maps (carte matchs/joueurs — à enrichir)
+ Discord    (communautés club — à structurer)
+ Playtomic  (matchmaking local)
+ OneFootball (données match structurées)
+ NTC        (programmes santé guidés — à créer)
+ Notion     (profil modulaire — à enrichir)
────────────────────────────────────────────
  Centré : football réel, staff vérifié, univers Man/Woman/Pro/Santé
```

---

## 8. Roadmap fusion références (priorisée)

| Priorité | Livrable | Références | Effort | KPI cible |
|----------|----------|------------|--------|-----------|
| **P0** | Covoit géo + ETA | Uber | Moyen | Trajets acceptés / événement |
| **P0** | Explication score fatigue | WHOOP | Faible | Confiance santé (NPS) |
| **P1** | Activity feed post-match | Strava | Moyen | Rétention J30 |
| **P1** | Programmes santé 7 jours | NTC + WHOOP | Moyen | RDV + adherence plan |
| **P1** | Carte clustering | Google Maps | Moyen | Matchs découverts via carte |
| **P1** | Groupes chat auto équipe | WhatsApp | Faible | Messages / convocation |
| **P1** | Profil blocs modulaires | Notion | Moyen | Complétion profil 80 % |
| **P2** | Club hub salons | Discord | Élevé | DAU club |
| **P2** | Réservation terrains | Playtomic | Élevé | Matchs créés |
| **P2** | Feedback loop réels | TikTok | Moyen | Watch time utile |
| **P3** | Health Kit / Google Fit | WHOOP | Élevé | Précision fatigue |

---

## 9. Anti-patterns — ce que ProDay ne doit pas devenir

| Risque | Référence source | Garde-fou ProDay |
|--------|------------------|-----------------|
| Addiction scroll vide | TikTok | Score utilité + plafond session jeunes |
| Comparaision toxique | Strava kudos | Respect / MVP local, pas classement global agressif |
| Boîte noire santé | WHOOP perçu | Écran « Pourquoi ce score » |
| Chat généraliste | WhatsApp | Contexte sport (convocation, mercato) |
| Complexité admin | Notion | Templates par rôle, pas liberté totale |

---

## 10. Traçabilité code — où vit chaque référence aujourd’hui

| Référence | Fichiers clés |
|-----------|---------------|
| Strava | `ProgressionBlock`, `MatchCarousel`, `gamification.engine` |
| WHOOP | `healthState.engine`, `HealthSummaryCard`, `validateMatchJoin` |
| NTC | `healthState.engine` (hints), `MedicalBookingScreen` |
| Instagram | `ReelsFeed`, `ReelSlide`, `ReelLikeBurst` |
| TikTok | `reelsRanking.engine`, `useReelsPlaylist` |
| OneFootball | `MatchEventHubScreen`, `EventLiveStatsScreen` |
| Playtomic | `SearchMatchScreen`, `friendlyMatches.service` |
| Uber | `CarpoolScreen`, `carpoolGeo.engine` ⚠️ stub |
| Google Maps | `GeoMapPreview`, `geoService.ts` |
| WhatsApp | `ChatScreen`, `messages.service` |
| Discord | `FeedTabScreen`, `TeamManagementScreen` |
| Notion | `PlayerCvEditorScreen`, `PlayerProfileScreen` |

---

## 11. Processus équipe — intégrer une nouvelle référence

1. **Identifier le pattern** (pas l’écran visuel)
2. **Mapper** au module ProDay (`PRODAY_V3_MODULES.md`)
3. **Vérifier** maturité 🟢🟡🔴 dans ce document
4. **Justifier** ROI utilisateur + produit + croissance
5. **Documenter** la décision dans `PRODAY_V3_PRODUCT_ANALYSIS.md`
6. **Instrumenter** KPI avant développement

---

## 12. Références croisées

| Document | Contenu |
|----------|---------|
| `PRODAY_V3_MODULES.md` | Spec modules + KPI |
| `PRODAY_V3_PRODUCT_ANALYSIS.md` | Personas, risques, croissance |
| `PRODAY_V3_QA.md` | Validation parcours |
| **Ce document** | Fusion références apps mondiales |

*ProDay V3 n’imite pas les géants — il absorbe leurs mécaniques les plus efficaces et les réoriente vers le football réel, la santé et les communautés locales.*
