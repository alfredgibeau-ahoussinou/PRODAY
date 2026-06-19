import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme/designTokens';
import { SIGNUP_STICKY_FOOTER_HEIGHT } from '../../navigation/tabBarLayout';

/**
 * Dimensions connexion / inscription (petits écrans, encoches).
 * Même logique que DiscoverGuestHero / AuroraHeader : insets explicites en haut.
 */
export function useAuthLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const compact = height < 780 || width < 390;
    const pad = compact ? spacing.md : spacing.lg;
    const logoWidth = Math.min(compact ? 160 : 188, width - pad * 2);
    const contentMaxWidth = Math.min(420, width - pad * 2);

    const headerTopPad = insets.top + (compact ? spacing.sm : spacing.md);

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
