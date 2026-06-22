# Inscriptions bêta (site vitrine) — EmailJS

Envoi via [EmailJS](https://www.emailjs.com/) : pas de domaine DNS à vérifier, branchement Gmail/Outlook dans le dashboard.

## Dépannage — pas d'email reçu

1. **Site à jour ?** Sur `/beta`, il ne doit plus y avoir « Démo locale ». Si oui → redéployer (Netlify ou Vercel).
2. **Test API** :
   ```bash
   curl -s -X POST https://proday75.netlify.app/api/beta \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","role":"player"}'
   ```
   - **404** → redeploy ; build Next.js + fonctions Netlify (`npm run netlify:deploy` depuis `website/`)
   - **503** → ajouter `EMAILJS_*` (ou `BETA_WAITLIST_FUNCTION_URL`) sur Netlify / Vercel
   - **502** → EmailJS rejette l'envoi. Réponse typique :
     - `Gmail_API: Invalid grant` → **reconnecter Gmail** dans [EmailJS](https://dashboard.emailjs.com/admin) → **Email Services** → service Gmail → **Reconnect**
     - clé privée / template / **Allow EmailJS API for non-browser applications** (Account → Security)
3. **Netlify** (proday75) → Site configuration → Environment variables → contexte **Production** → redeploy après modification.

## 1. Compte EmailJS

1. [emailjs.com](https://www.emailjs.com/) → créer un compte
2. **Email Services** → connecter Gmail (ou autre) — ex. `contact@proday.app`
3. **Account → Security** → activer **Allow EmailJS API for non-browser applications**

## 2. Template « Bêta ProDay » (`template_zkbezzh`)

1. Ouvrez **Email Templates** → `template_zkbezzh` → **Edit**
2. Copiez-collez le HTML depuis **`docs/emailjs/beta-welcome.html`**
3. Configurez :

| Champ | Valeur |
|-------|--------|
| **To Email** | `{{email}}` |
| **From Name** | `ProDay` |
| **Subject** | `{{subject}}` ou fixe : `Vous êtes beta-testeur ProDay` |
| **Reply To** | `support@proday.app` |
| **Content** | HTML de `docs/emailjs/beta-welcome.html` |

Variables : `to_email`, `member_role`, `profile_label`, `site_url`, `beta_url`, `subject`

4. **Test** :
   - `to_email` : votre email
   - `member_role` : Beta-testeur
   - `profile_label` : Joueur
   - `site_url` : https://proday-xak9.vercel.app
   - `beta_url` : https://proday-xak9.vercel.app/beta
   - `subject` : Vous êtes beta-testeur ProDay

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
