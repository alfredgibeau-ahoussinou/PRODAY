import React, { useEffect } from 'react';
import { View } from 'react-native';

type ReelNativeVideoProps = {
  playbackSource: { uri: string; headers?: Record<string, string> };
  isActive: boolean;
  paused: boolean;
  isMuted: boolean;
  onError: () => void;
};

/**
 * Stub Android : expo-video est exclu du build natif (cold start).
 * Force le fallback embed WebView côté ReelSlide.
 */
export const ReelNativeVideo: React.FC<ReelNativeVideoProps> = ({ onError }) => {
  useEffect(() => {
    onError();
  }, [onError]);

  return <View />;
};
