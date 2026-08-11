# Architecture pôles ProDay — cible août 2026

## Vision

ProDay = plateforme de référence du football amateur et semi-pro : **plus simple** que les concurrents, **plus complète**, avec un **modèle économique flexible** pour chaque budget de club.

## Pôles principaux (vitrine)

| Pôle | Rôle |
|------|------|
| **Joueur** | Profil, réseau, stats, convocations, covoiturage (+ Pass Premium 3,99 €) |
| **Club** | Cœur de la plateforme — équipes, licenciés, compétitions, permissions |
| **Coach** | Profil coach rattaché au club — Smart Tactics, IA, vidéo, effectif |
| **Supporter** | Tribune gratuite |
| **Sponsor** | Visibilité marque |

## Rôles intégrés (plus des pôles)

| Ancien pôle | Statut |
|------------|--------|
| Santé | Rôle `physio` — annuaire / agenda / visio |
| Agent | Rôle réseau sous écosystème Coach / Club |
| Recruteur | Rôle réseau (Mercato, shortlists) |
| Organisateur | Rôle intégré au Club (tournois, détections, stages) |

## Offres Club

| Offre | Prix indicatif | Inclus |
|-------|----------------|--------|
| **Amateur** | 4,99 €/mois | Licenciés, convocations, présences, calendrier, com, covoit, résultats, classements |
| **Essentiel** | 11,99 €/mois | Gestion club + compétitions ; coachs en abo individuel pour Smart Tactics |
| **Premium** | 39,99 €/mois | Tous coachs / staff / joueurs ; Smart Tactics, IA, **vidéo BYO** (smartphone / tablette) |
| **ProDay Pro + Veo** | Sur devis / admin | Premium + caméra (achat / location / déjà possédée), cloud, découpage auto |

Sous Club Premium et Pro + Veo, les coachs ne paient rien. Les joueurs peuvent activer le **Pass Premium** à **3,99 €/mois**.

## Pass Joueur

- **Gratuit** : profil, réseau, stats de base, événements, messagerie, convocations, covoiturage
- **Premium 3,99 €** : entraînements IA, stats avancées, heatmaps, vidéo, passeport recruteur, objectifs, historique, comparaisons

## Offres vidéo & matériel (optionnel)

**Pas de pack « Essentiel 990 €/an » séparé** : filmer avec son matériel est inclus dans Club Premium (et via abo Coach).

**ProDay Pro + Veo** est l’option clé en main du catalogue Club.

Principe : **le matériel n’est jamais obligatoire**. Architecture multi-fabricants
(smartphone, tablette, Veo, Trace, Pixellot, Spiideo, futures caméras).

Acquisition matériel (Pro + Veo) :
1. **Caméra déjà possédée** → connexion seule
2. **Location** via ProDay
3. **Achat** via ProDay

Analyse vidéo cible : découpage auto, temps forts, buts, arrêts, cartons, remplacements, heatmaps, stats, rapports IA.

Prix Pro + Veo **surchargeable depuis l’administration** (`video.pro_camera.display_price`).

## Modules déjà en code (réutiliser)

- Coach portal (`CoachPortalScreen` + chapitres)
- Smart Tactics (`SmartTacticsPortalScreen`, board, cards, video jobs)
- Compétitions (standings, stats, POTM, season fixtures)
- Covoiturage (onglet central, live trip, event-tied)
- Club structure / recrutement / communication

## Fichiers fondations (cette vague)

| Zone | Fichiers |
|------|----------|
| Carousel 5 pôles | `src/models/CarouselPole.ts` |
| Offres club | `src/content/clubOffers.ts` |
| Offres vidéo | `src/content/videoOffers.ts` |
| Plans store | `src/content/subscriptionPlans.ts` |
| Gates | `src/utils/clubFeatureAccess.ts` |
| Site pôles | `website/src/lib/poles.ts`, `/coach`, redirects `/pro-staff` `/evenements` |

## Suite produit

1. Permissions club granulaires (invites + rôles dirigeants / parents / bénévoles)
2. Wiring gates Club Premium → Smart Tactics inclus pour coachs du club
3. Live tagging + clips auto (architecture vidéo multi-vendeurs)
4. Entraînements IA collectifs / individuels (programmes évolutifs)
5. Design immersif page par page (cartes, widgets, timelines — éviter tableaux admin)
6. Déployer SKU store `club_amateur` / `club_premium` + mise à jour RevenueCat
