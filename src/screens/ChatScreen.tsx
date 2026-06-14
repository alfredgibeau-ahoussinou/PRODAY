import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { messagesService } from '../services/messages.service';
import { usersService } from '../services/users.service';
import type { ChatMessage } from '../lib/firestoreMappers';
import type { User } from '../models/User';
import { evaluateMessagingPermission } from '../utils/parentalMessaging';
import { isStaffVerificationPending } from '../utils/staffVerificationGuard';
import { isSponsorRole, SPONSOR_THEME } from '../content/sponsorExperience';
import { spacing, radius, shadows } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';
import type { AppColors } from '../theme/universeTheme';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { ProDayGradient } from '../components/ui/ProDayGradient';
import { ProDayText } from '../components/ui/ProDayText';
import { Icon } from '../components/ui/Icon';
import { PressableSpring } from '../components/motion';
import { prodayHaptics } from '../utils/prodayHaptics';
import { MAX_MESSAGE_BODY } from '../utils/messagingLimits';
import { isV3ShellEnabled } from '../config/featureFlags';
import { buildChatQuickReplies } from '../core/social/chatQuickReply.engine';
import { teamChatService } from '../services/teamChat.service';
import { isTeamThread } from '../utils/teamChatIds';
import { trackV3Event } from '../core/analytics/v3Events';
import { recordV3UserAction } from '../utils/recordV3Action';

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
  const listRef = useRef<FlatList>(null);
  const sponsorDark = isSponsorRole(currentUser?.role);
  const useV3Chat = isV3ShellEnabled();
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
            accent: themeColors.accent,
            onAccent: '#FFFFFF',
            warning: themeColors.warning,
            warningBg: themeColors.warningBg,
          },
    [sponsorDark, themeColors]
  );

  const otherUid = messagesService.getOtherParticipantId(threadId, currentUid);
  const isGroupChat = isTeamThread(threadId);
  const initial = otherName.charAt(0).toUpperCase();

  const quickReplies = useMemo(() => {
    if (!useV3Chat || sendBlocked) return [];
    const lastIncoming = [...messages]
      .reverse()
      .find((message) => message.sender_id !== currentUid)?.body;
    return buildChatQuickReplies({
      otherRole: otherUser?.role,
      otherName,
      lastIncoming,
    });
  }, [useV3Chat, sendBlocked, messages, currentUid, otherUser?.role, otherName]);

  useEffect(() => {
    if (!otherUid || isGroupChat) return;
    void usersService.getById(otherUid).then(setOtherUser);
  }, [otherUid, isGroupChat]);

  useEffect(() => {
    if (isGroupChat) {
      setSendBlocked(null);
      return;
    }
    if (!currentUser || !otherUser) {
      setSendBlocked(currentUser && !otherUser ? 'Chargement du profil…' : null);
      return;
    }
    if (isStaffVerificationPending(currentUser)) {
      setSendBlocked('Validez votre diplôme ou licence pour envoyer des messages.');
      return;
    }
    const permission = evaluateMessagingPermission(currentUser, otherUser);
    setSendBlocked(permission.allowed ? null : permission.message ?? 'Messagerie bloquée.');
  }, [currentUser, otherUser, isGroupChat]);

  useEffect(() => {
    setLoading(true);
    const unsub = messagesService.subscribeMessages(threadId, (list) => {
      setMessages(list);
      setLoading(false);
      void messagesService.markThreadRead(threadId, currentUid);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
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
    if (!text.trim() || sendBlocked || sending) return;
    if (isGroupChat) {
      if (currentUser && isStaffVerificationPending(currentUser)) {
        Alert.alert(
          'Vérification requise',
          'Validez votre diplôme ou licence pour envoyer des messages.',
        );
        return;
      }
      setSending(true);
      try {
        await messagesService.sendGroupMessage(
          threadId,
          currentUid,
          text.trim(),
          currentUser ?? undefined,
        );
        prodayHaptics.confirm();
        setText('');
        if (useV3Chat && currentUser) {
          trackV3Event('message_sent', { threadId, group: true });
          recordV3UserAction(currentUser, 'send_message');
        }
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Envoi impossible.');
      } finally {
        setSending(false);
      }
      return;
    }
    if (!otherUid) {
      Alert.alert('Envoi impossible', 'Destinataire introuvable pour cette conversation.');
      return;
    }
    if (!otherUser) {
      Alert.alert('Envoi impossible', 'Profil destinataire en cours de chargement.');
      return;
    }
    if (currentUser && isStaffVerificationPending(currentUser)) {
      Alert.alert(
        'Vérification requise',
        'Validez votre diplôme ou licence pour envoyer des messages.',
      );
      return;
    }
    if (currentUser) {
      const permission = evaluateMessagingPermission(currentUser, otherUser);
      if (!permission.allowed) {
        Alert.alert(permission.title ?? 'Messagerie bloquée', permission.message ?? '');
        return;
      }
    }
    setSending(true);
    try {
      await messagesService.sendMessage(
        threadId,
        currentUid,
        otherUid,
        text.trim(),
        currentUser ?? undefined,
      );
      prodayHaptics.confirm();
      setText('');
      if (useV3Chat && currentUser) {
        trackV3Event('message_sent', { threadId });
        recordV3UserAction(currentUser, 'send_message');
      }
    } catch (e) {
      Alert.alert(
        'Envoi impossible',
        e instanceof Error ? e.message : 'Vérifiez votre connexion et réessayez.',
      );
    } finally {
      setSending(false);
    }
  };

  const shell = (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: ui.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <View style={[styles.header, { backgroundColor: ui.surface, borderBottomColor: ui.border }]}>
        <PressableSpring style={[styles.backBtn, { borderColor: ui.border }]} onPress={onBack} scaleTo={0.92} haptic>
          <Icon name="arrow-back" size={20} color={ui.text} />
        </PressableSpring>
        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: themeColors.ink }]}>
            <ProDayText variant="section" inverse>
              {initial}
            </ProDayText>
          </View>
          <View>
            <ProDayText variant="section" numberOfLines={1}>
              {otherName}
            </ProDayText>
            <ProDayText variant="caption" muted>
              Conversation ProDay
            </ProDayText>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <ActivityIndicator color={ui.accent} style={styles.loader} />
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <ProDayGradient kind="cta" style={styles.emptyIcon}>
                <Icon name="chat" size={24} color="#FFFFFF" variant="filled" />
              </ProDayGradient>
              <ProDayText variant="section" style={styles.emptyTitle}>
                Démarrez la conversation
              </ProDayText>
              <ProDayText variant="body" muted style={styles.emptySub}>
                Envoyez le premier message pour échanger avec {otherName}.
              </ProDayText>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === currentUid;
            return (
              <View style={[styles.bubbleWrap, mine && styles.bubbleWrapMine]}>
                {mine ? (
                  <ProDayGradient
                    kind="cta"
                    style={styles.bubbleMine}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                  >
                    <ProDayText variant="body" inverse style={styles.bubbleText}>
                      {item.body}
                    </ProDayText>
                  </ProDayGradient>
                ) : (
                  <View
                    style={[
                      styles.bubbleTheirs,
                      { backgroundColor: ui.surface, borderColor: ui.border },
                    ]}
                  >
                    <ProDayText variant="body" style={{ color: ui.text }}>
                      {item.body}
                    </ProDayText>
                  </View>
                )}
                <ProDayText variant="caption" muted style={styles.time}>
                  {item.created_at.toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </ProDayText>
              </View>
            );
          }}
        />
      )}

      {sendBlocked ? (
        <View style={[styles.blocked, { backgroundColor: ui.warningBg }]}>
          <Icon name="warning" size={16} color={ui.warning} />
          <ProDayText variant="caption" style={{ color: ui.warning, flex: 1 }}>
            {sendBlocked}
          </ProDayText>
        </View>
      ) : null}

      {quickReplies.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickReplies}
          keyboardShouldPersistTaps="handled"
        >
          {quickReplies.map((reply) => (
            <PressableSpring
              key={reply}
              style={[styles.quickChip, { backgroundColor: ui.surfaceMuted, borderColor: ui.border }]}
              onPress={() => setText(reply)}
              scaleTo={0.97}
              haptic
            >
              <ProDayText variant="caption" accent numberOfLines={1}>
                {reply}
              </ProDayText>
            </PressableSpring>
          ))}
        </ScrollView>
      ) : null}

      <View style={[styles.composer, { backgroundColor: ui.surface, borderTopColor: ui.border }]}>
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
          maxLength={MAX_MESSAGE_BODY}
          editable={!sendBlocked}
        />
        <PressableSpring
          onPress={handleSend}
          disabled={!text.trim() || sending || Boolean(sendBlocked)}
          scaleTo={0.9}
          haptic
        >
          <ProDayGradient
            kind="cta"
            style={[
              styles.sendBtn,
              (!text.trim() || sending || sendBlocked) && styles.sendDisabled,
            ]}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Icon name="chat" size={20} color="#FFFFFF" variant="filled" />
            )}
          </ProDayGradient>
        </PressableSpring>
      </View>
    </KeyboardAvoidingView>
  );

  return sponsorDark ? shell : <ProDayScreenCanvas flat>{shell}</ProDayScreenCanvas>;
};

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      gap: spacing.sm,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSpacer: { width: 40 },
    loader: { marginTop: spacing.xl },
    list: { padding: spacing.lg, paddingBottom: spacing.md, flexGrow: 1 },
    emptyWrap: {
      alignItems: 'center',
      paddingVertical: spacing.xxl,
      gap: spacing.sm,
    },
    emptyIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    emptyTitle: { textAlign: 'center' },
    emptySub: { textAlign: 'center', paddingHorizontal: spacing.xl },
    bubbleWrap: { marginBottom: spacing.md, maxWidth: '82%' },
    bubbleWrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    bubbleMine: {
      borderRadius: radius.lg,
      borderBottomRightRadius: 4,
      padding: spacing.md,
      ...shadows.soft,
    },
    bubbleTheirs: {
      borderRadius: radius.lg,
      borderBottomLeftRadius: 4,
      padding: spacing.md,
      borderWidth: 1,
    },
    bubbleText: { lineHeight: 22 },
    time: { marginTop: 4 },
    blocked: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
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
      borderRadius: radius.pill,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      fontSize: 15,
      borderWidth: 1,
    },
    sendBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendDisabled: { opacity: 0.45 },
    quickReplies: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    quickChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      maxWidth: 220,
    },
  });
}
