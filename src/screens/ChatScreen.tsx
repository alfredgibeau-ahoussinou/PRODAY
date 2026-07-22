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
import { ProDayText } from '../components/ui/ProDayText';
import { Icon } from '../components/ui/Icon';
import { PressableSpring } from '../components/motion';
import { prodayHaptics } from '../utils/prodayHaptics';
import { MAX_MESSAGE_BODY } from '../utils/messagingLimits';
import { buildChatQuickReplies } from '../core/social/chatQuickReply.engine';
import { ChatQuickReplyRail } from '../components/messages/ChatQuickReplyRail';
import { teamChatService } from '../services/teamChat.service';
import { isTeamThread } from '../utils/teamChatIds';
import { trackV3Event } from '../core/analytics/v3Events';
import { recordV3UserAction } from '../utils/recordV3Action';
import { useTranslation } from '../context/LocaleContext';
import { useSubscriptionOptional } from '../context/SubscriptionContext';
import {
  subscriptionService,
  SubscriptionLimitError,
} from '../services/subscription.service';
import { sponsorHasUnlimitedMessaging, sponsorMessageLimit } from '../utils/sponsorPlanLimits';
import {
  shouldWarnSponsorMessageQuota,
  sponsorMessageQuotaWarningText,
} from '../components/sponsor/SponsorQuotaBanner';

interface ChatScreenProps {
  threadId: string;
  otherName: string;
  currentUid: string;
  currentUser?: User | null;
  initialDraft?: string;
  onBack: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  threadId,
  otherName,
  currentUid,
  currentUser,
  initialDraft,
  onBack,
}) => {
  const { t, locale } = useTranslation();
  const subscription = useSubscriptionOptional();
  const sponsorQuotaWarnedRef = useRef(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState(initialDraft ?? '');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [sendBlocked, setSendBlocked] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);
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
    if (sendBlocked) return [];
    const lastIncoming = [...messages]
      .reverse()
      .find((message) => message.sender_id !== currentUid)?.body;
    return buildChatQuickReplies({
      otherRole: otherUser?.role,
      otherName,
      lastIncoming,
    });
  }, [sendBlocked, messages, currentUid, otherUser?.role, otherName]);

  useEffect(() => {
    if (!otherUid || isGroupChat) return;
    void usersService.getPublicById(otherUid).then(setOtherUser);
  }, [otherUid, isGroupChat]);

  useEffect(() => {
    if (isGroupChat) {
      setSendBlocked(null);
      return;
    }
    if (!currentUser || !otherUser) {
      setSendBlocked(currentUser && !otherUser ? t('chat.recipientLoading') : null);
      return;
    }
    if (isStaffVerificationPending(currentUser)) {
      setSendBlocked(t('messages.verifyDiploma'));
      return;
    }
    const permission = evaluateMessagingPermission(currentUser, otherUser);
    setSendBlocked(permission.allowed ? null : permission.message ?? t('chat.blocked'));
  }, [currentUser, otherUser, isGroupChat, t]);

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
        Alert.alert(t('chat.verifyRequired'), t('messages.verifyDiploma'));
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
        if (currentUser) {
          trackV3Event('message_sent', { threadId, group: true });
          recordV3UserAction(currentUser, 'send_message');
        }
      } catch (e) {
        Alert.alert(t('common.error'), e instanceof Error ? e.message : t('chat.sendFailed'));
      } finally {
        setSending(false);
      }
      return;
    }
    if (!otherUid) {
      Alert.alert(t('chat.sendBlocked'), t('chat.recipientNotFound'));
      return;
    }
    if (!otherUser) {
      Alert.alert(t('chat.sendBlocked'), t('chat.recipientLoading'));
      return;
    }
    if (currentUser && isStaffVerificationPending(currentUser)) {
      Alert.alert(t('chat.verifyRequired'), t('messages.verifyDiploma'));
      return;
    }
    if (currentUser) {
      const permission = evaluateMessagingPermission(currentUser, otherUser);
      if (!permission.allowed) {
        Alert.alert(permission.title ?? t('chat.blocked'), permission.message ?? '');
        return;
      }
    }
    if (
      currentUser?.role === 'sponsor' &&
      !sponsorHasUnlimitedMessaging(currentUser)
    ) {
      const used = subscription?.usage?.sponsor_club_messages ?? 0;
      const limit = sponsorMessageLimit(currentUser);
      if (
        shouldWarnSponsorMessageQuota(currentUser, used, sponsorQuotaWarnedRef.current)
      ) {
        sponsorQuotaWarnedRef.current = true;
        Alert.alert('Quota messages', sponsorMessageQuotaWarningText(used, limit));
      }
      try {
        await subscriptionService.assertFeature(currentUser, 'sponsor_club_message');
      } catch (e) {
        if (e instanceof SubscriptionLimitError) {
          if (subscription) {
            subscription.openUpgradeForFeature('sponsor_club_message');
          } else {
            Alert.alert(t('chat.sendBlocked'), e.message);
          }
          return;
        }
        throw e;
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
      if (currentUser) {
        trackV3Event('message_sent', { threadId });
        recordV3UserAction(currentUser, 'send_message');
        if (
          currentUser.role === 'sponsor' &&
          !sponsorHasUnlimitedMessaging(currentUser)
        ) {
          await subscriptionService.incrementUsage(currentUser.uid, 'sponsor_club_message');
          void subscription?.refresh();
        }
      }
    } catch (e) {
      Alert.alert(
        t('chat.sendBlocked'),
        e instanceof Error ? e.message : t('chat.sendFailed')
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
          <View
            style={[
              styles.headerAvatar,
              { backgroundColor: isGroupChat ? ui.accent : themeColors.ink },
            ]}
          >
            {isGroupChat ? (
              <Icon name="people" size={20} color={ui.onAccent} variant="filled" />
            ) : (
              <ProDayText variant="section" inverse>
                {initial}
              </ProDayText>
            )}
          </View>
          <View style={styles.headerCopy}>
            <ProDayText variant="section" numberOfLines={1} style={styles.headerName}>
              {otherName}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {isGroupChat ? t('chat.teamChat') : t('chat.messaging')}
            </ProDayText>
          </View>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={[styles.chatArea, { backgroundColor: ui.surfaceMuted }]}>
          <ActivityIndicator color={ui.accent} style={styles.loader} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          style={[styles.chatArea, { backgroundColor: ui.surfaceMuted }]}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: ui.accent }]}>
                <Icon name="chat" size={24} color={ui.onAccent} variant="filled" />
              </View>
              <ProDayText variant="section" style={styles.emptyTitle}>
                {t('chat.empty.title')}
              </ProDayText>
              <ProDayText variant="body" muted style={styles.emptySub}>
                {t('chat.empty.subtitle', { name: otherName })}
              </ProDayText>
            </View>
          }
          renderItem={({ item }) => {
            const mine = item.sender_id === currentUid;
            return (
              <View style={[styles.bubbleWrap, mine && styles.bubbleWrapMine]}>
                {mine ? (
                  <View style={[styles.bubbleMine, { backgroundColor: ui.accent }]}>
                    <ProDayText variant="body" inverse style={styles.bubbleText}>
                      {item.body}
                    </ProDayText>
                  </View>
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
                  {item.created_at.toLocaleTimeString(locale, {
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
        <ChatQuickReplyRail replies={quickReplies} onSelect={setText} />
      ) : null}

      <View style={[styles.composerWrap, { backgroundColor: ui.surface, borderTopColor: ui.border }]}>
        <View style={[styles.composer, { backgroundColor: ui.surfaceMuted, borderColor: ui.border }]}>
          <TextInput
            style={[styles.input, { color: ui.text }]}
            placeholder={t('chat.placeholder')}
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
            <View
              style={[
                styles.sendBtn,
                { backgroundColor: ui.accent },
                (!text.trim() || sending || sendBlocked) && styles.sendDisabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator color={ui.onAccent} size="small" />
              ) : (
                <Icon name="chevron-forward" size={18} color={ui.onAccent} />
              )}
            </View>
          </PressableSpring>
        </View>
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
      borderBottomWidth: StyleSheet.hairlineWidth,
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
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCopy: { flex: 1, minWidth: 0 },
    headerName: { fontWeight: '800' },
    headerSpacer: { width: 40 },
    chatArea: { flex: 1 },
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
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    emptyTitle: { textAlign: 'center' },
    emptySub: { textAlign: 'center', paddingHorizontal: spacing.xl },
    bubbleWrap: { marginBottom: spacing.md, maxWidth: '80%' },
    bubbleWrapMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    bubbleMine: {
      borderRadius: radius.lg,
      borderBottomRightRadius: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      ...shadows.soft,
    },
    bubbleTheirs: {
      borderRadius: radius.lg,
      borderBottomLeftRadius: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderWidth: StyleSheet.hairlineWidth,
      ...shadows.soft,
    },
    bubbleText: { lineHeight: 22 },
    time: { marginTop: 4, fontSize: 11 },
    blocked: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
    },
    composerWrap: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
    },
    composer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      paddingLeft: spacing.lg,
      paddingRight: spacing.xs,
      paddingVertical: spacing.xs,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 120,
      fontSize: 15,
      paddingVertical: spacing.sm,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendDisabled: { opacity: 0.4 },
  });
}
