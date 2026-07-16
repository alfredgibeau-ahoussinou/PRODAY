# EmailJS — guide maître ProDay

ProDay utilise **[EmailJS](https://www.emailjs.com/)** comme **seul** transport pour tous les e-mails utilisateur (Auth, bêta, rendez-vous). En cas d'échec EmailJS côté Auth, l'app retombe sur les e-mails Firebase natifs.

## Prérequis dashboard EmailJS

1. Compte EmailJS (même compte pour tous les flux)
2. **Email Services** → connecter Gmail/Outlook (Service ID partagé)
3. **Account → Security** → activer **Allow EmailJS API for non-browser applications**
4. Créer **un template par flux** (ne pas réutiliser le template bêta pour l'Auth)

## Templates et fichiers source

| Flux | Fichier HTML à copier | Clé config Firebase | Variables env Netlify (site) |
|------|----------------------|---------------------|------------------------------|
| Auth — vérification e-mail | `docs/emailjs/auth-verification.html` | `auth.emailjs_verification_template_id` | — |
| Auth — reset mot de passe | `docs/emailjs/auth-password-reset.html` | `auth.emailjs_password_reset_template_id` | — |
| Auth — unifié (legacy) | `docs/emailjs/auth-action.html` | `auth.emailjs_template_id` (repli) | — |
| Bêta bienvenue | `docs/emailjs/beta-welcome.html` | `beta.emailjs_template_id` | `EMAILJS_TEMPLATE_ID` |
| Rendez-vous Santé | `docs/emailjs/appointment.html` | `appointment.emailjs_template_id` | — |

Texte brut optionnel : `docs/emailjs/auth-verification.txt`, `docs/emailjs/auth-password-reset.txt`, `docs/emailjs/auth-action.txt` (legacy), `docs/emailjs/beta-welcome.txt`.

### Paramètres communs EmailJS (chaque template)

- **To Email** : `{{email}}`
- **From Name** : `ProDay`
- **Subject** : `{{subject}}`
- **Reply To** : `support@proday.app` (bêta / RDV) ou `contact@proday.app` (Auth)

## Clés partagées (service + API)

Les clés **service / public / private** sont définies une fois sous `beta.*` et héritées par Auth et Rendez-vous :

```bash
firebase functions:config:set \
  beta.emailjs_service_id="service_VOTRE_ID" \
  beta.emailjs_public_key="VOTRE_CLE_PUBLIQUE" \
  beta.emailjs_private_key="VOTRE_CLE_PRIVEE" \
  beta.emailjs_template_id="template_BETA" \
  beta.site_url="https://proday75.fr"
```

## Configuration par flux

### Auth (vérification + mot de passe oublié)

Cloud Functions : `sendAuthVerificationEmail`, `sendAuthPasswordResetEmail`.

**Recommandé** — deux templates EmailJS distincts :

```bash
firebase functions:config:set \
  auth.enabled=true \
  auth.emailjs_verification_template_id="template_VERIF" \
  auth.emailjs_password_reset_template_id="template_RESET" \
  auth.continue_url="https://proday75.fr"
```

| Template | Fichier source | Objet suggéré |
|----------|----------------|---------------|
| Vérification | `docs/emailjs/auth-verification.html` | `Confirmez votre adresse e-mail ProDay` |
| Reset | `docs/emailjs/auth-password-reset.html` | `Réinitialisez votre mot de passe ProDay` |

Variables (templates séparés) : `email`, `app_name`, `subject`, `action_link`, `message_text`, `display_name_greeting`.

**Legacy** — un seul template dynamique (`auth.emailjs_template_id` + `docs/emailjs/auth-action.html`) : utilisé en repli si l'ID spécifique au flux est absent. Variables dynamiques : `functions/src/authEmailJsParams.ts`.

Ordre d'envoi : **EmailJS** → Firebase natif côté app (si EmailJS indisponible ou non configuré).

### Bêta waitlist

- **Site** : `POST /api/beta` → Cloud Function `submitBetaWaitlist` (Firestore, statut `pending`)
- **Email bienvenue** : après approbation admin (`adminApproveBetaAccess`) ou renvoi admin

```bash
firebase functions:config:set \
  beta.emailjs_template_id="template_BETA"
```

**Netlify** (variables serveur, voir `website/.env.example`) :

```
EMAILJS_SERVICE_ID=service_xxx
EMAILJS_TEMPLATE_ID=template_xxx
EMAILJS_PUBLIC_KEY=xxx
EMAILJS_PRIVATE_KEY=xxx
BETA_WAITLIST_FUNCTION_URL=https://europe-west1-PROJECT.cloudfunctions.net/submitBetaWaitlist
```

> Le site n'envoie plus d'e-mail directement : l'envoi passe par Firebase après validation admin.

### Rendez-vous (pôle Santé)

Triggers Firestore : `onMedicalAppointmentCreated`, `onMedicalAppointmentUpdated`.

| Événement | Destinataire | `email_kind` |
|-----------|--------------|--------------|
| Nouvelle demande | Praticien + patient | `booking_request_physio`, `booking_pending_patient` |
| Confirmé | Patient | `booking_confirmed` |
| Annulé | Patient | `booking_cancelled` |

```bash
firebase functions:config:set \
  appointment.emailjs_template_id="template_RDV"
```

Variables : `functions/src/appointmentEmail.ts`, en-tête `docs/emailjs/appointment.html`.

## Helper central (Cloud Functions)

`functions/src/emailJsClient.ts` :

- `getEmailJsConfig('auth' | 'beta' | 'appointment')`
- `sendEmailViaEmailJs(config, templateParams)`

## Déploiement

```bash
cd functions && npm run build && npm test
firebase deploy --only functions:sendAuthVerificationEmail,functions:sendAuthPasswordResetEmail,functions:adminApproveBetaAccess,functions:adminResendBetaWelcomeEmail,functions:onMedicalAppointmentCreated,functions:onMedicalAppointmentUpdated
```

## Scripts de test manuel

```bash
npm run auth:send-verification -- user@example.com
npm run auth:send-password-reset -- user@example.com
```

## Dépannage

| Symptôme | Action |
|----------|--------|
| E-mail Auth = template bêta | Vérifier `auth.emailjs_verification_template_id` / `auth.emailjs_password_reset_template_id` |
| 403 EmailJS | Activer API non-navigateur ; vérifier clés |
| 412 Gmail | Reconnecter Gmail dans EmailJS → Email Services |
| Bêta sans email | Approuver l'inscription admin ; vérifier `beta.emailjs_*` |
| RDV sans email | Déployer triggers ; configurer `appointment.emailjs_template_id` ; email sur fiche `users/{uid}` |
| E-mail Auth EN (Firebase natif) | Templates Auth EmailJS absents ou envoi échoué → configurer les IDs et redéployer |

## Voir aussi

- `firebase/auth-email-templates/README.md` — Auth détaillé (fichiers HTML de référence design)
- `docs/BETA_WAITLIST.md` — bêta waitlist
- `functions/.env.example` — liste complète des clés
