import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';

interface VoiceReflectionRecorderProps {
  active: boolean;
  uri?: string;
  onUriChange: (uri: string | undefined) => void;
}

export const VoiceReflectionRecorder: React.FC<VoiceReflectionRecorderProps> = ({
  active,
  uri,
  onUriChange,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const state = useAudioRecorderState(recorder);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!active && state.isRecording) {
      void recorder.stop().catch(() => undefined);
    }
  }, [active, recorder, state.isRecording]);

  const start = useCallback(async () => {
    setBusy(true);
    try {
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(t('activity.log.voice'), t('activity.log.voicePermission'));
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      Alert.alert(
        t('activity.log.voice'),
        e instanceof Error ? e.message : t('common.error')
      );
    } finally {
      setBusy(false);
    }
  }, [recorder, t]);

  const stop = useCallback(async () => {
    setBusy(true);
    try {
      await recorder.stop();
      const nextUri = recorder.uri ?? undefined;
      onUriChange(nextUri);
    } catch (e) {
      Alert.alert(
        t('activity.log.voice'),
        e instanceof Error ? e.message : t('common.error')
      );
    } finally {
      setBusy(false);
    }
  }, [onUriChange, recorder, t]);

  return (
    <View style={styles.row}>
      <PressableSpring
        onPress={() => void (state.isRecording ? stop() : start())}
        disabled={busy}
        scaleTo={0.96}
        haptic
        style={[
          styles.btn,
          {
            backgroundColor: state.isRecording ? colors.accentSoft : colors.surfaceMuted,
            borderColor: state.isRecording ? colors.accent : colors.border,
          },
        ]}
      >
        <Icon name={state.isRecording ? 'close' : 'volume-high'} size={16} color={colors.accent} />
        <ProDayText variant="caption" accent>
          {state.isRecording ? t('activity.log.voiceStop') : t('activity.log.voiceStart')}
        </ProDayText>
      </PressableSpring>
      {uri ? (
        <PressableSpring
          onPress={() => onUriChange(undefined)}
          scaleTo={0.96}
          style={[styles.btn, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
        >
          <ProDayText variant="caption" muted>
            {t('activity.log.voiceReady')}
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
