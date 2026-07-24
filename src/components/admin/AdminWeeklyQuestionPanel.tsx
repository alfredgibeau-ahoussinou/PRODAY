import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { weeklyQuestionService } from '../../services/weeklyQuestion.service';
import { adminService } from '../../services/admin.service';
import type { WeeklyQuestion, WeeklyQuestionResponse } from '../../models/WeeklyQuestion';
import { AdminSectionHeader } from './AdminSectionHeader';
import { AdminEmptyState } from './AdminEmptyState';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useAdminStyles } from './adminStyles';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import { getRoleLabel } from '../../screens/signup/signupFlowConfig';

export const AdminWeeklyQuestionPanel: React.FC = () => {
  const { profile, firebaseUser } = useAuth();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const weekKey = weeklyQuestionService.getCurrentWeekKey();

  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<WeeklyQuestion[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [responses, setResponses] = useState<WeeklyQuestionResponse[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await weeklyQuestionService.listRecentQuestions();
      setHistory(list);
      const counts = await Promise.all(
        list.map(async (item) => {
          const listResponses = await weeklyQuestionService.listResponses(item.id, 200);
          return [item.id, listResponses.length] as const;
        }),
      );
      setResponseCounts(Object.fromEntries(counts));
      const current = list.find((q) => q.week_key === weekKey);
      if (current) setQuestion(current.question);
    } finally {
      setLoading(false);
    }
  }, [weekKey]);

  const loadResponses = useCallback(async (questionId: string) => {
    setLoadingResponses(true);
    try {
      setResponses(await weeklyQuestionService.listResponses(questionId, 200));
    } finally {
      setLoadingResponses(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!expandedId) {
      setResponses([]);
      return;
    }
    void loadResponses(expandedId);
  }, [expandedId, loadResponses]);

  const publish = async () => {
    if (!profile) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await weeklyQuestionService.createQuestion({
        author_uid: profile.uid,
        author_name: profile.display_name || 'ProDay Admin',
        question,
        week_key: weekKey,
      });
      setMessage('Question publiée pour la semaine en cours.');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Publication impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (item: WeeklyQuestion) => {
    await weeklyQuestionService.setQuestionActive(item.id, !item.active);
    await load();
  };

  const removeResponse = (questionId: string, response: WeeklyQuestionResponse) => {
    Alert.alert('Supprimer la réponse', `Retirer la réponse de ${response.display_name} ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await adminService.deleteWeeklyQuestionResponse(
              questionId,
              response.id,
              profile?.uid ?? '',
              firebaseUser?.email ?? profile?.email,
              response.display_name,
            );
            await loadResponses(questionId);
            await load();
          })();
        },
      },
    ]);
  };

  return (
    <View>
      <AdminSectionHeader title="QUESTION HEBDOMADAIRE" />
      <ProDayText variant="body" muted style={styles.intro}>
        Publiez une question pour la communauté. Les réponses du Fil sont listées ci-dessous 
        touchez une question pour les afficher.
      </ProDayText>
      <ProDayText variant="caption" muted style={styles.week}>
        Semaine {weekKey}
      </ProDayText>
      <TextInput
        style={[styles.input, { color: c.text, borderColor: c.border, backgroundColor: c.surface }]}
        placeholder="Ex. Quel est ton objectif principal sur le terrain cette semaine ?"
        placeholderTextColor={c.textMuted}
        value={question}
        onChangeText={setQuestion}
        multiline
      />
      <PressableSpring
        style={[styles.publish, { backgroundColor: c.brand }, submitting && styles.disabled]}
        disabled={submitting || !question.trim()}
        onPress={() => void publish()}
        scaleTo={0.97}
        haptic={!submitting}
      >
        {submitting ? (
          <ActivityIndicator color={c.brandInverse} />
        ) : (
          <ProDayText variant="caption" inverse style={styles.publishText}>
            Publier la question de la semaine
          </ProDayText>
        )}
      </PressableSpring>
      {message ? (
        <ProDayText variant="caption" style={{ color: c.brand, marginTop: spacing.sm }}>
          {message}
        </ProDayText>
      ) : null}

      <AdminSectionHeader title="QUESTIONS & RÉPONSES" count={history.length} />
      {loading ? (
        <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.lg }} />
      ) : history.length === 0 ? (
        <AdminEmptyState
          icon="chat"
          title="Aucune question"
          subtitle="La première question apparaîtra dans le fil des joueurs."
        />
      ) : (
        history.map((item) => {
          const expanded = expandedId === item.id;
          const count = responseCounts[item.id] ?? 0;
          return (
            <View
              key={item.id}
              style={[styles.historyCard, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              <PressableSpring onPress={() => setExpandedId(expanded ? null : item.id)} scaleTo={0.99} haptic>
                <View style={styles.historyHead}>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="caption" muted>
                      {item.week_key} · {formatCalendarDate(item.created_at)}
                      {item.active ? ' · Active' : ' · Inactive'}
                    </ProDayText>
                    <ProDayText variant="body" style={styles.historyQuestion}>
                      {item.question}
                    </ProDayText>
                    <ProDayText variant="caption" accent style={{ fontWeight: '800', marginTop: 4 }}>
                      {count} réponse{count > 1 ? 's' : ''}. {expanded ? 'Réduire' : 'Voir les réponses'}
                    </ProDayText>
                  </View>
                  <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={c.brand} />
                </View>
              </PressableSpring>

              <PressableSpring onPress={() => void toggleActive(item)} scaleTo={0.98}>
                <ProDayText variant="caption" style={{ color: c.brand, fontWeight: '700', marginTop: spacing.xs }}>
                  {item.active ? 'Désactiver' : 'Réactiver'}
                </ProDayText>
              </PressableSpring>

              {expanded ? (
                <View style={styles.responsesBlock}>
                  {loadingResponses ? (
                    <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.md }} />
                  ) : responses.length === 0 ? (
                    <ProDayText variant="caption" muted>
                      Aucune réponse pour le moment.
                    </ProDayText>
                  ) : (
                    responses.map((response) => (
                      <View
                        key={response.id}
                        style={[styles.responseRow, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
                      >
                        <ProDayText variant="caption" style={{ fontWeight: '900', color: c.text }}>
                          {response.display_name}
                          {response.author_role ? ` · ${getRoleLabel(response.author_role)}` : ''}
                        </ProDayText>
                        {response.created_at ? (
                          <ProDayText variant="caption" muted>
                            {formatRelativeTime(response.created_at, (k) => k, new Date(), 'fr')}
                          </ProDayText>
                        ) : null}
                        <ProDayText variant="body" style={{ color: c.text, lineHeight: 21, marginTop: 4 }}>
                          {response.body}
                        </ProDayText>
                        <PressableSpring
                          onPress={() => removeResponse(item.id, response)}
                          scaleTo={0.97}
                          style={{ alignSelf: 'flex-start', marginTop: spacing.xs }}
                        >
                          <ProDayText variant="caption" style={{ color: c.error, fontWeight: '800' }}>
                            Supprimer
                          </ProDayText>
                        </PressableSpring>
                      </View>
                    ))
                  )}
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </View>
  );
};

function createStyles(_c: { border: string }) {
  return StyleSheet.create({
    intro: { lineHeight: 22, marginBottom: spacing.sm },
    week: { marginBottom: spacing.sm, fontWeight: '700' },
    input: {
      minHeight: 110,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      textAlignVertical: 'top',
      fontSize: 15,
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    publish: {
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    publishText: { fontWeight: '800' },
    disabled: { opacity: 0.7 },
    historyCard: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      gap: spacing.xs,
    },
    historyHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    historyQuestion: { lineHeight: 22, marginTop: 4 },
    responsesBlock: { marginTop: spacing.md, gap: spacing.sm },
    responseRow: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      gap: 2,
    },
  });
}
