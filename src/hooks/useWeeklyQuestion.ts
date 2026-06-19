import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '../models/User';
import type { WeeklyQuestion, WeeklyQuestionResponse } from '../models/WeeklyQuestion';
import { weeklyQuestionService } from '../services/weeklyQuestion.service';
import { canParticipateWeeklyQuestion } from '../utils/weeklyQuestionAccess';

export function useWeeklyQuestion(profile: User | null, refreshSignal = 0) {
  const canParticipate = profile ? canParticipateWeeklyQuestion(profile.role) : false;
  const weekKey = useMemo(() => weeklyQuestionService.getCurrentWeekKey(), []);

  const [question, setQuestion] = useState<WeeklyQuestion | null>(null);
  const [responses, setResponses] = useState<WeeklyQuestionResponse[]>([]);
  const [myResponse, setMyResponse] = useState<WeeklyQuestionResponse | null>(null);
  const [loading, setLoading] = useState(canParticipate);
  const [submitting, setSubmitting] = useState(false);

  const refresh = useCallback(async () => {
    if (!profile || !canParticipate) {
      setQuestion(null);
      setResponses([]);
      setMyResponse(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const activeQuestion = await weeklyQuestionService.getActiveQuestion();
      setQuestion(activeQuestion);

      if (!activeQuestion) {
        setResponses([]);
        setMyResponse(null);
        return;
      }

      const [list, mine] = await Promise.all([
        weeklyQuestionService.listResponses(activeQuestion.id),
        weeklyQuestionService.getMyResponse(activeQuestion.id, profile.uid),
      ]);
      setResponses(list);
      setMyResponse(mine);
    } finally {
      setLoading(false);
    }
  }, [profile, canParticipate, weekKey]);

  useEffect(() => {
    void refresh();
  }, [refresh, refreshSignal]);

  const displayResponses = useMemo(() => {
    if (!myResponse) return responses;
    if (responses.some((r) => r.author_uid === myResponse.author_uid)) return responses;
    return [myResponse, ...responses];
  }, [responses, myResponse]);

  const submitAnswer = useCallback(
    async (body: string) => {
      if (!profile || !question) return;
      setSubmitting(true);
      try {
        await weeklyQuestionService.submitResponse({
          question_id: question.id,
          author_uid: profile.uid,
          display_name: profile.display_name,
          author_role: profile.role,
          body,
        });
        await refresh();
      } finally {
        setSubmitting(false);
      }
    },
    [profile, question, refresh]
  );

  return {
    canParticipate,
    weekKey,
    question,
    responses: displayResponses,
    myResponse,
    loading,
    submitAnswer,
    submitting,
    refresh,
  };
}
