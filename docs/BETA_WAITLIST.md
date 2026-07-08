# Inscriptions bêta (site vitrine) — EmailJS

> **Guide opérateur complet :** `docs/BETA_GUIDE.md` (parcours, URLs, déploiement).

Envoi via [EmailJS](https://www.emailjs.com/) : pas de domaine DNS à vérifier, branchement Gmail/Outlook dans le dashboard.

## Dépannage — pas d'email reçu

1. **Site à jour ?** Sur `/beta`, il ne doit plus y avoir « Démo locale ». Si oui → redéployer (Netlify ou Vercel).
2. **Test API** (ne crée pas d'inscription — vérifie seulement que l'endpoint répond) :
   ```bash
   curl -s -o /dev/null -w "%{http_code}" -X OPTIONS https://proday75.fr/api/beta
   ```
   - **204** ou **405** → endpoint OK
   - **404** → redeploy ; build Next.js + fonctions Netlify (`npm run netlify:deploy` depuis `website/`)
   - **503** → ajouter `BETA_WAITLIST_FUNCTION_URL` sur Netlify / Vercel
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
   - `beta_url` : https://proday-xak9.vercel.app/beta?token=TEST
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
| `NEXT_PUBLIC_SITE_URL` | `https://proday75.fr` |

Redéployez après ajout des variables.

## 5. Firebase (optionnel — Firestore + email)

Plan **Blaze** requis pour Cloud Functions.

```bash
firebase functions:config:set \
  beta.emailjs_service_id="service_xxx" \
  beta.emailjs_template_id="template_xxx" \
  beta.emailjs_public_key="xxx" \
  beta.emailjs_private_key="xxx" \
  beta.site_url="https://proday75.fr"

firebase deploy --only functions:submitBetaWaitlist,functions:validateBetaAccess,firestore:rules
```

Sur Vercel, ajoutez aussi :
```env
BETA_WAITLIST_FUNCTION_URL=https://europe-west1-proday-155b0.cloudfunctions.net/submitBetaWaitlist
BETA_VALIDATE_FUNCTION_URL=https://europe-west1-proday-155b0.cloudfunctions.net/validateBetaAccess
```

## Flux

1. Formulaire `/beta/inscription` → `POST /api/beta` → Cloud Function `submitBetaWaitlist`
2. Inscription enregistrée dans Firestore (`beta_waitlist`, statut `pending`)
3. L'admin approuve depuis l'app ProDay → email de bienvenue avec lien `/beta/programme?token=…`
4. Le jeton est validé côté serveur (`validateBetaAccess` + Firestore)

## Page bêta privée (`/beta`)

- Accès via lien email (`?token=`) ou cookie httpOnly (90 jours, path `/beta`)
- Sans jeton valide : écran « Accès réservé » — pas de contenu public
- CTA public du site → `/beta/inscription` (pas `/beta`)
- Contenu invité (après validation du jeton) :
  - Hero « Bienvenue dans la bêta ProDay »
  - Explication du programme, six pôles testables, modules transverses
  - Téléchargement **iOS TestFlight** et **Android APK** (liens optionnels via env, sinon « bientôt » + email)
  - Retours par email (`support@proday.app`), timeline des prochaines étapes
- Email de bienvenue : CTA **« Accéder à la bêta »** → `{{beta_url}}` (`/beta?token=…`)

### Variables téléchargement (optionnelles)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BETA_APK_URL` | Lien APK Android — bouton actif sur `/beta` |
| `NEXT_PUBLIC_BETA_TESTFLIGHT_URL` | Lien TestFlight iOS — bouton actif sur `/beta` |

Sans ces variables, la page indique que les liens arriveront par email.

## Variables validation (Netlify / Vercel)

| Variable | Description |
|----------|-------------|
| `BETA_VALIDATE_FUNCTION_URL` | URL `validateBetaAccess` (Firestore) |
| `BETA_ACCESS_SECRET` | Secret HMAC (fallback EmailJS sans Firestore) |

## Inscrits Firestore

Collection `beta_waitlist` si la Cloud Function est déployée (lecture admin).

## Test local

```bash
# website/.env.local — voir website/.env.example
npm run website:dev
# → http://localhost:3000/beta/inscription (waitlist)
# → http://localhost:3000/beta?token=… (espace privé)
```
