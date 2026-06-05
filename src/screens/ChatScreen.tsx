import React, { useEffect, useMemo, useState } from 'react';
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
  Alert,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { messagesService } from '../services/messages.service';
import { usersService } from '../services/users.service';
import type { ChatMessage } from '../lib/firestoreMappers';
import type { User } from '../models/User';
import { evaluateMessagingPermission } from '../utils/parentalMessaging';
import { isSponsorRole, SPONSOR_THEME } from '../content/sponsorExperience';
import { spacing, radius } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';
import type { AppColors } from '../theme/universeTheme';

interface ChatScreenProps {
  threadId: string;
  otherName: string;
  currentUid: string;
  currentUser?: User | null;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  threadId,
  otherName,
  currentUid,
  currentUser,
  onBack,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [sendBlocked, setSendBlocked] = useState<string | null>(null);
  const sponsorDark = isSponsorRole(currentUser?.role);
  const { colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  const ui = useMemo(
    () =>
      sponsorDark
        ? {
            bg: SPONSOR_THEME.background,
            surface: SPONSOR_THEME.surface,
            surfaceMuted: SPONSOR_THEME.surfaceMuted,
            border: SPONSOR_THEME.borderSubtle,
            text: SPONSOR_THEME.text,
            textMuted: SPONSOR_THEME.textMuted,
            accent: SPONSOR_THEME.primary,
            onAccent: SPONSOR_THEME.onPrimary,
            warning: themeColors.warning,
            warningBg: themeColors.warningBg,
          }
        : {
            bg: themeColors.background,
            surface: themeColors.surface,
            surfaceMuted: themeColors.surfaceMuted,
            border: themeColors.border,
            text: themeColors.text,
            textMuted: themeColors.textMuted,
            accent: themeColors.brand,
            onAccent: themeColors.brandInverse,
            warning: themeColors.warning,
            warningBg: themeColors.warningBg,
          },
    [sponsorDark, themeColors]
  );

  const otherUid = messagesService.getOtherParticipantId(threadId, currentUid);

  useEffect(() => {
    if (!otherUid) return;
    void usersService.getById(otherUid).then(setOtherUser);
  }, [otherUid]);

  useEffect(() => {
    if (!currentUser || !otherUser) {
      setSendBlocked(null);
      return;
    }
    const permission = evaluateMessagingPermission(currentUser, otherUser);
    setSendBlocked(permission.allowed ? null : permission.message ?? 'Messagerie bloquée.');
  }, [currentUser, otherUser]);

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
    if (!text.trim() || !otherUid || sendBlocked) return;
    if (currentUser && otherUser) {
      const permission = evaluateMessagingPermission(currentUser, otherUser);
      if (!permission.allowed) {
        Alert.alert(permission.title ?? 'Messagerie bloquée', permission.message ?? '');
        return;
      }
    }
    setSending(true);
    try {
      await messagesService.sendMessage(threadId, currentUid, otherUid, text.trim());
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: ui.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScreenHeader title={otherName} onBack={onBack} centered sponsorDark={sponsorDark} />
      {loading ? (
        <ActivityIndicator color={ui.accent} style={styles.loader} />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: ui.textMuted }]}>
              Aucun message. Envoyez le premier pour démarrer la conversation.
            </Text>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === currentUid;
            return (
              <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMine : null]}>
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: ui.accent }
                      : {
                          backgroundColor: ui.surface,
                          borderWidth: 1,
                          borderColor: ui.border,
                        },
                  ]}
                >
                  <Text style={[styles.bubbleText, { color: mine ? ui.onAccent : ui.text }]}>
                    {item.body}
                  </Text>
                </View>
                <Text style={[styles.time, { color: ui.textMuted }]}>
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
      {sendBlocked ? (
        <Text
          style={[
            styles.blocked,
            { color: ui.warning, backgroundColor: ui.warningBg },
          ]}
        >
          {sendBlocked}
        </Text>
      ) : null}
      <View
        style={[
          styles.composer,
          { backgroundColor: ui.surface, borderTopColor: ui.border },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: ui.surfaceMuted,
              borderColor: ui.border,
              color: ui.text,
            },
          ]}
          placeholder="Votre message…"
          placeholderTextColor={ui.textMuted}
          value={text}
          onChangeText={setText}
          multiline
          editable={!sendBlocked}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: ui.accent },
            (!text.trim() || sending || sendBlocked) && styles.sendDisabled,
          ]}
          onPress={handleSend}
          disabled={!text.trim() || sending || Boolean(sendBlocked)}
        >
          {sending ? (
            <ActivityIndicator color={ui.onAccent} size="small" />
          ) : (
            <Text style={[styles.sendText, { color: ui.onAccent }]}>Envoyer</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    loader: { marginTop: spacing.xl },
    list: { padding: spacing.lg, paddingBottom: spacing.md, flexGrow: 1 },
    empty: {
      textAlign: 'center',
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
    bubbleText: { fontSize: 15, lineHeight: 22 },
    time: { fontSize: 10, marginTop: 4 },
    blocked: {
      fontSize: 12,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      lineHeight: 18,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
    },
    input: {
      flex: 1,
      minHeight: 44,
      maxHeight: 120,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      borderWidth: 1,
    },
    sendBtn: {
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      minWidth: 72,
      alignItems: 'center',
    },
    sendDisabled: { opacity: 0.5 },
    sendText: { fontWeight: '700', fontSize: 14 },
  });
}
