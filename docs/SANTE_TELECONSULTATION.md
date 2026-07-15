# Téléconsultation pôle Santé — lancement ProDay

## Contexte

Pour un « Doctolib + visio » sport (kinés, ostéos, coach mental…), **Zoom / Google Meet ne conviennent pas** si des données de santé circulent (HDS / RGPD UE).

## Décision produit (lancement)

| Couche | Choix | Pourquoi |
|--------|--------|----------|
| Agenda praticien (app) | Déjà ProDay (`PhysioAgendaScreen`, RDV) | Cockpit métier |
| Prise de RDV web + visio | **Cal.com** (embed) ou **Whereby Embedded** | Conforme, jours et non mois de dev |
| Visio custom WebRTC | **Plus tard** (Daily.co / Jitsi) | Seulement si usage massif validé |

### Recommandation

1. **Cal.com** si vous voulez agenda public + Cal Video (Daily.co) en un seul produit.
2. **Whereby Embedded** si l’agenda ProDay suffit et qu’il ne manque que la salle vidéo dans une page.

Ne pas coder une pile WebRTC propriétaire avant d’avoir validé la demande kinés / clubs en bêta.

## Configuration site (`proday75.fr`)

Sur Netlify / `.env.local` :

```bash
# URL d’iframe Cal.com (ex. https://cal.com/proday-sante/teleconsultation)
# ou Whereby (ex. https://proday.whereby.com/room-demo?embed=…)
NEXT_PUBLIC_SANTE_BOOKING_EMBED_URL=

# Optionnel — lien « ouvrir dans un nouvel onglet »
NEXT_PUBLIC_SANTE_BOOKING_PAGE_URL=
```

Page marketing : [`/sante#teleconsultation`](https://proday75.fr/sante#teleconsultation).

CSP Netlify : `frame-src` autorise Cal.com / Whereby ; caméra / micro autorisés pour ces origines.

## Roadmap

1. **Maintenant** — embed partenaire + mentions HDS / distinction Vidéos éducatives vs téléconsult.
2. **Bêta** — lier chaque RDV app à un `meeting_url` partenaire (Whereby room ou Cal).
3. **Post-validation** — éventuelle visio white-label Daily.co / Jitsi sous marque ProDay + audit HDS.
