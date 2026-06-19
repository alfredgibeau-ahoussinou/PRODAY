import React, { useMemo } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { useWeeklyQuestionPopup } from '../../hooks/useWeeklyQuestionPopup';
import { WeeklyQuestionPinnedCard } from './WeeklyQuestionShared';
import { WeeklyQuestionComposeForm } from './WeeklyQuestionComposeForm';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';

interface WeeklyQuestionHomePopupProps {
  profile: User;
}

export const WeeklyQuestionHomePopup: React.FC<WeeklyQuestionHomePopupProps> = ({ profile }) => {
  const { t } = useTranslation();
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(), []);
  const { visible, canParticipate, question, weekKey, myResponse, submitting, dismiss, submit } =
    useWeeklyQuestionPopup(profile);

  if (!canParticipate || !question || myResponse) return null;

  return (
    <AnimatedModalShell
      visible={visible}
      onClose={dismiss}
      closeLabel={t('feed.weekly.later')}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <ProDayText variant="caption" muted style={styles.eyebrow}>
            {t('feed.weekly.modalEyebrow')}
          </ProDayText>

          <WeeklyQuestionPinnedCard
            question={question.question}
            weekKey={weekKey}
            hint={t('feed.weekly.modalHint')}
            colors={c}
            t={t}
          />

          <WeeklyQuestionComposeForm
            colors={c}
            t={t}
            submitting={submitting}
            onSubmit={submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </AnimatedModalShell>
  );
};

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
    eyebrow: {
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingTop: spacing.xs,
    },
  });
}
