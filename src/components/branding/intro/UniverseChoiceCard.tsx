import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { ProductLineId } from '../../../models/ProductLine';
import { getUniverseIdentity } from '../../../content/brandExperience';
import { rolesForProductLine } from '../../../content/universeRoles';
import type { UserRole } from '../../../models/User';
import { ProductLineLogo } from '../ProductLineLogo';
import { Icon } from '../../ui/Icon';
import { spacing, radius, shadows } from '../../../theme/designTokens';

const ROLE_CHIP_LABELS: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  recruiter: 'Recruteur',
  organizer: 'Orga',
  sponsor: 'Sponsor',
  physio: 'Pôle santé',
};

const CARD_THEMES: Record<
  ProductLineId,
  {
    bg: string;
    border: string;
    glow: string;
    chipBg: string;
    chipText: string;
    ctaBg: string;
    ctaText: string;
    mission: string;
    eyebrow: string;
  }
> = {
  homme: {
    bg: '#FFFFFF',
    border: '#E5E5E5',
    glow: 'rgba(10, 10, 10, 0.06)',
    chipBg: '#F5F5F5',
    chipText: '#262626',
    ctaBg: '#0A0A0A',
    ctaText: '#FFFFFF',
    mission: '#525252',
    eyebrow: '#737373',
  },
  woman: {
    bg: '#FDF2F8',
    border: '#FBCFE8',
    glow: 'rgba(190, 24, 93, 0.12)',
    chipBg: '#FCE7F3',
    chipText: '#9D174D',
    ctaBg: '#BE185D',
    ctaText: '#FFFFFF',
    mission: '#9D174D',
    eyebrow: '#BE185D',
  },
  pro: {
    bg: '#F0F9FF',
    border: '#BFDBFE',
    glow: 'rgba(29, 78, 216, 0.12)',
    chipBg: '#EFF6FF',
    chipText: '#1E3A8A',
    ctaBg: '#1D4ED8',
    ctaText: '#FFFFFF',
    mission: '#334155',
    eyebrow: '#1D4ED8',
  },
};

interface UniverseChoiceCardProps {
  line: ProductLineId;
  index: number;
  onPress: () => void;
}

export const UniverseChoiceCard: React.FC<UniverseChoiceCardProps> = ({
  line,
  index,
  onPress,
}) => {
  const identity = getUniverseIdentity(line);
  const theme = CARD_THEMES[line];
  const roles = rolesForProductLine(line);

  const chipLabel = (role: UserRole) => {
    if (line === 'woman' && role === 'player') return 'Joueuse';
    if (line === 'woman' && role === 'club') return 'Club F';
    return ROLE_CHIP_LABELS[role];
  };

  return (
    <Animated.View entering={FadeInDown.delay(80 + index * 90).springify().damping(18)}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          shadows.card,
          {
            backgroundColor: theme.bg,
            borderColor: theme.border,
            transform: [{ scale: pressed ? 0.985 : 1 }],
          },
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Choisir ${identity.productName}`}
      >
        <View style={[styles.glow, { backgroundColor: theme.glow }]} />

        <Text style={[styles.eyebrow, { color: theme.eyebrow }]}>
          {identity.accentLabel}
        </Text>

        <View style={styles.logoWrap}>
          <ProductLineLogo line={line} width={152} onDark={false} />
        </View>

        <Text style={[styles.heroLine, { color: theme.chipText }]}>
          {identity.heroLine.replace('\n', ' ')}
        </Text>
        <Text style={[styles.mission, { color: theme.mission }]}>{identity.mission}</Text>

        <View style={styles.chips}>
          {roles.map((role) => (
            <View
              key={role}
              style={[styles.chip, { backgroundColor: theme.chipBg }]}
            >
              <Text style={[styles.chipText, { color: theme.chipText }]}>
                {chipLabel(role)}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.ctaRow, { backgroundColor: theme.ctaBg }]}>
          <Text style={[styles.ctaText, { color: theme.ctaText }]}>
            Entrer dans {identity.productName}
          </Text>
          <Icon name="chevron-forward" size={16} color={theme.ctaText} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    overflow: 'hidden',
    gap: spacing.sm,
  },
  glow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  logoWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  heroLine: {
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
    lineHeight: 22,
  },
  mission: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xs,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  ctaRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});
