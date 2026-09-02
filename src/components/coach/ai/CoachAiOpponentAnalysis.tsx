import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { CoachText } from '../coachPortalUi';
import { Icon } from '../../ui/Icon';
import { PressableSpring } from '../../motion';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { radius, spacing } from '../../../theme/designTokens';
import { CoachPane } from '../CoachScreenHeader';

interface Props {
  onBack: () => void;
}

export function CoachAiOpponentAnalysis({ onBack }: Props) {
  const { tokens } = useCoachTheme();

  return (
    <CoachPane
      title="Analyse Tactique"
      actions={[{ icon: 'chevron-down', onPress: onBack, accessibilityLabel: 'Retour' }]}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        <View style={[styles.card, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
          <CoachText style={[styles.title, { color: tokens.foreground }]}>Dernier Match : US Créteil</CoachText>
          <CoachText style={[styles.date, { color: tokens.muted }]}>Victoire 2-1 • Dim 12 Nov</CoachText>
          
          <View style={styles.section}>
            <CoachText style={[styles.sectionTitle, { color: tokens.accent }]}>Points positifs</CoachText>
            <CoachText style={{ color: tokens.foreground }}>+ Bonne récupération au milieu</CoachText>
            <CoachText style={{ color: tokens.foreground }}>+ Finition clinique</CoachText>
          </View>
          
          <View style={styles.section}>
            <CoachText style={[styles.sectionTitle, { color: 'tomato' }]}>À améliorer</CoachText>
            <CoachText style={{ color: tokens.foreground }}>- Repli défensif lent</CoachText>
          </View>
        </View>
      </ScrollView>
    </CoachPane>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md },
  card: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  date: { fontSize: 13, marginBottom: spacing.lg },
  section: { marginBottom: spacing.md },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
});
