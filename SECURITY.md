# Politique de sécurité — ProDay

## Signalement responsable

Si vous découvrez une vulnérabilité de sécurité affectant ProDay (application mobile,
site proday75.fr, Firebase, Cloud Functions ou infrastructure associée), merci de nous
la signaler de manière responsable.

**Contact :** [contact@proday.app](mailto:contact@proday.app)  
**Objet suggéré :** `[Sécurité ProDay] Description courte`

### Ce que nous attendons

- Description claire du problème et des étapes de reproduction
- Impact estimé (confidentialité, intégrité, disponibilité)
- Votre environnement (navigateur, OS, version app si pertinent)
- Délai raisonnable avant toute divulgation publique (nous visons une réponse sous 72 h ouvrées)

### Ce que nous ne demandons pas

- Pas de tests destructifs (DoS, suppression de données, spam massif)
- Pas d'accès non autorisé aux comptes d'autres utilisateurs
- Pas de scan automatisé agressif sans accord préalable

## Périmètre

| Composant | Notes |
|-----------|--------|
| Site vitrine (proday75.fr) | En-têtes HTTP, routes API bêta, cookies |
| Application mobile ProDay | Auth Firebase, règles Firestore/Storage |
| Cloud Functions | Secrets serveur, webhooks Stripe |
| GitHub (dépôt PRODAY) | Secrets commités, dépendances |

## Bonnes pratiques internes

- Secrets uniquement en variables d'environnement ou Firebase Functions config — jamais commités
- `.env`, clés privées et comptes de service listés dans `.gitignore`
- Règles Firestore/Storage comme barrière principale côté données
- En-têtes de sécurité documentés dans `docs/WEBSITE_SECURITY.md`

## Propriété intellectuelle

Le code source est **propriétaire** (voir [LICENSE](./LICENSE) et [COPYRIGHT.md](./COPYRIGHT.md)).
Le signalement d'une faille ne confère aucun droit d'utilisation du code.

---

© 2026 ProDay — Tous droits réservés
