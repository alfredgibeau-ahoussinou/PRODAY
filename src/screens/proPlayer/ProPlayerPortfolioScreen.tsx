import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { LazyReelsScreen } from '../LazyReelsScreen';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { ProDayText } from '../../components/ui/ProDayText';
import { spacing } from '../../theme/designTokens';

/** Onglet Portfolio — vidéos taguées et stats validées coach. */
export const ProPlayerPortfolioScreen: React.FC = () => {
  const profile = useSessionProfile();

  return (
    <View style={styles.root}>
      {profile ? (
        <ProDaySurface style={styles.banner}>
          <ProDayText variant="eyebrow" muted>
            Portfolio scouting
          </ProDayText>
          <ProDayText variant="caption" muted>
            Vidéos par match · stats saison badge « Validé coach »
          </ProDayText>
        </ProDaySurface>
      ) : null}
      <LazyReelsScreen />
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
});
