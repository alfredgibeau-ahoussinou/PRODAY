# Inventaire des parcours — ProDay v1.0.10 (web Expo, build Metro)

Application : **ProDay** (proday75.fr) — plateforme football (recrutement, compétitions,
communication, covoiturage, boutique). Les « pôles » sont des espaces par rôle ;
l'espace **Admin plateforme** est exclu de la couverture.

Comptes de démonstration (données de test isolées, club `proday_demo_club` — FC ProDay Démo) :

| Pôle | Compte | Mot de passe |
|------|--------|--------------|
| Club | `club.demo@proday.app` | `ProDayDemo2026!` |
| Coach | `coach.demo@proday.app` | `ProDayDemo2026!` |
| Joueur | `player.demo@proday.app` | `ProDayDemo2026!` |
| Parent | `parent.demo@proday.app` | `ProDayDemo2026!` |

## Parcours d'entrée (identique pour tous les pôles)
1. Écran d'accueil invité → carousel « Sélectionnez votre univers » (8 pôles, dots cliquables).
2. CTA « Entrer dans [pôle] » → gate auth (Google / e-mail / téléphone).
3. « Se connecter » → formulaire e-mail + mot de passe → bouton « Se connecter ».

## PÔLE CLUB (`club.demo`) — sidebar desktop / dock mobile 4 + FAB + Menu
Dock mobile : Accueil · Calendrier · Équipes · Menu (+ FAB « + CRÉER »).
Sidebar desktop (5 dossiers) :

| Page | ID | Accès | Contenu / actions clés |
|------|----|----|------------------------|
| Accueil | `today` | dock / sidebar Pilotage | Carte club (joueurs·coachs·équipes), recherche globale, prochain RDV, raccourcis Annuaire/Calendrier/Annonce/Créer, modules, stats 26 licenciés & 0 demandes |
| Copilote Club | `assistant` | sidebar Pilotage | Chat IA (confirmation obligatoire avant actions) |
| Notifications | `notifications` | sidebar Pilotage | Centre d'alertes staff, préférences par type (switchs) |
| Équipes | `teams` | dock / sidebar Effectifs | Sélection équipe (thème dynamique), effectif par équipe |
| Joueurs | `players` | sidebar Effectifs | Annuaire licenciés, fiches joueur, invitations |
| Coach | `coaches` | sidebar Effectifs | Staff & affectations |
| Demandes d'adhésion | `memberships` | sidebar Effectifs | Affiliations en attente (valider/refuser) |
| Calendrier | `calendar` | dock / sidebar Sport | Vue jour/semaine/mois, événements, ouverture fiche |
| Matchs | `matches` | sidebar Sport | Convocs & invitations, feuilles de match |
| Entraînements | `trainings` | sidebar Sport | Séances & présences |
| Événements | `events` | sidebar Sport | Tournois & poules |
| Classements | `standings` | sidebar Sport | Championnat officiel FFF |
| Vidéo & Analyse | `video` | sidebar Sport | Veo · smartphone · clips IA |
| Communication | `communication` | sidebar Opérations | Canaux équipes/coachs/parents (variante Messages) |
| Covoiturage | `carpool` | sidebar Opérations | Déplacements & logistique (Événements/Réserver/Proposer/Mes trajets/Équipe) |
| Club | `club` | sidebar Club | Identité & réglages (Profil club) |
| Pack Club | `pack` | sidebar Club | Offre SUR DEVIS (dès 3 €/adhérent) |
| Licences | `licenses` | sidebar Club | Documents & licences |
| Finances | `finances` | sidebar Club | Grand livre (démo) |
| Sponsoring | `sponsoring` | sidebar Club | Partenaires, buvette & bénévolat, médical FFF, équipements |
| Permissions | `permissions` | sidebar Club | Rôles Admin/Dirigeant/DS/Coach |
| Menu (mobile) | `plus` | dock | Grille de tous les modules + bannière « Pôle Président & Direction » |

**Pôle Président** (bascule depuis le Menu club, même compte si owner) : Cockpit (Accueil/Mon club/Alertes),
Pilotage (Sportif, Finances, Adhérents, Équipes, Staff, Sponsors, Communication, Événements, Recrutement, Vidéo),
Ressources (Documents, Comité, Saison, Objectifs, Analyses).

## PÔLE COACH (`coach.demo`) — 4 onglets : Accueil · Calendrier · Équipe · Menu
| Page | ID | Accès | Contenu |
|------|----|----|---------|
| Accueil (Cockpit) | `today` | onglet 1 | Briefing du banc, priorités, RSVP, échéances |
| Calendrier | `calendrier` | onglet 2 | Événements, convocations, séances |
| Équipe | `equipe` | onglet 3 | Terrain, effectif, notes joueurs |
| Menu | `plus` | onglet 4 | Grille outils |
| Matchs (centre) | `match_center` | Menu → Match | Live, convocs, stats |
| Entraînements | `entrainements` | Menu → Match | Planning & séances |
| Gestion | `gestion` | Menu → Club | Équipe & licences (TeamManagement) |
| Messagerie | `com_staff` | Menu → Club | DM, groupes staff & parents |
| Covoiturage | `carpool` | Menu → Club | Déplacements équipe |
| Coaching perso | `coaching_perso` | Menu → Club | Créneaux à l'heure & tarifs |
| Mes vidéos | `mes_videos` | Menu → Performance | Captation, IA, causerie (flag `coach_video`) |
| Analyse de forme | `forme` | Menu → Performance | Charge, évals, objectifs |
| Historique relances | `rsvp_log` | Accueil/Menu | Relances envoyées aux joueurs |
| Tactique IA | `coach_ia`/`smart_tactics` | header/Menu | Tableau tactique, Twin Match Lab |
| Chat Copilote | `copilot_chat` | Menu | Chat IA conversationnel |
| Messages (onglet main) | `messages` | header | Vestiaire |
| Profil | `profil` | header | Diplômes & vitrine |

## PÔLE JOUEUR (`player.demo`) — dock Accueil · Calendrier · Ma Carte · Menu
| Page | ID | Accès | Contenu |
|------|----|----|---------|
| Accueil (mode Pro arcade) | `home` | dock | Carte joueur (note globale), radar 6 axes, quêtes du jour (Échauffement, Session terrain, Centre Match, Passeport carte, Groupe, Conseil Coach), objectifs saison, tuiles S'entraîner/Matchs/Groupe/Carte |
| Calendrier | `matchs` | dock | Filtres Tout/Matchs/Entraînements/Compétitions, fiche événement (Aperçu/Direct/Compo/Stats/Effectif), RSVP |
| Ma Carte (Ma Saison) | `feed` | Menu « Ma Saison » | Saison : Matchs & Calendrier, Classement, Mes Stats |
| Progression | `progression` | Menu | Ma Saison (XP, niveau, défis) |
| Équipe/Club | `recrutement` | Menu « ÉQUIPE » | Annuaire club amateur |
| Vestiaire | `messages` | Menu | Messagerie |
| Trajet | `covoiturage` | Menu | Covoiturage |
| Clips | `reels` | Menu | Vidéos verticales (paysage si lecture) |
| Boutique | `shop` | Menu | Équipement/Textile/Maillots |
| Famille | `famille` | Menu (si lié) | Contrôle parental |
| Mon compte | `profil` | Menu | Profil & CV joueur |
| Mon Coach IA | overlay | Menu | `tactics_coach` overlay sur l'accueil |

## PÔLE PARENT (`parent.demo`) — dock 5 : Accueil · Enfant · Guide IA · Menu · Profil
| Page | ID | Accès | Contenu |
|------|----|----|---------|
| Accueil | `home` | dock | Enfants liés (bascule supervision), alertes, invitations, temps d'écran |
| Enfant | `enfant` | dock / pastille | Fiche enfant sélectionné |
| Guide IA | `guide` | dock | Guide conversationnel parent |
| Menu | `plus` | dock | Outils : Messages, Agenda, Trajet |
| Profil/Réglages | `reglages` | dock | Réglages & déconnexion |
| Messages | `messages` | Menu | Contacts & fils de l'enfant |
| Agenda | `agenda` | Menu | Matchs/entraînements, RSVP Présent/Absent, retards |
| Trajet | `trajet` | Menu | Suivi live du covoiturage |

## Limitations connues (à documenter dans les vidéos)
- Le pôle Coach du club démo couvre le club (« Couvert club ») : Smart Tactics & Vidéo
  dépendent des flags plateforme (`coach_video`) — si verrouillé, l'écran affiche le panneau.
- Les écrans Vidéo/IA présentent des résultats de démonstration, pas des traitements opérationnels.
- Aucun paiement réel : la boutique et le Pack Club sont des vitrines.
