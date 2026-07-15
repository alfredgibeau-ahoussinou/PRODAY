# Templates e-mail Firebase Auth — ProDay

Projet : **proday-155b0** ([Console](https://console.firebase.google.com/project/proday-155b0/authentication/emails)).

## Templates verrouillés

Sur **proday-155b0**, la Console Firebase affiche :

> *« Ce modèle ne peut pas être modifié. Pour en savoir plus, contactez Assistance Firebase »*

Le déploiement automatique via l'API Identity Platform renvoie aussi **`EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`**. Les fichiers HTML/TXT de ce dossier ne peuvent donc **ni** être collés manuellement **ni** poussés par script.

### Diagnostic (projet + causes connues)

| Facteur | État sur proday-155b0 | Impact |
| --- | --- | --- |
| **Plan Blaze** | Requis pour Cloud Functions — le projet utilise déjà Stripe, Mistral, push, etc. | Blaze **ne débloque pas** l'édition Console ; il permet le **contournement** via Functions |
| **Identity Platform (GCIP)** | Activé ou migré (API `identitytoolkit.googleapis.com` utilisée pour le déploiement templates) | Certains modèles passent en mode **Google-managed** : édition Console + API PATCH bloquées |
| **Anti-spam Google** | Politique générale Firebase Auth | Les templates **vérification e-mail** et **changement d'e-mail** sont historiquement verrouillés sur de nombreux projets pour limiter le phishing |
| **Multi-tenancy** | Non utilisé dans ProDay | Si un tenant GCIP existe ailleurs : activer `inheritance.emailSendingConfig=true` sur le tenant |
| **Région EU (eur3 / europe-west1)** | Firestore eur3, Functions europe-west1 | N'affecte **pas** directement le verrouillage ; les callables Auth custom sont déployés en `europe-west1` |
| **Extensions Firebase** | Aucune extension « Trigger Email » installée | Pas de conflit ; Option B documentée ci-dessous |
| **Délai après création projet** | Possible sur projets récents | Attendre **48–72 h** puis réessayer Console + API ; contournement Functions reste la solution fiable |

### Que faire pour débloquer la Console (Option C)

1. **Vérifier Identity Platform** : [Console GCP → Identity Platform](https://console.cloud.google.com/customer-identity) → projet `proday-155b0` → paramètres e-mail / SMTP custom.
2. **Attendre 48–72 h** après création ou changement majeur Auth, puis réessayer l'édition.
3. **Contacter le support Firebase** ([Assistance](https://firebase.google.com/support/contact)) en mentionnant `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED` et le projet `proday-155b0`.
4. **Conserver les templates** dans ce repo — ils seront prêts dès que la Console sera débloquée.

---

## Solution recommandée — E-mails Auth custom (Option A)

Implémenté dans **`functions/src/authCustomEmails.ts`** :

| Callable (europe-west1) | Remplace côté client | Template |
| --- | --- | --- |
| `sendAuthVerificationEmail` | `sendEmailVerification()` | `verification.html` / `.txt` |
| `sendAuthPasswordResetEmail` | `sendPasswordResetEmail()` | `password-reset.html` / `.txt` |

**Flux** :
1. Admin SDK génère le lien sécurisé (`generateEmailVerificationLink` / `generatePasswordResetLink`).
2. Le HTML ProDay (logo, bouton cyan) est rendu depuis ce dossier.
3. Envoi via **Resend** (fetch API, pas de dépendance npm).
4. Le client (`auth.service.ts`) tente le callable **en premier** ; si non configuré ou indisponible → **fallback Firebase natif** (template EN par défaut).

### Activer les e-mails ProDay brandés

**Prérequis** : plan Blaze, domaine vérifié sur [Resend](https://resend.com/domains) (`proday.app`).

```bash
# 1. Configurer Resend (réutilise beta.resend_api_key si déjà présent)
firebase functions:config:set \
  auth.enabled=true \
  auth.from_email="ProDay <contact@proday.app>" \
  auth.continue_url="https://proday75.fr"

# Obligatoire : proday75.fr (et www.proday75.fr) doivent figurer dans Authentication → Settings → Authorized domains
# (sinon generateEmailVerificationLink échoue avec auth/unauthorized-continue-uri)

# Optionnel si clé dédiée Auth (sinon beta.resend_api_key est utilisée)
firebase functions:config:set auth.resend_api_key="re_VOTRE_CLE"

# 2. Build + déployer les callables
cd functions && npm run build
firebase deploy --only functions:sendAuthVerificationEmail,functions:sendAuthPasswordResetEmail
```

**Test** :
- Inscription e-mail/mot de passe → e-mail « Confirmez votre adresse e-mail ProDay ».
- Mot de passe oublié → e-mail « Réinitialisez votre mot de passe ProDay ».

**Désactiver** (retour Firebase natif uniquement) :

```bash
firebase functions:config:set auth.enabled=false
firebase deploy --only functions:sendAuthVerificationEmail,functions:sendAuthPasswordResetEmail
```

Variables documentées dans `functions/.env.example` et `.env.example` (racine).

---

## Option B — Extension Firebase « Trigger Email »

Sans code custom supplémentaire, l'extension [`firestore-send-email`](https://extensions.dev/extensions/firebase/firestore-send-email) peut envoyer des e-mails depuis Firestore.

**Installation** (Console → Extensions) :
1. Installer **Trigger Email**.
2. Configurer SMTP (SendGrid, Mailgun, etc.) ou un transport compatible.
3. Adapter le flux Auth : après inscription, écrire un document `{ to, template, data }` dans la collection configurée — **ne remplace pas** automatiquement `sendEmailVerification()` ; il faut désactiver l'envoi natif côté client (comme Option A) et générer les liens via Admin SDK dans une Function.

ProDay utilise **Option A** (Resend + callables) pour rester aligné avec la bêta waitlist et éviter une collection Firestore intermédiaire.

---

## Fichiers templates (Console ou custom)

Les fichiers `verification.html` et `password-reset.html` fournissent un rendu visuel ProDay (fond sombre, logo, bouton cyan).

**Contraintes Firebase Console** (si débloquée un jour) :
- Fragment HTML **table-based**, styles **100 % inline**
- Pas de `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` — uniquement le contenu du corps
- Variables officielles : `%LINK%`, `%EMAIL%`, `%APP_NAME%`, `%DISPLAY_NAME%`
- `%LINK%` doit apparaître **sur une ligne dédiée** (lien secours en bas) **et** dans le bouton `<a href="%LINK%">`

**Logo** : `https://proday75.fr/branding/logo-proday-official.png` (hébergé dans `website/public/branding/`).

Les Cloud Functions enveloppent le fragment HTML dans un document complet avant envoi Resend.

## Fallback : texte brut

Si le HTML s'affiche mal (balises visibles, styles ignorés), basculer vers `verification.txt` ou `password-reset.txt` — corps simple sans mise en forme.

## Configuration Console (si templates débloqués)

| Template Console | Objet | Message (fichier) | Expéditeur | Reply-to | URL d'action |
| --- | --- | --- | --- | --- | --- |
| **Validation de l'adresse e-mail** | `Confirmez votre adresse e-mail ProDay` | `verification.html` *(fallback : `verification.txt`)* | `ProDay` | `contact@proday.app` | `%LINK%` (défaut) |
| **Réinitialisation du mot de passe** | `Réinitialisez votre mot de passe ProDay` | `password-reset.html` *(fallback : `password-reset.txt`)* | `ProDay` | `contact@proday.app` | `%LINK%` (défaut) |

## Étapes copier-coller (Console débloquée)

1. [Firebase Console](https://console.firebase.google.com) → **proday-155b0** → **Authentication** → **Templates**
2. Ouvrir le template (crayon ✏️)
3. Remplir **Nom de l'expéditeur**, **Reply-to** et **Objet** selon le tableau
4. Dans **Message**, coller **intégralement** le contenu de `verification.html` ou `password-reset.html`
5. Laisser **URL d'action** sur `%LINK%`
6. **Enregistrer** et envoyer un e-mail de test

## Aperçu visuel

```
┌─────────────────────────────────────┐
│  fond #0a0a0a                       │
│  ┌───────────────────────────────┐  │
│  │  [Logo ProDay blanc — 120px]  │  │
│  │                               │  │
│  │  Titre cyan #22d3ee           │  │
│  │  Texte blanc + %EMAIL%        │  │
│  │                               │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  BOUTON CTA #22d3ee     │  │  │
│  │  └─────────────────────────┘  │  │
│  │                               │  │
│  │  Lien secours %LINK% (petit)  │  │
│  │  — ProDay · contact@proday.app│  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Variables disponibles

| Variable | Description |
| --- | --- |
| `%LINK%` | Lien d'action (obligatoire, ligne seule + href du bouton) |
| `%EMAIL%` | Adresse e-mail du compte |
| `%APP_NAME%` | Nom du projet Firebase |
| `%DISPLAY_NAME%` | Nom affiché de l'utilisateur |

## Dépannage

| Problème | Action |
| --- | --- |
| Console : « modèle ne peut pas être modifié » | Utiliser **Option A** (callables + Resend) — voir ci-dessus |
| API : `EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED` | Idem ; contacter support si déblocage Console souhaité |
| E-mail EN moche reçu | Resend non configuré → activer `auth.enabled` + déployer callables |
| **Aucun e-mail reçu** | Voir section **Incident juillet 2026** ci-dessous |
| Lien non cliquable | Vérifier `%LINK%` seul sur une ligne + `href` du bouton |
| Lien mort / erreur | **Authentication → Settings → Authorized domains** |
| HTML visible / rendu cassé | Vérifier domaine Resend ; fallback `.txt` côté template |
| Logo absent | Vérifier `https://proday75.fr/branding/logo-proday-official.png` (HTTP 200) |
| Callable indisponible | Plan Blaze + `firebase deploy --only functions:sendAuthVerificationEmail,functions:sendAuthPasswordResetEmail` |

### Incident juillet 2026 — e-mails de vérification absents

**Symptôme** : inscription OK, mais aucun mail de confirmation ; le renvoi échoue silencieusement.

**Cause racine** (logs `sendAuthVerificationEmail`) :

```
FirebaseAuthError: Domain not allowlisted by project
code: auth/unauthorized-continue-uri
```

Le callable générait le lien avec `continue_url = https://proday75.fr` (défaut dans `authCustomEmails.ts`), mais **`proday75.fr` n’était pas** dans **Authentication → Settings → Authorized domains** (seuls `localhost`, `proday-155b0.firebaseapp.com` et `proday-155b0.web.app` l’étaient).

**Correctifs appliqués** :

1. **Domaines autorisés** : ajout de `proday75.fr`, `www.proday75.fr` (et legacy `proday.app`) dans Firebase Auth.
2. **Code** : `getContinueUrl()` utilise `auth.continue_url` → `beta.site_url` → `https://proday75.fr`.
3. **App** : erreurs d’envoi visibles sur l’écran « Vérifiez votre email » (plus de catch silencieux au renvoi).

**Retester** :

1. Créer un compte e-mail/mot de passe ou utiliser « Renvoyer l’e-mail ».
2. Vérifier la boîte + spams ; l’objet attendu est « Confirmez votre adresse e-mail ProDay ».
3. Logs : `firebase functions:log --only sendAuthVerificationEmail --project proday-155b0 -n 10` — plus d’erreur `unauthorized-continue-uri`.

**Si Resend bloque l’envoi** (domaine `proday.app` non vérifié) :

1. [Resend → Domains](https://resend.com/domains) → ajouter `proday.app`.
2. Publier les enregistrements DNS (SPF, DKIM) chez le registrar.
3. Attendre statut **Verified**, puis retester.

**Si l’utilisateur reçoit un e-mail « Bienvenue dans la bêta » au lieu de « Confirmez votre e-mail »** :

Cause : fallback EmailJS utilisait par erreur `beta.emailjs_template_id` (template waitlist bêta) quand Resend échouait.

Correctif : le fallback EmailJS Auth exige `auth.emailjs_template_id` (template dédié, voir `docs/emailjs/auth-action.html`). Sans ce template, l’app retombe sur l’e-mail Firebase natif plutôt que sur le mail bêta.
