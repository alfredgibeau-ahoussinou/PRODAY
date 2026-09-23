import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
  Keyboard,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import type { ReelThemeId } from '../../content/reelThemes';
import { REEL_THEME_CHIPS } from '../../content/reelThemes';
import { useTranslation } from '../../context/LocaleContext';
import { reelsTheme } from './reelsTheme';
import { pickDemoReelVideo, pickReelVideo, recordReelVideo } from '../../utils/pickReelVideo';
import type { UploadFileInput } from '../../services/storage.service';
import { prodayHaptics } from '../../utils/prodayHaptics';

type Stage = 'camera' | 'compose';

interface ReelUploadSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (caption: string, theme: Exclude<ReelThemeId, 'all'>) => Promise<void>;
  onVideoReady: (file: UploadFileInput) => void;
  onClearVideo: () => void;
  videoUri: string | null;
  uploading: boolean;
  /** Bouton démo E2E (bundle) — uniquement si fourni (__DEV__). */
  allowDemoVideo?: boolean;
}

const ComposePreview: React.FC<{ uri: string }> = ({ uri }) => {
  const player = useVideoPlayer(uri, (instance) => {
    instance.loop = true;
    instance.muted = false;
    instance.play();
  });

  useEffect(() => {
    player.replace(uri);
    player.play();
  }, [player, uri]);

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFill}
      contentFit="cover"
      nativeControls={false}
    />
  );
};

/**
 * Publish plein écran style Instagram.
 * Shutter → caméra système (selfie) — fiable sans module ExpoCamera natif.
 */
export const ReelUploadSheet: React.FC<ReelUploadSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  onVideoReady,
  onClearVideo,
  videoUri,
  uploading,
  allowDemoVideo = false,
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>('camera');
  const [caption, setCaption] = useState('');
  const [theme, setTheme] = useState<Exclude<ReelThemeId, 'all'>>('skills');
  const [busy, setBusy] = useState(false);

  const resetLocal = useCallback(() => {
    setStage('camera');
    setCaption('');
    setTheme('skills');
    setBusy(false);
  }, []);

  useEffect(() => {
    resetLocal();
  }, [visible, resetLocal]);

  const acceptVideo = useCallback(
    (file: UploadFileInput) => {
      onVideoReady(file);
      setStage('compose');
      prodayHaptics.confirm();
    },
    [onVideoReady],
  );

  const handlePickGallery = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const file = await pickReelVideo();
      if (file) acceptVideo(file);
    } finally {
      setBusy(false);
    }
  }, [acceptVideo, busy]);

  const handleRecord = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    prodayHaptics.press();
    try {
      const file = await recordReelVideo();
      if (file) acceptVideo(file);
    } finally {
      setBusy(false);
    }
  }, [acceptVideo, busy]);

  const handleDemo = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const file = await pickDemoReelVideo();
      if (file) acceptVideo(file);
    } finally {
      setBusy(false);
    }
  }, [acceptVideo, busy]);

  const handleRetake = useCallback(() => {
    onClearVideo();
    setCaption('');
    setStage('camera');
  }, [onClearVideo]);

  const handleClose = useCallback(() => {
    onClearVideo();
    onClose();
  }, [onClearVideo, onClose]);

  const handleSubmit = () => {
    if (!videoUri) {
      Alert.alert(t('reels.upload.videoRequired'));
      return;
    }
    if (!caption.trim()) {
      Alert.alert(t('reels.upload.captionRequired'));
      return;
    }
    void (async () => {
      try {
        await onSubmit(caption.trim(), theme);
        setCaption('');
        onClose();
        Alert.alert(t('reels.upload.sent.title'), t('reels.upload.sent.body'));
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : t('common.error');
        Alert.alert(t('common.error'), message);
      }
    })();
  };

  const renderCameraStage = () => (
    <View style={styles.stage} testID="reels-upload-camera">
      <LinearGradient colors={['#0A1520', '#000000', '#12080E']} style={StyleSheet.absoluteFill} />
      <View style={[styles.viewfinder, { top: insets.top + 64, bottom: insets.bottom + 150 }]}>
        <View style={styles.viewfinderFrame} />
        <Icon name="videocam" size={48} color="rgba(255,255,255,0.35)" />
        <ProDayText variant="body" style={styles.viewfinderHint}>
          {t('reels.upload.recordHint')}
        </ProDayText>
      </View>

      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <Pressable testID="reels-upload-close" onPress={handleClose} hitSlop={12} style={styles.glassBtn}>
          <Icon name="close" size={22} color="#fff" />
        </Pressable>
        <View style={styles.timerPill}>
          <ProDayText variant="caption" style={styles.timerText}>
            1:00
          </ProDayText>
        </View>
        <View style={styles.glassBtnPlaceholder} />
      </View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 18) }]}>
        <Pressable
          testID="reels-upload-pick-video"
          onPress={() => void handlePickGallery()}
          disabled={busy}
          style={[styles.sideAction, busy && { opacity: 0.45 }]}
        >
          <View style={styles.galleryThumb}>
            <Icon name="image" size={22} color="#fff" />
          </View>
          <ProDayText variant="caption" style={styles.sideLabel}>
            {t('reels.upload.gallery')}
          </ProDayText>
        </Pressable>

        <Pressable
          testID="reels-upload-shutter"
          onPress={() => void handleRecord()}
          disabled={busy}
          style={styles.shutterHit}
          accessibilityRole="button"
          accessibilityLabel={t('reels.upload.startRecord')}
        >
          <View style={styles.shutterOuter}>
            {busy ? <ActivityIndicator color="#FF3B5C" /> : <View style={styles.shutterInner} />}
          </View>
        </Pressable>

        {allowDemoVideo ? (
          <Pressable
            testID="reels-upload-demo-video"
            onPress={() => void handleDemo()}
            disabled={busy}
            style={[styles.sideAction, busy && { opacity: 0.45 }]}
          >
            <View style={styles.galleryThumb}>
              <Icon name="play" size={20} color="#fff" />
            </View>
            <ProDayText variant="caption" style={styles.sideLabel}>
              Demo
            </ProDayText>
          </Pressable>
        ) : (
          <View style={styles.sideAction} />
        )}
      </View>
    </View>
  );

  const renderComposeStage = () => (
    <View style={styles.stage} testID="reels-upload-compose">
      {videoUri ? <ComposePreview uri={videoUri} /> : <View style={styles.previewFallback} />}

      <View style={[styles.composeScrim, StyleSheet.absoluteFill]} pointerEvents="box-none">
        <View style={[styles.composeTop, { paddingTop: insets.top + 8 }]}>
          <Pressable testID="reels-upload-retake" onPress={handleRetake} style={styles.glassBtn} hitSlop={12}>
            <Icon name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <ProDayText variant="caption" style={styles.composeTitle}>
            {t('reels.upload.title').toUpperCase()}
          </ProDayText>
          <Pressable onPress={handleClose} style={styles.glassBtn} hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Fermer">
            <Icon name="close" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={[styles.composePanel, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TextInput
            testID="reels-upload-caption"
            value={caption}
            onChangeText={setCaption}
            placeholder={t('reels.upload.captionPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.45)"
            style={styles.input}
            multiline
            maxLength={220}
            blurOnSubmit
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
          />

          <View style={styles.themeRow}>
            {REEL_THEME_CHIPS.filter((c) => c.id !== 'all').map((chip) => {
              const on = theme === chip.id;
              return (
                <PressableSpring
                  key={chip.id}
                  testID={`reels-upload-theme-${chip.id}`}
                  onPress={() => setTheme(chip.id as Exclude<ReelThemeId, 'all'>)}
                  scaleTo={0.96}
                >
                  <View style={[styles.themeChip, on && styles.themeChipOn]}>
                    <ProDayText variant="caption" style={on ? styles.themeOn : styles.themeOff}>
                      {chip.label}
                    </ProDayText>
                  </View>
                </PressableSpring>
              );
            })}
          </View>

          <Pressable
            testID="reels-upload-submit"
            onPress={handleSubmit}
            disabled={uploading}
            accessibilityRole="button"
            accessibilityLabel={t('reels.upload.submit')}
          >
            <View style={[styles.cta, uploading && { opacity: 0.7 }]}>
              {uploading ? (
                <ActivityIndicator color={reelsTheme.color.onAmber} />
              ) : (
                <ProDayText variant="caption" style={styles.ctaText}>
                  {t('reels.upload.submit').toUpperCase()}
                </ProDayText>
              )}
            </View>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={handleClose}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.root}>
        {stage === 'compose' && videoUri ? renderComposeStage() : renderCameraStage()}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  stage: { flex: 1, backgroundColor: '#000' },
  viewfinder: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  viewfinderFrame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  viewfinderHint: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  topBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  glassBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  glassBtnPlaceholder: { width: 40, height: 40 },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  timerText: {
    color: '#fff',
    fontFamily: reelsTheme.type.kicker.fontFamily,
    letterSpacing: 1,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 28,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  sideAction: { width: 72, alignItems: 'center', gap: 6 },
  galleryThumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  sideLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 11, fontWeight: '600' },
  shutterHit: { alignItems: 'center', justifyContent: 'center' },
  shutterOuter: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  shutterInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#FF3B5C',
  },
  previewFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0A1018',
  },
  composeScrim: { justifyContent: 'space-between' },
  composeTop: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  composeTitle: {
    color: '#fff',
    fontFamily: reelsTheme.type.kicker.fontFamily,
    letterSpacing: 2,
  },
  composePanel: {
    marginHorizontal: 12,
    padding: 16,
    gap: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(8,12,18,0.72)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    borderRadius: 14,
    padding: 14,
    minHeight: 72,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  themeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  themeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  themeChipOn: {
    backgroundColor: reelsTheme.color.amberSoft,
    borderColor: reelsTheme.color.amberLine,
  },
  themeOn: { color: reelsTheme.color.amber, fontWeight: '800' },
  themeOff: { color: 'rgba(255,255,255,0.7)' },
  cta: {
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: reelsTheme.color.amber,
  },
  ctaText: {
    color: reelsTheme.color.onAmber,
    fontFamily: reelsTheme.type.kicker.fontFamily,
    letterSpacing: 1.4,
  },
});
