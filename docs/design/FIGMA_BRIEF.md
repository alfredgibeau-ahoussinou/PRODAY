# Brief Figma — ProDay (maquettes validées)

Les visuels de référence sont **déjà dans le dépôt** — à répliquer frame par frame dans Figma.

## Assets fournis

| Fichier | Contenu |
|---------|---------|
| `assets/branding/logo-light.png` | Logo fond blanc |
| `assets/branding/logo-dark.png` | Logo fond navy (splash / marketing) |
| `assets/mockups/mockup-recrutement-matchs.png` | 6 écrans Recrutement + Matchs amicaux |
| `assets/mockups/mockup-coach-verification.png` | Coachs, agents, vérification diplômes, contrôle parental |
| `assets/mockups/maquette-proday-ecrans-principaux.png` | Planche 6 écrans principaux (générée) |
| `assets/mockups/maquette-proday-coach-verification.png` | Profils, vérification, contrôle parental (générée) |
| `docs/design/mockups/index.html` | Maquettes HTML interactives (tokens `#003399`) |

Design system code : `src/theme/designTokens.ts` · doc : `docs/design/DESIGN_SYSTEM.md`

## Tokens (à créer comme Styles Figma)

| Style | Valeur |
|-------|--------|
| Primary / CTA | `#1D4ED8` |
| Accent / Day | `#2563EB` |
| Navy / Pro | `#0F172A` |
| Background | `#F1F5F9` |
| Surface | `#FFFFFF` |
| Border | `#CBD5E1` |
| Success (Vérifié) | `#16A34A` |
| Warning (En cours) | `#EA580C` |

Typo : **Inter**, titres bold 22–24, corps 13–15.

## Navigation — 5 onglets (maquette)

1. Accueil  
2. Recrutement  
3. Matchs  
4. Messages  
5. Profil  

Modules **Arena** et **Sponsors** : cartes sur l’accueil (roadmap produit).

## Checklist écrans (déjà dessinés sur PNG)

### Recrutement
- [x] Réf. Accueil recrutement (recherche, Joueurs/Clubs, annonces, FAB)
- [x] Réf. Liste joueurs + filtres chips
- [x] Réf. Profil joueur (stats, galerie, Contacter)

### Matchs
- [x] Réf. Accueil matchs amicaux
- [x] Réf. Proposer un match (formulaire)
- [x] Réf. Rechercher un match (liste clubs)

### Coach / sécurité
- [x] Réf. Liste coachs & agents
- [x] Réf. Profil coach vérifié (onglets, diplômes ✓)
- [x] Réf. Timeline vérification diplômes
- [x] Réf. Contrôle parental (V2)

## Import dans Figma

1. Fichier → **Place image** → importer les PNG du dossier `assets/mockups/`
2. Calquer les composants (boutons, cartes, barre nav) par-dessus
3. Créer les **Color styles** depuis le tableau tokens ci-dessus
4. Exporter le kit : `File → Export` pour le PDF collègues

## Lien Figma (à compléter)

```
FIGMA_URL=https://www.figma.com/file/VOTRE_ID/ProDay
```
