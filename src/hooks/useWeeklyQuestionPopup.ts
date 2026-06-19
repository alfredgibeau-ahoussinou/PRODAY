import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '../models/User';
import { useWeeklyQuestion } from './useWeeklyQuestion';
import { canParticipateWeeklyQuestion } from '../utils/weeklyQuestionAccess';
import {
  getWeeklyQuestionPopupMeta,
  recordWeeklyQuestionPopupShown,
} from '../services/weeklyQuestionPreferences.service';
import { shouldShowWeeklyQuestionPopup } from '../utils/weeklyQuestionPopupSchedule';

export function useWeeklyQuestionPopup(profile: User | null) {
  const canParticipate = profile ? canParticipateWeeklyQuestion(profile.role) : false;
  const {
    question,
    myResponse,
    loading,
    submitAnswer,
    submitting,
    weekKey,
    refresh,
  } = useWeeklyQuestion(profile);

  const [visible, setVisible] = useState(false);
  const evaluatedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profile || !canParticipate || loading) return;

    const evalKey = `${profile.uid}:${weekKey}:${myResponse?.id ?? 'none'}:${question?.id ?? 'none'}`;
    if (evaluatedRef.current === evalKey) return;

    void (async () => {
      if (!question || myResponse) {
        evaluatedRef.current = evalKey;
        return;
      }

      const meta = await getWeeklyQuestionPopupMeta(profile.uid, weekKey);
      if (!shouldShowWeeklyQuestionPopup(meta, false)) {
        evaluatedRef.current = evalKey;
        return;
      }

      await recordWeeklyQuestionPopupShown(profile.uid, weekKey);
      setVisible(true);
      evaluatedRef.current = evalKey;
    })();
  }, [profile, canParticipate, loading, question, myResponse, weekKey]);

  const dismiss = useCallback(() => {
    setVisible(false);
  }, []);

  const submit = useCallback(
    async (body: string) => {
      await submitAnswer(body);
      await refresh();
      setVisible(false);
    },
    [submitAnswer, refresh]
  );

  return {
    visible,
    canParticipate,
    question,
    weekKey,
    myResponse,
    submitting,
    dismiss,
    submit,
  };
}
