const fs = require('fs');

const content = `import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { CoachText } from '../coachPortalUi';
import { Icon } from '../../ui/Icon';
import { PressableSpring } from '../../motion';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { radius, spacing } from '../../../theme/designTokens';
import { CoachPane } from '../CoachScreenHeader';
import type { CoachChapterCommonProps } from '../coachPortalUi';
import { resolveCoachCalendarContext, composedPlanFromPrompt, type CoachComposedPlan } from '../../../utils/coachTrainingRecommendation';
import { teamEventsService } from '../../../services/teamEvents.service';

interface Props extends CoachChapterCommonProps {
  onBack: () => void;
}

export function CoachAiTrainingGen({ onBack, events, members, activeTeamId, onRefresh }: Props) {
  const { tokens } = useCoachTheme();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<CoachComposedPlan | null>(null);

  const calendarContext = useMemo(() => resolveCoachCalendarContext(events), [events]);
  const teamMembers = useMemo(() => members.filter((m) => m.role === 'player'), [members]);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const newPlan = composedPlanFromPrompt(prompt, {
        targetEventId: calendarContext.nextTraining?.id,
        playerCount: teamMembers.length || undefined,
      });
      setPlan(newPlan);
    } catch (e) {
      Alert.alert("Erreur", "Génération échouée.");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!plan || !activeTeamId) return;
    setLoading(true);
    try {
      if (plan.targetEventId) {
        // Update existing event
        const ev = events.find(e => e.id === plan.targetEventId);
        if (ev) {
          await teamEventsService.updateEvent(plan.targetEventId, {
            title: plan.title,
            notes: plan.reason,
            training_theme: 'tactical',
          });
        }
      } else {
        // Create new
        const startsAt = new Date();
        startsAt.setDate(startsAt.getDate() + 1);
        startsAt.setHours(18, 0, 0, 0);
        const endsAt = new Date(startsAt.getTime() + 90 * 60000);
        await teamEventsService.createEvent({
          team_id: activeTeamId,
          kind: plan.context === 'match' ? 'match' : 'training',
          title: plan.title,
          starts_at: startsAt.toISOString(),
          ends_at: endsAt.toISOString(),
          notes: plan.reason,
          training_theme: 'tactical',
        });
      }
      onRefresh();
      Alert.alert('Succès', 'La séance a été ajoutée au calendrier.');
      onBack();
    } catch (err: any) {
      Alert.alert('Erreur', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CoachPane
      title="Générateur de Séance"
      actions={[{ icon: 'chevron-down', onPress: onBack, accessibilityLabel: 'Retour' }]}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <CoachText style={[styles.title, { color: tokens.foreground }]}>Que souhaitez-vous travailler ?</CoachText>
          <CoachText style={[styles.subtitle, { color: tokens.muted }]}>
            Décrivez vos objectifs physiques, techniques ou tactiques.
          </CoachText>
          
          <TextInput
            style={[styles.input, { backgroundColor: tokens.bg, borderColor: tokens.border, color: tokens.foreground }]}
            multiline
            placeholder="Ex: Bloc bas 90min, pressing haut, blood bath..."
            placeholderTextColor={tokens.muted}
            value={prompt}
            onChangeText={setPrompt}
          />

          <View style={styles.chipsRow}>
            {['Pressing', 'Conservation', 'Finition', 'Bloc bas'].map(c => (
              <PressableSpring key={c} onPress={() => setPrompt(prev => prev + (prev ? ', ' : '') + c)} style={[styles.chip, { borderColor: tokens.border }]}>
                <CoachText style={{ color: tokens.foreground, fontSize: 12 }}>+ {c}</CoachText>
              </PressableSpring>
            ))}
          </View>

          <PressableSpring
            style={[styles.btn, { backgroundColor: tokens.accent }]}
            onPress={handleGenerate}
            disabled={loading || !prompt.trim()}
          >
            {loading ? <ActivityIndicator color={tokens.onAccent} /> : (
              <CoachText style={{ color: tokens.onAccent, fontWeight: '800' }}>Générer la séance</CoachText>
            )}
          </PressableSpring>
        </View>

        {plan && (
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border, marginTop: spacing.lg }]}>
            <CoachText style={[styles.title, { color: tokens.foreground }]}>{plan.title}</CoachText>
            <CoachText style={[styles.subtitle, { color: tokens.muted }]}>{plan.reason}</CoachText>
            <PressableSpring
              style={[styles.btn, { backgroundColor: tokens.bg, borderWidth: 1, borderColor: tokens.border }]}
              onPress={handleApply}
              disabled={loading}
            >
              <CoachText style={{ color: tokens.foreground, fontWeight: '800' }}>Appliquer au calendrier</CoachText>
            </PressableSpring>
          </View>
        )}
      </ScrollView>
    </CoachPane>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: 60 },
  card: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: spacing.lg, lineHeight: 18 },
  input: { minHeight: 120, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  btn: { marginTop: spacing.xl, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
});
`;
fs.writeFileSync('src/components/coach/ai/CoachAiTrainingGen.tsx', content);
