import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { FOUNDERS, FOUNDERS_LETTER } from '../../content/founders';
import { FOUNDER_IMAGE_KEYS } from '../../content/showcaseExperience';
import { SHOWCASE_IMAGES } from '../../content/showcaseAssets';
import { PressableSpring } from './PressableSpring';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { discover } from '../../theme/discoverTheme';
import { colors, spacing } from '../../theme/designTokens';
import { SPRING_SNAPPY } from './animationConfig';

export const FoundersInteractive: React.FC = () => {
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
  const scale = useSharedValue(1);

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
        {FOUNDER_IMAGE_KEYS[founder.id] ? (
          <Image
            source={SHOWCASE_IMAGES[FOUNDER_IMAGE_KEYS[founder.id]]}
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

const styles = StyleSheet.create({
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
    borderRadius: discover.radius.md,
    borderWidth: 1,
    borderColor: discover.borderSoft,
    backgroundColor: discover.bgElevated,
  },
  chipActive: {
    borderColor: discover.border,
    backgroundColor: discover.bgInverse,
  },
  chipAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: discover.border,
    overflow: 'hidden',
  },
  chipAvatarActive: {
    borderColor: colors.accent,
    borderWidth: 3,
  },
  chipPhoto: { width: '100%', height: '100%' },
  chipInitial: { color: '#FFF', fontWeight: '900', fontSize: 13 },
  chipName: {
    fontSize: 10,
    fontWeight: '700',
    color: discover.inkMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  chipNameActive: { color: discover.accentText },
  selectedBox: {
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    backgroundColor: discover.bgMuted,
    borderRadius: discover.radius.sm,
  },
  selectedName: { fontSize: 16, fontWeight: '900', color: discover.ink },
  selectedRole: { fontSize: 12, color: discover.inkMuted, marginTop: 2 },
  letterBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: discover.border,
    borderRadius: discover.radius.md,
    alignItems: 'center',
    backgroundColor: discover.bgElevated,
  },
  letterBtnText: { fontWeight: '800', fontSize: 14, color: discover.ink },
  letterBox: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: discover.bgElevated,
    borderWidth: 1,
    borderColor: discover.border,
    borderRadius: discover.radius.lg,
  },
  letterBody: { fontSize: 14, lineHeight: 23, color: discover.inkSecondary },
  letterSign: {
    marginTop: spacing.lg,
    fontStyle: 'italic',
    color: discover.ink,
    fontSize: 14,
  },
  letterNames: {
    marginTop: spacing.sm,
    fontWeight: '800',
    fontSize: 12,
    color: colors.accent,
  },
});
