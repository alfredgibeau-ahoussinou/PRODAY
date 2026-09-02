import React from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { CoachText } from '../coachPortalUi';
import { Icon } from '../../ui/Icon';
import { PressableSpring } from '../../motion';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { radius, spacing } from '../../../theme/designTokens';
import { CoachPane } from '../CoachScreenHeader';

export function CoachAiFreeChat({ onBack }: { onBack: () => void }) {
  const { tokens } = useCoachTheme();

  return (
    <CoachPane
      title="Chat IA"
      actions={[{ icon: 'chevron-down', onPress: onBack, accessibilityLabel: 'Retour' }]}
    >
      <View style={{ flex: 1, padding: spacing.md, justifyContent: 'space-between' }}>
        <ScrollView style={{ flex: 1 }}>
          <View style={[styles.bubble, { backgroundColor: tokens.surface }]}>
            <CoachText style={{ color: tokens.foreground }}>Bonjour Coach, comment puis-je vous aider aujourd'hui ?</CoachText>
          </View>
        </ScrollView>
        <View style={[styles.inputRow, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
          <TextInput
            style={[styles.input, { color: tokens.foreground }]}
            placeholder="Posez votre question..."
            placeholderTextColor={tokens.muted}
          />
          <PressableSpring style={[styles.sendBtn, { backgroundColor: tokens.accent }]}>
            <Icon name="chevron-forward" size={16} color={tokens.onAccent} />
          </PressableSpring>
        </View>
      </View>
    </CoachPane>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: spacing.md, borderRadius: radius.lg, alignSelf: 'flex-start', maxWidth: '80%' },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, height: 50 },
  input: { flex: 1 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: spacing.sm },
});
