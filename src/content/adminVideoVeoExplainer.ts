/**
 * Explication admin — connexion ProDay ↔ Veo (démo).
 * Affiché dans Paramètres → Système.
 */

export const ADMIN_VIDEO_VEO_DEMO = {
  title: 'Connexion ProDay ↔ Veo',
  eyebrow: 'Démo système vidéo',
  lead:
    'ProDay ne remplace pas Veo : il relie la caméra au club, au match, au coach et aux joueurs dans une seule app.',
  chain: [
    { step: '01', label: 'Caméra', body: 'Veo, XbotGo, autre compatible, ou smartphone / tablette.' },
    { step: '02', label: 'Club', body: 'Centre Vidéo : parc caméras, captations, bibliothèque, droits.' },
    { step: '03', label: 'Match', body: 'Programmation → captation → sync → traitement → clips.' },
    { step: '04', label: 'Coach', body: 'Mes vidéos : préparer, Live Center, analyse IA, causerie.' },
    { step: '05', label: 'Joueurs', body: 'Uniquement les séquences partagées par le coach / le club.' },
  ],
  howItWorks: [
    {
      title: '1. Activation admin (cette page)',
      body: 'Allume « Vidéo Club (Veo) » et « Vidéo Coach (Veo) ». Sans ça, les menus restent verrouillés hors formule Tout inclus.',
    },
    {
      title: '2. Connexion côté Club',
      body: 'Espace Club → Outils → Centre Vidéo → Caméras → Ajouter une caméra (Veo ou autre). L’appareil est enregistré dans Firestore (club_cameras).',
    },
    {
      title: '3. Association équipes',
      body: 'Une caméra peut servir plusieurs catégories (U15, U18…). Toucher la caméra pour lier les équipes.',
    },
    {
      title: '4. Programmer une captation',
      body: 'Centre Vidéo → Captations : adversaire, équipe, terrain, caméra. Crée une fiche match vidéo (club_match_videos).',
    },
    {
      title: '5. Parcours Coach',
      body: 'Performance → Mes vidéos : bibliothèque, préflight caméra, Live Center (buts, cartons, notes), analyse IA et causerie.',
    },
    {
      title: '6. Partage joueur',
      body: 'Les clips adressés au joueur apparaissent dans Profil → Activité → Mes vidéos.',
    },
  ],
  architecture: [
    {
      title: 'Couche providers',
      body: 'cameraProviders.ts : Veo (native), XbotGo / Spiideo… (connecteurs), smartphone (device capture). Même interface pour tous.',
    },
    {
      title: 'Données live',
      body: 'Firestore : club_cameras + club_match_videos. L’admin Vidéo liste le parc en temps réel.',
    },
    {
      title: 'État démo',
      body: 'Parcours produit complet (UI + données). OAuth fabricant Veo / sync cloud réel : connecteurs prêts, clés API à brancher ensuite.',
    },
  ],
  demoScript: [
    'Activer les 2 switches Vidéo ci-dessous.',
    'Ouvrir un compte Club → Centre Vidéo → ajouter une caméra Veo.',
    'Programmer une captation (ex. U15 vs Paris FC).',
    'Ouvrir un compte Coach → Mes vidéos → montrer Live + « Montre-moi nos erreurs ».',
    'Montrer le bloc Mes vidéos côté joueur si un clip est partagé.',
  ],
  pitch:
    'Caméra → Match → Vidéo → IA → Clips → Causerie → Joueurs. ProDay = le centre vidéo intelligent du club, compatible Veo sans y être limité.',
} as const;
