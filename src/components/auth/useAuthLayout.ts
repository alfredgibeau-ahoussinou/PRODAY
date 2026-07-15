import { useMemo } from 'react';
import { Platform, StatusBar, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme/designTokens';
import { SIGNUP_STICKY_FOOTER_HEIGHT } from '../../navigation/tabBarLayout';

/**
 * Dimensions connexion / inscription (petits écrans, encoches).
 * `headerTopPad` inclut la barre d’état : les overlays `absoluteFill`
 * (inscription, MDP oublié) ignorent le SafeAreaView parent, et sans ça
 * retour / langue / pôle passent sous l’heure et la batterie.
 */
export function useAuthLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const compact = height < 780 || width < 390;
    const pad = compact ? spacing.md : spacing.lg;
    const logoWidth = Math.min(compact ? 160 : 188, width - pad * 2);
    const contentMaxWidth = Math.min(420, width - pad * 2);

    const statusBarFallback =
      Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
    const topInset = Math.max(insets.top, statusBarFallback);
    // Un peu moins de marge que le full inset + md (évite un bandeau trop bas).
    const headerTopPad = Math.max(topInset - 6, 0) + spacing.xs;

    const bottomPad = (opts?: { stickyFooter?: boolean; extra?: number }) => {
      let inset = spacing.lg;
      if (opts?.stickyFooter) inset += SIGNUP_STICKY_FOOTER_HEIGHT;
      if (opts?.extra) inset += opts.extra;
      return inset + Math.max(insets.bottom, spacing.sm);
    };

    return {
      compact,
      pad,
      logoWidth,
      contentMaxWidth,
      insets,
      headerTopPad,
      scrollBottom: bottomPad(),
      tabBarScrollInset: bottomPad,
    };
  }, [width, height, insets.top, insets.bottom]);
}
