# Templates e-mail Firebase Auth — ProDay

Projet : **proday-155b0** ([Console](https://console.firebase.google.com/project/proday-155b0/authentication/emails)).

## Recommandé : HTML enrichi

Les fichiers `verification.html` et `password-reset.html` fournissent un rendu visuel ProDay (fond sombre, logo, bouton cyan) compatible avec le champ **Message** de la Console Firebase Auth.

**Contraintes Firebase** :
- Fragment HTML **table-based**, styles **100 % inline**
- Pas de `<!DOCTYPE>`, `<html>`, `<head>`, `<body>` — uniquement le contenu du corps
- Variables officielles : `%LINK%`, `%EMAIL%`, `%APP_NAME%`, `%DISPLAY_NAME%`
- `%LINK%` doit apparaître **sur une ligne dédiée** (lien secours en bas) **et** dans le bouton `<a href="%LINK%">`

**Logo** : `https://proday75.netlify.app/branding/logo-white.png` (hébergé dans `website/public/branding/`, accessible publiquement).

> Le déploiement automatique via l'API Identity Platform reste bloqué sur ce projet (`EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED`). Configuration manuelle dans la Console.

## Fallback : texte brut

Si le HTML s'affiche mal (balises visibles, styles ignorés), basculer vers `verification.txt` ou `password-reset.txt` — corps simple sans mise en forme.

## Configuration Console

| Template Console | Objet | Message (fichier) | Expéditeur | Reply-to | URL d'action |
| --- | --- | --- | --- | --- | --- |
| **Validation de l'adresse e-mail** | `Confirmez votre adresse e-mail ProDay` | `verification.html` *(fallback : `verification.txt`)* | `ProDay` | `contact@proday.app` | `%LINK%` (défaut) |
| **Réinitialisation du mot de passe** | `Réinitialisez votre mot de passe ProDay` | `password-reset.html` *(fallback : `password-reset.txt`)* | `ProDay` | `contact@proday.app` | `%LINK%` (défaut) |

## Étapes (copier-coller)

1. [Firebase Console](https://console.firebase.google.com) → **proday-155b0** → **Authentication** → **Templates**
2. Ouvrir le template (crayon ✏️)
3. Remplir **Nom de l'expéditeur**, **Reply-to** et **Objet** selon le tableau
4. Dans **Message**, coller **intégralement** le contenu de `verification.html` ou `password-reset.html`
5. Laisser **URL d'action** sur `%LINK%`
6. **Enregistrer** et envoyer un e-mail de test

> Si la Console propose une option **Custom email handler** ou un mode HTML explicite, l'activer avant de coller le fragment.

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
| Lien non cliquable | Vérifier que `%LINK%` est seul sur une ligne (lien secours) et dans le `href` du bouton |
| Lien mort / erreur | **Authentication → Settings → Authorized domains** |
| HTML visible / rendu cassé | Basculer vers le `.txt` correspondant |
| Logo absent | Vérifier que `https://proday75.netlify.app/branding/logo-white.png` répond en 200 |

## Style personnalisé avancé

Pour un contrôle total (tracking, A/B test, templates dynamiques), envoyer les e-mails via **Cloud Functions** + un service tiers (SendGrid, Mailgun, etc.) au lieu des templates Auth intégrés.
