import React, { useState } from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { DISCOVER_FEATURES } from '../../content/founders';
import { SHOWCASE_IMAGES } from '../../content/showcaseAssets';
import { PressableSpring } from './PressableSpring';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { Icon, type IconName } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

const STEP_IMAGES: Record<string, number> = {
  recruit: SHOWCASE_IMAGES.mercatoDetection,
  cv: SHOWCASE_IMAGES.playerProfile,
  matches: SHOWCASE_IMAGES.friendlyMatch,
  verify: SHOWCASE_IMAGES.playerProfile,
  team: SHOWCASE_IMAGES.friendlyMatch,
  arena: SHOWCASE_IMAGES.arenaTournament,
};

const STEPS = DISCOVER_FEATURES.map((f, i) => ({
  id: f.id,
  step: i + 1,
  title: f.title,
  icon: f.icon as IconName,
  color: f.color,
  preview: f.description,
  image: STEP_IMAGES[f.id] ?? SHOWCASE_IMAGES.discoverHero,
}));

interface DiscoverJourneyProps {
  onStepPress: (id: string) => void;
}

export const DiscoverJourney: React.FC<DiscoverJourneyProps> = ({ onStepPress }) => {
  const [active, setActive] = useState(STEPS[0].id);
  const current = STEPS.find((s) => s.id === active) ?? STEPS[0];

  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader
        label="Parcours"
        title="Testez l'expérience"
        subtitle="Touchez une étape — aperçu interactif"
      />

      <View style={styles.chips}>
        {STEPS.map((s) => {
          const on = s.id === active;
          return (
            <PressableSpring
              key={s.id}
              style={[styles.chip, on && styles.chipOn]}
              onPress={() => {
                setActive(s.id);
                onStepPress(s.id);
              }}
              scaleTo={0.94}
            >
              <Text style={[styles.chipNum, on && styles.chipNumOn]}>
                {String(s.step).padStart(2, '0')}
              </Text>
            </PressableSpring>
          );
        })}
      </View>

      <Animated.View
        key={current.id}
        entering={FadeInRight.duration(280).springify()}
        style={styles.preview}
      >
        <ImageBackground source={current.image} style={styles.previewImage} imageStyle={styles.previewImageInner}>
          <View style={styles.previewOverlay} />
          <View style={[styles.previewBadge, { borderColor: current.color }]}>
            <Icon name={current.icon} size={20} color={colors.brandInverse} variant="filled" />
          </View>
        </ImageBackground>
        <View style={styles.previewBody}>
          <View style={[styles.previewStripe, { backgroundColor: current.color }]} />
          <View style={styles.previewInner}>
            <Text style={styles.previewTitle}>{current.title}</Text>
            <Text style={styles.previewDesc}>{current.preview}</Text>
            <PressableSpring style={styles.previewCta} onPress={() => onStepPress(current.id)}>
              <Text style={styles.previewCtaText}>Débloquer avec un compte →</Text>
            </PressableSpring>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  chipNum: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textMuted,
  },
  chipNumOn: {
    color: colors.accent,
  },
  preview: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  previewImage: {
    height: 120,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  previewImageInner: { opacity: 0.85 },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  previewBadge: {
    alignSelf: 'flex-start',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  previewBody: { flexDirection: 'row', minHeight: 140 },
  previewStripe: { width: 5 },
  previewInner: {
    flex: 1,
    padding: spacing.lg,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.3,
  },
  previewDesc: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  previewCta: {
    marginTop: spacing.lg,
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  previewCtaText: {
    color: colors.accent,
    fontWeight: '800',
    fontSize: 13,
  },
});
