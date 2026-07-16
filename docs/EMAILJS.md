# EmailJS — repli ProDay (legacy)

> **Transport principal : Brevo** — voir [`docs/EMAIL.md`](./EMAIL.md).

EmailJS reste supporté en **repli** si Brevo échoue et que les clés sont configurées. Définir `email.provider="emailjs"` pour forcer EmailJS.

## Prérequis dashboard EmailJS

1. Compte EmailJS (même compte pour tous les flux)
2. **Email Services** → connecter Gmail/Outlook (Service ID partagé)
3. **Account → Security** → activer **Allow EmailJS API for non-browser applications**
4. Créer **un template par flux** (ne pas réutiliser le template bêta pour l'Auth)

## Templates et fichiers source

| Flux | Fichier HTML | Clé config Firebase |
|------|--------------|---------------------|
| Auth — vérification | `docs/emailjs/auth-verification.html` | `auth.emailjs_verification_template_id` |
| Auth — reset | `docs/emailjs/auth-password-reset.html` | `auth.emailjs_password_reset_template_id` |
| Auth — unifié (legacy) | `docs/emailjs/auth-action.html` | `auth.emailjs_template_id` |
| Bêta bienvenue | `docs/emailjs/beta-welcome.html` | `beta.emailjs_template_id` |
| Rendez-vous Santé | `docs/emailjs/appointment.html` | `appointment.emailjs_template_id` |

## Clés partagées (service + API)

```bash
firebase functions:config:set \
  beta.emailjs_service_id="service_VOTRE_ID" \
  beta.emailjs_public_key="VOTRE_CLE_PUBLIQUE" \
  beta.emailjs_private_key="VOTRE_CLE_PRIVEE" \
  beta.emailjs_template_id="template_BETA" \
  beta.site_url="https://proday75.fr"
```

## Helper central (Cloud Functions)

`functions/src/emailJsClient.ts` :

- `getEmailJsConfig('auth' | 'beta' | 'appointment')`
- `sendEmailViaEmailJs(config, templateParams)`

Utilisé via `functions/src/emailTransport.ts` en repli après échec Brevo.

## Dépannage EmailJS

| Symptôme | Action |
|----------|--------|
| 403 EmailJS | Activer API non-navigateur ; vérifier clés |
| 412 Gmail | Reconnecter Gmail dans EmailJS → Email Services |
| E-mail Auth = template bêta | Vérifier `auth.emailjs_verification_template_id` / `auth.emailjs_password_reset_template_id` |

## Voir aussi

- [`docs/EMAIL.md`](./EMAIL.md) — Brevo (principal)
- `firebase/auth-email-templates/README.md`
- `functions/.env.example`
