const fs = require('fs');

const content = `import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TextInput } from 'react-native';
import { CoachText } from '../coachPortalUi';
import { Icon } from '../../ui/Icon';
import { PressableSpring } from '../../motion';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { radius, spacing } from '../../../theme/designTokens';
import { CoachPane } from '../CoachScreenHeader';
import { buildLocalProdayAiReply } from '../../../services/prodayAi.service';

export function CoachAiFreeChat({ onBack }: { onBack: () => void }) {
  const { tokens } = useCoachTheme();
  const [messages, setMessages] = useState<{role: 'user'|'assistant', content: string}[]>([
    { role: 'assistant', content: "Bonjour Coach, comment puis-je vous aider aujourd'hui ?" }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    
    // Simulate thinking delay
    setTimeout(() => {
      const reply = buildLocalProdayAiReply(userMsg).reply;
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    }, 600);
  };

  return (
    <CoachPane
      title="Chat IA"
      actions={[{ icon: 'chevron-down', onPress: onBack, accessibilityLabel: 'Retour' }]}
    >
      <View style={{ flex: 1, padding: spacing.md, justifyContent: 'space-between' }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: spacing.lg }}>
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubble, m.role === 'user' ? [styles.bubbleUser, { backgroundColor: tokens.accent }] : [styles.bubbleAssistant, { backgroundColor: tokens.surface }]]}>
              <CoachText style={{ color: m.role === 'user' ? tokens.onAccent : tokens.foreground }}>{m.content}</CoachText>
            </View>
          ))}
        </ScrollView>
        <View style={[styles.inputRow, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
          <TextInput
            style={[styles.input, { color: tokens.foreground }]}
            placeholder="Posez votre question..."
            placeholderTextColor={tokens.muted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={handleSend}
          />
          <PressableSpring style={[styles.sendBtn, { backgroundColor: tokens.accent }]} onPress={handleSend}>
            <Icon name="chevron-forward" size={16} color={tokens.onAccent} />
          </PressableSpring>
        </View>
      </View>
    </CoachPane>
  );
}

const styles = StyleSheet.create({
  bubble: { padding: spacing.md, borderRadius: radius.lg, maxWidth: '85%', marginBottom: spacing.sm },
  bubbleUser: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleAssistant: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, height: 50 },
  input: { flex: 1 },
  sendBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginLeft: spacing.sm },
});
`;

fs.writeFileSync('src/components/coach/ai/CoachAiFreeChat.tsx', content);
