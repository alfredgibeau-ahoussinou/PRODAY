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
import { reelsTheme } from './reelsTheme';

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

/**
 * Bloc créateur — un tiers-inférieur éditorial : filet ambre vertical, vignette
 * carrée, identité en une et légende traitée comme un sous-titre de diffusion.
 */
export const ReelCreatorBar: React.FC<ReelCreatorBarProps> = ({
  name,
  handle,
  sourceLabel,
  caption,
  following,
  labels,
  onOpenProfile,
  onToggleFollow,
}) => {
  const initial = (name?.trim().charAt(0) || 'P').toUpperCase();
  const followScale = useSharedValue(1);

  useEffect(() => {
    followScale.value = withSequence(
      withSpring(following ? 1.05 : 0.95, motion.spring.bouncy),
      withSpring(1, motion.spring.snappy),
    );
  }, [following, followScale]);

  const followStyle = useAnimatedStyle(() => ({ transform: [{ scale: followScale.value }] }));

  return (
    <View style={styles.wrap}>
      <View style={styles.rule} />

      <View style={styles.body}>
        <View style={styles.identityRow}>
          <Pressable style={styles.authorRow} onPress={onOpenProfile}>
            <LinearGradient
              colors={['#221D16', '#0C0A08']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.avatar}
            >
              <Text style={styles.avatarLetter}>{initial}</Text>
            </LinearGradient>

            <View style={styles.identityText}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {name}
                </Text>
                <View style={styles.tick} />
              </View>
              <Text style={styles.meta} numberOfLines={1}>
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
              style={[styles.follow, following ? styles.followOn : styles.followOff, followStyle]}
            >
              {following ? (
                <Icon name="checkmark-circle" size={14} color={reelsTheme.color.text} />
              ) : null}
              <Text
                style={[
                  styles.followText,
                  { color: following ? reelsTheme.color.text : reelsTheme.color.amber },
                ]}
              >
                {(following ? labels.following : labels.follow).toUpperCase()}
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
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: reelsTheme.space.sm,
  },
  rule: {
    width: 2.5,
    borderRadius: 2,
    backgroundColor: reelsTheme.color.amber,
    marginTop: 4,
    marginBottom: 4,
  },
  body: {
    flex: 1,
    gap: reelsTheme.space.sm,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: reelsTheme.space.sm,
  },
  authorRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: reelsTheme.space.sm,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: reelsTheme.radius.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: reelsTheme.color.hairlineStrong,
  },
  avatarLetter: {
    color: reelsTheme.color.text,
    fontFamily: reelsTheme.type.name.fontFamily,
    fontSize: 18,
  },
  identityText: {
    flexShrink: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: reelsTheme.space.xs,
  },
  name: {
    color: reelsTheme.color.text,
    fontFamily: reelsTheme.type.name.fontFamily,
    fontSize: reelsTheme.type.name.fontSize,
    letterSpacing: reelsTheme.type.name.letterSpacing,
    flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  tick: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: reelsTheme.color.amber,
    transform: [{ rotate: '45deg' }],
  },
  meta: {
    color: reelsTheme.color.amberBright,
    fontFamily: reelsTheme.type.kicker.fontFamily,
    fontSize: reelsTheme.type.kicker.fontSize,
    letterSpacing: reelsTheme.type.kicker.letterSpacing,
    textTransform: 'uppercase',
  },
  follow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: reelsTheme.space.md,
    height: 34,
    borderRadius: reelsTheme.radius.sm,
    borderWidth: 1,
  },
  followOff: {
    borderColor: reelsTheme.color.amberLine,
    backgroundColor: 'transparent',
  },
  followOn: {
    borderColor: reelsTheme.color.hairlineStrong,
    backgroundColor: 'rgba(245,240,230,0.10)',
  },
  followText: {
    fontFamily: reelsTheme.type.kicker.fontFamily,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  caption: {
    color: reelsTheme.color.text,
    fontFamily: reelsTheme.type.caption.fontFamily,
    fontSize: reelsTheme.type.caption.fontSize,
    lineHeight: reelsTheme.type.caption.lineHeight,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
});
