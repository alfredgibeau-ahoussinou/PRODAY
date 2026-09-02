import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { CoachText } from '../coachPortalUi';
import { Icon } from '../../ui/Icon';
import { PressableSpring } from '../../motion';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { radius, spacing } from '../../../theme/designTokens';
import { CoachPane } from '../CoachScreenHeader';
import type { CoachChapterCommonProps } from '../coachPortalUi';
import { listRecentPostMatchAnalyses, type PostMatchAnalysis } from '../../../utils/coachPostMatchAnalysis';

interface Props extends CoachChapterCommonProps {
  onBack: () => void;
}

export function CoachAiOpponentAnalysis({ onBack, events, members }: Props) {
  const { tokens } = useCoachTheme();
  
  const analyses = useMemo(() => listRecentPostMatchAnalyses(events, members, 2), [events]);

  return (
    <CoachPane
      title="Analyse Tactique"
      actions={[{ icon: 'chevron-down', onPress: onBack, accessibilityLabel: 'Retour' }]}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {analyses.length === 0 ? (
          <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border, alignItems: 'center' }]}>
            <CoachText style={{ color: tokens.muted }}>Aucune analyse d'après-match disponible.</CoachText>
          </View>
        ) : (
          analyses.map((analysis) => (
            <View key={analysis.eventId} style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <View style={styles.header}>
                <CoachText style={[styles.title, { color: tokens.foreground }]}>{analysis.title}</CoachText>
                <CoachText style={[styles.date, { color: tokens.muted }]}>
                  {analysis.date.toLocaleDateString('fr-FR')} {analysis.scoreLabel ? `• ${analysis.scoreLabel}` : ''}
                </CoachText>
              </View>
              
              {analysis.positives.length > 0 && (
                <View style={styles.section}>
                  <CoachText style={[styles.sectionTitle, { color: tokens.accent }]}>Points positifs</CoachText>
                  {analysis.positives.map(p => (
                    <CoachText key={p} style={{ color: tokens.foreground }}>+ {p}</CoachText>
                  ))}
                </View>
              )}
              
              {analysis.improvements.length > 0 && (
                <View style={styles.section}>
                  <CoachText style={[styles.sectionTitle, { color: 'tomato' }]}>À améliorer</CoachText>
                  {analysis.improvements.map(p => (
                    <CoachText key={p} style={{ color: tokens.foreground }}>- {p}</CoachText>
                  ))}
                </View>
              )}
              
              {analysis.mvp && (
                <View style={styles.section}>
                  <CoachText style={[styles.sectionTitle, { color: '#F5C518' }]}>MVP : {analysis.mvp.name}</CoachText>
                  <CoachText style={{ color: tokens.foreground, fontStyle: 'italic' }}>{analysis.mvp.reason}</CoachText>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </CoachPane>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, paddingBottom: 60, gap: spacing.md },
  card: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  header: { marginBottom: spacing.md },
  title: { fontSize: 18, fontWeight: '800' },
  date: { fontSize: 13 },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
});
