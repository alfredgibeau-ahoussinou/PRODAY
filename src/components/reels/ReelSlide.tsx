import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ReelNativeVideo } from './ReelNativeVideo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion/PressableSpring';
import { ReelLikeBurst } from './ReelLikeBurst';
import {
  embedUrlForReel,
  playbackSourceForReel,
  REEL_SOURCE_LABEL,
  type PlaybackReel,
} from '../../content/footballReels';
import { authorProfileUrl } from '../../utils/reelAuthorUrls';
import { shouldUseEmbedPlayback } from '../../services/reelResolver.service';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { toggleReelBookmark } from '../../utils/reelBookmarks';
import { toggleReelLike } from '../../utils/reelLikes';
import { reportReel } from '../../utils/reelReports';
import { trackV3Event } from '../../core/analytics/v3Events';
import { spacing } from '../../theme/designTokens';

type ReelSlideProps = {
  reel: PlaybackReel;
  isActive: boolean;
  height: number;
  width: number;
  bookmarked?: boolean;
  liked?: boolean;
  reporterUid?: string;
  onBookmarkToggle?: (bookmarkKey: string) => Promise<boolean>;
  onLikeToggle?: (bookmarkKey: string, liked: boolean) => void;
  onReported?: (bookmarkKey: string) => void;
  onRetry?: () => void;
};

const DOUBLE_TAP_MS = 280;
const EMBED_FALLBACK_MS = 5000;

const NativeWebView =
  Platform.OS !== 'web' ? require('react-native-webview').WebView : null;

type ReelEmbedProps = {
  embedUrl: string;
  html: string;
  reelId: string;
};

const ReelEmbed: React.FC<ReelEmbedProps> = ({ embedUrl, html, reelId }) => {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.media} accessibilityLabel="Lecture reel">
        {/* iframe natif. WebView indisponible sur react-native-web */}
        <iframe
          title={`reel-${reelId}`}
          src={embedUrl}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#000',
          }}
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </View>
    );
  }

  if (!NativeWebView) return null;

  return (
    <NativeWebView
      key={`${reelId}-embed`}
      source={{ html }}
      style={styles.media}
      scrollEnabled={false}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['*']}
    />
  );
};

export const ReelSlide: React.FC<ReelSlideProps> = ({
  reel,
  isActive,
  height,
  width,
  bookmarked,
  liked: likedProp,
  reporterUid,
  onBookmarkToggle,
  onLikeToggle,
  onReported,
  onRetry,
}) => {
  const insets = useSafeAreaInsets();
  const lastTapRef = useRef(0);
  const [userMuted, setUserMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showBurst, setShowBurst] = useState(false);
  const [useEmbed, setUseEmbed] = useState(shouldUseEmbedPlayback());
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const isMuted = !isActive || userMuted;

  const embedUrl = embedUrlForReel(reel);
  const playbackSource = playbackSourceForReel(reel);
  const hasMp4 = Boolean(playbackSource) && !reel.loading && !reel.failed;
  const canPlay = useEmbed ? Boolean(embedUrl) && !embedFailed : hasMp4;
  const showLoader = isActive && !canPlay && !reel.failed && !embedFailed;
  const showError = isActive && (reel.failed || embedFailed);
  const caption = reel.caption.trim();
  const bottomPad = Math.max(insets.bottom, spacing.md) + spacing.lg;

  useEffect(() => {
    setPaused(false);
    setUseEmbed(shouldUseEmbedPlayback());
    setLoadTimedOut(false);
  }, [reel.id]);

  useEffect(() => {
    if (reel.failed && embedUrl && isActive) {
      setUseEmbed(true);
    }
  }, [reel.failed, embedUrl, isActive, reel.id]);

  useEffect(() => {
    if (!isActive || useEmbed || !reel.loading || reel.failed) return;
    const timer = setTimeout(() => setLoadTimedOut(true), EMBED_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [isActive, useEmbed, reel.loading, reel.failed, reel.id]);

  useEffect(() => {
    if (loadTimedOut && embedUrl && isActive) {
      setUseEmbed(true);
    }
  }, [loadTimedOut, embedUrl, isActive]);

  useEffect(() => {
    if (!isActive || !useEmbed || embedFailed || !embedUrl) return;
    const timer = setTimeout(() => setEmbedFailed(true), EMBED_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [isActive, useEmbed, embedFailed, embedUrl, reel.id]);

  useEffect(() => {
    if (bookmarked !== undefined) setSaved(bookmarked);
  }, [bookmarked, reel.id]);

  useEffect(() => {
    if (likedProp !== undefined) setLiked(likedProp);
  }, [likedProp, reel.id]);

  const profileUrl = authorProfileUrl(reel);

  const applyLike = async (nextLiked: boolean) => {
    if (onLikeToggle) {
      await onLikeToggle(reel.bookmarkKey, nextLiked);
      setLiked(nextLiked);
    } else {
      const persisted = await toggleReelLike(reel.bookmarkKey);
      setLiked(persisted);
    }
    if (nextLiked) {
      setShowBurst(true);
      prodayHaptics.like();
    }
  };

  const triggerLike = () => {
    if (liked) return;
    void applyLike(true);
  };

  const onSurfacePress = () => {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      triggerLike();
      lastTapRef.current = 0;
      return;
    }
    lastTapRef.current = now;
    setTimeout(() => {
      if (lastTapRef.current === now && canPlay) {
        setPaused((p) => !p);
        lastTapRef.current = 0;
      }
    }, DOUBLE_TAP_MS);
  };

  const onOpenSource = () => {
    void Share.share({
      message: `${reel.caption || 'Reel ProDay'}\n${reel.sourceUrl}`,
      url: reel.sourceUrl,
    }).then(() => {
      trackV3Event('reel_share', { bookmarkKey: reel.bookmarkKey, source: reel.source });
    });
  };

  const onOpenExternal = () => {
    void Linking.openURL(reel.sourceUrl);
  };

  const onToggleSave = async () => {
    const next = onBookmarkToggle
      ? await onBookmarkToggle(reel.bookmarkKey)
      : await toggleReelBookmark(reel.id);
    setSaved(next);
    prodayHaptics.confirm();
  };

  const onOpenProfile = () => {
    if (profileUrl) void Linking.openURL(profileUrl);
    else onOpenSource();
  };

  const onReport = () => {
    Alert.alert(
      'Signaler ce reel',
      'Ce contenu sera masqué de votre fil. Notre équipe pourra l\'examiner.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Signaler',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              await reportReel({
                bookmarkKey: reel.bookmarkKey,
                reporterUid,
                reason: 'Contenu inapproprié',
                sourceUrl: reel.sourceUrl,
              });
              trackV3Event('reel_report', { bookmarkKey: reel.bookmarkKey });
              onReported?.(reel.bookmarkKey);
            })();
          },
        },
      ],
    );
  };

  const embedHtml = embedUrl
    ? `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<style>*{margin:0;padding:0}html,body,#w{height:100%;background:#000;overflow:hidden}
iframe{border:0;width:100%;height:100%}</style></head>
<body><div id="w"><iframe src="${embedUrl}" allow="autoplay;encrypted-media;fullscreen" allowfullscreen></iframe></div></body></html>`
    : null;

  return (
    <Pressable style={[styles.slide, { width, height }]} onPress={onSurfacePress}>
      {!canPlay && reel.posterUrl ? (
        <Image
          source={{ uri: reel.posterUrl }}
          style={styles.media}
          resizeMode="cover"
        />
      ) : null}

      {isActive && useEmbed && embedUrl && embedHtml ? (
        <ReelEmbed embedUrl={embedUrl} html={embedHtml} reelId={reel.id} />
      ) : null}

      {isActive && !useEmbed && hasMp4 && playbackSource ? (
        <ReelNativeVideo
          key={playbackSource.uri}
          playbackSource={playbackSource}
          isActive={isActive}
          paused={paused}
          isMuted={isMuted}
          onError={() => setUseEmbed(true)}
        />
      ) : null}

      {showLoader ? (
        <View style={styles.loader} pointerEvents="none">
          <ActivityIndicator color="#fff" size="large" />
        </View>
      ) : null}

      {showError ? (
        <View style={styles.errorPanel} pointerEvents="auto">
          <Text style={styles.errorText}>Vidéo indisponible</Text>
          <View style={styles.errorActions}>
            {onRetry ? (
              <PressableSpring
                style={styles.errorBtn}
                scaleTo={0.96}
                haptic
                onPress={() => {
                  setEmbedFailed(false);
                  setUseEmbed(shouldUseEmbedPlayback());
                  onRetry();
                }}
              >
                <Text style={styles.errorBtnText}>Réessayer</Text>
              </PressableSpring>
            ) : null}
            <PressableSpring style={styles.errorBtn} scaleTo={0.96} haptic onPress={onOpenExternal}>
              <Text style={styles.errorBtnText}>Ouvrir la source</Text>
            </PressableSpring>
          </View>
        </View>
      ) : null}

      {paused && isActive && canPlay ? (
        <View style={styles.pauseBadge} pointerEvents="none">
          <Icon name="videocam" size={48} color="rgba(255,255,255,0.9)" />
        </View>
      ) : null}

      <ReelLikeBurst visible={showBurst} onDone={() => setShowBurst(false)} />

      <View style={[styles.overlay, { paddingBottom: bottomPad }]} pointerEvents="box-none">
        <View style={styles.sidebar}>
          <PressableSpring
            style={styles.sideBtn}
            scaleTo={0.9}
            haptic
            onPress={() => void applyLike(!liked)}
          >
            <Icon name={liked ? 'heart' : 'heart-outline'} size={26} color="#fff" />
          </PressableSpring>
          <PressableSpring style={styles.sideBtn} scaleTo={0.9} haptic onPress={() => void onToggleSave()}>
            <Icon name="bookmark" size={22} color="#fff" variant={saved ? 'filled' : undefined} />
          </PressableSpring>
          <PressableSpring style={styles.sideBtn} scaleTo={0.9} haptic onPress={onOpenSource}>
            <Icon name="share" size={22} color="#fff" />
          </PressableSpring>
          <PressableSpring style={styles.sideBtn} scaleTo={0.9} onPress={onReport}>
            <Icon name="alert-circle" size={22} color="#fff" />
          </PressableSpring>
          <PressableSpring style={styles.sideBtn} scaleTo={0.9} haptic onPress={() => setUserMuted((m) => !m)}>
            <Icon name={userMuted ? 'volume-mute' : 'volume-high'} size={24} color="#fff" />
          </PressableSpring>
        </View>

        <View style={styles.meta}>
          <View style={styles.authorRow}>
            <Pressable onPress={onOpenProfile} style={styles.authorTap}>
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarLetter}>
                    {reel.authorName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.handle}>
                @{reel.authorHandle}
                <Text style={styles.sourceBadge}> · {REEL_SOURCE_LABEL[reel.source]}</Text>
              </Text>
            </Pressable>
            <PressableSpring style={styles.followBtn} scaleTo={0.97} haptic onPress={onOpenProfile}>
              <Text style={styles.followText}>Profil</Text>
            </PressableSpring>
          </View>

          {caption ? (
            <Text style={styles.caption} numberOfLines={3}>
              {caption}
            </Text>
          ) : null}

          {reel.tags.length > 0 ? (
            <Text style={styles.tags} numberOfLines={1}>
              {reel.tags.join(' ')}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  slide: {
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  media: {
    ...StyleSheet.absoluteFillObject,
  },
  loader: {
    position: 'absolute',
    bottom: '42%',
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  errorPanel: {
    position: 'absolute',
    bottom: '38%',
    alignSelf: 'center',
    left: spacing.lg,
    right: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  errorText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  errorBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  errorBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  pauseBadge: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
  },
  sidebar: {
    position: 'absolute',
    right: spacing.sm,
    bottom: spacing.lg + 20,
    alignItems: 'center',
    gap: spacing.md,
  },
  sideBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  meta: {
    paddingRight: 64,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  authorTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarRing: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
  handle: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
    flex: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sourceBadge: {
    fontWeight: '600',
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },
  followBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.65)',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  followText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '400',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  tags: {
    marginTop: spacing.xs,
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    fontWeight: '600',
  },
});
