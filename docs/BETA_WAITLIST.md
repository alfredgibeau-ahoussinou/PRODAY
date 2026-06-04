# Inscriptions bêta (site vitrine)

## Production — envoyer à tous les inscrits (pas le mode test Resend)

`onboarding@resend.dev` **ne fonctionne qu'en test** : emails limités à l'adresse de votre compte Resend.

Pour la vraie bêta :

### 1. Vérifier le domaine `proday.app` sur Resend

1. [resend.com/domains](https://resend.com/domains) → **Add Domain** → `proday.app`
2. Ajoutez les enregistrements DNS proposés (SPF, DKIM) chez votre registrar / Cloudflare
3. Attendez le statut **Verified**

### 2. Expéditeur production

```env
BETA_FROM_EMAIL=ProDay <contact@proday.app>
```

(`contact@proday.app` est déjà l'email légal ProDay dans l'app.)

### 3. Firebase Functions (Firestore + email)

```bash
firebase functions:config:set \
  beta.resend_api_key="re_VOTRE_CLE" \
  beta.from_email="ProDay <contact@proday.app>" \
  beta.site_url="https://proday.app"

firebase deploy --only functions:submitBetaWaitlist,firestore:rules
```

### 4. Vercel (projet `website`)

| Variable | Valeur |
|----------|--------|
| `RESEND_API_KEY` | clé Resend |
| `BETA_FROM_EMAIL` | `ProDay <contact@proday.app>` |
| `NEXT_PUBLIC_SITE_URL` | `https://proday.app` |
| `BETA_WAITLIST_FUNCTION_URL` | `https://europe-west1-proday-155b0.cloudfunctions.net/submitBetaWaitlist` |

Redéployez le site après modification des variables.

---

## Flux

1. Visiteur remplit le formulaire sur `/beta`
2. `POST /api/beta` (Next.js sur Vercel)
3. Cloud Function `submitBetaWaitlist` (Firebase) :
   - enregistre dans `beta_waitlist` (email, rôle, dates)
   - envoie l’email **« Bienvenue dans la bêta ProDay »** via Resend

## Contenu de l’email

- Remerciement + rôle choisi (Joueur, Coach, Club, Organisateur)
- Présentation ProDay (Mercato, matchs, Pulse, CV)
- Prochaines étapes (nouvelles, accès prioritaire, ProDay Woman)
- Lien vers `/beta` sur le site
- Contact `support@proday.app`

Template : `functions/src/betaWaitlistEmail.ts` (copie miroir dans `website/src/lib/betaWelcomeEmail.ts`).

## Déploiement

```bash
# 1. Secrets Firebase Functions
firebase functions:config:set \
  beta.resend_api_key="re_VOTRE_CLE" \
  beta.from_email="ProDay <noreply@votredomaine.com>" \
  beta.site_url="https://proday.app"

# 2. Functions + règles Firestore
firebase deploy --only functions:submitBetaWaitlist,firestore:rules

# 3. Vercel (projet website)
# BETA_WAITLIST_FUNCTION_URL=https://europe-west1-proday-155b0.cloudfunctions.net/submitBetaWaitlist
```

## Consulter les inscrits

Firestore → collection `beta_waitlist` (lecture admin uniquement).

## Test local

```bash
# website/.env.local
RESEND_API_KEY=re_...
BETA_FROM_EMAIL=ProDay <onboarding@resend.dev>
NEXT_PUBLIC_SITE_URL=http://localhost:3000

npm run website:dev
```

Sans clé Resend, le formulaire renvoie une erreur 503.
