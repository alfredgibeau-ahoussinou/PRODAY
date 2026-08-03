import React, { useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { PressableSpring } from '../../motion';
import { ProDayText } from '../../ui/ProDayText';
import { spacing, radius } from '../../../theme/designTokens';
import { MEDICAL_THEME } from '../../../content/medicalExperience';
import type { VisioChatMessage } from './visioCallTypes';

type Props = {
  messages: VisioChatMessage[];
  onSend: (text: string) => void;
  onClose: () => void;
};

export const VisioCallChat: React.FC<Props> = ({ messages, onSend, onClose }) => {
  const [draft, setDraft] = useState('');
  const listRef = useRef<FlatList<VisioChatMessage>>(null);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.panel}
    >
      <View style={styles.header}>
        <ProDayText variant="caption" style={styles.headerTitle}>
          Chat consultation
        </ProDayText>
        <PressableSpring onPress={onClose} scaleTo={0.95} haptic>
          <ProDayText variant="caption" style={styles.close}>
            Fermer
          </ProDayText>
        </PressableSpring>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <ProDayText variant="caption" muted style={styles.empty}>
            Messages visibles uniquement pendant cet appel.
          </ProDayText>
        }
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.local ? styles.bubbleLocal : styles.bubbleRemote]}>
            {!item.local ? (
              <ProDayText variant="caption" style={styles.from}>
                {item.from}
              </ProDayText>
            ) : null}
            <ProDayText variant="caption" style={styles.text}>
              {item.text}
            </ProDayText>
          </View>
        )}
      />

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Écrire un message…"
          placeholderTextColor="rgba(255,255,255,0.45)"
          style={styles.input}
          onSubmitEditing={submit}
          returnKeyType="send"
          maxLength={500}
        />
        <PressableSpring style={styles.send} onPress={submit} scaleTo={0.95} haptic>
          <ProDayText variant="caption" inverse style={styles.sendLabel}>
            Envoyer
          </ProDayText>
        </PressableSpring>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  panel: {
    ...StyleSheet.absoluteFillObject,
    top: '28%',
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderWidth: 1,
    borderColor: MEDICAL_THEME.primaryBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.12)',
  },
  headerTitle: { color: '#FFF', fontWeight: '700' },
  close: { color: MEDICAL_THEME.primaryBorder },
  list: { padding: spacing.md, gap: spacing.xs, flexGrow: 1 },
  empty: { textAlign: 'center', marginTop: spacing.lg },
  bubble: {
    maxWidth: '82%',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  bubbleLocal: {
    alignSelf: 'flex-end',
    backgroundColor: MEDICAL_THEME.primary,
  },
  bubbleRemote: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  from: { color: 'rgba(255,255,255,0.65)', marginBottom: 2, fontSize: 11 },
  text: { color: '#FFF' },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  input: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)',
    color: '#FFF',
  },
  send: {
    backgroundColor: MEDICAL_THEME.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendLabel: { fontWeight: '700' },
});
