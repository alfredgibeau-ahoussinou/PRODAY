# Écrans (`src/screens/`)

**CONNECTER. PROGRESSER. RÉVÉLER.** — ProDay **1.0.9**

Un fichier ≈ un écran enregistré dans la navigation. L’écran compose `components/`, appelle `hooks/` / `services/`, et délègue le calcul lourd à `core/`.

## Organisation

```
screens/
├── (racine)          Auth, feed, mercato, matchs, reels, profil, shop…
├── joueur/           Parcours joueur dédiés
├── coach/            Profil & outils coach
├── club/             Hub club, annonces, roster…
├── president/        Vue président
├── parent/           Contrôle parental, rapports
├── sponsor/          Offres & profil public sponsor
├── supporter/        Parcours supporter
├── signup/           Inscription multi-étapes
├── training/         Séances & log activité
├── competition/      Tournois, matchday
├── smartTactics/     Tactiques
└── proPlayer/        Variante pro
```

## Rôles ↔ dossiers

| Pôle | Dossier(s) typiques |
|------|---------------------|
| Joueur | racine + `joueur/` + `training/` |
| Coach | `coach/` |
| Club / Président | `club/`, `president/` |
| Parent | `parent/` |
| Sponsor | `sponsor/` |
| Supporter | `supporter/` |
| Auth / onboarding | `AuthScreen`, `signup/`, vérifications |

Les shells (`navigation/`, `features/*/shell/`) montent ces écrans ; ils ne vivent pas dans ce dossier.

## Conventions

- Pas d’accès Firestore direct — passer par `services/`.
- Copy produit longue : préférer `content/`.
- Typo UI via `ProDayText` (Inter pour titres, Syne pour `brand` uniquement).
- Univers joueur (âge × genre) : respecter les tokens d’identité / theme existants.

## Lancer & tester

```bash
npm start
npm run ios:sim
npm test
```

[PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [proday75.fr](https://proday75.fr) · [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

[`../README.md`](../README.md) · [`../navigation/README.md`](../navigation/README.md) · [`../features/README.md`](../features/README.md)
