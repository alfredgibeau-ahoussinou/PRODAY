# Publication stores — ProDay (EAS)

Guide pour construire et soumettre l’application mobile sur l’App Store et Google Play.

**Version marketing (app.json) :** `1.0.8`.  
**Numéros natifs (EAS `appVersionSource: remote`) :** prochain iOS TestFlight = **build 17** (auto-incrément depuis 16) ; Android = **versionCode 10**.  
Les champs `ios.buildNumber` / `android.versionCode` dans `app.json` sont indicatifs (Constants) — EAS ignore leur valeur pour le binaire store.  
**OTA :** non. `expo-updates` n’est pas dans l’app ; une mise à jour = nouveau build EAS (TestFlight / APK / stores).

**GitHub :** [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) (code) · [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs) (doc publique) · push : [GITHUB_AUTH.md](./GITHUB_AUTH.md).  
**Branding store :** icône / splash / adaptive = `assets/branding/proday-app-icon.png`, `proday-splash.png`, `proday-adaptive-foreground.png` (identité P + ballon).

## Notes de version — 1.0.8 build 17 (août 2026)

Correctif urgent démarrage (build 16 crashait) :

- Rules of Hooks : `useWindowDimensions()` dans `AppShell` avant les early returns auth/rôle (`4d495f21`)

Correctifs et livraisons depuis 1.0.7 (déjà dans 16) :

- Déconnexion accessible sur mobile ; icônes de notification Coach / Club / Président
- IA honnête (erreurs cloud visibles, plus de mock silencieux) ; création de séance coach (brouillon NLP) ; coaching perso
- Shells adaptés au grand écran (Expo web / Mac)
- Accents Club émeraude ; visio Daily native retirée du client Expo (liens Daily restent côté functions)

Pas de soumission App Store production automatique : TestFlight + APK interne, puis revue store manuelle.

## Prérequis

1. Compte [Expo](https://expo.dev) et projet lié : `npx eas init`
2. Compte **Apple Developer** (99 €/an) pour iOS
3. Compte **Google Play Console** (25 € unique) pour Android
4. Variables `.env` remplies (voir `docs/FIREBASE_SETUP.md`)
5. Firebase en production : règles, index, Storage, Functions (plan Blaze si besoin)
6. Secrets EAS alignés avec `.env.example` (Firebase, Google OAuth, RevenueCat, EAS project id)

## Installation EAS CLI

```bash
npm install -g eas-cli
eas login
eas init
```

Copiez l’`projectId` affiché dans `app.config.js` (champ `extra.eas.projectId`) ou laissez EAS le gérer via `eas.json` après liaison.

## Builds

```bash
# APK de test interne (Android) — distribution interne, pas TestFlight
npm run eas:build:android:apk

# AAB Google Play
npm run eas:build:android:aab

# IPA → App Store Connect / TestFlight
npm run eas:build:testflight

# Les deux plateformes (profil production)
npm run eas:build:production -- --platform all
```

Profils définis dans `eas.json` :

| Profil | Usage |
|--------|--------|
| `development` | Client de développement + simulateur iOS |
| `preview` | APK Android interne (`distribution: internal`) |
| `production` | Stores (AAB + IPA) — version auto-incrémentée |
| `testflight` | Alias iOS store (étend `production`) → soumission TestFlight |

> **Important :** le profil `preview` n’envoie **pas** vers TestFlight. Pour TestFlight utilisez `testflight` ou `production` (distribution store).

## Soumission stores

1. Renseignez `eas.json` → section `submit.production` (Apple ID, ASC App ID).
2. Placez la clé de service Google Play dans `secrets/google-play-service-account.json` (ne pas committer).
3. Assurez-vous que les secrets EAS (Firebase, RevenueCat, Daily, Google OAuth) sont configurés sur le projet Expo.
4. Lancez :

```bash
npm run eas:submit:testflight
eas submit --platform android --latest --profile production
```

## Fiches store — textes légaux

### Politique de confidentialité (URL publique obligatoire)

Hébergez le contenu de `docs/legal/PRIVACY_POLICY.md` sur :

- **https://proday75.fr/confidentialite** (déployé avec le site), ou
- une page GitHub Pages / Notion publique.

Indiquez cette URL dans App Store Connect et Google Play Console.

### CGU / Conditions d’utilisation

Même principe avec `docs/legal/TERMS_OF_USE.md` → **https://proday75.fr/cgu**.

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
- [ ] `EXPO_PUBLIC_APP_ENV=production` et `EXPO_PUBLIC_V3_SHELL=1` (forcés dans les profils EAS)
- [ ] Push : entitlements `aps-environment=production` sur le build store (EAS gère le profil)
- [ ] RevenueCat keys + produits App Store / Play configurés

## Contact support store

Email suggéré dans les fiches : `proday.admin@gmail.com` (à adapter).
