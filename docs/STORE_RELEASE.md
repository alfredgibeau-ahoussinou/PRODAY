# Publication stores — ProDay (EAS)

Guide pour construire et soumettre l’application mobile sur l’App Store et Google Play.

## Prérequis

1. Compte [Expo](https://expo.dev) et projet lié : `npx eas init`
2. Compte **Apple Developer** (99 €/an) pour iOS
3. Compte **Google Play Console** (25 € unique) pour Android
4. Variables `.env` remplies (voir `docs/FIREBASE_SETUP.md`)
5. Firebase en production : règles, index, Storage, Functions (plan Blaze si besoin)

## Installation EAS CLI

```bash
npm install -g eas-cli
eas login
eas init
```

Copiez l’`projectId` affiché dans `app.config.js` (champ `extra.eas.projectId`) ou laissez EAS le gérer via `eas.json` après liaison.

## Builds

```bash
# APK de test interne (Android)
npm run eas:build:preview -- --platform android

# Build production (AAB + IPA)
npm run eas:build:production -- --platform all
```

Profils définis dans `eas.json` :

| Profil | Usage |
|--------|--------|
| `development` | Client de développement + simulateur iOS |
| `preview` | Tests internes (APK Android) |
| `production` | Stores — version auto-incrémentée |

## Soumission stores

1. Renseignez `eas.json` → section `submit.production` (Apple ID, ASC App ID, clé Google Play).
2. Placez la clé de service Google Play dans `secrets/google-play-service-account.json` (ne pas committer).
3. Lancez :

```bash
eas submit --platform ios --latest
eas submit --platform android --latest
```

## Fiches store — textes légaux

### Politique de confidentialité (URL publique obligatoire)

Hébergez le contenu de `docs/legal/PRIVACY_POLICY.md` sur :

- un site `https://votre-domaine.com/confidentialite`, ou
- une page GitHub Pages / Notion publique.

Indiquez cette URL dans App Store Connect et Google Play Console.

### CGU / Conditions d’utilisation

Même principe avec `docs/legal/TERMS_OF_USE.md` → URL `https://votre-domaine.com/cgu`.

L’application affiche aussi ces textes dans **Profil → Informations légales**.

## Checklist avant soumission

- [ ] `npm run typecheck` OK
- [ ] `npm test` OK
- [ ] `npm run firebase:rules:test` OK
- [ ] Icônes 1024×1024 (iOS) et adaptive icon (Android)
- [ ] Captures d’écran (6.7", 5.5", tablette si support)
- [ ] Description courte / longue en français
- [ ] Classification d’âge (sport — en général 4+ / PEGI 3 avec messagerie modérée)
- [ ] Compte démo pour la revue Apple (email + mot de passe test)
- [ ] Politique de confidentialité et CGU accessibles en ligne

## Contact support store

Email suggéré dans les fiches : `contact@proday.app` (à adapter).
