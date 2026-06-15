import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FOUNDERS, FOUNDERS_LETTER } from '../../content/founders';
import { FOUNDER_IMAGE_KEYS } from '../../content/showcaseExperience';
import { useShowcaseImages } from '../../hooks/useShowcaseImages';
import type { ShowcaseImageKey } from '../../content/showcaseAssets';
import { PressableSpring } from '../motion';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { spacing, radius } from '../../theme/designTokens';
import { SPRING_SNAPPY } from './animationConfig';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

export const FoundersInteractive: React.FC = () => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [selected, setSelected] = useState<string | null>(null);
  const [showLetter, setShowLetter] = useState(false);
  const founder = FOUNDERS.find((f) => f.id === selected);

  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader
        label="Équipe fondatrice"
        title={FOUNDERS_LETTER.title}
        subtitle={FOUNDERS_LETTER.intro}
      />

      <View style={styles.avatars}>
        {FOUNDERS.map((f) => (
          <FounderChip
            key={f.id}
            founder={f}
            active={selected === f.id}
            onPress={() => {
              setSelected(f.id);
              setShowLetter(false);
            }}
          />
        ))}
      </View>

      {founder && (
        <Animated.View entering={FadeIn.duration(200)} style={styles.selectedBox}>
          <Text style={styles.selectedName}>{founder.name}</Text>
          <Text style={styles.selectedRole}>{founder.role}</Text>
        </Animated.View>
      )}

      <PressableSpring
        style={styles.letterBtn}
        onPress={() => setShowLetter((v) => !v)}
      >
        <Text style={styles.letterBtnText}>
          {showLetter ? 'Fermer' : 'Lire le message des 4 fondateurs'}
        </Text>
      </PressableSpring>

      {showLetter && (
        <Animated.View entering={FadeInUp.springify()} style={styles.letterBox}>
          <Text style={styles.letterBody}>{FOUNDERS_LETTER.body}</Text>
          <Text style={styles.letterSign}>{FOUNDERS_LETTER.signature}</Text>
          <Text style={styles.letterNames}>
            {FOUNDERS.map((f) => f.name).join(' · ')}
          </Text>
        </Animated.View>
      )}
    </View>
  );
};

const FounderChip: React.FC<{
  founder: (typeof FOUNDERS)[number];
  active: boolean;
  onPress: () => void;
}> = ({ founder, active, onPress }) => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const showcase = useShowcaseImages();
  const scale = useSharedValue(1);
  const imageKey = FOUNDER_IMAGE_KEYS[founder.id] as ShowcaseImageKey | undefined;

  return (
    <PressableSpring
      style={[styles.chip, active && styles.chipActive]}
      onPress={() => {
        scale.value = withSpring(0.92, SPRING_SNAPPY, () => {
          scale.value = withSpring(1, SPRING_SNAPPY);
        });
        onPress();
      }}
      scaleTo={0.95}
    >
      <View
        style={[
          styles.chipAvatar,
          { backgroundColor: founder.accent },
          active && styles.chipAvatarActive,
        ]}
      >
        {imageKey ? (
          <Image
            source={showcase[imageKey]}
            style={styles.chipPhoto}
          />
        ) : (
          <Text style={styles.chipInitial}>{founder.initial}</Text>
        )}
      </View>
      <Text style={[styles.chipName, active && styles.chipNameActive]} numberOfLines={1}>
        {founder.name}
      </Text>
    </PressableSpring>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: { marginTop: spacing.lg },
    avatars: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    chip: {
      flex: 1,
      alignItems: 'center',
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: {
      borderColor: c.text,
      backgroundColor: c.surfaceInverse,
    },
    chipAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    chipAvatarActive: {
      borderColor: c.brand,
      borderWidth: 3,
    },
    chipPhoto: { width: '100%', height: '100%' },
    chipInitial: { color: '#FFF', fontWeight: '900', fontSize: 13 },
    chipName: {
      fontSize: 10,
      fontWeight: '700',
      color: c.textMuted,
      marginTop: spacing.xs,
      textAlign: 'center',
    },
    chipNameActive: { color: c.brand },
    selectedBox: {
      marginHorizontal: spacing.lg,
      padding: spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: c.brand,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.sm,
    },
    selectedName: { fontSize: 16, fontWeight: '900', color: c.text },
    selectedRole: { fontSize: 12, color: c.textMuted, marginTop: 2 },
    letterBtn: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      alignItems: 'center',
      backgroundColor: c.surface,
    },
    letterBtnText: { fontWeight: '800', fontSize: 14, color: c.text },
    letterBox: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.md,
      padding: spacing.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.lg,
    },
    letterBody: { fontSize: 14, lineHeight: 23, color: c.textSecondary },
    letterSign: {
      marginTop: spacing.lg,
      fontStyle: 'italic',
      color: c.text,
      fontSize: 14,
    },
    letterNames: {
      marginTop: spacing.sm,
      fontWeight: '800',
      fontSize: 12,
      color: c.brand,
    },
  });
}
