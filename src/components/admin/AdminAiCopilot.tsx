import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { AdminButton } from './AdminButton';
import { adminChrome, adminType, ADMIN_ON_ACCENT } from '../../theme/adminTheme';
import { spacing } from '../../theme/designTokens';
import { useAdminData } from '../../context/AdminDataContext';
import {
  answerAdminCopilot,
  type AdminCopilotAction,
  type AdminCopilotReply,
  type AdminCopilotSnapshot,
} from '../../utils/adminCopilot';
import type { AdminNavTarget } from '../../navigation/adminNavConfig';
import { ADMIN_NAV_DESKTOP_BREAKPOINT } from '../../navigation/adminNavConfig';

type Msg = { id: string; role: 'user' | 'assistant'; text: string; reply?: AdminCopilotReply };

type CopilotCtx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  ask: (query: string) => AdminCopilotReply;
  messages: Msg[];
};

const Ctx = createContext<CopilotCtx | null>(null);

function snapshotFromData(data: ReturnType<typeof useAdminData>): AdminCopilotSnapshot {
  return {
    users: data.users.map((u) => ({
      uid: u.uid,
      display_name: u.display_name,
      email: u.email,
      role: u.role,
      subscription_tier: u.subscription_tier,
      last_active_at: u.last_active_at,
      verification_status: u.verification_status,
      club_id: u.profile?.club_id,
    })),
    clubs: data.clubs.map((c) => ({
      id: c.id,
      name: c.name,
      created_at: c.created_at,
      verified: c.verified,
    })),
    events: data.events.map((e) => ({ club_id: e.club_id, starts_at: e.starts_at })),
    payments: data.payments.map((p) => ({
      id: p.id,
      status: p.status,
      amount_eur: p.amount_eur,
      member_name: p.member_name,
      member_uid: p.member_uid,
      label: p.label,
    })),
    workQueue: data.workQueue,
    reelReports: data.reelReports.map((r) => ({ id: r.id })),
    cameras: data.cameras,
    dailySnapshots: data.dailySnapshots,
  };
}

export function AdminAiCopilotProvider({
  children,
  onNavigate,
}: {
  children: React.ReactNode;
  onNavigate: (target: AdminNavTarget) => void;
}) {
  const data = useAdminData();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);

  const ask = useCallback(
    (query: string) => {
      const reply = answerAdminCopilot(query, snapshotFromData(data));
      const id = `${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: `${id}-u`, role: 'user', text: query.trim() },
        { id: `${id}-a`, role: 'assistant', text: reply.text, reply },
      ]);
      return reply;
    },
    [data],
  );

  const value = useMemo(
    () => ({ open, setOpen, ask, messages }),
    [open, ask, messages],
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <AdminAiCopilotHost onNavigate={onNavigate} />
    </Ctx.Provider>
  );
}

export function useAdminAiCopilot(): CopilotCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAdminAiCopilot hors provider');
  return ctx;
}

export function AdminAiCopilotFab() {
  const { setOpen, open } = useAdminAiCopilot();
  return (
    <PressableSpring
      onPress={() => setOpen(!open)}
      style={fabStyles.fab}
      scaleTo={0.94}
      haptic
      accessibilityLabel="ProDay AI"
    >
      <Icon name="star-four-points" size={20} color={ADMIN_ON_ACCENT} />
    </PressableSpring>
  );
}

function AdminAiCopilotHost({ onNavigate }: { onNavigate: (t: AdminNavTarget) => void }) {
  const { width } = useWindowDimensions();
  const desktop = width >= ADMIN_NAV_DESKTOP_BREAKPOINT;
  const { open, setOpen } = useAdminAiCopilot();
  const insets = useSafeAreaInsets();

  if (!open) return null;

  const panel = (
    <AdminCopilotConversation
      embedded={false}
      onNavigate={(t) => {
        onNavigate(t);
        setOpen(false);
      }}
      onClose={() => setOpen(false)}
    />
  );

  if (desktop) {
    return (
      <View style={hostStyles.desktopWrap} pointerEvents="box-none">
        <Pressable style={hostStyles.desktopScrim} onPress={() => setOpen(false)} />
        <View style={[hostStyles.desktopPanel, { paddingTop: insets.top + 8 }]}>{panel}</View>
      </View>
    );
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={() => setOpen(false)}>
      <View style={hostStyles.sheetOverlay}>
        <Pressable style={hostStyles.sheetScrim} onPress={() => setOpen(false)} />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[hostStyles.sheet, { paddingBottom: insets.bottom + 8 }]}
        >
          {panel}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function AdminCopilotConversation({
  embedded,
  onNavigate,
  onClose,
  seedQuery,
}: {
  embedded?: boolean;
  onNavigate: (t: AdminNavTarget) => void;
  onClose?: () => void;
  seedQuery?: string;
}) {
  const { ask, messages, setOpen } = useAdminAiCopilot();
  const [input, setInput] = useState(seedQuery ?? '');
  const styles = useMemo(() => createConvStyles(), []);

  const run = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    const reply = ask(trimmed);
    setInput('');
    return reply;
  };

  const handleAction = (action: AdminCopilotAction, reply: AdminCopilotReply) => {
    if (action.id === 'copy_report') {
      const text = reply.reportText ?? reply.text;
      void copyOrShare(text);
      return;
    }
    if (action.id === 'prepare_relance') {
      Alert.alert('Brouillon de relance', reply.relanceDraft ?? 'Aucun destinataire.', [
        { text: 'Fermer', style: 'cancel' },
        {
          text: 'Copier',
          onPress: () => void copyOrShare(reply.relanceDraft ?? ''),
        },
      ]);
      return;
    }
    if (action.id === 'global_notification') {
      Alert.alert(
        'Notification globale',
        'Aucun envoi automatique. Confirmez pour ouvrir Contenu → Fil (annonces plateforme).',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Ouvrir le fil',
            onPress: () => {
              if (action.nav) onNavigate(action.nav);
              setOpen(false);
            },
          },
        ],
      );
      return;
    }
    if (action.nav) {
      onNavigate(action.nav);
      setOpen(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <View>
          <Text style={styles.kicker}>ProDay AI</Text>
          <Text style={styles.title}>Copilote fondateur</Text>
        </View>
        {onClose ? (
          <PressableSpring onPress={onClose} style={styles.closeBtn} scaleTo={0.94}>
            <Icon name="close" size={16} color={adminChrome.text} />
          </PressableSpring>
        ) : null}
      </View>
      <Text style={styles.hint}>
        Réponses bâties sur les faits Firestore chargés. Aucun chiffre inventé.
      </Text>
      <ScrollView style={styles.thread} contentContainerStyle={styles.threadInner}>
        {messages.length === 0 ? (
          <Text style={styles.empty}>
            Ex. « Combien de clubs ? », « Paiements en attente », « Prépare un rapport ».
          </Text>
        ) : (
          messages.map((m) => (
            <View
              key={m.id}
              style={[styles.bubble, m.role === 'user' ? styles.bubbleUser : styles.bubbleAi]}
            >
              <Text style={m.role === 'user' ? styles.userText : styles.aiText}>{m.text}</Text>
              {m.reply?.actions?.length ? (
                <View style={styles.actions}>
                  {m.reply.actions.map((a) => (
                    <AdminButton
                      key={a.id}
                      label={a.label}
                      variant={a.sensitive ? 'secondary' : 'outline'}
                      size="sm"
                      onPress={() => handleAction(a, m.reply!)}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="Posez une question…"
          placeholderTextColor={adminChrome.textMuted}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => run(input)}
          returnKeyType="send"
        />
        <AdminButton
          icon="star-four-points"
          variant="primary"
          size="sm"
          onPress={() => run(input)}
          accessibilityLabel="Envoyer"
        />
      </View>
      {embedded ? null : null}
    </View>
  );
}

async function copyOrShare(text: string) {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav?.clipboard?.writeText) {
      await nav.clipboard.writeText(text);
      Alert.alert('Copié', 'Le texte est dans le presse-papiers.');
      return;
    }
  } catch {
    /* share fallback */
  }
  await Share.share({ message: text });
}

const fabStyles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 22,
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: adminChrome.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: adminChrome.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 40,
  },
});

const hostStyles = StyleSheet.create({
  desktopWrap: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    zIndex: 50,
  },
  desktopScrim: { flex: 1, backgroundColor: adminChrome.scrim },
  desktopPanel: {
    width: 420,
    maxWidth: '100%',
    backgroundColor: adminChrome.shell,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: adminChrome.shellBorder,
  },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end' },
  sheetScrim: { flex: 1, backgroundColor: adminChrome.scrim },
  sheet: {
    height: '78%',
    backgroundColor: adminChrome.shell,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
});

function createConvStyles() {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: adminChrome.shell },
    head: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
    },
    kicker: {
      color: adminChrome.accent,
      fontFamily: adminType.bodyExtra,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1.3,
      textTransform: 'uppercase',
    },
    title: {
      color: adminChrome.text,
      fontFamily: adminType.bodyExtra,
      fontSize: 18,
      fontWeight: '800',
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: adminChrome.shellElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    hint: {
      color: adminChrome.textMuted,
      fontSize: 12,
      paddingHorizontal: spacing.md,
      paddingTop: 6,
      lineHeight: 17,
    },
    thread: { flex: 1 },
    threadInner: { padding: spacing.md, gap: spacing.sm, paddingBottom: 24 },
    empty: { color: adminChrome.textMuted, fontSize: 13, lineHeight: 20 },
    bubble: { borderRadius: 14, padding: spacing.sm, gap: 8 },
    bubbleUser: { alignSelf: 'flex-end', backgroundColor: adminChrome.accent, maxWidth: '92%' },
    bubbleAi: {
      alignSelf: 'stretch',
      backgroundColor: adminChrome.shellElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
    userText: { color: ADMIN_ON_ACCENT, fontSize: 14, lineHeight: 20 },
    aiText: { color: adminChrome.text, fontSize: 14, lineHeight: 20 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    composer: {
      flexDirection: 'row',
      gap: 8,
      padding: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: adminChrome.shellBorder,
      alignItems: 'center',
    },
    input: {
      flex: 1,
      minHeight: 42,
      borderRadius: 12,
      paddingHorizontal: 12,
      color: adminChrome.text,
      backgroundColor: adminChrome.shellElevated,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: adminChrome.shellBorder,
    },
  });
}
