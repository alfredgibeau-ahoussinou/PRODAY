import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { PressableSpring } from './PressableSpring';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius, shadows, brandOverlay } from '../../theme/designTokens';
import { SHOWCASE_IMAGES } from '../../content/showcaseAssets';

export type DiscoverExperienceId = 'deck' | 'stories' | 'motion';

interface DiscoverExperiencesHubProps {
  onPress: (id: DiscoverExperienceId) => void;
}

export const DiscoverExperiencesHub: React.FC<DiscoverExperiencesHubProps> = ({ onPress }) => (
  <View style={styles.wrap}>
    <DiscoverSectionHeader
      label="EXPÉRIENCES"
      title="Plus de pages interactives"
      subtitle="Animations, transitions, micro‑interactions"
      compact
    />

    <View style={styles.grid}>
      <Animated.View entering={FadeInUp.delay(40).springify()} style={styles.cell}>
        <PressableSpring style={styles.card} onPress={() => onPress('deck')} scaleTo={0.94}>
          <ImageBackground source={SHOWCASE_IMAGES.expPulse} style={styles.bg} imageStyle={styles.bgImg}>
            <View style={styles.overlay} />
            <View style={styles.pill}>
              <Icon name="star-four-points" size={16} color={colors.accent} />
              <Text style={styles.pillText}>Deck</Text>
            </View>
            <Text style={styles.title}>Pitch interactif</Text>
            <Text style={styles.sub}>Swipe horizontal · parallax</Text>
          </ImageBackground>
        </PressableSpring>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.cell}>
        <PressableSpring style={styles.card} onPress={() => onPress('stories')} scaleTo={0.94}>
          <ImageBackground source={SHOWCASE_IMAGES.expTeam} style={styles.bg} imageStyle={styles.bgImg}>
            <View style={styles.overlay} />
            <View style={styles.pill}>
              <Icon name="calendar" size={16} color={colors.accent} />
              <Text style={styles.pillText}>Stories</Text>
            </View>
            <Text style={styles.title}>Showcase vertical</Text>
            <Text style={styles.sub}>Snap cards · focus dynamique</Text>
          </ImageBackground>
        </PressableSpring>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(160).springify()} style={[styles.cell, styles.full]}>
        <PressableSpring style={styles.card} onPress={() => onPress('motion')} scaleTo={0.96}>
          <View style={[styles.motionCard, shadows.card]}>
            <View style={styles.motionPill}>
              <Icon name="star" size={16} color={colors.brandInverse} />
              <Text style={styles.motionPillText}>Motion lab</Text>
            </View>
            <Text style={styles.motionTitle}>Une page “wow”</Text>
            <Text style={styles.motionSub}>Tap · burst · bulles flottantes</Text>
          </View>
        </PressableSpring>
      </Animated.View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.xl },
  grid: { paddingHorizontal: spacing.lg, gap: spacing.sm, flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '48.5%', flexGrow: 1 },
  full: { width: '100%' },
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  bg: { minHeight: 150, padding: spacing.md, justifyContent: 'flex-end' },
  bgImg: { opacity: 0.9 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: brandOverlay(0.42) },
  pill: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillText: { fontSize: 11, fontWeight: '900', color: colors.ink, letterSpacing: 1 },
  title: { fontSize: 16, fontWeight: '900', color: colors.brandInverse, letterSpacing: -0.3 },
  sub: { marginTop: 4, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.82)' },
  motionCard: {
    minHeight: 120,
    backgroundColor: colors.surfaceInverse,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  motionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  motionPillText: { fontSize: 11, fontWeight: '900', color: colors.brandInverse, letterSpacing: 1.2 },
  motionTitle: { fontSize: 18, fontWeight: '900', color: colors.brandInverse, letterSpacing: -0.4 },
  motionSub: { marginTop: 4, fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.8)' },
});

