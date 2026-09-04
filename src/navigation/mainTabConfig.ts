/** Définition des onglets — sans import d’écrans (évite les cycles require). */
export type MainTabId =
  | 'home'
  | 'recrutement'
  | 'matchs'
  | 'covoiturage'
  | 'sante'
  | 'feed'
  | 'progression'
  | 'reels'
  | 'famille'
  | 'messages'
  | 'profil'
  | 'shop'
  | 'plus';

export const MAIN_TAB_ITEMS: {
  id: MainTabId;
  label: string;
  icon: string;
}[] = [
  { id: 'home', label: 'Accueil', icon: 'home' },
  { id: 'recrutement', label: 'Mercato', icon: 'recruitment' },
  { id: 'matchs', label: 'Matchs', icon: 'handshake' },
  { id: 'covoiturage', label: 'Covoiturage', icon: 'car' },
  { id: 'sante', label: 'Santé', icon: 'heart' },
  { id: 'feed', label: 'Actualités', icon: 'star-four-points' },
  { id: 'progression', label: 'Progression', icon: 'stats-chart' },
  { id: 'reels', label: 'Vidéos', icon: 'videocam' },
  { id: 'famille', label: 'Famille', icon: 'shield' },
  { id: 'messages', label: 'Vestiaire', icon: 'chat' },
  { id: 'profil', label: 'Mon Profil', icon: 'user' },
  { id: 'shop', label: 'Boutique', icon: 'bag' },
  { id: 'plus', label: 'Services', icon: 'hamburger' },
];
