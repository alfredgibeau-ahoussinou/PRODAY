import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { messagesService } from '../services/messages.service';
import type { ChatMessage } from '../lib/firestoreMappers';
import { colors, spacing, radius } from '../theme/designTokens';

interface ChatScreenProps {
  threadId: string;
  otherName: string;
  currentUid: string;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  threadId,
  otherName,
  currentUid,
  onBack,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const otherUid = messagesService.getOtherParticipantId(threadId, currentUid);

  useEffect(() => {
    setLoading(true);
    const unsub = messagesService.subscribeMessages(threadId, (list) => {
      setMessages(list);
      setLoading(false);
      void messagesService.markThreadRead(threadId, currentUid);
    });
    if (!unsub) {
      messagesService.listMessages(threadId).then((list) => {
        setMessages(list);
        setLoading(false);
      });
    }
    return () => unsub?.();
  }, [threadId, currentUid]);

  const handleSend = async () => {
    if (!text.trim() || !otherUid) return;
    setSending(true);
    try {
      await messagesService.sendMessage(
        threadId,
        currentUid,
        otherUid,
        text.trim()
      );
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScreenHeader title={otherName} onBack={onBack} centered />
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Aucun message. Envoyez le premier pour démarrer la conversation.
            </Text>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === currentUid;
            return (
              <View
                style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : null]}
              >
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
                    {item.body}
                  </Text>
                </View>
                <Text style={styles.time}>
                  {item.created_at.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            );
          }}
        />
      )}
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Votre message…"
          placeholderTextColor={colors.textMuted}
          value={text}
          onChangeText={setText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.sendText}>Envoyer</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.lg, paddingBottom: spacing.md, flexGrow: 1 },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.xl,
    lineHeight: 22,
  },
  bubbleWrap: { marginBottom: spacing.md, maxWidth: '82%' },
  bubbleWrapMine: { alignSelf: 'flex-end' },
  bubble: {
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  bubbleMine: { backgroundColor: colors.brand },
  bubbleTheirs: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { fontSize: 15, color: colors.text, lineHeight: 22 },
  bubbleTextMine: { color: '#FFFFFF' },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: {
    backgroundColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    minWidth: 72,
    alignItems: 'center',
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});
