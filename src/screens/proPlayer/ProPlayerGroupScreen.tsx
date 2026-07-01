import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MatchsScreen } from '../MatchsScreen';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

/** Onglet Groupe — convocations staff et logistique déplacement. */
export const ProPlayerGroupScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const nav = useTabNavigationActions();

  return (
    <View style={styles.root}>
      <ProDaySurface style={styles.banner}>
        <ProDayText variant="eyebrow" muted>
          Groupe pro
        </ProDayText>
        <ProDayText variant="caption" muted>
          Convocations staff et transport groupe — pas de gestion compo
        </ProDayText>
        <PressableSpring
          style={[styles.transport, { borderColor: colors.border }]}
          onPress={() => nav.setActiveTab('covoiturage')}
          haptic
        >
          <Icon name="car" size={16} color={colors.accent} />
          <ProDayText variant="caption">Transport groupe</ProDayText>
        </PressableSpring>
      </ProDaySurface>
      <MatchsScreen />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  transport: {
    marginTop: spacing.xs,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
