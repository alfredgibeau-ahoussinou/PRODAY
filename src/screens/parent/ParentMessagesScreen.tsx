import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Pressable,
  Switch,
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

export const ParentMessagesScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
  const { profile } = useAuth();
  const { selected, reload } = useParentShell();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(false);
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
      setThreads(await parentPortalService.listChildThreads(selected.uid));
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => {
    void load();
  }, [load]);

  const openThread = async (threadId: string) => {
    setOpenThreadId(threadId);
    const msgs = await parentPortalService.listChildMessages(threadId);
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

  if (!selected) {
    return (
      <View style={styles.center}>
        <ProDayText variant="body" muted>
          Sélectionnez un enfant.
        </ProDayText>
      </View>
    );
  }

  if (openThreadId) {
    return (
      <View style={styles.root}>
        <Pressable onPress={() => setOpenThreadId(null)} style={styles.back}>
          <ProDayText variant="caption" accent>
            ← Retour aux conversations
          </ProDayText>
        </Pressable>
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
    );
  }

  const contacts = selected.settings.approved_contacts ?? [];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ProDayText variant="section">Messages de {selected.display_name}</ProDayText>
      <ProDayText variant="caption" muted>
        Consultation des conversations + approbation / blocage des contacts.
      </ProDayText>

      <ProDaySurface variant="module" style={styles.card}>
        <ProDayText variant="section">Contacts approuvés</ProDayText>
        {contacts.length === 0 ? (
          <ProDayText variant="caption" muted>
            Aucun contact enregistré.
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
      </ProDaySurface>

      {loading ? (
        <ActivityIndicator color={c.brand} />
      ) : threads.length === 0 ? (
        <ProDayText variant="body" muted>
          Aucune conversation pour le moment.
        </ProDayText>
      ) : (
        threads.map((thread) => {
          const otherUid = thread.other_user_id;
          const otherName = thread.participant_name || 'Contact';
          const pending = thread.request_status === 'pending';
          return (
            <ProDaySurface key={thread.id} variant="module" style={styles.card}>
              <Pressable onPress={() => void openThread(thread.id)}>
                <ProDayText variant="section">{otherName}</ProDayText>
                <ProDayText variant="caption" muted numberOfLines={2}>
                  {thread.last_message ?? '—'}
                </ProDayText>
                {pending ? (
                  <ProDayText variant="caption" accent>
                    Demande en attente
                  </ProDayText>
                ) : null}
              </Pressable>
              <View style={styles.row}>
                <Pressable
                  onPress={() => void toggleContact(otherUid, String(otherName), true)}
                >
                  <ProDayText variant="caption" accent style={styles.link}>
                    Approuver
                  </ProDayText>
                </Pressable>
                <Pressable
                  onPress={() => void toggleContact(otherUid, String(otherName), false)}
                >
                  <ProDayText variant="caption" muted style={styles.link}>
                    Bloquer
                  </ProDayText>
                </Pressable>
                {pending && thread.request_id ? (
                  <>
                    <Pressable
                      onPress={() =>
                        void parentPortalService
                          .resolveMessageRequest(thread.request_id!, 'accepted')
                          .then(load)
                      }
                    >
                      <ProDayText variant="caption" accent style={styles.link}>
                        Accepter demande
                      </ProDayText>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        void parentPortalService
                          .resolveMessageRequest(thread.request_id!, 'refused')
                          .then(load)
                      }
                    >
                      <ProDayText variant="caption" muted style={styles.link}>
                        Refuser
                      </ProDayText>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </ProDaySurface>
          );
        })
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg },
  msg: { padding: spacing.md, gap: 4, borderRadius: radius.md },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  link: { fontWeight: '700' },
  back: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
});
