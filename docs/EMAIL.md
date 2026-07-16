# E-mails ProDay — Brevo (principal)

ProDay envoie tous les e-mails utilisateur via **[Brevo](https://www.brevo.com/)** (API transactionnelle gratuite). EmailJS reste disponible en **repli** si Brevo échoue et que les clés EmailJS sont encore configurées.

## Prérequis Brevo

1. Compte [Brevo](https://app.brevo.com/)
2. **Expéditeurs & IP** → vérifier l'adresse `contact@proday75.fr` (obligatoire avant envoi)
3. **SMTP & API** → créer une clé API transactionnelle (`xkeysib-...`)

> Ne jamais committer la clé API. Utiliser `firebase functions:config:set` ou les secrets Firebase.

## Configuration Firebase

```bash
firebase functions:config:set \
  email.provider="brevo" \
  email.brevo_api_key="xkeysib-VOTRE_CLE" \
  email.from_email="contact@proday75.fr" \
  email.from_name="ProDay" \
  auth.enabled=true \
  auth.continue_url="https://proday75.fr" \
  beta.site_url="https://proday75.fr"
```

| Clé | Description |
|-----|-------------|
| `email.provider` | `brevo` (défaut) ou `emailjs` pour forcer l'ancien transport |
| `email.brevo_api_key` | Clé API Brevo (secret) |
| `email.from_email` | Expéditeur vérifié dans Brevo |
| `email.from_name` | Nom affiché (`ProDay`) |
| `auth.enabled` | `true` pour activer les e-mails Auth brandés |
| `auth.continue_url` | URL de redirection après action Auth |

## Flux et templates HTML

Les HTML sont générés côté Cloud Functions — **aucun template dashboard Brevo requis**.

| Flux | Source HTML | Cloud Function(s) |
|------|-------------|-------------------|
| Auth — vérification | `firebase/auth-email-templates/verification.html` | `sendAuthVerificationEmail` |
| Auth — reset mot de passe | `firebase/auth-email-templates/password-reset.html` | `sendAuthPasswordResetEmail` |
| Bêta bienvenue | `functions/src/betaWaitlistEmail.ts` (`buildBetaWelcomeEmail`) | `adminApproveBetaAccess`, `adminResendBetaWelcomeEmail` |
| Rendez-vous Santé | `docs/emailjs/appointment.html` | `onMedicalAppointmentCreated`, `onMedicalAppointmentUpdated` |

Rendu Auth : `functions/src/authEmailTemplates.ts` (`renderAuthEmailTemplate`).

## Helper central (Cloud Functions)

- `functions/src/brevoEmailClient.ts` — `sendViaBrevo()`, `getBrevoConfig()`
- `functions/src/emailTransport.ts` — `sendTransactionalEmail()` (Brevo → repli EmailJS)
- `functions/src/emailJsClient.ts` — repli EmailJS (legacy)

## Déploiement

```bash
cd functions && npm run build && npm test
firebase deploy --only functions:sendAuthVerificationEmail,functions:sendAuthPasswordResetEmail,functions:adminApproveBetaAccess,functions:adminResendBetaWelcomeEmail,functions:onMedicalAppointmentCreated,functions:onMedicalAppointmentUpdated
```

## Test manuel Brevo (curl)

```bash
# Récupérer la clé depuis la config Firebase (ne pas l'afficher en clair)
BREVO_KEY="$(firebase functions:config:get email.brevo_api_key 2>/dev/null | tr -d '\"')"

curl -sS -X POST 'https://api.brevo.com/v3/smtp/email' \
  -H "api-key: $BREVO_KEY" \
  -H 'Content-Type: application/json' \
  -d '{
    "sender": {"name": "ProDay", "email": "contact@proday75.fr"},
    "to": [{"email": "votre@email.com"}],
    "subject": "Test Brevo ProDay",
    "htmlContent": "<p>Test migration Brevo OK</p>"
  }'
```

Scripts Auth (Admin SDK + transport configuré) :

```bash
npm run auth:send-verification -- user@example.com
npm run auth:send-password-reset -- user@example.com
```

## Dépannage

| Symptôme | Action |
|----------|--------|
| 401 / clé invalide | Vérifier `email.brevo_api_key` ; régénérer la clé dans Brevo |
| Expéditeur non vérifié | Dashboard Brevo → Expéditeurs → valider `contact@proday75.fr` |
| E-mail Auth EN (Firebase natif) | Brevo indisponible ou `auth.enabled=false` → vérifier config et logs Functions |
| Bêta sans email | Approuver l'inscription admin ; vérifier `email.brevo_api_key` |
| RDV sans email | Déployer triggers ; email sur fiche `users/{uid}` ou Auth |
| Repli EmailJS | Conserver `beta.emailjs_*` / `auth.emailjs_*` si souhaité |

## Repli EmailJS (optionnel)

Voir `docs/EMAILJS.md` pour la configuration legacy. Définir `email.provider="emailjs"` pour forcer EmailJS.

## Voir aussi

- `docs/EMAILJS.md` — guide EmailJS (repli)
- `firebase/auth-email-templates/README.md` — Auth détaillé
- `functions/.env.example` — placeholders locaux
