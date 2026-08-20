import { useTabNavigationOptional } from '../context/TabNavigationContext';
import { useSessionProfile } from './useSessionProfile';

/** Retour vers le hub Plus (Explorer, Vidéos, Fil, Shop). */
export function useSupporterPlusReturn() {
  const nav = useTabNavigationOptional();
  const profile = useSessionProfile();
  const showBack = nav?.returnTab === 'plus' && profile?.role === 'supporter';
  return {
    showBack,
    onBack: () => nav?.goBackTab(),
  };
}
