import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion/PressableSpring';
import { motion } from '../../theme/motion';
import { fontFamily } from '../../theme/typography';
import { spacing, radius } from '../../theme/designTokens';

const AnimatedView = Animated.createAnimatedComponent(View);

type ReelCreatorBarProps = {
  name: string;
  handle: string;
  sourceLabel: string;
  caption: string;
  following: boolean;
  accent: string;
  labels: { follow: string; following: string };
  onOpenProfile: () => void;
  onToggleFollow: () => void;
};

/** Bloc créateur — avatar, identité et suivi réunis calmement en bas de la scène. */
export const ReelCreatorBar: React.FC<ReelCreatorBarProps> = ({
  name,
  handle,
  sourceLabel,
  caption,
  following,
  accent,
  labels,
  onOpenProfile,
  onToggleFollow,
}) => {
  const initial = (name?.trim().charAt(0) || 'P').toUpperCase();
  const followScale = useSharedValue(1);

  useEffect(() => {
    followScale.value = withSequence(
      withSpring(following ? 1.06 : 0.94, motion.spring.bouncy),
      withSpring(1, motion.spring.snappy),
    );
  }, [following, followScale]);

  const followStyle = useAnimatedStyle(() => ({ transform: [{ scale: followScale.value }] }));

  return (
    <View style={styles.wrap}>
      <View style={styles.identityRow}>
        <Pressable style={styles.authorRow} onPress={onOpenProfile}>
          <View style={[styles.avatarRing, { borderColor: 'rgba(255,255,255,0.9)' }]}>
            <LinearGradient
              colors={['#1B2027', '#0A0C10']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarLetter}>{initial}</Text>
            </LinearGradient>
          </View>

          <View style={styles.identityText}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {name}
              </Text>
              <View style={[styles.tick, { backgroundColor: accent }]} />
            </View>
            <Text style={styles.handle} numberOfLines={1}>
              @{handle} · {sourceLabel}
            </Text>
          </View>
        </Pressable>

        <PressableSpring
          scaleTo={0.94}
          haptic
          onPress={onToggleFollow}
          accessibilityRole="button"
          accessibilityLabel={following ? labels.following : labels.follow}
        >
          <AnimatedView
            style={[
              styles.follow,
              following
                ? styles.followOn
                : { borderColor: accent, backgroundColor: 'rgba(255,255,255,0.06)' },
              followStyle,
            ]}
          >
            {following ? (
              <Icon name="checkmark-circle" size={15} color="rgba(255,255,255,0.92)" />
            ) : null}
            <Text
              style={[
                styles.followText,
                { color: following ? 'rgba(255,255,255,0.92)' : accent },
              ]}
            >
              {following ? labels.following : labels.follow}
            </Text>
          </AnimatedView>
        </PressableSpring>
      </View>

      {caption ? (
        <Text style={styles.caption} numberOfLines={2}>
          {caption}
        </Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 2,
  },
  avatar: {
    flex: 1,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontFamily: fontFamily.displayBold,
    fontSize: 18,
  },
  identityText: {
    flexShrink: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    color: '#FFFFFF',
    fontFamily: fontFamily.displayBold,
    fontSize: 18,
    letterSpacing: -0.4,
    flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tick: {
    width: 16,
    height: 2.5,
    borderRadius: 2,
  },
  handle: {
    color: 'rgba(255,255,255,0.62)',
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    letterSpacing: 0.1,
  },
  follow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  followOn: {
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  followText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    letterSpacing: 0.2,
  },
  caption: {
    color: 'rgba(255,255,255,0.94)',
    fontFamily: fontFamily.regular,
    fontSize: 15,
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
