/**
 * Centre Vidéo ProDay — contenu produit (Club + Coach).
 * Caméra → Match → Vidéo → IA → Clips → Causerie → Joueurs.
 */

import type { IconName } from '../components/ui/iconNames';

export type VideoCenterTabId =
  | 'dashboard'
  | 'cameras'
  | 'schedule'
  | 'library'
  | 'ai'
  | 'offers';

export type VideoProcessingStageId =
  | 'sync'
  | 'process'
  | 'ai'
  | 'clips'
  | 'ready';

export type VideoLiveEventKind =
  | 'goal'
  | 'yellow'
  | 'red'
  | 'sub'
  | 'highlight'
  | 'error'
  | 'set_piece'
  | 'note';

export type VideoShareTarget =
  | 'team'
  | 'player'
  | 'parents'
  | 'staff'
  | 'club'
  | 'link';

export type VideoLibraryBucket =
  | 'matches'
  | 'training'
  | 'talks'
  | 'clips'
  | 'analyses'
  | 'highlights';

export const VIDEO_CENTER_TABS: {
  id: VideoCenterTabId;
  label: string;
  hint: string;
}[] = [
  { id: 'dashboard', label: 'Centre', hint: 'Vue globale' },
  { id: 'cameras', label: 'Caméras', hint: 'Parc connecté' },
  { id: 'schedule', label: 'Captations', hint: 'Programmer' },
  { id: 'library', label: 'Bibliothèque', hint: 'Matchs & clips' },
  { id: 'ai', label: 'Analyse IA', hint: 'Requêtes coach' },
  { id: 'offers', label: 'Offres', hint: 'Packs & devis' },
];

export const VIDEO_PROCESSING_STAGES: {
  id: VideoProcessingStageId;
  label: string;
}[] = [
  { id: 'sync', label: 'Synchronisation' },
  { id: 'process', label: 'Traitement' },
  { id: 'ai', label: 'Analyse IA' },
  { id: 'clips', label: 'Clips' },
  { id: 'ready', label: 'Disponible' },
];

export const VIDEO_LIVE_EVENTS: {
  id: VideoLiveEventKind;
  label: string;
  icon: IconName;
  iconColor?: string;
}[] = [
  { id: 'goal', label: 'But', icon: 'football' },
  { id: 'yellow', label: 'Carton jaune', icon: 'warning', iconColor: '#FFD60A' },
  { id: 'red', label: 'Carton rouge', icon: 'alert-circle', iconColor: '#FF375F' },
  { id: 'sub', label: 'Remplacement', icon: 'swap-horizontal' },
  { id: 'highlight', label: 'Action importante', icon: 'star' },
  { id: 'error', label: 'Erreur', icon: 'close' },
  { id: 'set_piece', label: 'Coup arrêté', icon: 'flag' },
  { id: 'note', label: 'Note', icon: 'document' },
];

export const VIDEO_AI_PROMPTS: string[] = [
  'Montre-moi les erreurs défensives de mon équipe.',
  'Montre-moi toutes nos sorties de balle.',
  'Montre-moi nos occasions.',
  'Montre-moi les situations où notre bloc était trop bas.',
  'Montre-moi nos corners offensifs.',
  'Montre-moi les 5 meilleures actions du match.',
  'Tous les buts de cette saison.',
  'Toutes les actions de [joueur].',
];

export const VIDEO_TALK_SECTIONS: {
  id: string;
  label: string;
  defaultClips: number;
}[] = [
  { id: 'defense', label: 'Défense', defaultClips: 3 },
  { id: 'attack', label: 'Attaque', defaultClips: 3 },
  { id: 'transitions', label: 'Transitions', defaultClips: 2 },
  { id: 'set_pieces', label: 'Coups de pied arrêtés', defaultClips: 2 },
];

export const VIDEO_SHARE_TARGETS: {
  id: VideoShareTarget;
  label: string;
}[] = [
  { id: 'team', label: 'Équipe' },
  { id: 'player', label: 'Joueur' },
  { id: 'parents', label: 'Parents' },
  { id: 'staff', label: 'Staff' },
  { id: 'club', label: 'Club' },
  { id: 'link', label: 'Lien sécurisé' },
];

export const VIDEO_LIBRARY_BUCKETS: {
  id: VideoLibraryBucket;
  label: string;
}[] = [
  { id: 'matches', label: 'Matchs' },
  { id: 'training', label: 'Entraînements' },
  { id: 'talks', label: 'Causeries' },
  { id: 'clips', label: 'Clips' },
  { id: 'analyses', label: 'Analyses' },
  { id: 'highlights', label: 'Highlights' },
];

export const VIDEO_CAMERA_PREFLIGHT: {
  id: string;
  label: string;
}[] = [
  { id: 'battery', label: 'Batterie' },
  { id: 'connection', label: 'Connexion' },
  { id: 'storage', label: 'Stockage' },
  { id: 'position', label: 'Position' },
  { id: 'sync', label: 'Synchronisation' },
  { id: 'availability', label: 'Disponibilité' },
];

export const VIDEO_ACCESS_ROLES: {
  id: string;
  label: string;
  scope: string;
}[] = [
  { id: 'president', label: 'Président', scope: 'Accès global' },
  { id: 'sporting_director', label: 'Directeur sportif', scope: 'Équipes autorisées' },
  { id: 'coach', label: 'Coach', scope: 'Ses équipes uniquement' },
  { id: 'player', label: 'Joueur', scope: 'Contenus autorisés' },
  { id: 'parent', label: 'Parent', scope: 'Contenus de son enfant si autorisé' },
];

export const VIDEO_PACKS_COPY = {
  essentiel: {
    title: 'Pack ProDay Essentiel',
    body: 'Le club utilise son propre matériel (smartphone, tablette ou caméra existante). À partir de 3 € / adhérent / mois selon formule et effectif.',
  },
  video: {
    title: 'Pack ProDay + Vidéo',
    body: 'Ajoute le Centre Vidéo intelligent : captation, analyse IA, clips, causeries et partage.',
  },
  camera: {
    title: 'Module Caméra',
    body: 'Achat, location, mise à disposition ou intégration d’une caméra existante (Veo, XbotGo…). Sur devis selon adhérents, équipes et matériel.',
  },
} as const;

export function formatStorageGb(usedMb: number): string {
  const gb = usedMb / 1024;
  if (gb < 1) return `${Math.round(usedMb)} Mo`;
  return `${gb.toFixed(gb >= 10 ? 0 : 1)} Go`;
}
