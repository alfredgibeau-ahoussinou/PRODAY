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
import { Icon, type IconName } from '../ui/Icon';
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
import { reelAuthorKey, toggleReelFollow } from '../../utils/reelFollows';
import { reportReel } from '../../utils/reelReports';
import { trackV3Event } from '../../core/analytics/v3Events';
import { useTranslation } from '../../context/LocaleContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { motion } from '../../theme/motion';
import { fontFamily } from '../../theme/typography';
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

const AnimatedView = Animated.createAnimatedComponent(View);

/** Un bouton flottant du rail — glyphe minimal sur voile doux, cible large et espacée. */
const Fab: React.FC<{
  icon: IconName;
  onPress: () => void;
  color?: string;
  size?: number;
  filled?: boolean;
  label?: string;
  accessibilityLabel: string;
  animatedStyle?: ReturnType<typeof useAnimatedStyle>;
}> = ({ icon, onPress, color = '#FFFFFF', size = 28, filled, label, accessibilityLabel, animatedStyle }) => (
  <PressableSpring
    style={styles.fab}
    scaleTo={0.84}
    haptic
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <View style={styles.fabScrim}>
      <AnimatedView style={animatedStyle}>
        <Icon name={icon} size={size} color={color} variant={filled ? 'filled' : undefined} />
      </AnimatedView>
    </View>
    {label ? (
      <Text style={styles.fabLabel} numberOfLines={1}>
        {label}
      </Text>
    ) : null}
  </PressableSpring>
);

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

  // Motion : révélation douce de la légende quand la vidéo devient active.
  const reveal = useSharedValue(isActive ? 1 : 0);
  const likeScale = useSharedValue(1);
  const followScale = useSharedValue(1);

  useEffect(() => {
    reveal.value = withTiming(isActive ? 1 : 0, { duration: 360, easing: motion.easing.out });
  }, [isActive, reveal]);

  const metaStyle = useAnimatedStyle(() => ({
    opacity: 0.2 + reveal.value * 0.8,
    transform: [{ translateY: (1 - reveal.value) * 16 }],
  }));
  const railStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + reveal.value * 0.6,
    transform: [{ translateX: (1 - reveal.value) * 20 }],
  }));
  const likeStyle = useAnimatedStyle(() => ({ transform: [{ scale: likeScale.value }] }));
  const followStyle = useAnimatedStyle(() => ({
    transform: [{ scale: followScale.value }],
  }));

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
    likeScale.value = withSpring(nextLiked ? 1.28 : 1, motion.spring.bouncy);
    setTimeout(() => {
      likeScale.value = withSpring(1, motion.spring.snappy);
    }, 130);
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

  // Motion : confirmation du suivi — pop du bouton + apparition du check.
  const onToggleFollow = () => {
    const next = !following;
    setFollowing(next);
    followScale.value = withSequence(
      withSpring(next ? 1.3 : 0.88, motion.spring.bouncy),
      withSpring(1, motion.spring.snappy),
    );
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

  // Appui long — options discrètes (signaler / ouvrir la source), sans encombrer le rail.
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

  const initial = reel.authorName.charAt(0).toUpperCase();
  const commentLabel = commentCount > 0 ? String(commentCount) : undefined;

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
          <View style={styles.pauseGlyph}>
            <Icon name="football" size={30} color="rgba(255,255,255,0.92)" />
          </View>
        </View>
      ) : null}

      <ReelLikeBurst visible={showBurst} onDone={() => setShowBurst(false)} />

      {/* Voile bas — atmosphère issue de la vidéo, pas de carte ni de barre */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.32)', 'rgba(0,0,0,0.9)']}
        locations={[0, 0.5, 1]}
        style={[styles.scrim, { height: height * 0.46 }]}
        pointerEvents="none"
      />

      <View style={[styles.overlay, { paddingBottom: bottomPad }]} pointerEvents="box-none">
        {/* Rail flottant — social premium, glyphes espacés */}
        <Animated.View style={[styles.rail, railStyle]}>
          <Fab
            icon={following ? 'checkmark-circle' : 'add'}
            onPress={onToggleFollow}
            color={following ? colors.accent : '#FFFFFF'}
            filled={following}
            size={26}
            accessibilityLabel={following ? t('reels.following') : t('reels.follow')}
            animatedStyle={followStyle}
          />
          <Fab
            icon={liked ? 'heart' : 'heart-outline'}
            onPress={() => void applyLike(!liked)}
            color={liked ? '#FF3B5C' : '#FFFFFF'}
            filled={liked}
            size={30}
            accessibilityLabel={t('reels.like')}
            animatedStyle={likeStyle}
          />
          <Fab
            icon="chat"
            onPress={() => onOpenComments?.(reel)}
            size={27}
            label={commentLabel}
            accessibilityLabel={t('reels.comments.title')}
          />
          <Fab
            icon="share"
            onPress={onOpenSource}
            size={26}
            accessibilityLabel={t('reels.share')}
          />
          <Fab
            icon={saved ? 'bookmark' : 'bookmark-outline'}
            onPress={() => void onToggleSave()}
            size={26}
            accessibilityLabel={t('reels.save')}
          />
          <PressableSpring
            style={styles.soundBtn}
            scaleTo={0.84}
            haptic
            onPress={() => setUserMuted((m) => !m)}
            accessibilityRole="button"
            accessibilityLabel={userMuted ? t('reels.sound.off') : t('reels.sound.on')}
          >
            <Icon
              name={userMuted ? 'volume-mute' : 'volume-high'}
              size={20}
              color="rgba(255,255,255,0.75)"
            />
          </PressableSpring>
        </Animated.View>

        {/* Créateur — avatar + nom + club/source, épuré, sans carte */}
        <Animated.View style={[styles.meta, metaStyle]}>
          <Pressable onPress={onOpenProfile} style={styles.authorRow}>
            <View style={[styles.avatar, { borderColor: colors.accent }]}>
              <Text style={styles.avatarLetter}>{initial}</Text>
            </View>
            <View style={styles.authorText}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {reel.authorName}
                </Text>
                <View style={[styles.authorTick, { backgroundColor: colors.accent }]} />
              </View>
              <Text style={styles.handleLine} numberOfLines={1}>
                @{reel.authorHandle} · {REEL_SOURCE_LABEL[reel.source]}
              </Text>
            </View>
          </Pressable>

          {caption ? (
            <Text style={styles.caption} numberOfLines={2}>
              {caption}
            </Text>
          ) : null}
        </Animated.View>
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
  },
  pauseGlyph: {
    width: 74,
    height: 74,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.lg,
  },
  rail: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.xl + 52,
    alignItems: 'center',
    gap: spacing.xl,
  },
  fab: {
    alignItems: 'center',
    gap: 5,
  },
  fabScrim: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(10,12,16,0.32)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  fabLabel: {
    color: '#FFFFFF',
    fontFamily: fontFamily.bold,
    fontSize: 12,
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  soundBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -spacing.sm,
  },
  meta: {
    paddingRight: 84,
    gap: spacing.md,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontFamily: fontFamily.extrabold,
    fontSize: 18,
  },
  authorText: {
    flexShrink: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    color: '#fff',
    fontFamily: fontFamily.displayBold,
    fontSize: 18,
    letterSpacing: -0.4,
    flexShrink: 1,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  authorTick: {
    width: 16,
    height: 2.5,
    borderRadius: 2,
  },
  handleLine: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    letterSpacing: 0.1,
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
