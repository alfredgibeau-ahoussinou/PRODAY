# Inscriptions bêta (site vitrine) — EmailJS

> **Guide opérateur complet :** `docs/BETA_GUIDE.md` (parcours, URLs, déploiement).

Envoi via [EmailJS](https://www.emailjs.com/) : pas de domaine DNS à vérifier, branchement Gmail/Outlook dans le dashboard.

## Dépannage — pas d'email reçu

1. **Site à jour ?** Sur `/beta`, il ne doit plus y avoir « Démo locale ». Si oui → redéployer sur Netlify.
2. **Test API** (ne crée pas d'inscription — vérifie seulement que l'endpoint répond) :
   ```bash
   curl -s -o /dev/null -w "%{http_code}" -X OPTIONS https://proday75.fr/api/beta
   ```
   - **204** ou **405** → endpoint OK
   - **404** → redeploy ; build Next.js + fonctions Netlify (`npm run netlify:deploy` depuis `website/`)
   - **503** → ajouter `BETA_WAITLIST_FUNCTION_URL` sur Netlify
3. **Netlify** (proday75) → Site configuration → Environment variables → contexte **Production** → redeploy après modification.

## Dépannage — lien email « Accéder à la bêta »

Symptômes : page blanche, « trop de redirections », ou retour sur « Accéder à la bêta » sans contenu.

1. **Redéployer le site** (`cd website && npm run netlify:deploy`) — un bug Netlify/OpenNext conservait `?token=` après `/api/beta/access`, provoquant une boucle `/beta/programme` ↔ API. Corrigé dans `buildBetaInternalRedirectUrl`.
2. **Variables Netlify (Production)** :
   - `BETA_VALIDATE_FUNCTION_URL` → `https://europe-west1-proday-155b0.cloudfunctions.net/validateBetaAccess`
   - `NEXT_PUBLIC_SITE_URL` → `https://proday75.fr`
3. **Test rapide** (jeton fictif — doit finir sur `/beta`, pas boucler) :
   ```bash
   curl -sI "https://proday75.fr/api/beta/access?token=TEST" | grep -i location
   # Attendu : location: https://proday75.fr/beta   (sans ?token=)
   ```
4. **Jeton valide** : renvoyer l'email depuis l'admin ProDay (inscription approuvée) ou ouvrir le lien du dernier mail reçu.
5. **HTTPS** : si Chrome affiche `ERR_CERT_AUTHORITY_INVALID` sur `proday75.fr`, voir `docs/DOMAIN_PRODAY75_FR.md` § Incident 2026-07-24 (souvent l’ancien A `99.83.81.81` à supprimer chez IONOS).

## 1. Compte EmailJS

1. [emailjs.com](https://www.emailjs.com/) → créer un compte
2. **Email Services** → connecter Gmail (ou autre) — ex. `proday.admin@gmail.com`
3. **Account → Security** → activer **Allow EmailJS API for non-browser applications**

## 2. Template « Bêta ProDay » (`template_zkbezzh`)

Style ProDay sombre (fond `#0a0f1a`, accent cyan `#22d3ee` / `#06b6d4`) — compatible clients email (tables + CSS inline).

### Copier-coller dans EmailJS

1. Ouvrez **Email Templates** → `template_zkbezzh` → **Edit**
2. Onglet **Content** → basculez en mode **HTML** si besoin
3. Copiez-collez **tout** le contenu de **`docs/emailjs/beta-welcome.html`** (sans modifier les `{{variables}}`)
4. *(Optionnel)* Version texte brut pour clients sans HTML : **`docs/emailjs/beta-welcome.txt`** — utile si EmailJS propose un champ Plain Text séparé
5. Configurez les champs du template :

| Champ | Valeur |
|-------|--------|
| **To Email** | `{{email}}` |
| **From Name** | `ProDay` |
| **Subject** | `{{subject}}` |
| **Reply To** | `proday.admin@gmail.com` |
| **Content** | HTML de `docs/emailjs/beta-welcome.html` |

### Variables EmailJS (envoyées par le code)

Source : `website/src/lib/betaEmailjs.ts` et `functions/src/betaWaitlistEmail.ts` (`buildBetaEmailJsTemplateParams`).

| Variable | Exemple | Description |
|----------|---------|-------------|
| `email` | `joueur@exemple.fr` | Destinataire (champ **To Email**) |
| `to_email` | `joueur@exemple.fr` | Email inscrit (affiché dans le corps) |
| `user_email` | `joueur@exemple.fr` | Alias de `email` |
| `member_role` | `Beta-testeur` | Statut membre bêta |
| `profile_label` | `Joueur` | Rôle choisi à l'inscription |
| `role_label` | `Beta-testeur` | Alias de `member_role` |
| `site_url` | `https://proday75.fr` | URL du site vitrine |
| `beta_url` | `https://proday75.fr/beta/programme?token=…` | Lien CTA « Accéder à la bêta » |
| `subject` | `Vous êtes beta-testeur ProDay` | Objet de l'email |

> Pas de variable `user_name` pour l'instant — la personnalisation repose sur `profile_label` et `to_email`.

### Test dans le dashboard EmailJS

Remplissez **Test It** avec :

| Variable | Valeur test |
|----------|-------------|
| `email` | votre email |
| `to_email` | votre email |
| `user_email` | votre email |
| `member_role` | Beta-testeur |
| `profile_label` | Joueur |
| `role_label` | Beta-testeur |
| `site_url` | `https://proday75.fr` |
| `beta_url` | `https://proday75.fr/beta/programme?token=TEST` |
| `subject` | Vous êtes beta-testeur ProDay |

## 3. Clés API

**Account → API Keys** :

- **Public Key** → `EMAILJS_PUBLIC_KEY`
- **Private Key** → `EMAILJS_PRIVATE_KEY` (serveur uniquement, jamais dans le navigateur)

**Email Services** → Service ID → `EMAILJS_SERVICE_ID`  
**Email Templates** → Template ID → `EMAILJS_TEMPLATE_ID`

## 4. Netlify (projet `website`)

| Variable | Description |
|----------|-------------|
| `EMAILJS_SERVICE_ID` | ID service EmailJS |
| `EMAILJS_TEMPLATE_ID` | ID template bêta |
| `EMAILJS_PUBLIC_KEY` | Clé publique |
| `EMAILJS_PRIVATE_KEY` | Clé privée (secret) |
| `NEXT_PUBLIC_SITE_URL` | `https://proday75.fr` |

Site configuration → Environment variables → contexte **Production**. Redéployez après ajout des variables.

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

Sur Netlify, ajoutez aussi :
```env
BETA_WAITLIST_FUNCTION_URL=https://europe-west1-proday-155b0.cloudfunctions.net/submitBetaWaitlist
BETA_VALIDATE_FUNCTION_URL=https://europe-west1-proday-155b0.cloudfunctions.net/validateBetaAccess
```

## Flux

1. Formulaire `/beta/inscription` → `POST /api/beta` → Cloud Function `submitBetaWaitlist`
2. Inscription enregistrée dans Firestore (`beta_waitlist`, statut `pending`)
3. L'admin approuve depuis **https://proday75.fr/admin** (minicode) ou l'app ProDay → email de bienvenue avec lien `/beta/programme?token=…`
4. Le jeton est validé côté serveur (`validateBetaAccess` + Firestore)

### Admin site (fondateurs)

| Variable Netlify | Description |
|------------------|-------------|
| `BETA_ADMIN_PIN` | Minicode partagé (placeholder local : `CHANGEME`) |
| `BETA_ADMIN_SESSION_SECRET` | Secret cookie session (≥ 16 car.) |
| `BETA_WAITLIST_ADMIN_FUNCTION_URL` | URL `websiteBetaWaitlistAdmin` |
| `BETA_WEBSITE_ADMIN_SECRET` | Secret API (= Firebase `BETA_WEBSITE_ADMIN_SECRET`) |

```bash
firebase functions:config:set beta.website_admin_secret="votre-secret-partage"
firebase deploy --only functions:websiteBetaWaitlistAdmin
```

## Page bêta privée (`/beta`)

- Accès via lien email (`?token=`) ou cookie httpOnly (90 jours, path `/beta`)
- Sans jeton valide : écran « Accès réservé » — pas de contenu public
- CTA public du site → `/beta/inscription` (pas `/beta`)
- Contenu invité (après validation du jeton) :
  - Hero « Bienvenue dans la bêta ProDay »
  - Explication du programme, sept pôles testables, modules transverses
  - Téléchargement **iOS TestFlight** et **Android APK** (liens optionnels via env, sinon « bientôt » + email)
  - Retours par email (`proday.admin@gmail.com`), timeline des prochaines étapes
- Email de bienvenue : CTA **« Accéder à la bêta »** → `{{beta_url}}` (`/beta/programme?token=…`)

### Variables téléchargement (optionnelles)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_BETA_APK_URL` | Lien APK Android — bouton actif sur `/beta` |
| `NEXT_PUBLIC_BETA_TESTFLIGHT_URL` | Lien TestFlight iOS — bouton actif sur `/beta` |

Sans ces variables, la page indique que les liens arriveront par email.

## Variables validation (Netlify)

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
# → http://localhost:3000/beta/programme?token=… (programme bêta)
```
