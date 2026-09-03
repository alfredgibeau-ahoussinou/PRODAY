# Plan d'Implémentation - Formulaire de Support & Déploiements

## ⚠️ User Review Required
1. **Envoi d'un email de masse :** Envoyer un message à toute la base d'utilisateurs est une action critique. Je vais préparer le script d'envoi, mais j'aurai besoin de ton feu vert final (et de valider le contenu exact) avant de déclencher l'envoi.
2. **Build iOS (TestFlight) :** Le lancement d'un build iOS via EAS nécessite que tes certificats Apple Developer soient bien configurés. Je lancerai la commande, mais une action de ta part sera peut-être requise si EAS demande une authentification Apple (2FA).

## Open Questions
- **EmailJS pour le Support :** Pour que le formulaire de contact envoie un email *silencieusement* (sans ouvrir l'application mail de l'utilisateur), j'utiliserai l'API de backend. As-tu un `TEMPLATE_ID` précis sur EmailJS pour la réception des demandes de support, ou dois-je formater ça via le template par défaut existant ?
- **Contenu du mail global :** Quel texte exact souhaites-tu envoyer à tous les inscrits pour annoncer la mise à jour ?

## Proposed Changes

### 1. Formulaire de Support Intégré (Website)
- **[NEW]** `website/src/components/SupportModal.tsx` : Une modale propre (UI premium) avec un champ "Type de demande" (Bug, Téléchargement, Question), un champ "Message", et un champ "Email de réponse".
- **[MODIFY]** `website/src/components/SiteFooter.tsx` et `TerminalCta.tsx` : Remplacement du lien `mailto:` par un bouton ouvrant la modale de support.
- **[NEW]** `website/src/app/api/support/route.ts` : API sécurisée permettant l'envoi de l'email vers `proday.admin@gmail.com` via l'API EmailJS (backend-to-backend) ou un appel Cloud Function.

### 2. Audit et Mise à jour des READMEs
- **[MODIFY]** `README.md` et `website/README.md` : Mise à jour pour refléter que la bêta est désormais 100% publique et ouverte (suppression des mentions de la file d'attente).
- Un sous-agent sera lancé pour auditer dynamiquement tous les boutons (`href`, actions) du site web et de l'app mobile afin d'assurer l'absence de liens morts.

### 3. Compilation Mobile (APK et TestFlight)
- Exécution de la création de l'APK (via tes scripts `npm run android:apk:beta` / `publish`).
- Soumission du build iOS sur EAS (`npm run eas:build:testflight` et `eas:submit:testflight`).

### 4. Notification Email Globale
- **[NEW]** `scripts/broadcast-update.mjs` : Script Node lisant la liste des inscrits et envoyant la notification via l'API existante.

## Verification Plan
1. Test du formulaire de support : je vérifierai que l'API renvoie bien un succès `200` et que l'interface confirme l'envoi.
2. Suivi des logs EAS pour confirmer le dépôt sur TestFlight.
3. Rapport complet de l'audit des boutons par le sous-agent.
