import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useVideoPlayer, VideoView } from 'expo-video';
import type { AuthGreetingVideoClip } from '../../content/authGreetingVideos';

type AuthGreetingVideoBackdropProps = {
  clip: AuthGreetingVideoClip;
  active: boolean;
};

export const AuthGreetingVideoBackdrop: React.FC<AuthGreetingVideoBackdropProps> = ({
  clip,
  active,
}) => {
  const [failed, setFailed] = useState(false);
  const posterScale = useSharedValue(1);

  const player = useVideoPlayer(null, (instance) => {
    instance.loop = true;
    instance.muted = true;
  });

  useEffect(() => {
    setFailed(false);
    player.replace(clip.video);
  }, [clip.video, player]);

  useEffect(() => {
    if (!active) {
      player.pause();
      return undefined;
    }

    const playWhenReady = () => {
      if (!failed) player.play();
    };

    const statusSub = player.addListener('statusChange', ({ status }) => {
      if (status === 'readyToPlay') playWhenReady();
      if (status === 'error') setFailed(true);
    });

    const loadSub = player.addListener('sourceLoad', () => {
      playWhenReady();
    });

    playWhenReady();

    return () => {
      statusSub.remove();
      loadSub.remove();
    };
  }, [active, failed, player]);

  useEffect(() => {
    if (!failed) {
      posterScale.value = 1;
      return;
    }
    posterScale.value = withRepeat(
      withTiming(1.04, { duration: 9000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true
    );
  }, [failed, posterScale]);

  const posterAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: posterScale.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.posterWrap, posterAnimStyle]}>
        <Image source={clip.poster} style={styles.poster} resizeMode="cover" />
      </Animated.View>

      {active && !failed ? (
        <VideoView
          player={player}
          style={styles.video}
          contentFit="cover"
          nativeControls={false}
          allowsFullscreen={false}
          allowsPictureInPicture={false}
        />
      ) : null}

      <LinearGradient
        colors={['rgba(0,0,0,0.42)', 'rgba(0,0,0,0.12)', 'rgba(0,0,0,0.78)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(13,92,46,0.35)', 'transparent']}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={styles.turfGlow}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a1a10',
    overflow: 'hidden',
  },
  posterWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  video: {
    ...StyleSheet.absoluteFillObject,
  },
  turfGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '42%',
  },
});
