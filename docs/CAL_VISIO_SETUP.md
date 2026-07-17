# Visio Cal.com (Cal Video) — configuration

ProDay utilise **Cal Video** (intégré Cal.com) comme flux principal de téléconsultation. **Daily.co** reste disponible en **secours** si Cal.com n'est pas configuré ou si la création du booking échoue.

## Prérequis praticien

1. Compte [Cal.com](https://cal.com/signup) avec username public (`cal_com_username` dans ProDay)
2. **Type d'événement visio** avec lieu **Cal Video** activé (Settings → Event Types → Location → Cal Video)
3. Slug de l'événement connu (ex. `teleconsultation`) — configurable dans le profil ou via Firebase

## Configuration Firebase Functions

```bash
# Clé API Cal.com (Settings → Developer → API Keys)
firebase functions:config:set cal.api_key="cal_live_VOTRE_CLE"

# Slug par défaut de l'événement visio (optionnel, défaut : teleconsultation)
firebase functions:config:set cal.event_type_slug="teleconsultation"

# Secours Daily (optionnel)
firebase functions:config:set visio.daily_api_key="VOTRE_CLE_DAILY"
firebase functions:config:set visio.daily_domain="proday"

# Déployer
firebase deploy --only functions:getVisioJoinUrl,functions:onMedicalAppointmentUpdated,functions:onMedicalAppointmentCreated
```

Variable d'environnement alternative (émulateur local) :

```bash
export CAL_API_KEY="cal_live_VOTRE_CLE"
export DAILY_API_KEY="VOTRE_CLE_DAILY"
```

## Profil praticien ProDay

| Champ | Exemple | Rôle |
|-------|---------|------|
| `cal_com_username` | `cabinet-martin-kine` | Username Cal.com |
| `booking_url` | `https://cal.com/cabinet-martin-kine/teleconsultation` | Lien complet (extrait le slug événement) |
| `cal_event_type_slug` | `teleconsultation` | Slug si booking_url = page racine |

## Flux utilisateur (zéro formulaire)

| Étape | Comportement |
|-------|--------------|
| Réservation joueur | Créneau + note — **pas de nom/email** (profil Firebase) |
| Confirmation praticien | Cloud Function crée un booking Cal.com avec Cal Video via API |
| Firestore | `meeting_link` = `https://app.cal.com/video/{uid}`, `visio_provider` = `cal` |
| « Rejoindre la visio » | Callable `getVisioJoinUrl` → URL Cal Video + nom/email depuis le profil |
| Échec Cal.com API | Lien Cal.com pré-rempli (secours) ou Daily.co si clé configurée |

## Configurer Cal.com (côté praticien)

1. Créer un type d'événement **Téléconsultation** (ex. 30 min)
2. **Location** → sélectionner **Cal Video** (pas Zoom / Meet)
3. Noter le **slug** de l'événement (URL : `cal.com/votre-username/teleconsultation`)
4. Générer une **API Key** (Developer settings) et la transmettre à l'admin ProDay pour `cal.api_key`

## Tester le join direct

1. Configurer `cal.api_key` et déployer les functions
2. Créer un RDV visio depuis l'app (joueur)
3. Confirmer depuis l'agenda praticien
4. Vérifier Firestore : `meeting_link` contient `app.cal.com/video`, `visio_provider` = `cal`
5. Appuyer sur **Rejoindre la visio** — entrée directe dans Cal Video, sans formulaire email/horaires

## Sans clé API Cal.com

Sans `cal.api_key`, le système tente un lien Cal.com pré-rempli (créneau + Cal Video). Si le praticien n'a pas Cal Video activé, Daily.co prend le relais si `visio.daily_api_key` est configuré.

## CSP / permissions

Les domaines `cal.com`, `*.cal.com`, `app.cal.com` et `*.daily.co` sont autorisés dans `netlify.toml` (camera, microphone, frame-src).
