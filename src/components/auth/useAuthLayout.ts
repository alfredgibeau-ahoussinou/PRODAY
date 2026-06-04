import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '../../theme/designTokens';

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

    return {
      compact,
      pad,
      logoWidth,
      contentMaxWidth,
      insets,
      scrollBottom: Math.max(insets.bottom, spacing.xl),
    };
  }, [width, height, insets.top, insets.bottom]);
}
