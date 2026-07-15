# Téléconsultation pôle Santé — lancement ProDay

## Contexte

Pour un « Doctolib + visio » sport (kinés, ostéos, coach mental…), **Zoom / Google Meet ne conviennent pas** si des données de santé circulent (HDS / RGPD UE).

## Qui a l’agenda ?

**Les professionnels de santé inscrits sur le pôle Santé**, pas un calendrier au nom du fondateur.

| Acteur | Rôle |
|--------|------|
| Praticien (physio, ostéo…) | S’inscrit, valide son cabinet, connecte **son** Cal.com / lien visio |
| Sportif / club | Choisit un pro dans l’**annuaire** et réserve sur **la fiche de ce praticien** |
| ProDay | Plateforme + partenaire technique (Cal Video / Whereby) — pas le médecin |

Ne jamais mettre un profil Cal.com personnel (prénom fondateur) comme booking global sur `/sante`.

## Décision produit (lancement)

| Couche | Choix | Pourquoi |
|--------|--------|----------|
| Agenda praticien (app) | ProDay (`PhysioAgendaScreen`, RDV) | Cockpit métier |
| Lien booking / visio | **Cal.com de chaque praticien** (ou Whereby) | Conforme, 1 compte par pro |
| Visio custom WebRTC | **Plus tard** (Daily.co / Jitsi) | Si usage massif validé |

### UX web actuelle

Page [`/sante#teleconsultation`](https://proday75.fr/sante#teleconsultation) : explique le parcours + CTA inscription praticiens. **Pas d’iframe Cal.com globale.**

### Roadmap technique

1. Champ profil praticien `booking_url` / `cal_com_username` (Cal.com du pro).
2. Depuis la fiche annuaire → ouvrir / embed **son** lien uniquement.
3. Optionnel plus tard : org Cal.com « Pro Day Santé » multi-membres (team), jamais un prénom individuel en vitrine.

## Config

Plus de `NEXT_PUBLIC_SANTE_BOOKING_EMBED_URL` obligatoire. CSP conserve `frame-src` Cal.com / Whereby pour les embeds **par fiche praticien** à venir.

## HDS / RGPD

Visio via Cal Video (Daily.co) ou Whereby Embedded — pas Zoom / Meet classiques pour les échanges médicaux.
