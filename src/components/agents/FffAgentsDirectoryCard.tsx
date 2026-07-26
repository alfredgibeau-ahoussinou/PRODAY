import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { GlassCard } from '../aurora/GlassCard';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import {
  FFF_AGENTS_SECTION,
  FFF_LICENSED_AGENTS_URL,
} from '../../content/fffAgentsDirectory';
import { spacing } from '../../theme/designTokens';

/** Carte lien vers l’annuaire officiel FFF des agents licenciés. */
export const FffAgentsDirectoryCard: React.FC = () => {
  return (
    <GlassCard style={styles.card}>
      <ProDayText variant="section">{FFF_AGENTS_SECTION.title}</ProDayText>
      <ProDayText variant="caption" muted>
        {FFF_AGENTS_SECTION.subtitle}
      </ProDayText>
      <PressableSpring
        style={styles.btn}
        onPress={() => void Linking.openURL(FFF_LICENSED_AGENTS_URL)}
        scaleTo={0.97}
        haptic
      >
        <ProDayText variant="body" accent>
          {FFF_AGENTS_SECTION.cta}
        </ProDayText>
      </PressableSpring>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  btn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
});
