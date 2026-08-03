---
title: "PRODAY — Architecture complète des pôles"
subtitle: "Document de référence produit détaillé"
author: "PRODAY"
date: "Juin 2026"
lang: fr
---

\newpage

# PRODAY — Architecture complète des pôles

**Document de référence produit — version détaillée**  
**Juin 2026 — Usage interne équipe produit, design et technique**

> **Mise à jour août 2026** — fondations livrées dans [ECOSYSTEM_POLES_EVOLUTION.md](./ECOSYSTEM_POLES_EVOLUTION.md) :
> Pôle Joueur unifié (badges Amateur / Centre / Pro), calendrier & convocations côté Staff, pipeline candidatures kanban, offre agent 19,99 € (20 premiers) puis 29,99 €, Joueur vérifié, privacy contacts, demandes de message, scaffolding Pôle Événements.

---

## Table des matières

1. Vision et principes fondateurs  
2. Couche d'entrée (avant connexion)  
3. Inscription détaillée par pôle  
4. Les 7 univers + Partenaires (fiche complète)  
5. Graphe de relations (modèle de données et flux)  
6. Matchs : typologie exhaustive  
7. Scores et stats : qui fait quoi, écran par écran  
8. Pôle Supporter (spécification complète)  
9. Famille et comptes mineurs  
10. Moteurs techniques partagés  
11. Notifications par acteur  
12. Abonnements et limites freemium  
13. Matrice des permissions (exhaustive)  
14. État actuel du code vs cible  
15. Roadmap de construction  
16. Annexes et cas limites  

\newpage

# 1. Vision et principes fondateurs

## 1.1 Le problème que PRODAY résout

Aujourd'hui, beaucoup d'applications « foot » proposent le même schéma : un fil social, un onglet matchs, un onglet messages, parfois un Mercato. Le joueur amateur, le recruteur pro, le parent d'un U13 et le supporter du dimanche soir **n'ont pas les mêmes besoins**, mais finissent sur des interfaces quasi identiques.

PRODAY part du principe inverse :

- **Un métier = une coque applicative** (navigation, accueil, priorités différentes).
- **Un lien relationnel = une capacité** (être dans une équipe, mandater un agent, suivre un club).
- **Une source de vérité sportive** (le coach pour les stats ; l'organisateur ou le coach pour le score ; l'API pour le monde pro).

## 1.2 Les quatre piliers techniques

| Pilier | Description | Conséquence produit |
|--------|-------------|---------------------|
| **Coques métier** | Shells UI indépendants par univers | L'amateur ne voit pas « Mercato » au centre |
| **Graphe** | Club, équipe, membership, mandat, suivi | Sans affiliation validée, pas de convocation |
| **Moteurs** | Logique partagée (événements, transport, scores) | Un seul code covoiturage, deux UX (amateur vs pro) |
| **Sources sportives** | PRODAY (interne) vs Monde (API) | Badge clair sur chaque score en tribune |

## 1.3 Les six règles d'or (rappel opérationnel)

1. **Chaque pôle = un métier différent** — pas le même menu avec des onglets retirés.  
2. **Les liens créent l'expérience** — club, équipe, coach, mandat, tuteur, favori.  
3. **Le coach est la source de vérité** pour les stats joueur sur matchs PRODAY.  
4. **La tribune lit tout, ne saisit rien** — scores PRODAY ou API, jamais le supporter.  
5. **UFT est dépassé localement** ; le monde (PSG–OM) est une couche habitude (20 %), pas le cœur.  
6. **L'enfant joue, le parent encadre, le coach mesure** — trois rôles jamais fusionnés.

## 1.4 Genre masculin / féminin : pas un pôle, une dimension

| Aujourd'hui (code) | Cible produit |
|--------------------|---------------|
| Pôles `homme` et `woman` séparés au carousel | Un seul pôle **Amateur** et un seul **Pro Joueur** |
| Copy et assets différents par ligne | Étape inscription : **Genre H ou F** |
| `app_space` boys / girls / men / women | Conservé comme **catégorie d'âge et espace** |

Chaque **match**, **tournoi**, **équipe** et **compétition monde** porte un champ :

- `gender_scope`: `men` | `women` | `mixed` | `unspecified`

Les filtres supporter et les listes de tournois s'appuient sur ce champ.

## 1.5 Promesses marketing par pôle

| Pôle | Phrase carousel | Job-to-be-done |
|------|-----------------|----------------|
| Amateur | Ton club, ta semaine, tes déplacements | Ne pas rater l'entraînement ; trouver une place en voiture |
| Pro Joueur | Ta carrière, ta visibilité, tes opportunités | Savoir qui regarde ton profil ; saisir un essai |
| Club | Ta structure, tes équipes, ton recrutement | Gérer 5 équipes et recruter un gardien U17 |
| Staff | Ton métier du foot pro | Agent : mandats ; Recruteur : shortlists ; etc. |
| Supporter | Le match près de chez toi et dans le monde | Vivre PSG–OM ET le tournoi U15 du samedi |
| Santé | Tes RDV, tes sportifs, ton cabinet | Agenda kiné, demandes joueurs |
| Partenaire | Ta marque sur le terrain | ROI campagnes, visibilité clubs |

\newpage

# 2. Couche d'entrée (avant connexion)

## 2.1 Séquence d'ouverture

```
[Lancement app]
    -> BrandRevealIntro (fondus courts entre univers)
    -> Carousel 6 pôles (swipe horizontal)
    -> Choix : [Continuer en invité] [Se connecter] [Créer un compte]
```

## 2.2 Mode invité (Discover)

| Élément | Comportement |
|---------|--------------|
| Slides par pôle | Aperçu modules, pas de données perso |
| Changement d'univers | Bouton « Pro Day X » en tête |
| Actions bloquées | RSVP, messages, publication, saisie score |
| Objectif | Comprendre la différenciation avant inscription |

## 2.3 Connexion

- Email / mot de passe, OAuth (Google, etc.)
- Après login : **routage automatique** selon `product_line` + `role`
- Un compte = **un pôle principal** (changement d'univers possible avec garde-fous)

## 2.4 Règles de routage post-login

| product_line | role | Shell destination |
|--------------|------|-------------------|
| amateur | player | Shell Amateur joueur |
| amateur | coach | Shell Amateur coach |
| pro_player | player | Shell Pro joueur |
| club | club | Shell Club |
| staff | agent / recruiter / coach / organizer | Shell Staff (variante métier) |
| supporter | supporter | Shell Supporter |
| sante | physio | Shell Santé |
| (hors carousel) | sponsor | SponsorAppShell |

\newpage

# 3. Inscription détaillée par pôle

## 3.1 Pro Day Amateur — Joueur

### Phases et pages

| Ordre | Page ID | Champs collectés | Validation |
|-------|---------|------------------|------------|
| 1 | welcome | — | — |
| 2 | space | Genre implicite (boys/girls), catégorie U7–Vétérans, espace app | Cohérence âge / espace |
| 3 | sport | Poste, pied fort, taille (optionnel) | Poste requis |
| 4 | location | Ville, département | Ville requise |
| 5 | stats | Bio courte, stats saison déclaratives (initialisation — **écrasées ensuite par le coach**) | Optionnel |
| 6 | family | **Si mineur (<18) ou U13** : nom tuteur, email tuteur, consentement | Email tuteur valide |
| 7 | account | Nom affiché, email | Unicité email |
| 8 | security | Mot de passe, CGU | Force MDP |
| 9 | launch | Confirmation email, documents (CNI, licence) | Selon âge |

### Données créées en base

```
users/{uid}
  role: player
  product_line: amateur
  app_space: under_u13 | boys | girls | ...
  profile: { position, category, age, club_id: null, season_stats: {...} }
  parental_settings: { ... }  // si mineur
```

### Après inscription

1. Email de confirmation  
2. Écran documents (identité ; licence club si >U13)  
3. Accueil Amateur : **pas de club** -> CTA « Rejoindre un club » ou attente invitation coach  

---

## 3.2 Pro Day Amateur — Coach

| Ordre | Page | Champs |
|-------|------|--------|
| 1 | welcome | — |
| 2 | coach_pro (profil) | Diplôme, club actuel, ville, expérience |
| 3 | account | Identité |
| 4 | security | MDP, CGU |
| 5 | launch | Vérification diplôme (IA + admin) |

**Pas d'étape famille.** Le coach est un adulte encadrant.

---

## 3.3 Pro Day Pro — Joueur

| Ordre | Page | Champs spécifiques |
|-------|------|-------------------|
| 1–2 | welcome, space | Genre, niveau (R1, N3, L2, etc.) |
| 3 | sport | Poste, profil athlétique, mandat agent (optionnel) |
| 4 | location | Zone mobilité |
| 5 | stats | Parcours clubs, vidéos, disponibilité contractuelle |
| 6 | family | Si <18 (rare en pro) |
| 7–9 | account, security, launch | Vérification identité + licence pro |

---

## 3.4 Pro Day Club

| Page | Champs |
|------|--------|
| welcome | — |
| club_pro | Nom structure, ville, ligue, catégories gérées (U13, U17, Seniors F…), logo |
| account | Responsable officiel (nom, email pro) |
| security | MDP, CGU structure |
| launch | Vérification mandat (statuts, FFF) |

**Compte créé :** entité `clubs/{clubId}` + user `role: club` lié comme `owner_uid`.

---

## 3.5 Pro Day Staff (4 métiers)

### Agent

- welcome -> agent_pro (licence FIFA, zone, spécialité) -> account -> security -> launch  
- Vérification : licence agent  

### Recruteur

- welcome -> recruiter_pro (territoire, spécialité scouting, club employeur optionnel) -> account -> security -> launch  

### Coach pro (individu)

- welcome -> coach_pro (diplômes UEFA, historique clubs) -> account -> security -> launch  

### Organisateur

- welcome -> organizer_pro (type événements, ville, structure) -> account -> security -> launch  

---

## 3.6 Pro Day Supporter

| Page | Durée estimée |
|------|---------------|
| welcome | 10 s |
| account | Nom, email |
| security | MDP, CGU |
| launch | Entrée tribune |

**Aucun champ sportif.** `role: supporter`, `product_line: supporter`.

---

## 3.7 Pro Day Santé

- welcome -> medical_specialty (kiné, ostéo, médecin, prépa, mental, nutrition, podologue) -> medical_practice (ville, zone, RDV en ligne oui/non) -> account -> security -> launch  
- Vérification : diplôme + carte professionnelle  

---

## 3.8 Sponsor (7ᵉ pôle produit)

- Entrée app (coque Sponsor) + site `proday75.fr/sponsor` (alias `/partenaires`)  
- welcome -> sponsor_pro (entreprise, secteur, territoire, budget indicatif) -> account -> security -> launch  
- Validation **admin / commercial** (`sponsor_approved`) avant publication de campagnes  
- Messagerie clubs : quota Découverte **serveur** (`sendSponsorClubMessage`) ; Territorial / National illimités  

\newpage

# 4. Les univers — fiche complète par pôle

## 4.1 Amateur — Joueur

### Navigation (barre basse + overflow)

| Onglet | Icône | Écran principal | Actions clés |
|--------|-------|-----------------|--------------|
| **Équipe** | Maillot | Accueil semaine | Voir convocations, RSVP, compo, messages coach |
| **Déplacements** | Voiture | Liste trajets | Proposer place, réserver, point RDV |
| **Club** | Blason | Actus + effectif | Annonces, tournois club, rejoindre équipe |
| **Famille** | Bouclier | *(si mineur ou parent)* | Contrôle parental ou portail tuteur |
| **Moi** | Profil | CV léger, paramètres | Abonnement, documents, **stats lecture seule** |

**Menu overflow (...):** Santé (annuaire kiné), Moments (highlights match, pas feed TikTok), Paramètres.

### Écran d'accueil « Équipe » — contenu précis

```
[Bandeau prochain événement]
  « Entraînement mercredi 19h00 — Gymnase municipal »
  [Je viens] [Je viens pas] [Peut-être]
  Présents : 14/18

[Carte prochain match]
  « Samedi 15h00 — FC Villebon vs AS Melun (domicile) »
  Covoiturage : 2 places restantes
  [Voir convocation]

[Fil coach]
  Dernier message staff (aperçu)

[Raccourcis]
  Déplacements | Messages équipe | Kiné
```

### Ce que le joueur amateur NE voit PAS

- Mercato (marque, candidatures, pipeline)  
- Shortlist scouting  
- Création tournoi  
- Saisie score / stats (lecture uniquement après validation coach)  
- Édition manuelle `season_stats`  
- Hub live avec boutons +/– score (réservé coach sur le même match, vue joueur = lecture)  

### Abonnement « Joueur Amateur Plus »

| Gratuit | Plus |
|---------|------|
| Profil, présence, calendrier | Alertes convocation |
| 1 annonce « cherche club » / saison | Illimité |
| Covoiturage | Priorité affichage annonce locale |
| Stats validées coach (lecture) | Export PDF CV amateur |

---

## 4.2 Amateur — Coach

### Navigation

| Onglet | Contenu |
|--------|---------|
| **Équipe** | Effectif, prochaine séance, convocations à envoyer |
| **Matchs** | Hub match, live, rapport après-match |
| **Club** | Annonces, remplaçant local |
| **Messages** | Joueurs, parents (canal équipe) |
| **Moi** | Profil coach, abonnement |

### Actions exclusives coach

| Action | Détail technique |
|--------|------------------|
| Créer convocation | `team_events` type training / friendly / tournament |
| Convoquer joueurs | `invitee_uids[]` |
| Pointage présence | `attendance_marks` |
| Composition | `lineup.slots` |
| Live score | `live_state.home_score`, `away_score`, `status` |
| Actions live | `live_actions[]` (but, passe, carton) |
| Feuille match | `player_match_stats[uid]` |
| Valider rapport | `match_report_finalized_at` -> propagation `season_stats` |
| Covoiturage | `carpool_slots[]`, conducteurs |

### Ce que le coach amateur NE fait PAS

- Mandats agent, négociations pro  
- Pipeline recruteur national  
- Publier annonce Mercato Pro  
- Modifier le classement tournoi (sauf s'il est aussi organisateur)  

---

## 4.3 Pro Joueur

### Navigation

Carrière | Opportunités | Portfolio | Groupe | Moi

### Écran Carrière

- Jours avant fin de contrat  
- Clubs ayant consulté le profil (7 derniers jours)  
- Essais à venir  
- Messages non lus agent / recruteur  
- Timeline : clubs, prêts, blessures (données validées + déclarations contrat)

### Écran Opportunités

- Offres correspondant au poste / niveau  
- Détections ouvertes  
- **Pas** le Mercato amateur  

### Écran Portfolio

- Vidéos taguées par match  
- Stats saison **badge « Validé coach »**  
- Export PDF scouting  

### Écran Groupe

- Convocations staff (entraînement, match officiel)  
- **Logistique déplacement** (même moteur covoiturage, libellé « Transport groupe »)  
- Pas de gestion compo (c'est le coach staff)  

---

## 4.4 Club (structure)

### Navigation

Structure | Recrutement | Calendrier | Communication | Vitrine

### Écran Structure

```
Club FC Villebon
├── Équipe U13 Garçons (14 licenciés) — Coach Martin
├── Équipe U15 Filles (16) — Coach Diallo
├── Seniors H (22) — Coach Bernard
└── Staff : 3 coachs, 1 kiné club, 1 secrétaire
```

Actions DS / président :

- Valider adhésion joueur à une équipe  
- Affecter coach -> équipe  
- Voir stats agrégées (buteurs saison par équipe)  
- **Ne pas** saisir la feuille match (délégué au coach)  
- Déverrouiller rapport validé (cas erreur, droit admin)  

### Écran Recrutement

- Publier : « Cherche gardien U17 F » — zone 50 km  
- Recevoir candidatures  
- Shortlist locale (pas le réseau national recruteur pro sauf si club pro)  

---

## 4.5 Staff — détail des 4 métiers

### Agent

**Données suivies :** mandats actifs, date fin, commission, clubs en discussion, historique.

**Écran Portefeuille :**

| Joueur | Club actuel | Fin mandat | Statut négo |
|--------|-------------|------------|-------------|
| Dupont | FC Nantes | 45 j | Discussion L2 |
| Martin | Libre | — | Essais x2 |

**Interdit :** convocations U15, covoiturage, tournoi amateur (sauf compte perso séparé).

### Recruteur

**Données :** base scouting, notes match, shortlists par besoin club.

**Flux type :**

1. Club missionne : « Ailier gauche U21, pied gauche »  
2. Recruteur filtre base PRODAY (stats validées coach uniquement)  
3. Rapport après match observation  
4. Proposition essai -> notification joueur  

### Coach pro

Même outils convocation / live / rapport que coach amateur, sur **groupe pro** :

- Effectif sous contrat  
- Statuts blessure  
- Préparation adversaire  
- Coordination staff (adjoint, prépa, médecin)  

### Organisateur

**Données :** tournoi, inscriptions, poules, fixtures, scores, classements.

**Flux création tournoi :**

1. Créer événement (titre, dates, max équipes, tarif, gender_scope)  
2. Ouvrir inscriptions  
3. Générer poules automatiquement  
4. Planning terrains  
5. Saisir scores matchs poule -> classement auto  
6. Phases finales  

**Lien joueurs :** l'organisateur ne saisit **pas** les stats individuelles ; les coachs des équipes inscrites le font sur leur convocation.

---

## 4.6 Supporter — résumé (voir section 8 complète)

Onglets : Matchs | Suivis | Communauté | Moments | Shop

---

## 4.7 Santé

| Onglet | Actions praticien |
|--------|-------------------|
| Agenda | Créneaux, RDV, rappels |
| Patients | Sportifs suivis (historique dans cadre légal) |
| Demandes | Joueurs cherchant kiné dans sa zone |
| Messages | Contact prise RDV |
| Cabinet | Spécialités, tarifs, documents vérifiés |

**Joueur (autre pôle) :** bouton « Trouver un praticien » -> fiche publique + demande RDV.

---

## 4.8 Partenaire

| Onglet | Contenu |
|--------|---------|
| Campagnes | Création, territoire, dates, clubs ciblés |
| Performance | Impressions, clics, conversions |
| Contrat | Tier Starter / Territorial / National |
| Contacts | Clubs pour activation terrain (maillot, board LED…) |

\newpage

# 5. Graphe de relations

## 5.1 Entités cibles (Firestore)

### Collection `clubs`

```
clubs/{clubId}
  name, city, department, logo_url, verified
  owner_uid
  categories: ["U13", "U15F", "Seniors"]
  sponsor_ids: []
```

### Collection `teams`

```
teams/{teamId}
  club_id
  name: "U17 Filles"
  category: "U17"
  gender_scope: "women"
  coach_uids: []
  season_id: "2025-2026"
```

### Collection `memberships`

```
memberships/{id}
  team_id, club_id, player_uid
  status: "pending" | "active" | "suspended" | "left"
  joined_at, validated_by_uid
  license_number (optionnel)
```

### Collection `mandates` (agent)

```
mandates/{id}
  agent_uid, player_uid
  start_at, end_at
  exclusive: boolean
  status: "active" | "terminated"
```

### Collection `follows` (supporter)

```
follows/{id}
  supporter_uid
  target_type: "club" | "player" | "tournament" | "competition"
  target_id
```

### Collection `parental_links`

```
// Dérivé de users.parental_settings.guardian_email
// Pas de collection séparée obligatoire : requête users où guardian_email == parent.email
```

## 5.2 Flux d'affiliation joueur -> club

```
1. Joueur recherche club OU reçoit invitation coach
2. Demande membership status=pending
3. Coach ou admin club approuve -> status=active
4. Joueur apparaît dans effectif équipe
5. Coach peut convoquer (invitee_uids)
```

**Aujourd'hui :** le joueur peut se déclarer `club_id` seul (JoinClubScreen) sans validation — **à remplacer** par le flux ci-dessus.

## 5.3 Qui voit quoi selon le lien

| Acteur | Condition | Voit |
|--------|-----------|------|
| Joueur | membership active | Convocations de son équipe |
| Coach | affecté à team | Effectif, stats, live |
| Club admin | club_id | Toutes équipes du club |
| Parent | guardian_email match | Activité enfant (pas contenu messages) |
| Supporter | follow | Scores publics, stats publiées, moments |
| Recruteur | pas de membership | Profil public joueur + stats validées |
| Agent | mandate active | Fiche complète mandaté |

\newpage

# 6. Matchs — typologie exhaustive

## 6.1 Matchs PRODAY (source interne)

### Par type d'événement (`TeamEventType`)

| Type | Score public | Stats joueur | Exemple |
|------|--------------|--------------|---------|
| training | Non | Optionnel (présence) | Entraînement mercredi |
| friendly | Oui | Oui | Amical vs club voisin |
| tournament | Oui | Oui | Match de poule tournoi |
| detection | Partiel | Oui | Journée détection |
| meeting | Non | Non | Réunion parents |
| other | Configurable | Configurable | — |

### Par genre

Tous les types ci-dessus existent en **masculin**, **féminin**, **mixte** (plateaux U9, tournois entreprise, foot à 5).

### Par niveau

| Niveau | Exemples |
|--------|----------|
| École de foot | U7–U9 plateau |
| Jeunes | U11–U19 championnat |
| Adulte amateur | R3, district, vétérans |
| Semi-pro / pro sur plateforme | N3, D1 Arkema |

## 6.2 Matchs tournoi (entité `tournaments`)

- Poules, fixtures, `home_score`, `away_score`, `played`  
- Classement calculé (`computeAllStandings`)  
- Saisie score : **organisateur** sur `TournamentDetailScreen`  
- Cible : **sync automatique** depuis rapport coach si match = convocation liée  

## 6.3 Matchs MONDE (API externe)

### Masculin (exemples API)

Ligue 1, L2, National, Coupe de France, C1, Europa, Euro, CM, Liga, PL, Serie A, Bundesliga, sélections A/U21, etc.

### Féminin (exemples API)

D1 Arkema, D2 F, Coupe de France F, UWCL, WSL, NWSL, Euro F, CM F, sélection France F, etc.

### Règles d'affichage

| Champ | Valeur |
|-------|--------|
| source | `external` |
| provider | nom API |
| gender_scope | men / women |
| editable_by_user | **false** toujours |

## 6.4 Événements sans score tribune

Entraînement, réunion, visite médicale — visibles joueur/coach uniquement.

\newpage

# 7. Scores et stats — spécification précise

## 7.1 Distinction fondamentale

| Donnée | Granularité | Exemple |
|--------|-------------|---------|
| **Score équipe** | Match | Villebon 2 – 1 Melun |
| **Stats joueur** | Individu | Martin : 67 min, 1 but, note 7,5 |

## 7.2 Score équipe — acteurs et écrans

### Match club (convocation)

| Étape | Acteur | Écran | Action technique |
|-------|--------|-------|------------------|
| Avant match | Coach | Hub match > Live | status = scheduled |
| Coup d'envoi | Coach | Live | status = live |
| But | Coach | Live | live_actions += goal OU home_score++ |
| Mi-temps | Coach | Live | status = halftime |
| Fin | Coach | Live | status = finished |
| Affichage joueur | Joueur | Hub > Live | Lecture seule MatchLiveScoreboard |
| Affichage supporter | Supporter | Matchs > En direct | Lecture si match public / suivi |

**Permissions code actuel :** `canManageTeamEvent` -> coach, organizer, agent, club du même `club_id`.

### Match tournoi

| Acteur | Écran | Action |
|--------|-------|--------|
| Organisateur | TournamentDetail > fixture row | submitFixtureScore(home, away) |
| Public | Même écran | Lecture scores + classement |
| Coach équipe | Hub match parallèle | Rapport joueur + sync score vers tournoi (cible) |

### Match monde

| Acteur | Source |
|--------|--------|
| Tous | API polling / webhook |
| Admin PRODAY | Aucune saisie manuelle sauf override incident |

## 7.3 Stats joueur — workflow complet

### Phase 1 — Pendant le match (optionnel)

Coach enregistre dans `live_actions` :

| Type | Effet score | Effet stats |
|------|-------------|-------------|
| goal | +1 domicile (souvent) | Pré-remplit buteur |
| assist | — | Pré-remplit passeur |
| yellow_card / red_card | — | Cartons |
| sub_in / sub_out | — | Minutes (estimation) |

### Phase 2 — Rapport après-match (obligatoire)

Pour **chaque** `uid` dans `invitee_uids` (ou présents pointés) :

```
player_match_stats[uid] = {
  minutes_played, rating (0-10),
  goals, assists, yellow_cards, red_cards
}
```

Interface coach : liste joueurs -> tap -> formulaire -> sauvegarde.

Bouton **« Importer depuis le live »** : agrège `live_actions` vers la feuille.

### Phase 3 — Validation

Coach appuie **« Valider le rapport d'après-match »** :

1. `match_report_finalized_at = now`  
2. Feuille **verrouillée** (sauf admin club déverrouille)  
3. Pour chaque joueur : mise à jour `profile.season_stats` :  
   - `matches += 1`  
   - `goals += player_match_stats.goals`  
   - `assists += player_match_stats.assists`  
4. `stats_applied_at = now`  
5. Entrée `player_activities` (historique match)  
6. Notification push joueur : « Stats validées par Coach X »  
7. Si match public : mise à jour tribune (buteurs, homme du match)  

### Phase 4 — Lecture

| Acteur | Accès |
|--------|-------|
| Joueur | Profil, CV — **lecture seule** |
| Parent | Portail tuteur — résumé activité |
| Supporter | Fiche match — buteurs officiels |
| Recruteur | Scouting — badge « stats validées coach » |
| Joueur | **INTERDIT** : EditProfileScreen season_stats (cible) |

## 7.4 Matrice saisie score / stats

| Contexte | Score équipe | Stats joueur | Classement |
|----------|--------------|--------------|------------|
| Championnat amateur | Coach | Coach | — |
| Amical | Coach | Coach | — |
| Tournoi poule | Orga (+ sync coach) | Coach | Auto |
| Entraînement | — | Coach (présence) | — |
| PSG–OM | API | — | API |
| UWCL | API | — | API |

\newpage

# 8. Pôle Supporter — spécification complète

## 8.1 Positionnement vs UFT

| Capacité | UFT | PRODAY Supporter |
|----------|-----|----------------|
| Catalogue tournois | Oui | Oui + géolocalisation |
| Scores live tournoi | Oui | Oui |
| Classements poules | Oui | Oui |
| Suivre un joueur | Non | Oui |
| Stats joueur validées coach | Non | Oui |
| Matchs monde L1 / D1 F | Non | Oui (API) |
| Communauté / débats | Non | Oui |
| Highlights but | Limité | Oui (Moments) |
| Shop | Non | Oui |
| Inscription équipe | Oui (joueur) | **Non** (lecture) |

## 8.2 Structure onglet Matchs (shell dédié — pas MatchsScreen joueur)

### Sous-onglets

| Sous-onglet | Contenu |
|-------------|---------|
| **En direct** | Tous live des suivis + trending PRODAY + top monde |
| **Aujourd'hui** | Calendrier jour (filtres H/F/mixte) |
| **Tournois** | Catalogue, recherche ville/date |
| **Mes suivis** | Clubs, joueurs, compétitions épinglés |

### Carte match — champs affichés

```
[Badge LIVE | TERMINÉ | À VENIR]
[Badge PRODAY | MONDE]
[Badge MASC | FÉM | MIXTE]
Équipe domicile  score  score  Équipe extérieur
Minute (si live) ou date/heure
Buteurs (si rapport validé ou API externe)
[Suivre] [Debattre] [Moment]
```

## 8.3 Règles d'accès supporter aux données

| Donnée | Visible | Condition |
|--------|---------|-----------|
| Score live PRODAY | Oui | Match marqué public OU club/tournoi suivi |
| Compo avant match | Non | Donnée interne équipe |
| Covoiturage | Non | — |
| Stats joueur | Oui | `match_report_finalized_at` défini |
| Messages équipe | Non | — |
| Nom mineur | Oui | Profil public club ; pas de DM si mineur |

## 8.4 Filtres persistants

- Genre : Tout | Masculin | Féminin | Mixte  
- Source : Tout | Sur PRODAY | Dans le monde  
- Portée : Tout | Mes suivis  

## 8.5 Tribune supporter — 100 % gratuit *(Supporter Plus obsolète)*

> **Décision produit (2026)** : le tier payant « Supporter Plus » est **supprimé**.  
> Pas de paywall, pas de plan store IAP pour le pôle tribune.  
> Alignement code : `supporterFreeAccess.ts`, `subscriptionPlansByLine.ts` (`supporter: []`).

| Feature | Inclus (gratuit) |
|---------|------------------|
| Suivis clubs / joueurs / tournois | Illimité |
| Matchs PRODAY + monde (API-Football) | Oui |
| Alertes but / coup d'envoi / rappels | Oui (opt-in profil) |
| Fil, débats, réactions | Illimité |
| Shop merch | Accès gratuit |
| Badge supporter | Visible |

## 8.6 Parcours type dimanche

```
10h00 — Notification : « Tournoi U15F suivi : demi-finale dans 1h »
11h45 — Onglet En direct : live 0-0
12h30 — But -> Moment clip + débat « Ouverture du score »
14h00 — PSG–OM (monde) : live API 1-1
16h00 — Fin tournoi : classement + « Dupont (suivi) : 2 buts cette semaine »
```

\newpage

# 9. Famille et comptes mineurs

## 9.1 Définition mineur

```typescript
isMinorUser(user):
  if user.profile.age < 18 -> true
  else if user.parental_settings.is_minor -> true
  else false
```

Étape inscription `family` déclenchée si :

- `age < 18` OU  
- `app_space === under_u13`  

## 9.2 Données `parental_settings` (détail)

| Champ | Type | Rôle |
|-------|------|------|
| is_minor | boolean | Flag compte supervisé |
| guardian_name | string | Nom tuteur principal |
| guardian_email | string | **Clé de liaison parent** |
| guardian_email_secondary | string | Co-tuteur |
| guardian_invite_code | string | Code 6 chiffres co-tuteur |
| guardian_consent | boolean | Consentement inscription |
| supervision_enabled | boolean | Master switch |
| contacts_filter_enabled | boolean | Filtre messages |
| screen_time_enabled | boolean | Limite temps |
| daily_limit_minutes | number | Ex: 90 min/jour |
| active_days | string[] | Jours autorisés |
| approved_contacts | array | {uid, name, approved} |
| screen_time_bonus_minutes | number | Bonus parent |
| unlock_request | object | Demande déblocage enfant |
| activity_journal | array | Entrées simplifiées |

## 9.3 Parcours parent

```
1. Enfant inscrit avec guardian_email = parent@email.fr
2. Parent crée compte PRODAY avec parent@email.fr (n'importe quel pôle, souvent sans être joueur)
3. Parent ouvre onglet Famille -> GuardianPortalScreen
4. parentalGuardianService.listLinkedMinors(email) retourne les enfants
5. Parent configure temps, approuve contacts, accorde bonus
```

## 9.4 Parcours enfant

```
1. Onglet Famille -> ParentalControlScreen (embedded)
2. Voit temps restant, règles, peut demander déblocage
3. Peut afficher code invitation co-tuteur
4. Utilise app normalement (Équipe, Déplacements) dans les limites
```

## 9.5 Restrictions techniques mineur

| Fonction | Règle | Fichier / logique |
|----------|-------|-------------------|
| Messages | Contacts approuvés | parentalMessaging.ts |
| Adulte -> mineur | Expéditeur vérifié | canContactMinors() |
| Covoiturage | guardian requis | standaloneCarpoolMinor.ts |
| Espace app | U13/boys/girls lock | useMinorYouthSpace.ts |
| Stats édition | Bloqué | cible EditProfileScreen |
| Mercato | Absent amateur mineur | poleExperience |

## 9.6 Parent et matchs de l'enfant

| Événement | Enfant | Parent (cible) |
|-----------|--------|----------------|
| Convocation publiée | Notif + RSVP | **Notif** « Entraînement mercredi » |
| RSVP enfant | Oui | Lecture (cible : notif choix) |
| Covoiturage réservé | Oui (si tuteur ok) | **Notif** trajet |
| Stats post-match | Notif validation coach | Lecture résumé activité |
| Score live | Lecture | Lecture (si suit club enfant) |

## 9.7 Cas U13 et documents

- Vérification identité : **CNI responsable ou livret de famille**  
- Pas de licence enfant obligatoire même niveau que senior  
- Score plateau U9 : option **masquer score tribune** (paramètre club)  

## 9.8 Majorité (18 ans)

- `is_minor` -> false (processus validation âge)  
- Onglet Famille disparaît côté enfant  
- Parent perd supervision automatique (historique conservé)  
- Stats toujours par coach uniquement  

\newpage

# 10. Moteurs techniques partagés

## 10.1 Moteur Événements (`engines/events`)

**Responsabilités :**

- CRUD `team_events`  
- RSVP, attendance, lineup  
- Live state et actions  
- Rapport match et propagation stats  

**Consommateurs :** Amateur, Pro joueur, Club (lecture), Staff coach, Organisateur (lien tournoi).

## 10.2 Moteur Transport (`engines/transport`)

**Responsabilités :**

- `carpool_slots`, passagers, messages covoiturage  
- Équilibre trajets saison (`carpoolBalance`)  

**Présentations :**

| Pôle | Label UI | Particularité |
|------|----------|---------------|
| Amateur | Covoiturage | Enfant : alerte tuteur |
| Pro joueur | Transport groupe | Groupe convoqué seulement |
| Coach | Gestion conducteurs | Désigne chauffeurs |

## 10.3 Moteur Scouting (`engines/scouting`)

- Shortlists recruteur  
- Consultations profil  
- **Filtre :** n'indexer que stats avec `stats_applied_at`  

## 10.4 Moteur Communauté (`engines/community`)

- Question de la semaine  
- Fil réactions  
- Débats supporter  

## 10.5 Moteur Scores externes (`engines/externalScores`)

- Ingestion API  
- Cache local  
- Mapping compétitions -> gender_scope  
- **Jamais** écriture utilisateur  

\newpage

# 11. Notifications par acteur

| Événement | Joueur | Coach | Parent | Supporter | Club |
|-----------|--------|-------|--------|-----------|------|
| Convocation | Oui | — | Cible | — | — |
| RSVP joueur | — | Oui | Cible | — | — |
| Rappel match J-1 | Oui | Oui | Cible | — | — |
| But live (suivi) | — | — | — | Plus | — |
| Stats validées | Oui | — | Cible | Si suit joueur | — |
| Demande adhésion | — | Oui | — | — | Oui |
| Message (mineur) | Si approuvé | — | — | — | — |
| Essai proposé | Oui | — | — | — | — |
| Tournoi : score final | — | — | — | Si suit tournoi | — |

\newpage

# 12. Abonnements et limites

## 12.1 Amateur joueur (player_plus)

**Gratuit :** profil, calendrier, RSVP, covoiturage, stats lecture, 1 « cherche club »/saison  
**Plus :** alertes, chercher club illimité, mise en avant locale, export PDF  

## 12.2 Amateur coach (coach_pro)

**Gratuit :** 1 équipe, 5 messages recrutement local/mois, annonces lecture  
**Plus :** équipes illimitées, messages illimités, annonces actives, stats effectif  

## 12.3 Pro joueur Plus

Visibilité scouting, candidatures opportunités illimitées, alertes intérêt clubs.

## 12.4 Club Pro

Annonces recrutement actives, multi-équipes, stats agrégées, vitrine premium.

## 12.5 Staff (par métier)

Recruteur / Coach / Agent / Organisateur — quotas Mercato messages, annonces, événements.

## 12.6 Tribune supporter *(Supporter Plus obsolète)*

100 % gratuit — alertes opt-in, suivis illimités, fil et shop sans abonnement store.

## 12.7 Physio Pro

Agenda illimité, visibilité annuaire, stats cabinet.

## 12.8 Partenaire

Starter gratuit -> Territorial (devis) -> National Pro.

\newpage

# 13. Matrice des permissions (exhaustive)

Légende : **C** = créer/modifier, **L** = lecture, **—** = pas d'accès

| Capacité | Joueur am. | Joueur pro | Coach | Club | Agent | Recruteur | Orga | Supporter | Parent | Santé |
|----------|------------|------------|-------|------|-------|-----------|------|-----------|--------|-------|
| RSVP convocation | C | C | L | L | — | — | — | — | L | — |
| Créer convocation | — | — | C | C | — | — | C | — | — | — |
| Saisir score live | — | — | C | — | — | — | C* | — | — | — |
| Saisir stats joueur | — | — | C | — | — | — | — | — | — | — |
| Valider rapport | — | — | C | L | — | — | — | — | — | — |
| Éditer sa saison stats | — | — | — | — | — | — | — | — | — | — |
| Publier annonce recrutement | — | — | L | C | — | C | — | — | — | — |
| Shortlist scouting | — | L | — | L | L | C | — | — | — | — |
| Mandat agent | L | L | — | — | C | — | — | — | — | — |
| Suivre club/joueur | — | — | — | — | — | — | — | C | L | — |
| Score monde | L | L | L | L | L | L | L | L | L | — |
| Covoiturage réserver | C** | C | C | — | — | — | — | — | — | — |
| Question semaine répondre | — | — | — | — | — | — | — | C | — | — |
| RDV santé | C | C | — | — | — | — | — | — | C*** | C |

\* Orga sur matchs de son tournoi, pas sur convocation club  
\*\* Mineur : si tuteur enregistré  
\*\*\* Parent pour enfant mineur (cible)

\newpage

# 14. État actuel du code vs cible

| Sujet | État actuel | Cible |
|-------|-------------|-------|
| Pôles carousel | homme, woman, amateur, pro, supporter, sante | amateur, pro_player, club, staff, supporter, sante |
| Lien joueur-club | club_id auto (JoinClubScreen) | membership validée |
| Équipe (Team entity) | Absent | teams + memberships |
| Stats coach | Partiel (TeamManagement, Live) | Workflow obligatoire + blocage joueur |
| Joueur édite season_stats | Encore possible (EditProfileScreen) | Interdit |
| Shell Supporter matchs | SupporterAppShell déployé | Shell dédié tribune ✓ |
| Scores monde | API-Football MVP (L1 + D1 Arkema) | API L1 + D1 Arkema MVP ✓ |
| Supporter Plus / paywall | Supprimé — tribune 100 % gratuite | Gratuit sans IAP ✓ |
| Famille onglet | homme/woman | amateur + pro_player jeune |
| Sync score coach -> tournoi | Manuel orga | Automatique |
| Supporter permissions live | canViewTeamEvent bloque | Vue publique matchs suivis |
| Mercato amateur | Encore visible pole amateur | Retiré ou « cherche club » |

\newpage

# 15. Roadmap de construction (détaillée)

## Phase 1 — Fondations graphe (4–6 semaines)

1. Modèles `teams`, `memberships`  
2. Flux validation adhésion (remplace join libre)  
3. Migration `club_id` -> membership active  

## Phase 2 — Stats source de vérité (2–3 semaines)

1. Bloquer `season_stats` côté joueur (UI + Firestore rules)  
2. Rapport après-match obligatoire avant propagation  
3. Badge « validé coach » sur profil public  

## Phase 3 — Shells navigation (6–8 semaines)

1. Shell Amateur (joueur + coach)  
2. Shell Supporter (Matchs dédié)  
3. Shell Club  
4. Staff 4 variantes accueil  

## Phase 4 — Tribune & monde (4 semaines)

1. Intégration API scores  
2. Filtres H/F/mixte  
3. Suivis illimités et alertes tribune (gratuit, préférences opt-in)  

## Phase 5 — Famille renforcée (2 semaines)

1. Notifs parent convocation / trajet / stats  
2. Famille sur pôle Amateur  
3. Option RSVP parent U13 (si validé produit)  

## Phase 6 — Migration carousel (2 semaines)

1. Fusion homme/woman -> amateur + étape genre  
2. Extraction club/staff/partenaire du pôle pro  
3. Pro joueur comme pôle distinct  

\newpage

# 16. Annexes et cas limites

## 16.1 Joueur dans deux équipes (rare)

- Deux memberships actifs (ex. futsal + foot à 11)  
- Convocations filtrées par `team_id`  
- Stats match liées à l'événement (équipe du match)  

## 16.2 Coach à la fois amateur et organisateur tournoi

- Deux rôles -> **deux comptes recommandés** ou switch rôle explicite  
- Permissions union sur les écrans concernés  

## 16.3 Parent supporter séparé

- Compte 1 : parent (Famille) — email tuteur  
- Compte 2 : supporter (tribune) — même personne, emails identiques ou non  
- Pas de fusion automatique des comptes  

## 16.4 Match mixte tournoi entreprise

- gender_scope = mixed  
- Stats individuelles optionnelles (paramètre orga)  
- Classement équipe uniquement  

## 16.5 Données personnelles mineur

- Profil public : prénom + initiale nom (option club)  
- Pas de géolocalisation précise enfant sur carte publique  
- RGPD : consentement parental stocké `guardian_consent_at`  

## 16.6 Offline

- Calendrier saison en cache (`seasonCalendarCache`)  
- Scores live : indicateur « données en retard » si pas de réseau  

## 16.7 Glossaire

| Terme | Définition |
|-------|------------|
| Coque (shell) | Navigation + accueil d'un pôle |
| Membership | Lien validé joueur <-> équipe |
| Rapport validé | Feuille match figée par le coach |
| Source PRODAY | Donnée saisie sur la plateforme |
| Source externe | Donnée API monde |
| Tribune | Expérience supporter lecture seule |

## 17. Implementation status (Jul 2026)

Done:
- Shell Pro joueur dédié: `Carrière | Opportunités | Portfolio | Groupe | Moi`
- Différenciation amateur/pro: onglet Mercato retiré du joueur amateur
- Shell Club câblé: onglet `Structure` branché sur gestion structure
- Supporter Matchs: cartes sourcées avec badge `Monde` vs `PRODAY`
- External scores: provider mock par défaut + squelette provider API (env `EXPO_PUBLIC_EXTERNAL_SCORES_MOCK`)
- Parent cross-device fallback: inbox Firestore `guardian_notifications` + bannière portail tuteur
- Rules Firestore: contrôle lecture/écriture `guardian_notifications` + tests rules associés
- Préparation carousel: mapping stockage `pro_player -> pro` + TODO explicite cible 6 pôles
- Famille: visibilité étendue aux lignes joueur (inclut pro joueur mineur)
- **Migration carousel §1.4 (juil. 2026)** : `homme` et `woman` retirés du carousel
  pré-connexion (`UNIVERSE_CHOICE_ORDER` = `amateur, supporter, pro, sante`). Les
  comptes existants créés sous `homme`/`woman` continuent de fonctionner sans
  migration de données (routage post-login déjà piloté par `getUserProductLine`,
  inchangé) ; seuls les **nouveaux** parcours d'inscription et le carousel
  basculent vers Amateur.
- **Étape Genre explicite** (`SignupSpaceStep`, pôle Amateur) : remplace la
  déduction implicite « pôle = genre ». Nouveau champ `User.profile.gender`
  (`men` | `women`), nouvel état `gender`/`setGender` dans `useSignupForm`,
  propagé à `defaultCategoriesForAppSpace` et aux suggestions d'espace par âge
  (espace -13 ans : catégories filtrées par genre explicite, plus seulement par
  pôle Woman legacy).
- Copie d'étapes Amateur complétée : `getPlayerStepMeta('amateur', …)` route
  désormais vers `signupAmateurConfig.getAmateurStepMeta` pour **toutes** les
  pages du parcours joueur (`sport`, `location`, `stats`, `family`, `account`,
  `security`), qui retombaient auparavant sur la copie « Pro Day Man ».
- Tests : `carouselAmateurMigration.test.ts` (ordre carousel, groupes d'espace
  par genre, copy Amateur dédiée, non-régression Woman legacy).
- **Accueil Amateur joueur (§4.1)** : `AmateurPlayerHomeDashboard.tsx` câblé dans
  `HomeScreen.tsx` pour `role === 'player'` + ligne `amateur`/`homme`/`woman` —
  bandeau RSVP, prochain match + covoiturage, fil coach (placeholder), raccourcis,
  CTA « Rejoindre un club » si sans affiliation (`amateurPlayerHome.ts` + i18n
  `roleHome.amateurPlayer.*`).
- **Écrans Pro joueur enrichis (§4.3)** :
  - `ProPlayerCareerScreen` — jours contrat, consultations 7j, essais à venir
  - `ProPlayerPortfolioScreen` — stats saison, badge « Validé coach », export PDF
  - `ProPlayerGroupScreen` — liste convocations staff (3–5) + transport groupe
  - Helpers : `proPlayerCareerMetrics.ts`
- **Portefeuille Agent (§4.5)** : `AgentHomeDashboard.tsx` — tableau mandats
  (Joueur | Club actuel | Fin mandat | Statut négo) depuis shortlist + profils publics.
- **Tribune Supporter §8 (juil. 2026)** :
  - Filtres persistants : `supporterPreferences.service.ts`, `SupporterFilterBar.tsx`
  - Cartes match enrichies : `SupporterMatchCard.tsx`, refactor `SupporterMatchsScreen.tsx`
  - Suivis joueurs + recherche tournois : `SupporterSuivisScreen.tsx`
  - Helpers filtres : `supporterMatchFilters.ts` + tests `supporterMatchFilters.test.ts`
  - i18n `supporter.*` (`ui.fr.ts`, `ui.en.ts`)
- **Structure Club §4.4 (juil. 2026)** :
  - Écran dédié : `ClubStructureScreen.tsx` (arbre équipes, staff, adhésions pending)
  - Helpers agrégation : `clubStructureView.ts` + tests `clubStructureView.test.ts`
  - i18n `clubStructure.*` (`ui.fr.ts`, `ui.en.ts`)
- **Affiliation club §5.2 (juil. 2026)** :
  - Rules : `ownerClubIdUnchanged()` — joueur ne peut plus auto-modifier `profile.club_id`
  - Rules : staff club peut créer membership `pending` pour un joueur (`invitePlayer`)
  - Service : `membershipsService.invitePlayer` + champ `invited_by_uid`
  - UI coach : recherche joueur + invitation dans `TeamManagementScreen`
  - Gating convocations : `membershipAccess.ts` + dashboard amateur renforcé
  - Effectif : `usersService.listMembersByClubId` priorise memberships actifs
  - Tests : `membershipAccess.test.ts`, rules `firestore-rules.test.mjs`
- **Shell Santé §4.7 (juil. 2026)** :
  - Onglets praticien : Accueil · Agenda · Demandes · Messages · Cabinet
  - `PhysioRequestsScreen.tsx` (onglet Demandes / `feed`)
  - `PhysioPatientsScreen.tsx` (depuis dashboard accueil)
  - i18n `medical.shell.*`, `medical.requests.*`, `medical.patients.*`
- **Partenaires §4.8 (juil. 2026)** :
  - `SponsorContractScreen.tsx` (formule Starter / Territorial / National)
  - `SponsorContactsScreen.tsx` (prospects clubs · activation terrain)
  - Gate campagnes : `isSponsorCampaignAllowed` + `profile.sponsor_approved`
  - Navigation shell : segments Contrat (Marque) et Contacts (Réseau)
  - i18n `sponsor.contract.*`, `sponsor.contacts.*`, `sponsor.gate.*`

Still stub / pending external dependencies:
- Connecteur API scores réel (API-Football ou équivalent) + auth/quotas
- Push mobile natif FCM/APNS full stack (actuel: inbox Firestore + notif locale best effort)
- **Pôles carousel club / staff / pro_player distincts** (cible §14) : **implémenté**
  au carousel pré-connexion (`pro_player`, `pro_club`, `pro_staff`) avec stockage
  `product_line: 'pro'` inchangé et preset rôle inscription
  (`PRO_SIGNUP_PRESET_ROLE_KEY`). Identités de marque dédiées dans
  `carouselPoleExperience.ts` + accents/gradients par segment.
- **Onglet Club amateur joueur** : shell `Équipe · Déplacements · Club · Moi` +
  `AmateurClubScreen` (statut adhésion, annonces, effectif, rejoindre un club).
- **Écrans Pro joueur dédiés** : coquilles initiales remplacées par versions enrichies
  (voir Done ci-dessus) — `resolveMainTabScreen` pour `line === 'pro_player' && role === 'player'`.
- **Joueur pro à l'inscription** : rôle `player` ajouté à `PRO_PRODUCT_ROLES` et
  groupe signup `pro_player`.
- **Rename `product_line` en base** (`pro` → `pro_player`/`club`/`staff`) :
  **implémenté** — nouveaux comptes écrivent `pro_player` | `pro_club` | `pro_staff`.
  Migration automatique à la connexion (`productLineMigration.service`) + script batch
  `scripts/migrate-product-lines.mjs`. Legacy `pro` reste lisible via `canonicalizeProductLine`.

---

*Fin du document — PRODAY Architecture des pôles v2 détaillée — Juin 2026*
