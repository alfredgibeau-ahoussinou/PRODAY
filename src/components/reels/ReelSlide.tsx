import React, { useEffect, useRef, useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { ReelNativeVideo } from './ReelNativeVideo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion/PressableSpring';
import { ReelLikeBurst } from './ReelLikeBurst';
import { ReelActionRail } from './ReelActionRail';
import { ReelCreatorBar } from './ReelCreatorBar';
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
import { reelAuthorKey, toggleReelFollow } from '../../utils/reelFollows';
import { reportReel } from '../../utils/reelReports';
import { trackV3Event } from '../../core/analytics/v3Events';
import { useTranslation } from '../../context/LocaleContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { motion } from '../../theme/motion';
import { spacing } from '../../theme/designTokens';

type ReelSlideProps = {
  reel: PlaybackReel;
  isActive: boolean;
  height: number;
  width: number;
  bookmarked?: boolean;
  liked?: boolean;
  following?: boolean;
  commentCount?: number;
  reporterUid?: string;
  onBookmarkToggle?: (bookmarkKey: string) => Promise<boolean>;
  onLikeToggle?: (bookmarkKey: string, liked: boolean) => void;
  onFollowToggle?: (authorKey: string, following: boolean) => void;
  onOpenComments?: (reel: PlaybackReel) => void;
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
  following: followingProp,
  commentCount = 0,
  reporterUid,
  onBookmarkToggle,
  onLikeToggle,
  onFollowToggle,
  onOpenComments,
  onReported,
  onRetry,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const lastTapRef = useRef(0);
  const [userMuted, setUserMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
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
  const bottomPad = Math.max(insets.bottom, spacing.md) + spacing.xl;

  // Motion : révélation douce des éléments quand la vidéo devient active.
  const reveal = useSharedValue(isActive ? 1 : 0);
  const pausePop = useSharedValue(0);

  useEffect(() => {
    reveal.value = withTiming(isActive ? 1 : 0, { duration: 360, easing: motion.easing.out });
  }, [isActive, reveal]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: 0.25 + reveal.value * 0.75,
    transform: [{ translateY: (1 - reveal.value) * 14 }],
  }));
  const railStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + reveal.value * 0.65,
    transform: [{ translateX: (1 - reveal.value) * 22 }],
  }));
  const pauseStyle = useAnimatedStyle(() => ({
    opacity: pausePop.value,
    transform: [{ scale: 0.85 + pausePop.value * 0.15 }],
  }));

  useEffect(() => {
    pausePop.value = withTiming(paused && isActive && canPlay ? 1 : 0, {
      duration: 160,
      easing: motion.easing.out,
    });
  }, [paused, isActive, canPlay, pausePop]);

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

  useEffect(() => {
    if (followingProp !== undefined) setFollowing(followingProp);
  }, [followingProp, reel.id]);

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

  const onToggleFollow = () => {
    const next = !following;
    setFollowing(next);
    if (next) prodayHaptics.confirm();
    const authorKey = reelAuthorKey(reel);
    if (onFollowToggle) {
      onFollowToggle(authorKey, next);
    } else {
      void toggleReelFollow(authorKey);
    }
    trackV3Event(next ? 'reel_follow' : 'reel_unfollow', {
      author: reel.authorHandle || reel.authorName,
    });
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

  const onShare = () => {
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
    else onShare();
  };

  const doReport = () => {
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
  };

  // Appui long — options discrètes (ouvrir la source / signaler), sans encombrer l'écran.
  const onLongPress = () => {
    prodayHaptics.tabSwitch();
    Alert.alert(reel.authorName, undefined, [
      { text: t('reels.openSource'), onPress: onOpenExternal },
      {
        text: t('reels.report.action'),
        style: 'destructive',
        onPress: () =>
          Alert.alert('', t('reels.report.hide'), [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('reels.report.action'), style: 'destructive', onPress: doReport },
          ]),
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const embedHtml = embedUrl
    ? `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/>
<style>*{margin:0;padding:0}html,body,#w{height:100%;background:#000;overflow:hidden}
iframe{border:0;width:100%;height:100%}</style></head>
<body><div id="w"><iframe src="${embedUrl}" allow="autoplay;encrypted-media;fullscreen" allowfullscreen></iframe></div></body></html>`
    : null;

  return (
    <Pressable
      style={[styles.slide, { width, height }]}
      onPress={onSurfacePress}
      onLongPress={onLongPress}
      delayLongPress={320}
    >
      {!canPlay && reel.posterUrl ? (
        <Image source={{ uri: reel.posterUrl }} style={styles.media} resizeMode="cover" />
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
          <ActivityIndicator color="rgba(255,255,255,0.85)" size="large" />
        </View>
      ) : null}

      {showError ? (
        <View style={styles.errorPanel} pointerEvents="auto">
          <Text style={styles.errorText}>{t('reels.error.unavailable')}</Text>
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
                <Text style={styles.errorBtnText}>{t('reels.error.retry')}</Text>
              </PressableSpring>
            ) : null}
            <PressableSpring style={styles.errorBtn} scaleTo={0.96} haptic onPress={onOpenExternal}>
              <Text style={styles.errorBtnText}>{t('reels.openSource')}</Text>
            </PressableSpring>
          </View>
        </View>
      ) : null}

      <Animated.View style={[styles.pauseBadge, pauseStyle]} pointerEvents="none">
        <View style={styles.pauseGlyph}>
          <Icon name="play" size={30} color="rgba(255,255,255,0.95)" variant="filled" />
        </View>
      </Animated.View>

      <ReelLikeBurst visible={showBurst} onDone={() => setShowBurst(false)} />

      {/* Voile bas — atmosphère issue de la vidéo, sans carte ni barre */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.28)', 'rgba(0,0,0,0.88)']}
        locations={[0, 0.45, 1]}
        style={[styles.scrim, { height: height * 0.48 }]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.rail, { bottom: bottomPad + 4 }, railStyle]} pointerEvents="box-none">
        <ReelActionRail
          liked={liked}
          saved={saved}
          muted={userMuted}
          commentCount={commentCount}
          accent={colors.accent}
          labels={{
            like: t('reels.like'),
            comment: t('reels.comments.title'),
            share: t('reels.share'),
            save: t('reels.save'),
            soundOn: t('reels.sound.on'),
            soundOff: t('reels.sound.off'),
          }}
          onLike={() => void applyLike(!liked)}
          onComment={() => onOpenComments?.(reel)}
          onShare={onShare}
          onSave={() => void onToggleSave()}
          onToggleMute={() => setUserMuted((m) => !m)}
        />
      </Animated.View>

      <Animated.View
        style={[styles.creator, { paddingBottom: bottomPad }, overlayStyle]}
        pointerEvents="box-none"
      >
        <ReelCreatorBar
          name={reel.authorName}
          handle={reel.authorHandle}
          sourceLabel={REEL_SOURCE_LABEL[reel.source]}
          caption={caption}
          following={following}
          accent={colors.accent}
          labels={{ follow: t('reels.follow'), following: t('reels.following') }}
          onOpenProfile={onOpenProfile}
          onToggleFollow={onToggleFollow}
        />
      </Animated.View>
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
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    alignSelf: 'center',
    justifyContent: 'center',
    left: spacing.xl,
    right: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    color: '#fff',
    fontSize: 15,
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
    borderColor: 'rgba(255,255,255,0.55)',
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    paddingVertical: 9,
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
  },
  pauseGlyph: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
    backgroundColor: 'rgba(0,0,0,0.34)',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  rail: {
    position: 'absolute',
    right: spacing.lg,
  },
  creator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingRight: 80,
  },
});
