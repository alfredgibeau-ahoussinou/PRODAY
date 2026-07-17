# Visio native Daily.co — configuration

ProDay utilise **Daily.co Prebuilt** comme flux principal de téléconsultation. Cal.com reste disponible en **secours** si Daily n'est pas configuré ou si la création de salle échoue.

## Prérequis

1. Compte [Daily.co](https://www.daily.co/) (offre gratuite suffisante pour les tests)
2. Projet Firebase en plan **Blaze** (Cloud Functions)
3. Sous-domaine Daily (ex. `proday` → `proday.daily.co`)

## Configuration Firebase Functions

```bash
# Clé API Daily (Dashboard → Developers → API keys)
firebase functions:config:set visio.daily_api_key="VOTRE_CLE_DAILY"

# Sous-domaine Daily (optionnel, défaut : proday)
firebase functions:config:set visio.daily_domain="proday"

# Déployer les fonctions visio
firebase deploy --only functions:getVisioJoinUrl,functions:onMedicalAppointmentUpdated,functions:onMedicalAppointmentCreated
```

Variable d'environnement alternative (émulateur local) :

```bash
export DAILY_API_KEY="VOTRE_CLE_DAILY"
```

## Flux utilisateur (zéro formulaire)

| Étape | Comportement |
|-------|--------------|
| Réservation joueur | Créneau + note optionnelle — **pas de nom/email** (profil Firebase) |
| Confirmation praticien | Cloud Function crée la salle Daily `proday-rdv-{appointmentId}` avec prejoin désactivé |
| « Rejoindre la visio » | Callable `getVisioJoinUrl` → token + `userName`/`userId` depuis le profil |
| Échec Daily | Lien Cal.com du praticien en secours (page externe) |

## Tester le join direct

1. Configurer `visio.daily_api_key` et déployer les functions
2. Créer un RDV visio depuis l'app (joueur)
3. Confirmer depuis l'agenda praticien
4. Vérifier dans Firestore : `meeting_link` = `https://proday.daily.co/proday-rdv-...`, `visio_provider` = `daily`
5. Appuyer sur **Rejoindre la visio** — entrée directe dans la salle, nom pré-rempli, sans formulaire

## Sans clé API (développement)

Sans `daily_api_key`, le système génère quand même l'URL déterministe `https://proday.daily.co/proday-rdv-{id}`. La salle ne sera pas créée côté Daily tant que la clé n'est pas configurée — utile pour tester l'UI, pas pour un appel réel.

## CSP / permissions

Les domaines `*.daily.co` sont déjà autorisés dans `netlify.toml` (camera, microphone, frame-src).
