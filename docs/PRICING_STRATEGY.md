# Stratégie tarifaire ProDay — analyse concurrentielle (2026)

## Références marché

| Acteur | Cible | Mensuel | Annuel | Notes |
|--------|-------|---------|--------|-------|
| **Footsider** | Joueur | 8,99 € | 89,99 € | Pro Star — visibilité + contact clubs |
| **Next Football Stars** | Joueur | 5 € (base) / 14 € (premium) | 60 € / 160 € | Profil en ligne, détections |
| **SportEasy** | Club / équipe | ~5 € / équipe | — | Gestion équipe, pas Mercato |
| **Assoconnect / Clubeo** | Club structuré | 25–29 € | — | Admin association, hors sport |

## Positionnement ProDay

ProDay vise le **foot amateur connecté** (Mercato + saison + CV + Arena), pas uniquement la visibilité joueur. Les prix doivent rester **inférieurs à Footsider et NFS Premium**, tout en restant crédibles (pas « trop cheap »).

## Grille retenue (app + site)

| Plan | Mensuel | Annuel | vs Footsider joueur | vs NFS Premium |
|------|---------|--------|---------------------|----------------|
| **Joueur Plus** | 2,99 € | 24,99 € | −67 % | −79 % |
| **Coach Pro** | 7,99 € | 59,99 € | — | Sous stack club SportEasy+ |
| **Club Pro** | 11,99 € | 89,99 € | — | Sous Assoconnect (29 €) |
| **Agent Elite** | 24,99 € | 199,99 € | — | CRM pro accessible |

## Gratuit (freemium crédible)

- Profil, Pulse, **CV en ligne**, galerie
- Mercato en lecture
- 3 candidatures / mois (joueur)
- 1 équipe + 5 messages recrutement (coach)
- 2 annonces actives (club)

## Phase déploiement

1. Bêta : accès Pro manuel Firestore ou promo 100 %
2. IAP : Club Pro en premier (store actif)
3. Stripe Functions (Blaze) : webhook + facturation web
