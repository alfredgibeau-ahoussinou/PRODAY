import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import type { ReelThemeId } from '../../content/reelThemes';
import { REEL_THEME_CHIPS } from '../../content/reelThemes';
import { useTranslation } from '../../context/LocaleContext';
import { reelsTheme } from './reelsTheme';

interface ReelUploadSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (caption: string, theme: Exclude<ReelThemeId, 'all'>) => Promise<void>;
  onPickVideo: () => Promise<boolean>;
  hasVideo: boolean;
  uploading: boolean;
}

export const ReelUploadSheet: React.FC<ReelUploadSheetProps> = ({
  visible,
  onClose,
  onSubmit,
  onPickVideo,
  hasVideo,
  uploading,
}) => {
  const { t } = useTranslation();
  const [caption, setCaption] = useState('');
  const [theme, setTheme] = useState<Exclude<ReelThemeId, 'all'>>('skills');

  const handleSubmit = () => {
    if (!hasVideo) {
      Alert.alert(t('reels.upload.videoRequired'));
      return;
    }
    if (!caption.trim()) {
      Alert.alert(t('reels.upload.captionRequired'));
      return;
    }
    void onSubmit(caption.trim(), theme).then(() => {
      setCaption('');
      onClose();
      Alert.alert(
        t('reels.upload.sent.title'),
        t('reels.upload.sent.body'),
      );
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <ProDayText variant="title" style={styles.title}>{t('reels.upload.title')}</ProDayText>
            <Pressable onPress={onClose} hitSlop={12}>
              <Icon name="close" size={22} color={reelsTheme.color.textDim} />
            </Pressable>
          </View>

          <ProDayText variant="caption" style={styles.disclaimer}>
            {t('reels.upload.disclaimer')}
          </ProDayText>

          <PressableSpring onPress={() => void onPickVideo()} scaleTo={0.98} haptic disabled={uploading}>
            <View style={[styles.pickBox, hasVideo && styles.pickBoxOn]}>
              <Icon
                name="videocam"
                size={28}
                color={hasVideo ? reelsTheme.color.amber : reelsTheme.color.textDim}
              />
              <ProDayText variant="caption" style={styles.pickLabel}>
                {hasVideo ? t('reels.upload.changeVideo') : t('reels.upload.pickVideo')}
              </ProDayText>
            </View>
          </PressableSpring>

          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder={t('reels.upload.captionPlaceholder')}
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.input}
            multiline
            maxLength={220}
          />

          <View style={styles.themeRow}>
            {REEL_THEME_CHIPS.filter((c) => c.id !== 'all').map((chip) => {
              const on = theme === chip.id;
              return (
                <PressableSpring
                  key={chip.id}
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

          <PressableSpring onPress={handleSubmit} disabled={uploading} scaleTo={0.97} haptic>
            <View style={styles.cta}>
              {uploading ? (
                <ActivityIndicator color={reelsTheme.color.onAmber} />
              ) : (
                <ProDayText variant="caption" style={styles.ctaText}>
                  {t('reels.upload.submit').toUpperCase()}
                </ProDayText>
              )}
            </View>
          </PressableSpring>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: reelsTheme.color.backdrop,
  },
  sheet: {
    backgroundColor: reelsTheme.color.surface,
    borderTopLeftRadius: reelsTheme.radius.lg,
    borderTopRightRadius: reelsTheme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: reelsTheme.color.hairline,
    padding: reelsTheme.space.lg,
    gap: reelsTheme.space.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: reelsTheme.color.hairlineStrong,
    marginBottom: reelsTheme.space.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: reelsTheme.color.text },
  disclaimer: { color: reelsTheme.color.textDim, lineHeight: 17 },
  pickBox: {
    alignItems: 'center',
    gap: reelsTheme.space.xs,
    padding: reelsTheme.space.lg,
    borderRadius: reelsTheme.radius.md,
    borderWidth: 1,
    borderColor: reelsTheme.color.hairlineStrong,
    borderStyle: 'dashed',
    backgroundColor: reelsTheme.color.surfaceRaised,
  },
  pickBoxOn: {
    borderColor: reelsTheme.color.amberLine,
    backgroundColor: reelsTheme.color.amberSoft,
  },
  pickLabel: { color: reelsTheme.color.amber, fontWeight: '700' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: reelsTheme.color.hairline,
    borderRadius: reelsTheme.radius.md,
    padding: reelsTheme.space.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    color: reelsTheme.color.text,
    backgroundColor: reelsTheme.color.surfaceRaised,
  },
  themeRow: { flexDirection: 'row', gap: reelsTheme.space.sm, flexWrap: 'wrap' },
  themeChip: {
    paddingHorizontal: reelsTheme.space.md,
    paddingVertical: 7,
    borderRadius: reelsTheme.radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: reelsTheme.color.hairlineStrong,
  },
  themeChipOn: {
    backgroundColor: reelsTheme.color.amberSoft,
    borderColor: reelsTheme.color.amberLine,
  },
  themeOn: { color: reelsTheme.color.amber, fontWeight: '800' },
  themeOff: { color: reelsTheme.color.textDim },
  cta: {
    alignItems: 'center',
    paddingVertical: 15,
    borderRadius: reelsTheme.radius.md,
    backgroundColor: reelsTheme.color.amber,
  },
  ctaText: {
    color: reelsTheme.color.onAmber,
    fontFamily: reelsTheme.type.kicker.fontFamily,
    letterSpacing: 1.4,
  },
});
