import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from './PressableSpring';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { colors, spacing, radius, shadows, surfaces } from '../../theme/designTokens';

const Launchpad: React.FC<{
  icon: IconName;
  title: string;
  subtitle: string;
  accent: string;
  bg: string;
  delay: number;
  onPress: () => void;
}> = ({ icon, title, subtitle, accent, bg, delay, onPress }) => (
  <Animated.View entering={FadeInUp.delay(delay).springify()}>
    <PressableSpring style={[styles.card, shadows.card]} onPress={onPress} scaleTo={0.98}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Icon name={icon} size={24} color={accent} variant="filled" />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{subtitle}</Text>
      </View>
      <View style={styles.arrow}>
        <Icon name="chevron-forward" size={18} color={colors.accent} />
      </View>
    </PressableSpring>
  </Animated.View>
);

interface ExploreLaunchpadsProps {
  onMercato: () => void;
  onMatchs: () => void;
}

export const ExploreLaunchpads: React.FC<ExploreLaunchpadsProps> = ({
  onMercato,
  onMatchs,
}) => (
  <View style={styles.wrap}>
    <DiscoverSectionHeader label="Accès direct" title="Plongez dans l'app" compact />
    <Launchpad
      icon="search"
      title="Mercato & recrutement"
      subtitle="Annonces, joueurs, clubs"
      accent={colors.accent}
      bg={colors.accentSoft}
      delay={0}
      onPress={onMercato}
    />
    <Launchpad
      icon="handshake"
      title="Matchs amicaux"
      subtitle="Calendrier & propositions"
      accent={colors.tone2}
      bg={colors.backgroundAlt}
      delay={80}
      onPress={onMatchs}
    />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    ...surfaces.card,
    padding: spacing.md,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: colors.text },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
