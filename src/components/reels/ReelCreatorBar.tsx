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
  compact?: boolean;
};

/** Bloc créateur premium: identité claire + légende, sans surcharge. */
export const ReelCreatorBar: React.FC<ReelCreatorBarProps> = ({
  name,
  handle,
  sourceLabel,
  caption,
  following,
  labels,
  onOpenProfile,
  onToggleFollow,
  compact = false,
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
                <Text
                  style={[styles.name, compact && styles.nameCompact]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.82}
                >
                  {name}
                </Text>
                <View style={styles.tick} />
              </View>
              <Text
                style={[styles.meta, compact && styles.metaCompact]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                @{handle} · {sourceLabel}
              </Text>
            </View>
          </Pressable>

          <PressableSpring
            scaleTo={0.97}
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
                  compact && styles.followTextCompact,
                  { color: following ? reelsTheme.color.text : reelsTheme.color.amber },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {(following ? labels.following : labels.follow).toUpperCase()}
              </Text>
            </AnimatedView>
          </PressableSpring>
        </View>

        {caption ? (
          <Text style={[styles.caption, compact && styles.captionCompact]} numberOfLines={2}>
            {caption}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: reelsTheme.radius.lg,
    borderWidth: 1,
    borderColor: reelsTheme.color.hairline,
    backgroundColor: reelsTheme.color.backdrop,
    padding: reelsTheme.space.md,
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
  nameCompact: {
    fontSize: 17,
    letterSpacing: -0.25,
  },
  tick: {
    width: 7,
    height: 7,
    borderRadius: 2,
    backgroundColor: reelsTheme.color.amber,
    transform: [{ rotate: '45deg' }],
  },
  meta: {
    color: reelsTheme.color.textDim,
    fontFamily: reelsTheme.type.kicker.fontFamily,
    fontSize: reelsTheme.type.kicker.fontSize,
    letterSpacing: reelsTheme.type.kicker.letterSpacing,
    textTransform: 'uppercase',
  },
  metaCompact: {
    fontSize: 10,
    letterSpacing: 1.2,
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
    borderColor: reelsTheme.color.hairlineStrong,
    backgroundColor: reelsTheme.color.surfaceRaised,
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
  followTextCompact: {
    fontSize: 10,
    letterSpacing: 1.15,
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
  captionCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
});
