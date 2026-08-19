import { useMemo } from 'react';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useAppTheme } from '../context/ProductLineContext';
import { useSessionProfile } from './useSessionProfile';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { getMobileRailLayout } from '../navigation/mobileTabConfig';

/** Bouton retour pour onglets secondaires joueur (Plus → Messages, Mercato, etc.). */
export function useJoueurSecondaryTabBack() {
  const { activeTab, returnTab, goBackTab } = useTabNavigation();
  const { productLine } = useAppTheme();
  const profile = useSessionProfile();
  const session = useJoueurSession();
  const joueurLive = Boolean(
    session?.isJoueurPlayer && session.ready && !session.needsGate,
  );

  const isOverflowTab = useMemo(() => {
    const rail = getMobileRailLayout(productLine, profile?.role);
    if (!rail.flat?.length) return false;
    return !rail.flat.includes(activeTab);
  }, [productLine, profile?.role, activeTab]);

  const showBack = joueurLive && isOverflowTab && returnTab != null;

  return { showBack, onBack: goBackTab, returnTab };
}
