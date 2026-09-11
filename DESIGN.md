# ProDay Design System (DESIGN.md)

> Document standard de spécification visuelle et d'expérience utilisateur pour l'écosystème ProDay (App Mobile & Web).

---

## 1. Identité & Philosophie de Marque

- **Nom du Produit** : ProDay
- **Tagline Officielle** : *CONNECTER. PROGRESSER. RÉVÉLER.*
- **Positionnement** : L'infrastructure technologique et sportive du football moderne.
- **Direction Artistique** : **Dark Premium & Performance Athlétique**. Une interface sombre, épurée, immersive et dynamique, inspirée des cockpits de formule 1 et des hubs d'entraînement d'élite.
- **Principes Clés** :
  1. **Dark Mode First** : Fond noir absolu (`#000000`) et anthracite élevé (`#0A0A0F`, `#121218`) pour faire ressortir les statistiques, les médias et les visuels.
  2. **Contraste & Lisibilité** : Typographie blanche nette (`#FFFFFF`) et accents vifs avec hiérarchie stricte.
  3. **Micro-Interactions Tactiles** : Boutons avec effet ressort (`PressableSpring`, scale 0.95-0.97) et retours haptiques sur chaque action clé.
  4. **Respect Absolu des Safe Areas** : Aucun chevauchement avec la Dynamic Island, l'encoche iPhone ou la barre d'accueil iOS.

---

## 2. Palette de Couleurs (Color Tokens)

### 2.1 Couleurs Fondatrices (Dark Base)
| Token | Hex / Valeur | Usage |
|---|---|---|
| `bg` | `#000000` | Fond d'écran principal (OLED Black) |
| `bgElevated` | `#0A0A0F` | Dégradés de fond et conteneurs de niveau 1 |
| `surface` | `#121218` | Cartes, bulles de chat IA, panneaux |
| `surfaceRaised` | `#1A1A24` | Champs de saisie, barres flottantes, modales |
| `surfaceInverse` | `#FAFAFA` | Éléments inversés / contrastés |

### 2.2 Bordures & Lignes (Borders & Dividers)
| Token | Valeur | Usage |
|---|---|---|
| `border` | `rgba(255, 255, 255, 0.08)` | Bordures délicates des cartes et séparateurs |
| `borderStrong` | `rgba(255, 255, 255, 0.14)` | Contours d'éléments interactifs au repos |
| `borderActive` | `rgba(var(--accent-rgb), 0.45)` | États actifs, focus et sélections |

### 2.3 Typographie (Text & Contrast)
| Token | Hex | Usage |
|---|---|---|
| `text` | `#FFFFFF` | Titres principaux, messages utilisateur, valeurs |
| `textSecondary` | `#D4D4D4` | Corps de texte courant, descriptions |
| `textMuted` | `#8B8B9A` | Métadonnées, sous-titres, horodatages |
| `textDim` | `rgba(139, 139, 154, 0.72)` | Placeholders, légendes discrètes |

### 2.4 Accents de Marque & Rôles Métier
| Token | Hex | Usage |
|---|---|---|
| `gold` (Master) | `#C5A059` / `#E8B923` | Marque mère, CTA Master, Coach & Présidence |
| `playerGreen` (Joueur) | `#00E676` / `#2DD4BF` | Performance athlétique, forme, XP, stats |
| `clubBlue` (Club) | `#00ADEF` / `#2563EB` | Pôle Club, calendrier, effectifs |
| `parentLime` (Parent) | `#8CC63F` / `#84CC16` | Pôle Famille, suivi jeune |
| `sponsorRed` (Sponsor) | `#EF4444` | Offres partenaires, dotations |
| `liveGreen` | `#10B981` | Pastilles de disponibilité & services en ligne |

---

## 3. Typographie (Typography Scale)

- **Polices Système** :
  - Corps & UI : `Inter` (`Inter_400Regular`, `Inter_600SemiBold`, `Inter_700Bold`)
  - Titres & Display : `Syne` (`Syne_700Bold`) / `Sora` (`Sora_700Bold`)

| Échelle | Taille | Graisse | Interlettrage | Usage |
|---|---|---|---|---|
| `hero` | 30px - 32px | 800 - 900 (Black) | `-0.6px` | Grands titres d'accueil, score OVR |
| `title` | 22px - 24px | 800 (Extrabold) | `-0.4px` | Titres d'écrans, en-têtes de modules |
| `section` | 17px - 18px | 700 (Bold) | `-0.2px` | Titres de cartes, sous-parties |
| `body` | 14px - 15px | 400 - 600 | `normal` | Texte courant, réponses de chat |
| `caption` | 11px - 12px | 500 - 600 | `+0.2px` | Légendes, hints, sous-titres |
| `kicker` | 9px - 10px | 900 (Black) | `+1.4px à +2.0px` | Sur-titres en majuscules (ex: *PASS IA · TACTIQUE*) |

---

## 4. Espacements, Rayons & Élévation

### 4.1 Grille d'Espacement (8pt Grid)
- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 24px
- `xxl`: 32px

### 4.2 Rayons de Courbure (Border Radius)
- `sm` (10px) : Badges, petits boutons d'action
- `md` (14px) : Boutons de navigation, icônes encapsulées
- `lg` (18px) : Cartes d'action, blocs d'informations
- `xl` (24px) : Capsules de saisie (Composer), grandes cartes Hero
- `pill` (999px) : Boutons d'action pleine largeur, chips de suggestions, pastilles de statut

### 4.3 Ombres & Halos Lumineux
- **Cartes** : `shadowColor: '#000000'`, `offset: (0, 4)`, `opacity: 0.25`, `radius: 12`
- **Halo lumineux (Ambient Glow)** : Dégradé radial ou cercle diffus (`opacity: 0.12` à `0.20`) placé en haut d'écran pour donner de la profondeur sans surcharger.

---

## 5. Composants UI & Motifs Récurrents

### 5.1 En-tête d'Écran (Screen Header)
- Intégration stricte de `useSafeAreaInsets` : `paddingTop: Math.max(insets.top, 12)`.
- **Gauche** : Bouton retour squircle (40×40px, `radius: 12`, fond `surface`, bordure `border`).
- **Centre** : 
  - Kicker avec puce lumineuse verte clignotante ou fixe (`liveDot`).
  - Titre bold en blanc.
  - Sous-titre descriptif en `textMuted`.
- **Droite** : Bouton d'action contextuelle (Recharger / Réinitialiser / Fermer).

### 5.2 Expérience Conversationnelle IA (Chat & Copilote)
- **État d'Accueil (Zero-State)** :
  - **Carte Hero** : Salutation personnalisée au joueur, avatar IA avec étincelle (`star-four-points`), badge de disponibilité et rappel de sécurité.
  - **Grille de Cartes Thématiques** : Blocs à deux colonnes avec icône dédiée, tag majuscule, titre percutant et descriptif. Le tap envoie directement la requête.
- **Bulles de Discussion** :
  - *Conseiller IA* : Alignée à gauche, fond `surface`, bordure `borderStrong`, avatar miniature avec étincelle, badge d'en-tête « Conseiller IA ».
  - *Joueur* : Alignée à droite, fond teinté d'accent (`${accent}28`), bordure `${accent}66`, texte blanc ultra-lisible.
- **Indicateur de Réflexion** : Bulle assistant avec loader discret et message dynamique (*« Le Conseiller analyse ton profil tactique... »*).
- **Composer Flottant** :
  - Respect du Home Indicator iOS (`paddingBottom: Math.max(insets.bottom, 10)`).
  - Champ arrondi avec placeholder chaleureux.
  - Bouton circulaire tactile avec icône d'envoi (`chevron-forward`), illuminé dynamiquement à la saisie.

### 5.3 Boutons & Retours Haptiques
- Utilisation systématique de `PressableSpring` pour un retour visuel physique élastique.
- `Haptics.impactAsync(Light / Medium)` sur les clics de cartes et l'envoi de messages.

---

## 6. Icônes & Symbolique

- **Bibliothèque** : Ionicons & ProDay Custom FootIcons.
- **Symboles Fréquents** :
  - `star-four-points` : Intelligence Artificielle, fonctionnalités premium, XP.
  - `football` : Tactique, terrain, matchs.
  - `shield` : Défense, duels, sécurité & données personnelles.
  - `trophy` : Compétitions, classements, victoires.
  - `refresh` : Réinitialisation, mise à jour des flux.
  - `arrow-back` / `chevron-forward` : Navigation et validation.

---

## 7. Directives d'Intégration & Accessibilité

1. **Pas de Texte Tronqué** : Utiliser `numberOfLines` judicieusement avec `adjustsFontSizeToFit` sur les badges restreints.
2. **Zones Tactiles Ergonomiques** : `minHeight: 44px` ou `hitSlop: 10` sur tous les boutons interactifs.
3. **Contraste Élevé** : Tout texte informatif respecte un ratio de contraste supérieur à 4.5:1 sur fond sombre.
4. **Fluidité d'Animation** : Transitions à 60/120 fps via React Native Reanimated.

---

## 8. Architecture Multi-Pôles (6 Espaces Dédiés)

ProDay n'est pas une application mono-profil, mais un écosystème articulé autour de **6 pôles métiers**, partageant le même socle Dark Premium mais avec leur propre accent, leur navigation (Dock d'onglets) et leurs fonctionnalités dédiées :

### 8.1 Pôle Joueur (Accent : `#00E676` / `#2DD4BF` / `#FFFFFF`)
- **Cible** : Joueurs et joueuses amateurs et en formation.
- **Ambiance** : Cockpit athlétique, gamification, progression XP, carte d'attributs radar.
- **Dock 5 Onglets** :
  1. `Accueil` : Cockpit du jour, forme, météo d'entraînement, raccourcis.
  2. `Matchs` : Calendrier, convocations, statut titulaire/banc, météo.
  3. `Saison / XP` : Niveaux, progression, défis, badges débloqués.
  4. `Profil / CV` : CV sportif public, statistiques, vidéo réels, préférences.
  5. `Plus` : Conseiller IA, vestiaire, nutrition, matériel.

### 8.2 Pôle Coach & Staff (Accent : Or Champagne `#C5A059`)
- **Cible** : Entraîneurs, préparateurs physiques, adjoints.
- **Ambiance** : Tableau de bord tactique, rigueur professionnelle.
- **Fonctionnalités clés** :
  - Gestion des convocations et présences en temps réel.
  - Smart Tactics : composition d'équipe interactive (XI de départ, banc, remplaçants).
  - Suivi de forme et disponibilité de l'effectif.
  - Briefings tactiques d'avant-match et causeries.

### 8.3 Pôle Club & Direction (Accent : Émeraude Football `#10B981` ou Bleu `#00ADEF`)
- **Cible** : Présidents, directeurs sportifs, secrétaires de club.
- **Ambiance** : Centre de commandement institutionnel.
- **Fonctionnalités clés** :
  - Gestion des équipes, licences et effectifs du club.
  - Bourse aux matchs amicaux et tournois inter-clubs.
  - Pipeline de détection et mercato jeune (Observé → Contacté → Essai → Intégré).
  - Financements, sponsoring local et équipements.

### 8.4 Pôle Parent & Famille (Accent : Vert Lime `#8CC63F`)
- **Cible** : Parents de jeunes licenciés.
- **Ambiance** : Rassurante, claire, simplifiée, bienveillante.
- **Fonctionnalités clés** :
  - Agenda des matchs et entraînements des enfants.
  - Gestion du covoiturage entre parents de l'équipe.
  - Validation des présences et autorisations parentales.
  - Guide éducatif & IA d'accompagnement du jeune joueur.

### 8.5 Pôle Supporter & Tribune (Accent : Cyan Vibrant `#06B6D4`)
- **Cible** : Fans, bénévoles, passionnés de football local.
- **Ambiance** : Festive, communautaire, 100% libre et gratuite.
- **Fonctionnalités clés** :
  - Suivi des scores en direct des clubs de quartier et région.
  - Fil d'actualité vidéo (football réels), moments forts et classements.
  - Billetterie solidaire et boutique officielle du club.

### 8.6 Pôle Sponsor & Marque (Accent : Magenta / Violet `#92278F`)
- **Cible** : Entreprises partenaires, marques de sport, sponsors locaux.
- **Ambiance** : Business, ROI, visibilité et sponsoring à impact.
- **Fonctionnalités clés** :
  - Catalogue d'opportunités de sponsoring de clubs locaux.
  - Mesure d'impact et métriques de visibilité terrain.
  - Activation de dotations et gestion des contrats partenaires.
