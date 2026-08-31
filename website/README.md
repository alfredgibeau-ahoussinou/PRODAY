<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/branding/logo-proday-lockup-white.png">
  <source media="(prefers-color-scheme: light)" srcset="public/branding/logo-proday-lockup-black.png">
  <img src="public/branding/logo-proday-official.png" alt="ProDay" width="320" />
</picture>

<br /><br />

# **Site Web Officiel & Portail Bêta ProDay**

**CONNECTER · PROGRESSER · RÉVÉLER**  
*Pas un outil de plus. L’infrastructure de votre football.*

<br />

[![Site](https://img.shields.io/badge/Production-proday75.fr-F5D04A?style=flat-square&logo=googlechrome&logoColor=black)](https://proday75.fr)
[![Bêta](https://img.shields.io/badge/Bêta-Inscription-0891b2?style=flat-square)](https://proday75.fr/beta/inscription)
[![Téléchargement APK](https://img.shields.io/badge/Download-proday--beta.apk-34d399?style=flat-square&logo=android)](https://proday75.fr/downloads/proday-beta.apk)

</div>

---

## 📖 Présentation

Le site officiel **[proday75.fr](https://proday75.fr)** est conçu avec **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS 4** et **Framer Motion**, déployé sur **Netlify**.

Il présente l'écosystème ProDay, les **6 portes d'entrée métier**, l'accès au programme bêta, les formulaires de devis pour les clubs et sponsors, ainsi que la vidéo de présentation Motion 60 FPS et le téléchargement direct de l'APK Android.

---

## 🗂️ Structure du Projet Web

```
website/
├── src/
│   ├── app/                      Pages & routes App Router
│   │   ├── page.tsx              Page d'accueil avec immersion vidéo & univers
│   │   ├── beta/                 Hub bêta-testeurs (inscription, programme, installer, aide)
│   │   ├── joueur/               Page Pôle Joueur (CV, highlights, stats)
│   │   ├── coach/                Page Pôle Coach & IA Blood Bath
│   │   ├── pro-club/             Page Pôle Club, tarifs & devis
│   │   ├── sponsor/              Page Pôle Sponsor, mécénat & simulateur
│   │   ├── parent/               Page Pôle Famille & covoiturage
│   │   ├── supporter/            Page Pôle Supporter & tribune
│   │   ├── confidentialite/      Politique de confidentialité (RGPD / CNIL)
│   │   └── cgu/                  Conditions Générales d'Utilisation
│   ├── components/               Composants d'interface (UI, immersive, formulaires)
│   │   ├── immersive/            Lecteur vidéo Canvas, UniverseScroll & animations 60 FPS
│   │   └── home/                 ProductPositioning, comparaison & témoignages
│   └── lib/                      Contenu éditorial, routes et hooks
├── public/
│   ├── downloads/                Fichiers distribuables (proday-beta.apk)
│   ├── videos/                   Vidéos MP4 (proday-intro.mp4)
│   └── branding/                 Logos officiels et favicons
└── netlify.toml                  Configuration de routage, headers de sécurité et redirects
```

---

## ⚡ Démarrage en Local

### 1. Installation des dépendances
```bash
cd website
npm install
```

### 2. Variables d'environnement (`.env.local`)
```env
NEXT_PUBLIC_SITE_URL=https://proday75.fr
NEXT_PUBLIC_BETA_APP_VERSION=1.0.9
NEXT_PUBLIC_BETA_APK_URL=/downloads/proday-beta.apk
NEXT_PUBLIC_BETA_TESTFLIGHT_URL=https://appstoreconnect.apple.com/apps/6801583755/testflight/ios
EMAILJS_SERVICE_ID=...
EMAILJS_TEMPLATE_ID=...
EMAILJS_PUBLIC_KEY=...
EMAILJS_PRIVATE_KEY=...
```

### 3. Lancer le serveur de développement
```bash
npm run dev
# Accessible sur http://localhost:3000
```

### 4. Compiler pour la production
```bash
npm run build
```

---

## 🚀 Déploiement en Production

Le déploiement en production vers **[https://proday75.fr](https://proday75.fr)** utilise le script dédié avec gestion du SSR et des Edge Functions Netlify :

```bash
# Depuis la racine ou le dossier website
npm run netlify:deploy
```

---

## 🔒 Sécurité & Performance
- **Content Security Policy (CSP)** stricte avec règles HTTPS et protections contre le clickjacking (`X-Frame-Options: DENY`).
- **PWA & Cache CDN** optimisé avec compression Turbopack et streaming Edge.
- **Formulaires sécurisés** avec rate limiting et protection anti-abus.
