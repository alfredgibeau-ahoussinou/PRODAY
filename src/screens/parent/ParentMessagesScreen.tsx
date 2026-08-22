import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  RefreshControl,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { spacing, radius } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';
import { parentPortalService } from '../../services/parentPortal.service';
import type { MessageThread } from '../../lib/firestoreMappers';
import { useAuth } from '../../context/AuthContext';
import { normalizeGuardianEmail } from '../../utils/guardianEmail';
import { ParentPageFrame } from '../../components/parent/ParentPageFrame';
import {
  ParentActionButton,
  ParentSectionCard,
} from '../../components/parent/parentPortalUi';
import { PARENT_PAGES } from '../../content/parentPageIdentity';
import { PressableSpring } from '../../components/motion';
import {
  countUnreadThreads,
  formatThreadPreview,
  sortThreadsForInbox,
} from '../../utils/messagesInboxModel';
import { Icon } from '../../components/ui/Icon';

export const ParentMessagesScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
  const { profile } = useAuth();
  const { selected, reload } = useParentShell();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ id: string; body: string; sender_id: string }[]>([]);
  const email = normalizeGuardianEmail(profile?.email);

  const load = useCallback(async () => {
    if (!selected) {
      setThreads([]);
      return;
    }
    setLoading(true);
    try {
      const allow = parentPortalService.canParentReadMessages(selected);
      setThreads(
        await parentPortalService.listChildThreads(selected.uid, 40, { allowRead: allow }),
      );
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await reload();
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [reload, load]);

  const openThread = async (threadId: string) => {
    if (!parentPortalService.canParentReadMessages(selected)) {
      Alert.alert(
        'Messages masqués',
        'Active « Lecture des messages » dans Réglages pour consulter les conversations.',
      );
      return;
    }
    setOpenThreadId(threadId);
    const msgs = await parentPortalService.listChildMessages(threadId, 80, { allowRead: true });
    setMessages(msgs.map((m) => ({ id: m.id, body: m.body, sender_id: m.sender_id })));
  };

  const toggleContact = async (contactUid: string, name: string, approved: boolean) => {
    if (!selected || !email) return;
    try {
      await parentPortalService.setContactApproval(
        selected.uid,
        email,
        contactUid,
        approved,
        { name },
      );
      await reload();
      Alert.alert(
        approved ? 'Conversation autorisée' : 'Conversation bloquée',
        approved
          ? `${name} peut désormais écrire à ${selected.display_name}.`
          : `${name} ne peut plus écrire à ${selected.display_name}.`,
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible');
    }
  };

  const contacts = selected?.settings.approved_contacts ?? [];
  const pendingContacts = useMemo(
    () => contacts.filter((contact) => !contact.approved),
    [contacts],
  );
  const pendingThreads = useMemo(
    () => threads.filter((thread) => thread.request_status === 'pending'),
    [threads],
  );
  const sortedThreads = useMemo(() => sortThreadsForInbox(threads), [threads]);
  const unreadCount = useMemo(() => countUnreadThreads(threads), [threads]);

  if (!selected) {
    return (
      <ParentPageFrame identity={PARENT_PAGES.messages}>
        <View style={styles.center}>
          <ProDayText variant="body" muted>
            Sélectionnez un enfant.
          </ProDayText>
        </View>
      </ParentPageFrame>
    );
  }

  if (openThreadId) {
    return (
      <ParentPageFrame identity={PARENT_PAGES.messages} showHero={false}>
        <View style={styles.root}>
          <PressableSpring onPress={() => setOpenThreadId(null)} style={styles.back} haptic>
            <ProDayText variant="caption" accent>
              ← Retour aux conversations
            </ProDayText>
          </PressableSpring>
          <ScrollView contentContainerStyle={styles.content}>
            {messages.length === 0 ? (
              <ProDayText variant="body" muted>
                Aucun message dans cette conversation.
              </ProDayText>
            ) : (
              messages.map((m) => (
                <ProDaySurface key={m.id} variant="module" style={styles.msg}>
                  <ProDayText variant="caption" muted>
                    {m.sender_id === selected.uid ? selected.display_name : 'Correspondant'}
                  </ProDayText>
                  <ProDayText variant="body">{m.body}</ProDayText>
                </ProDaySurface>
              ))
            )}
          </ScrollView>
        </View>
      </ParentPageFrame>
    );
  }

  return (
    <ParentPageFrame identity={PARENT_PAGES.messages}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={c.brand}
          />
        }
      >
        {!parentPortalService.canParentReadMessages(selected) ? (
          <ParentSectionCard title="Lecture désactivée">
            <ProDayText variant="body">
              Active « Lecture des messages » dans Réglages pour voir le contenu des conversations.
              Vous pouvez toujours approuver ou bloquer des contacts.
            </ProDayText>
          </ParentSectionCard>
        ) : null}

        {pendingContacts.length > 0 || pendingThreads.length > 0 ? (
          <ParentSectionCard
            title="À valider"
            subtitle="Demandes et contacts en attente"
          >
            {pendingContacts.map((contact) => (
              <View key={contact.uid} style={styles.pendingBlock}>
                <ProDayText variant="body">{contact.name}</ProDayText>
                <ProDayText variant="caption" muted>
                  {contact.role ?? 'contact'} · en attente
                </ProDayText>
                <View style={styles.row}>
                  <ParentActionButton
                    label="Approuver"
                    icon="checkmark-circle"
                    onPress={() => void toggleContact(contact.uid, contact.name, true)}
                  />
                  <ParentActionButton
                    label="Bloquer"
                    tone="ghost"
                    icon="close"
                    onPress={() => void toggleContact(contact.uid, contact.name, false)}
                  />
                </View>
              </View>
            ))}
            {pendingThreads.map((thread) => (
              <View key={thread.id} style={styles.pendingBlock}>
                <ProDayText variant="body">{thread.participant_name || 'Contact'}</ProDayText>
                <ProDayText variant="caption" muted numberOfLines={2}>
                  {thread.last_message ?? 'Demande de conversation'}
                </ProDayText>
                <View style={styles.row}>
                  {thread.request_id ? (
                    <>
                      <ParentActionButton
                        label="Accepter"
                        icon="checkmark-circle"
                        onPress={() =>
                          void parentPortalService
                            .resolveMessageRequest(thread.request_id!, 'accepted')
                            .then(load)
                        }
                      />
                      <ParentActionButton
                        label="Refuser"
                        tone="ghost"
                        onPress={() =>
                          void parentPortalService
                            .resolveMessageRequest(thread.request_id!, 'refused')
                            .then(load)
                        }
                      />
                    </>
                  ) : null}
                  <ParentActionButton
                    label="Ouvrir"
                    tone="ghost"
                    onPress={() => void openThread(thread.id)}
                  />
                </View>
              </View>
            ))}
          </ParentSectionCard>
        ) : null}

        <ParentSectionCard title="Contacts approuvés">
          {contacts.length === 0 ? (
            <ProDayText variant="caption" muted>
              Aucun contact enregistré. Ils apparaîtront dès qu’une conversation démarre.
            </ProDayText>
          ) : (
            contacts.map((contact) => (
              <View key={contact.uid} style={styles.contactRow}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="body">{contact.name}</ProDayText>
                  <ProDayText variant="caption" muted>
                    {contact.role}
                  </ProDayText>
                </View>
                <Switch
                  value={contact.approved}
                  onValueChange={(v) => void toggleContact(contact.uid, contact.name, v)}
                  trackColor={{ false: c.border, true: c.brandSoft }}
                  thumbColor={contact.approved ? c.brand : c.surface}
                />
              </View>
            ))
          )}
        </ParentSectionCard>

        <ParentSectionCard
          title={`Conversations de ${selected.display_name}`}
          subtitle={
            unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''} · lecture seule`
              : 'Lecture seule · contacts à valider ci-dessus'
          }
        >
          {loading && !refreshing ? (
            <ActivityIndicator color={c.brand} />
          ) : sortedThreads.length === 0 ? (
            <View style={styles.emptyBlock}>
              <ProDayText variant="section">Aucune conversation</ProDayText>
              <ProDayText variant="body" muted>
                Les échanges de {selected.display_name} apparaîtront ici dès qu’un fil démarre.
              </ProDayText>
            </View>
          ) : (
            sortedThreads.map((thread) => {
              const otherUid = thread.other_user_id;
              const otherName = thread.participant_name || 'Contact';
              const pending = thread.request_status === 'pending';
              const unread = Boolean(thread.unread);
              return (
                <View key={thread.id} style={styles.threadBlock}>
                  <PressableSpring
                    onPress={() => void openThread(thread.id)}
                    haptic
                    scaleTo={0.98}
                    style={[
                      styles.threadCard,
                      {
                        backgroundColor: c.surface,
                        borderColor: unread ? c.brand : c.border,
                      },
                    ]}
                  >
                    {unread ? <View style={[styles.threadStripe, { backgroundColor: c.brand }]} /> : null}
                    <View style={styles.threadInner}>
                      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                        <View style={styles.threadHead}>
                          <ProDayText variant="section" numberOfLines={1} style={{ flex: 1 }}>
                            {otherName}
                          </ProDayText>
                          {unread ? (
                            <View style={[styles.unreadPill, { backgroundColor: c.brandSoft }]}>
                              <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
                                Non lu
                              </ProDayText>
                            </View>
                          ) : null}
                        </View>
                        <ProDayText variant="caption" muted numberOfLines={2}>
                          {formatThreadPreview(thread.last_message)}
                        </ProDayText>
                        {pending ? (
                          <ProDayText variant="caption" accent>
                            Demande en attente
                          </ProDayText>
                        ) : null}
                      </View>
                      <Icon name="chevron-forward" size={16} color={c.textMuted} />
                    </View>
                  </PressableSpring>
                  <View style={styles.row}>
                    <ParentActionButton
                      label="Approuver"
                      tone="ghost"
                      onPress={() => void toggleContact(otherUid, String(otherName), true)}
                    />
                    <ParentActionButton
                      label="Bloquer"
                      tone="ghost"
                      onPress={() => void toggleContact(otherUid, String(otherName), false)}
                    />
                  </View>
                </View>
              );
            })
          )}
        </ParentSectionCard>
      </ScrollView>
    </ParentPageFrame>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  msg: { padding: spacing.md, gap: 4, borderRadius: radius.md },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pendingBlock: { gap: spacing.xs, paddingVertical: spacing.xs },
  threadBlock: { gap: spacing.sm, paddingVertical: spacing.xs },
  threadCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  threadStripe: { height: 3, width: '100%' },
  threadInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
  },
  threadHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  unreadPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  emptyBlock: { gap: spacing.xs, paddingVertical: spacing.xs },
  back: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
