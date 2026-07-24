# ProDay — Accès fondateurs (confidentiel)

**Document réservé aux 4 associés fondateurs.**  
**Date :** 24 juillet 2026  
**Statut :** CONFIDENTIEL — ne pas partager hors du cercle des 4.

> Régénérer le PDF : `python3 scripts/generate-acces-fondateurs-pdf.py`

---

## Destinataires (4 collaborateurs)

| # | Nom | Rôle | Initiales |
|---|-----|------|-----------|
| 1 | _À compléter_ | Associé fondateur | |
| 2 | _À compléter_ | Associé fondateur | |
| 3 | _À compléter_ | Associé fondateur | |
| 4 | Alfred Gibeau-Ahoussinou | Associé fondateur · développeur du groupe | AGA |

---

## 1. Site & espaces opérationnels

| Accès | URL |
|-------|-----|
| Site vitrine | https://proday75.fr |
| Espace admin bêta (minicode) | https://proday75.fr/admin |
| Pôle Sponsor | https://proday75.fr/sponsor |
| Hub bêta (invitation) | https://proday75.fr/beta |
| Inscription waitlist bêta | https://proday75.fr/beta/inscription |

### Minicode admin bêta

- **Code :** `739482`
- **Variable Netlify :** `BETA_ADMIN_PIN` (site `proday75`, contexte Production)
- Vérifié le 24/07/2026 via `netlify env:list`

---

## 2. GitHub

| Élément | Valeur |
|---------|--------|
| Dépôt code (privé) | https://github.com/alfredgibeau-ahoussinou/PRODAY |
| Documentation publique | https://github.com/alfredgibeau-ahoussinou/PRODAY-docs |

---

## 3. Firebase

| Élément | Valeur |
|---------|--------|
| Projet | `proday-155b0` |
| Console | https://console.firebase.google.com/project/proday-155b0 |
| Région Functions | `europe-west1` |

Secrets Cloud Functions (Brevo, Cal, etc.) : **ne pas coller ici** — stockés dans `firebase functions:config` / secrets Firebase. Demander à Alfred.

---

## 4. Netlify

| Élément | Valeur |
|---------|--------|
| Site / projet | `proday75` |
| Domaine | https://proday75.fr |
| Console | https://app.netlify.com/ (rechercher `proday75`) |

Secrets session admin, EmailJS legacy, etc. : **stockés dans Netlify Environment variables** — demander à Alfred. Ne jamais committer.

---

## 5. E-mails

| Usage | Adresse |
|-------|---------|
| Expéditeur Brevo (transactionnel) | `proday.admin@gmail.com` |
| Contact produit / légal | `contact@proday.app` |
| Partenaires (si utilisé) | `partenaires@proday.app` |

Clé API Brevo : **secret stocké dans Firebase** (`email.brevo_api_key`) — demander à Alfred. Ne jamais coller dans ce document.

---

## 6. Cal.com (visio Santé)

| Élément | Valeur |
|---------|--------|
| Clé API | Stockée dans Firebase Functions config `cal.api_key` — **ne pas coller ici** |
| Username org (défaut docs) | `proday-sante` |
| Username Alfred (si compte perso) | `alfred-gibeau-ahoussinou-crbca7` |
| Console | https://app.cal.com/ |

---

## 7. Application mobile (Expo / EAS)

| Élément | Valeur |
|---------|--------|
| Nom Expo | `ProDay` |
| Slug | `proday` |
| Bundle / package | `com.proday.app` |
| EAS projectId | `db5a18a4-8b0a-4c96-a109-eedbb10a69b9` |
| Compte admin app (claim) | `proday.admin@gmail.com` (mot de passe hors Git — demander à Alfred) |

---

## 8. Secrets — où les trouver (sans les écrire)

| Secret | Emplacement |
|--------|-------------|
| `BETA_ADMIN_PIN` | Netlify → proday75 → Environment variables |
| Session / admin website secrets | Netlify (mêmes variables) |
| Brevo API key | Firebase `email.brevo_api_key` |
| Cal.com API key | Firebase `cal.api_key` |
| Stripe / service accounts | Netlify / Firebase / fichiers locaux gitignorés |
| Mot de passe admin app | Hors dépôt — Alfred uniquement |

**Règle :** toute clé complète manquante → demander à Alfred. Ne jamais coller de clé `xkeysib-…`, `cal_live_…`, Stripe ou JSON service account dans ce fichier.

---

## Rappels de sécurité

1. Ce document est **réservé aux 4 fondateurs**. Ne pas l’envoyer hors de ce cercle.
2. **Faire tourner le minicode** (`BETA_ADMIN_PIN`) périodiquement et après tout départ / fuite suspectée.
3. Ne jamais committer de clés API dans Git (même dépôt privé).
4. Le PDF généré est listé dans `.gitignore` (`docs/**/*.pdf`) — le régénérer localement si besoin.
5. En cas de doute sur un accès : contacter Alfred avant de partager quoi que ce soit.
