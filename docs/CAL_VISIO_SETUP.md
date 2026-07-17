# Visio Cal.com (Cal Video) — configuration

ProDay utilise **Cal Video** (intégré Cal.com) comme flux principal de téléconsultation. **Daily.co** reste disponible en **secours** si Cal.com n'est pas configuré ou si la création du booking échoue.

## Prérequis praticien

1. Compte [Cal.com](https://cal.com/signup) avec username public (`cal_com_username` dans ProDay) **ou** compte org ProDay partagé (`cal.default_username`)
2. **Type d'événement visio** avec lieu **Cal Video** activé (Settings → Event Types → Location → Cal Video)
3. Slug de l'événement connu (ex. `teleconsultation`) — configurable dans le profil ou via Firebase

## Configuration Firebase Functions

```bash
# Clé API Cal.com (Settings → Developer → API Keys)
firebase functions:config:set cal.api_key="cal_live_VOTRE_CLE"

# Slug par défaut de l'événement visio (optionnel, défaut : teleconsultation)
firebase functions:config:set cal.event_type_slug="teleconsultation"

# Username Cal.com org ProDay — secours si le praticien n'a pas cal_com_username
firebase functions:config:set cal.default_username="proday-sante"

# Secours Daily (optionnel)
firebase functions:config:set visio.daily_api_key="VOTRE_CLE_DAILY"
firebase functions:config:set visio.daily_domain="proday"

# Déployer
firebase deploy --only functions:getVisioJoinUrl,functions:onMedicalAppointmentUpdated,functions:onMedicalAppointmentCreated
```

Variable d'environnement alternative (émulateur local) :

```bash
export CAL_API_KEY="cal_live_VOTRE_CLE"
export CAL_DEFAULT_USERNAME="proday-sante"
export DAILY_API_KEY="VOTRE_CLE_DAILY"
```

## Profil praticien ProDay

| Champ | Exemple | Rôle |
|-------|---------|------|
| `cal_com_username` | `cabinet-martin-kine` | Username Cal.com (optionnel si `cal.default_username` configuré) |
| `booking_url` | `https://cal.com/cabinet-martin-kine/teleconsultation` | Lien complet (extrait le slug événement) |
| `cal_event_type_slug` | `teleconsultation` | Slug si booking_url = page racine |

**Compte org vs par praticien :** si tous les praticiens partagent le même calendrier Cal.com ProDay, configurez uniquement `cal.default_username` + `cal.event_type_slug`. Sinon, chaque praticien renseigne son `cal_com_username`.

## Flux utilisateur (zéro formulaire, auto-confirm visio)

| Étape | Comportement |
|-------|--------------|
| Réservation joueur (visio) | Créneau + note — **pas de nom/email** (profil Firebase) |
| **Création RDV (Cloud Function)** | Booking Cal.com + Cal Video créé **immédiatement** via API |
| Firestore | `status: confirmed`, `meeting_link`, `cal_booking_uid`, `visio_provider: cal` |
| Planning Cal.com praticien | RDV visible **sans confirmation manuelle** |
| « Rejoindre la visio » | Disponible dès la réservation (callable `getVisioJoinUrl`) |
| Réservation cabinet | Flux classique : `pending` → confirmation praticien |
| Échec Cal.com API | Daily.co si clé configurée, sinon RDV reste `pending` |

## Configurer Cal.com (côté praticien)

1. Créer un type d'événement **Téléconsultation** (ex. 30 min)
2. **Location** → sélectionner **Cal Video** (pas Zoom / Meet)
3. Noter le **slug** de l'événement (URL : `cal.com/votre-username/teleconsultation`)
4. Générer une **API Key** (Developer settings) et la transmettre à l'admin ProDay pour `cal.api_key`

## Tester le join direct

1. Configurer `cal.api_key` et déployer les functions
2. Créer un RDV visio depuis l'app (joueur)
3. Vérifier Firestore : `status: confirmed`, `meeting_link` contient `app.cal.com/video`, `visio_provider` = `cal`
4. Vérifier le planning Cal.com du praticien — le RDV y apparaît
5. Appuyer sur **Rejoindre la visio** — entrée directe dans Cal Video, sans formulaire email/horaires

## Sans clé API Cal.com

Sans `cal.api_key`, le système tente un lien Cal.com pré-rempli (créneau + Cal Video). Si le praticien n'a pas Cal Video activé, Daily.co prend le relais si `visio.daily_api_key` est configuré.

## CSP / permissions

Les domaines `cal.com`, `*.cal.com`, `app.cal.com` et `*.daily.co` sont autorisés dans `netlify.toml` (camera, microphone, frame-src).
