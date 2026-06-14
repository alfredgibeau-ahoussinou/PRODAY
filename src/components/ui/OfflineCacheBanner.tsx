import React from 'react';
import { View, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from './Icon';
import { ProDayText } from './ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface OfflineCacheBannerProps {
  visible: boolean;
  onRefresh?: () => void;
  message?: string;
}

/** Bandeau discret — données calendrier en cache local. */
export const OfflineCacheBanner: React.FC<OfflineCacheBannerProps> = ({
  visible,
  onRefresh,
  message = 'Données hors ligne — dernière synchro enregistrée',
}) => {
  const { colors } = useAppTheme();
  if (!visible) return null;

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.warningBg, borderColor: colors.warning },
      ]}
    >
      <Icon name="warning" size={16} color={colors.warning} />
      <ProDayText variant="caption" style={[styles.text, { color: colors.warning }]}>
        {message}
      </ProDayText>
      {onRefresh ? (
        <PressableSpring onPress={onRefresh} scaleTo={0.94} haptic>
          <ProDayText variant="caption" accent style={styles.action}>
            Actualiser
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  text: { flex: 1, fontWeight: '600' },
  action: { fontWeight: '800' },
});
