import type { ImageSourcePropType } from 'react-native';
import type { VideoSource } from 'expo-video';
import type { AuthGreetingPayload } from '../services/authGreeting.controller';

export type AuthGreetingKind = AuthGreetingPayload['kind'];

export type AuthGreetingVideoClip = {
  video: VideoSource;
  poster: ImageSourcePropType;
  credit: string;
};

const BUNDLED_CLIPS: Record<AuthGreetingKind, AuthGreetingVideoClip> = {
  welcome: {
    video: require('../../assets/auth-greeting/welcome.mp4'),
    poster: require('../../assets/auth-greeting/welcome-poster.jpg'),
    credit: 'Mixkit',
  },
  goodbye: {
    video: require('../../assets/auth-greeting/goodbye.mp4'),
    poster: require('../../assets/auth-greeting/goodbye-poster.jpg'),
    credit: 'Mixkit',
  },
};

function envClip(kind: AuthGreetingKind): Partial<AuthGreetingVideoClip> | null {
  const videoKey =
    kind === 'welcome'
      ? process.env.EXPO_PUBLIC_AUTH_GREETING_WELCOME_VIDEO_URL
      : process.env.EXPO_PUBLIC_AUTH_GREETING_GOODBYE_VIDEO_URL;
  const posterKey =
    kind === 'welcome'
      ? process.env.EXPO_PUBLIC_AUTH_GREETING_WELCOME_POSTER_URL
      : process.env.EXPO_PUBLIC_AUTH_GREETING_GOODBYE_POSTER_URL;

  const videoUrl = videoKey?.trim();
  if (!videoUrl) return null;

  const fallback = BUNDLED_CLIPS[kind];
  const posterUrl = posterKey?.trim();

  return {
    video: videoUrl,
    poster: posterUrl ? { uri: posterUrl } : fallback.poster,
    credit: 'ProDay',
  };
}

export function resolveAuthGreetingClip(kind: AuthGreetingKind): AuthGreetingVideoClip {
  return { ...BUNDLED_CLIPS[kind], ...envClip(kind) };
}
