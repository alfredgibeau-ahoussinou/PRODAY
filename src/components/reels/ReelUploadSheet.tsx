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
import { ProDayGradient } from '../ui/ProDayGradient';
import type { ReelThemeId } from '../../content/reelThemes';
import { REEL_THEME_CHIPS } from '../../content/reelThemes';
import { spacing, radius } from '../../theme/designTokens';
import { useTranslation } from '../../context/LocaleContext';

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
              <Icon name="close" size={22} color="rgba(255,255,255,0.7)" />
            </Pressable>
          </View>

          <ProDayText variant="caption" style={styles.disclaimer}>
            {t('reels.upload.disclaimer')}
          </ProDayText>

          <PressableSpring onPress={() => void onPickVideo()} scaleTo={0.98} haptic disabled={uploading}>
            <View style={[styles.pickBox, hasVideo && styles.pickBoxOn]}>
              <Icon name="videocam" size={28} color={hasVideo ? '#22D3EE' : 'rgba(255,255,255,0.5)'} />
              <ProDayText variant="caption" accent>
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
            <ProDayGradient kind="cta" style={styles.cta}>
              {uploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ProDayText variant="caption" inverse style={styles.ctaText}>
                  {t('reels.upload.submit')}
                </ProDayText>
              )}
            </ProDayGradient>
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
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#0B0D10',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: spacing.xl,
    gap: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { color: '#FFFFFF' },
  disclaimer: { color: 'rgba(255,255,255,0.55)', lineHeight: 17 },
  pickBox: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  pickBoxOn: {
    borderColor: 'rgba(34,211,238,0.5)',
    backgroundColor: 'rgba(34,211,238,0.06)',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 15,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  themeRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  themeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  themeChipOn: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  themeOn: { color: '#0B0D10', fontWeight: '800' },
  themeOff: { color: 'rgba(255,255,255,0.75)' },
  cta: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  ctaText: { fontWeight: '800' },
});
