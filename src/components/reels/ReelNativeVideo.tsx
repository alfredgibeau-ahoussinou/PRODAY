import React, { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';

type ReelNativeVideoProps = {
  playbackSource: { uri: string; headers?: Record<string, string> };
  isActive: boolean;
  paused: boolean;
  isMuted: boolean;
  onError: () => void;
};

export const ReelNativeVideo: React.FC<ReelNativeVideoProps> = ({
  playbackSource,
  isActive,
  paused,
  isMuted,
  onError,
}) => {
  const source = useMemo((): VideoSource => {
    if (playbackSource.headers) {
      return { uri: playbackSource.uri, headers: playbackSource.headers };
    }
    return playbackSource.uri;
  }, [playbackSource.headers, playbackSource.uri]);

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = true;
    instance.muted = isMuted;
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (isActive && !paused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, paused, player]);

  useEffect(() => {
    const subscription = player.addListener('statusChange', ({ status }) => {
      if (status === 'error') onError();
    });
    return () => subscription.remove();
  }, [onError, player]);

  return (
    <VideoView
      player={player}
      style={styles.media}
      contentFit="cover"
      nativeControls={false}
      fullscreenOptions={{ enable: false }}
      allowsPictureInPicture={false}
    />
  );
};

const styles = StyleSheet.create({
  media: {
    ...StyleSheet.absoluteFillObject,
  },
});
