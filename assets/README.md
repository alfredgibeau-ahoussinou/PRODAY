# Assets & Identité Visuelle ProDay (`assets/`)

> Identité officielle, logos haute résolution, vidéo d'introduction Motion 60 FPS et kit marketing Stories Instagram.

---

## 📁 Organisation des Dossiers

```
assets/
├── branding/                       Logos officiels, icônes d'application et favicons
│   ├── logo-proday-official.png    Logo maître officiel ProDay (doré et fond sombre)
│   ├── proday-app-icon.png         Icône d'application mobile (1024x1024)
│   ├── proday-splash.png           Écran de démarrage Expo (splash screen)
│   ├── proday-adaptive-foreground.png Icône adaptative Android
│   └── proday-notification-icon.png   Icône monochrome pour notifications push
├── intro/                          Vidéo d'introduction officielle
│   ├── proday-intro.mp4            Vidéo Motion Graphics 60 FPS verticale (1080x1920)
│   └── music/                      Bandes sons originales libres de droits
├── marketing/                      Kits de promotion et visuels réseaux sociaux
│   ├── instagram_stories/          5 Stories Instagram 1080x1920 (Lancement, Joueur, Coach, Club, Sponsor)
│   └── app-store/                  Captures d'écran officielles pour App Store & Play Store
└── mockups/                        Planches de design et maquettes d'interface
```

---

## 🎬 Vidéo d'Introduction Motion Graphics 60 FPS

La vidéo d'introduction [`assets/intro/proday-intro.mp4`](./intro/proday-intro.mp4) est générée à l'aide d'un moteur de rendu frame-by-frame sans saccade ni tremblement :
- **Résolution** : 1080x1920 (format vertical 9:16 pour mobile et stories).
- **Fréquence** : 60 images par seconde (594 frames).
- **Contenu** : 3 scènes éditoriales calquées sur le site web officiel avec centrage optique parfait.

Pour régénérer la vidéo :
```bash
python3 scripts/build_motion_intro_video.py
```

---

## 📱 Kit de 5 Stories Instagram (1080x1920)

Disponibles dans [`assets/marketing/instagram_stories/`](./marketing/instagram_stories/) :
1. **`01_proday_lancement_app.png`** : Présentation globale de l'écosystème (*« Des portes d'entrée. Un seul football. »*).
2. **`02_pole_joueur_carriere.png`** : Pôle Joueur (*CV digital, statistiques et vidéos de match*).
3. **`03_pole_coach_ia_bloodbath.png`** : Pôle Coach (*Séances IA Gemini Blood Bath et tableau tactique*).
4. **`04_pole_club_gestion.png`** : Pôle Club (*Organisation de tournois, licences et covoiturage*).
5. **`05_pole_sponsor_partenariats.png`** : Pôle Sponsor (*Partenariats de proximité et visibilité locale*).

Pour régénérer les stories :
```bash
python3 scripts/generate_instagram_stories.py
```

---

## 🎨 Palette de Couleurs Officielles

| Nom | Hex | RGB | Usage |
| :--- | :--- | :--- | :--- |
| **Noir Nuit** | `#07100C` | `(7, 16, 12)` | Fond officiel application & site web |
| **Or Vif** | `#F5D04A` | `(245, 208, 74)` | Accents, boutons d'action et kickers |
| **Or Master** | `#C5A059` | `(197, 160, 89)` | Logo officiel et typographies de prestige |
| **Bleu Vif** | `#38BDF8` | `(56, 189, 248)` | Identité Pôle Joueur |
| **Émeraude** | `#34D399` | `(52, 211, 153)` | Identité Pôle Coach & IA |
| **Ambre** | `#FBBF24` | `(251, 191, 36)` | Identité Pôle Sponsor |
