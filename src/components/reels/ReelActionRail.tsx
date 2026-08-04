import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Icon, type IconName } from '../ui/Icon';
import { PressableSpring } from '../motion/PressableSpring';
import { motion } from '../../theme/motion';
import { reelsTheme } from './reelsTheme';

const AnimatedView = Animated.createAnimatedComponent(View);

type RailActionProps = {
  icon: IconName;
  onPress: () => void;
  accessibilityLabel: string;
  color?: string;
  size?: number;
  filled?: boolean;
  count?: number;
  pop?: boolean;
};

function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  return `${Math.round(n / 1000)}k`;
}

/** Un geste du rail — glyphe nu posé sur la vidéo, ombre douce pour la lisibilité. */
const RailAction: React.FC<RailActionProps> = ({
  icon,
  onPress,
  accessibilityLabel,
  color = reelsTheme.color.text,
  size = 27,
  filled,
  count,
  pop,
}) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (pop) {
      scale.value = withSequence(
        withSpring(1.22, motion.spring.bouncy),
        withSpring(1, motion.spring.snappy),
      );
    }
  }, [pop, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <PressableSpring
      style={styles.action}
      scaleTo={0.86}
      haptic
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <AnimatedView style={[styles.glyph, style]}>
        <Icon name={icon} size={size} color={color} variant={filled ? 'filled' : undefined} />
      </AnimatedView>
      {count && count > 0 ? (
        <Text style={styles.count} numberOfLines={1}>
          {formatCount(count)}
        </Text>
      ) : null}
    </PressableSpring>
  );
};

type ReelActionRailProps = {
  liked: boolean;
  saved: boolean;
  muted: boolean;
  commentCount: number;
  accent: string;
  labels: {
    like: string;
    comment: string;
    share: string;
    save: string;
    soundOn: string;
    soundOff: string;
  };
  onLike: () => void;
  onComment: () => void;
  onShare: () => void;
  onSave: () => void;
  onToggleMute: () => void;
};

/**
 * Rail social — Like · Commenter · Partager · Enregistrer, plus une bascule son.
 * Glyphes nus, espacement large et intentionnel, états actifs en braise/ambre.
 */
export const ReelActionRail: React.FC<ReelActionRailProps> = ({
  liked,
  saved,
  muted,
  commentCount,
  labels,
  onLike,
  onComment,
  onShare,
  onSave,
  onToggleMute,
}) => (
  <View style={styles.rail} pointerEvents="box-none">
    <RailAction
      icon={liked ? 'heart' : 'heart-outline'}
      onPress={onLike}
      color={liked ? reelsTheme.color.ember : reelsTheme.color.text}
      filled={liked}
      size={30}
      pop={liked}
      accessibilityLabel={labels.like}
    />
    <RailAction
      icon="chat"
      onPress={onComment}
      size={27}
      count={commentCount}
      accessibilityLabel={labels.comment}
    />
    <RailAction
      icon="share"
      onPress={onShare}
      size={26}
      accessibilityLabel={labels.share}
    />
    <RailAction
      icon={saved ? 'bookmark' : 'bookmark-outline'}
      onPress={onSave}
      color={saved ? reelsTheme.color.amber : reelsTheme.color.text}
      size={26}
      pop={saved}
      accessibilityLabel={labels.save}
    />

    <View style={styles.divider} />

    <PressableSpring
      style={styles.mute}
      scaleTo={0.86}
      haptic
      onPress={onToggleMute}
      accessibilityRole="button"
      accessibilityLabel={muted ? labels.soundOff : labels.soundOn}
    >
      <Icon
        name={muted ? 'volume-mute' : 'volume-high'}
        size={17}
        color={reelsTheme.color.textDim}
      />
    </PressableSpring>
  </View>
);

const styles = StyleSheet.create({
  rail: {
    alignItems: 'center',
    gap: reelsTheme.space.lg,
  },
  action: {
    alignItems: 'center',
    gap: 7,
  },
  glyph: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
  },
  count: {
    color: reelsTheme.color.text,
    fontFamily: reelsTheme.type.count.fontFamily,
    fontSize: reelsTheme.type.count.fontSize,
    letterSpacing: reelsTheme.type.count.letterSpacing,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  divider: {
    width: 22,
    height: StyleSheet.hairlineWidth,
    backgroundColor: reelsTheme.color.hairlineStrong,
    marginVertical: reelsTheme.space.xxs,
  },
  mute: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
