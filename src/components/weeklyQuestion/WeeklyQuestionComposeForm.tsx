import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { prodayHaptics } from '../../utils/prodayHaptics';

const MAX_LENGTH = 500;

interface WeeklyQuestionComposeFormProps {
  colors: AppColors;
  t: (key: string, vars?: Record<string, string | number>) => string;
  submitting: boolean;
  onSubmit: (body: string) => Promise<void>;
  compact?: boolean;
  tribune?: boolean;
}

export const WeeklyQuestionComposeForm: React.FC<WeeklyQuestionComposeFormProps> = ({
  colors: c,
  t,
  submitting,
  onSubmit,
  compact = false,
  tribune = false,
}) => {
  const styles = useMemo(() => createStyles(c, compact, tribune), [c, compact, tribune]);
  const [draft, setDraft] = useState('');
  const canSubmit = draft.trim().length > 0 && !submitting;
  const accent = tribune ? '#3C00F0' : c.brand;

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: tribune ? 'rgba(255,255,255,0.03)' : c.surface,
          borderColor: tribune ? 'rgba(255,255,255,0.1)' : c.border,
        },
      ]}
    >
      <ProDayText
        variant="caption"
        style={[styles.label, tribune && { color: accent }]}
      >
        {t('feed.weekly.yourAnswer')}
      </ProDayText>
      <TextInput
        style={[
          styles.input,
          {
            color: c.text,
            borderColor: tribune ? 'rgba(255,255,255,0.1)' : c.border,
            backgroundColor: tribune ? 'rgba(0,0,0,0.35)' : c.background,
          },
        ]}
        placeholder={t('feed.weekly.composePlaceholder')}
        placeholderTextColor={c.textMuted}
        value={draft}
        onChangeText={setDraft}
        multiline
        maxLength={MAX_LENGTH}
      />
      <View style={styles.footer}>
        <ProDayText variant="caption" muted>
          {t('feed.weekly.charCount', { n: draft.length, max: MAX_LENGTH })}
        </ProDayText>
        <PressableSpring
          style={[
            styles.submitBtn,
            { backgroundColor: canSubmit ? accent : c.surfaceMuted },
          ]}
          disabled={!canSubmit}
          onPress={() => {
            prodayHaptics.confirm();
            void onSubmit(draft).then(() => setDraft(''));
          }}
          scaleTo={0.97}
          haptic={canSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={c.brandInverse} size="small" />
          ) : (
            <ProDayText
              variant="caption"
              inverse={canSubmit}
              style={[styles.submitText, !canSubmit && { color: c.textMuted }]}
            >
              {t('feed.weekly.publish')}
            </ProDayText>
          )}
        </PressableSpring>
      </View>
    </View>
  );
};

function createStyles(c: AppColors, compact: boolean, tribune: boolean) {
  return StyleSheet.create({
    wrap: {
      marginHorizontal: spacing.md,
      borderWidth: 1,
      borderRadius: tribune ? 2 : radius.lg,
      borderLeftWidth: tribune ? 2 : 1,
      borderLeftColor: tribune ? '#3C00F0' : undefined,
      padding: spacing.md,
      gap: spacing.sm,
    },
    label: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.6 },
    input: {
      minHeight: compact ? 88 : 110,
      borderWidth: 1,
      borderRadius: tribune ? 2 : radius.md,
      padding: spacing.md,
      textAlignVertical: 'top',
      fontSize: 16,
      lineHeight: 22,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    submitBtn: {
      borderRadius: tribune ? 2 : radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      minWidth: 100,
      alignItems: 'center',
    },
    submitText: { fontWeight: '800' },
  });
}
