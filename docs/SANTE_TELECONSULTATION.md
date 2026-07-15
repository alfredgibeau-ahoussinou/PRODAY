# Téléconsultation pôle Santé — lancement ProDay

## Contexte

Pour un « Doctolib + visio » sport (kinés, ostéos, coach mental…), **Zoom / Google Meet ne conviennent pas** si des données de santé circulent (HDS / RGPD UE).

## Qui a l’agenda ?

**Les professionnels de santé inscrits sur le pôle Santé**, pas un calendrier au nom du fondateur.

| Acteur | Rôle |
|--------|------|
| Praticien (physio, ostéo…) | S’inscrit sur ProDay **et** Cal.com en même temps (username / lien public obligatoire) |
| Sportif / joueur | Compte ProDay uniquement — réserve **sans** compte Cal.com (invité sur le lien du pro) |
| ProDay | Plateforme + partenaire technique (Cal Video / Whereby) — pas le médecin |

Ne jamais mettre un profil Cal.com personnel (prénom fondateur) comme booking global sur `/sante`.

## Décision produit (lancement)

| Couche | Choix | Pourquoi |
|--------|--------|----------|
| Inscription praticien | Champ `cal_com_username` + `booking_url` | Cal.com obligatoire dès le cabinet |
| Booking sportif (app) | Ouvre le Cal.com du praticien si présent, sinon créneaux ProDay | UX simple, 0 compte Cal pour le patient |
| Visio | Cal Video / Whereby | Conforme HDS — pas Zoom / Meet |

### UX web

Page [`/sante#teleconsultation`](https://proday75.fr/sante#teleconsultation) : parcours praticien + sportif. **Pas d’iframe Cal.com globale.**

### Implémenté

1. Profil praticien `booking_url` / `cal_com_username`.
2. Signup pôle Santé (étape cabinet) : validation Cal.com + lien inscription.
3. Écran disponibilités praticien : édition / sauvegarde Cal.com.
4. Réservation joueur : CTA « Prendre RDV (Cal.com) » depuis la fiche.

## Config

Pas de `NEXT_PUBLIC_SANTE_BOOKING_EMBED_URL` obligatoire. CSP conserve `frame-src` Cal.com / Whereby pour d’éventuels embeds **par fiche praticien**.

## HDS / RGPD

Visio via Cal Video (Daily.co) ou Whereby Embedded — pas Zoom / Meet classiques pour les échanges médicaux.
