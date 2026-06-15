import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { spacing, radius, shadows, surfaces } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

const Launchpad: React.FC<{
  icon: IconName;
  title: string;
  subtitle: string;
  accent: string;
  bg: string;
  arrowColor: string;
  delay: number;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}> = ({ icon, title, subtitle, accent, bg, arrowColor, delay, onPress, styles }) => (
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
        <Icon name="chevron-forward" size={18} color={arrowColor} />
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
}) => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader label="Accès direct" title="Plongez dans l'app" compact />
      <Launchpad
        icon="search"
        title="Mercato & recrutement"
        subtitle="Annonces, joueurs, clubs"
        accent={c.brand}
        bg={c.brandSoft}
        arrowColor={c.brand}
        delay={0}
        onPress={onMercato}
        styles={styles}
      />
      <Launchpad
        icon="handshake"
        title="Matchs amicaux"
        subtitle="Calendrier & propositions"
        accent={c.tone2}
        bg={c.backgroundAlt}
        arrowColor={c.brand}
        delay={80}
        onPress={onMatchs}
        styles={styles}
      />
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
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
    title: { fontSize: 16, fontWeight: '800', color: c.text },
    sub: { fontSize: 13, color: c.textMuted, marginTop: 2 },
    arrow: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
