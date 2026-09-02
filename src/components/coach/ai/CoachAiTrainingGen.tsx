import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { CoachText } from '../coachPortalUi';
import { Icon } from '../../ui/Icon';
import { PressableSpring } from '../../motion';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { radius, spacing } from '../../../theme/designTokens';
import { CoachPane } from '../CoachScreenHeader';

interface CoachAiTrainingGenProps {
  onBack: () => void;
}

export function CoachAiTrainingGen({ onBack }: CoachAiTrainingGenProps) {
  const { tokens } = useCoachTheme();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Simulate result
    }, 1500);
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
            {['Pressing', 'Conservation', 'Finition'].map(c => (
              <PressableSpring key={c} onPress={() => setPrompt(prev => prev + (prev ? ', ' : '') + c)} style={[styles.chip, { borderColor: tokens.border }]}>
                <CoachText style={{ color: tokens.foreground, fontSize: 12 }}>+ {c}</CoachText>
              </PressableSpring>
            ))}
          </View>

          <PressableSpring
            style={[styles.btn, { backgroundColor: tokens.accent }]}
            onPress={handleGenerate}
            disabled={loading}
          >
            <CoachText style={{ color: tokens.onAccent, fontWeight: '800' }}>
              {loading ? 'Génération en cours...' : 'Générer la séance'}
            </CoachText>
          </PressableSpring>
        </View>
      </ScrollView>
    </CoachPane>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md },
  card: { padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 13, marginBottom: spacing.lg },
  input: { minHeight: 120, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, textAlignVertical: 'top' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  chip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1 },
  btn: { marginTop: spacing.xl, paddingVertical: 14, borderRadius: radius.md, alignItems: 'center' },
});
