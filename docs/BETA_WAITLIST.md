# Inscriptions bêta (site vitrine) — EmailJS

Envoi via [EmailJS](https://www.emailjs.com/) : pas de domaine DNS à vérifier, branchement Gmail/Outlook dans le dashboard.

## 1. Compte EmailJS

1. [emailjs.com](https://www.emailjs.com/) → créer un compte
2. **Email Services** → connecter Gmail (ou autre) — ex. `contact@proday.app`
3. **Account → Security** → activer **Allow EmailJS API for non-browser applications**

## 2. Template « Bêta ProDay »

**Email Templates → Create**

| Champ | Valeur |
|-------|--------|
| **To Email** | `{{to_email}}` |
| **Subject** | `{{subject}}` |
| **Content** | `{{{message_html}}}` (mode HTML, triple accolades) |

Variables injectées par le code : `to_email`, `role_label`, `site_url`, `beta_url`, `subject`, `message_html`, `message_text`.

Le HTML complet est généré dans `website/src/lib/betaWelcomeEmail.ts`.

## 3. Clés API

**Account → API Keys** :

- **Public Key** → `EMAILJS_PUBLIC_KEY`
- **Private Key** → `EMAILJS_PRIVATE_KEY` (serveur uniquement, jamais dans le navigateur)

**Email Services** → Service ID → `EMAILJS_SERVICE_ID`  
**Email Templates** → Template ID → `EMAILJS_TEMPLATE_ID`

## 4. Vercel (projet `website`)

| Variable | Description |
|----------|-------------|
| `EMAILJS_SERVICE_ID` | ID service EmailJS |
| `EMAILJS_TEMPLATE_ID` | ID template bêta |
| `EMAILJS_PUBLIC_KEY` | Clé publique |
| `EMAILJS_PRIVATE_KEY` | Clé privée (secret) |
| `NEXT_PUBLIC_SITE_URL` | `https://proday-xak9.vercel.app` ou `https://proday.app` |

Redéployez après ajout des variables.

## 5. Firebase (optionnel — Firestore + email)

Plan **Blaze** requis pour Cloud Functions.

```bash
firebase functions:config:set \
  beta.emailjs_service_id="service_xxx" \
  beta.emailjs_template_id="template_xxx" \
  beta.emailjs_public_key="xxx" \
  beta.emailjs_private_key="xxx" \
  beta.site_url="https://proday.app"

firebase deploy --only functions:submitBetaWaitlist,firestore:rules
```

Sur Vercel, ajoutez aussi :
```env
BETA_WAITLIST_FUNCTION_URL=https://europe-west1-proday-155b0.cloudfunctions.net/submitBetaWaitlist
```

## Flux

1. Formulaire `/beta` → `POST /api/beta`
2. API Next.js envoie via `@emailjs/nodejs` (clé privée côté serveur)
3. L’inscrit reçoit « Bienvenue dans la bêta ProDay »

## Inscrits Firestore

Collection `beta_waitlist` si la Cloud Function est déployée (lecture admin).

## Test local

```bash
# website/.env.local — voir website/.env.example
npm run website:dev
# → http://localhost:3000/beta
```
