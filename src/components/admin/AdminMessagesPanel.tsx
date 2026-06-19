import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { adminService, type AdminMessageThread } from '../../services/admin.service';
import { useAuth } from '../../context/AuthContext';
import { AdminSectionHeader } from './AdminSectionHeader';
import { AdminEmptyState } from './AdminEmptyState';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import { formatRelativeTime } from '../../utils/formatRelativeTime';
import type { ChatMessage } from '../../lib/firestoreMappers';

export const AdminMessagesPanel: React.FC = () => {
  const { profile, firebaseUser } = useAuth();
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  const [threads, setThreads] = useState<AdminMessageThread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      setThreads(await adminService.listAllMessageThreads(80));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (threadId: string) => {
    setLoadingMessages(true);
    try {
      setMessages(await adminService.listThreadMessages(threadId, 100));
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void loadMessages(selectedId);
  }, [selectedId, loadMessages]);

  const deleteMessage = (msg: ChatMessage) => {
    Alert.alert('Supprimer le message', 'Ce message sera définitivement retiré.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await adminService.deleteMessageAdmin(
              msg.id,
              profile?.uid ?? '',
              firebaseUser?.email ?? profile?.email,
              msg.thread_id,
            );
            if (selectedId) await loadMessages(selectedId);
          })();
        },
      },
    ]);
  };

  const deleteThread = (thread: AdminMessageThread) => {
    Alert.alert('Supprimer la conversation', thread.label, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            await adminService.deleteMessageThreadAdmin(
              thread.id,
              profile?.uid ?? '',
              firebaseUser?.email ?? profile?.email,
              thread.label,
            );
            setSelectedId(null);
            await loadThreads();
          })();
        },
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.lg }} />;
  }

  if (selectedId) {
    const thread = threads.find((t) => t.id === selectedId);
    return (
      <View>
        <PressableSpring onPress={() => setSelectedId(null)} scaleTo={0.98} haptic>
          <ProDayText variant="caption" accent style={{ fontWeight: '800', marginBottom: spacing.sm }}>
            ← Retour aux conversations
          </ProDayText>
        </PressableSpring>
        <AdminSectionHeader title={thread?.label ?? 'Messages'} />
        {loadingMessages ? (
          <ActivityIndicator color={c.brand} />
        ) : messages.length === 0 ? (
          <AdminEmptyState icon="chat" title="Aucun message" subtitle="Conversation vide." />
        ) : (
          messages.map((msg) => (
            <View
              key={msg.id}
              style={[styles.msgRow, { borderColor: c.border, backgroundColor: c.surface }]}
            >
              <ProDayText variant="caption" muted>
                {msg.sender_id.slice(0, 8)}… ·{' '}
                {formatRelativeTime(msg.created_at, (k) => k, new Date(), 'fr')}
              </ProDayText>
              <ProDayText variant="body" style={{ color: c.text, lineHeight: 20, marginTop: 4 }}>
                {msg.body}
              </ProDayText>
              <PressableSpring onPress={() => deleteMessage(msg)} scaleTo={0.97}>
                <ProDayText variant="caption" style={{ color: c.error, fontWeight: '800', marginTop: 6 }}>
                  Supprimer
                </ProDayText>
              </PressableSpring>
            </View>
          ))
        )}
      </View>
    );
  }

  return (
    <View>
      <AdminSectionHeader title="MESSAGERIE" count={threads.length} />
      <ProDayText variant="caption" muted style={{ marginBottom: spacing.sm, lineHeight: 18 }}>
        Modération des conversations ProDay — lecture et suppression.
      </ProDayText>
      {threads.length === 0 ? (
        <AdminEmptyState icon="chat" title="Aucune conversation" subtitle="Les threads apparaîtront ici." />
      ) : (
        threads.map((thread) => (
          <View
            key={thread.id}
            style={[styles.threadRow, { borderColor: c.border, backgroundColor: c.surface }]}
          >
            <PressableSpring
              onPress={() => setSelectedId(thread.id)}
              scaleTo={0.98}
              haptic
              style={{ flex: 1 }}
            >
              <View style={styles.threadHead}>
                <Icon name="chat" size={16} color={c.brand} />
                <ProDayText variant="body" style={{ fontWeight: '800', color: c.text, flex: 1 }}>
                  {thread.label}
                </ProDayText>
              </View>
              <ProDayText variant="caption" muted numberOfLines={2}>
                {thread.last_message || '—'}
              </ProDayText>
              <ProDayText variant="caption" muted style={{ marginTop: 2 }}>
                {thread.participant_ids.length} participant(s) ·{' '}
                {formatRelativeTime(thread.updated_at, (k) => k, new Date(), 'fr')}
              </ProDayText>
            </PressableSpring>
            <PressableSpring onPress={() => deleteThread(thread)} scaleTo={0.95}>
              <Icon name="close" size={16} color={c.error} />
            </PressableSpring>
          </View>
        ))
      )}
    </View>
  );
};

function createStyles(_c: { border: string }) {
  return StyleSheet.create({
    threadRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    threadHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
    msgRow: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
  });
}
