import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme/designTokens';
import { tabBarScrollInset } from '../../navigation/tabBarLayout';

/**
 * Dimensions connexion / inscription (petits écrans, encoches).
 */
export function useAuthLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    const compact = height < 780 || width < 390;
    const pad = compact ? spacing.md : spacing.lg;
    const logoWidth = Math.min(compact ? 160 : 188, width - pad * 2);
    const contentMaxWidth = Math.min(420, width - pad * 2);

    const headerTopPad = compact ? spacing.sm : spacing.md;

    return {
      compact,
      pad,
      logoWidth,
      contentMaxWidth,
      insets,
      /** Haut du header : le parent `SafeAreaView` gère déjà l’encoche. */
      headerTopPad,
      scrollBottom: Math.max(insets.bottom, spacing.xl),
      tabBarScrollInset: (opts?: { guestMode?: boolean; stickyFooter?: boolean; extra?: number }) =>
        tabBarScrollInset({
          guestMode: opts?.guestMode,
          stickyFooter: opts?.stickyFooter,
          extra: opts?.extra ?? spacing.md,
        }),
    };
  }, [width, height, insets.top, insets.bottom]);
}
