/** Définition des onglets — sans import d’écrans (évite les cycles require). */
export type MainTabId =
  | 'home'
  | 'recrutement'
  | 'matchs'
  | 'messages'
  | 'profil';

export const MAIN_TAB_ITEMS: {
  id: MainTabId;
  label: string;
  icon: string;
}[] = [
  { id: 'home', label: 'Accueil', icon: 'home' },
  { id: 'recrutement', label: 'Recrutement', icon: 'recruitment' },
  { id: 'matchs', label: 'Matchs', icon: 'handshake' },
  { id: 'messages', label: 'Messages', icon: 'chat' },
  { id: 'profil', label: 'Profil', icon: 'user' },
];
