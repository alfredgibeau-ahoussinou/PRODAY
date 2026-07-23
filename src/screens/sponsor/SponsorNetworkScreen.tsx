import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useMessagesData } from '../../hooks/useAppData';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useSponsorShellOptional } from '../../context/SponsorShellContext';
import { useSponsorDashboard } from '../../hooks/useSponsorDashboard';
import { ChatScreen } from '../ChatScreen';
import { SponsorScreenHeader } from '../../components/sponsor/SponsorScreenHeader';
import { SPONSOR_MESSAGE_TEMPLATES } from '../../content/sponsorContent';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { SPONSOR_NAV_INSET } from '../../navigation/sponsorTabConfig';
import { SPONSOR_THEME } from '../../content/sponsorExperience';
import { spacing, radius } from '../../theme/designTokens';
import { openSponsorProspectChat } from '../../utils/openSponsorProspectChat';
import type { SponsorProspect } from '../../models/SponsorOffer';
import { PushScreenTransition } from '../../components/motion';
import { SponsorQuotaBanner } from '../../components/sponsor/SponsorQuotaBanner';

interface SponsorNetworkScreenProps {
  shellMode?: boolean;
  initialSegment?: 'messages' | 'prospects';
}

export const SponsorNetworkScreen: React.FC<SponsorNetworkScreenProps> = ({
  shellMode = false,
  initialSegment = 'messages',
}) => {
  const profile = useSessionProfile();
  const company = profile?.profile.job_title ?? profile?.display_name;
  const tabNav = useTabNavigation();
  const sponsorShell = useSponsorShellOptional();
  const pendingChatThreadId = sponsorShell?.pendingChatThreadId ?? tabNav.pendingChatThreadId;
  const pendingChatDraft = sponsorShell?.pendingChatDraft ?? null;
  const clearPendingChat = sponsorShell?.clearPendingChat ?? tabNav.clearPendingChat;
  const bottomInset = shellMode ? SPONSOR_NAV_INSET : TAB_BAR_CONTENT_INSET;
  const { threads, loading, refresh } = useMessagesData(profile?.uid);
  const { prospects, analytics, loading: sponsorLoading, stats } = useSponsorDashboard(
    profile?.uid,
    company
  );
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState<string | undefined>();
  const [draftNonce, setDraftNonce] = useState(0);
  const [pendingTemplate, setPendingTemplate] = useState<string | null>(null);
  const [segment, setSegment] = useState<'messages' | 'prospects'>(initialSegment);

  useEffect(() => {
    if (pendingChatThreadId) {
      setActiveThreadId(pendingChatThreadId);
      setChatDraft(pendingChatDraft ?? undefined);
      setDraftNonce((n) => n + 1);
      clearPendingChat();
    }
  }, [pendingChatThreadId, pendingChatDraft, clearPendingChat]);

  const handleContactProspect = (prospect: SponsorProspect) => {
    if (!profile) return;
    void openSponsorProspectChat(profile, prospect, (threadId, draft) => {
      setChatDraft(pendingTemplate ?? draft);
      setPendingTemplate(null);
      setActiveThreadId(threadId);
      setDraftNonce((n) => n + 1);
      setSegment('messages');
    });
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);

  const applyTemplate = (text: string) => {
    if (activeThreadId) {
      setChatDraft(text);
      setPendingTemplate(null);
      setDraftNonce((n) => n + 1);
      return;
    }
    if (threads.length > 0) {
      setActiveThreadId(threads[0].id);
      setChatDraft(text);
      setPendingTemplate(null);
      setDraftNonce((n) => n + 1);
      setSegment('messages');
      return;
    }
    setPendingTemplate(text);
    setSegment('prospects');
  };

  let chatOverlay: React.ReactNode = null;
  if (activeThreadId && profile && activeThread) {
    chatOverlay = (
      <ChatScreen
        key={`${activeThreadId}-${draftNonce}`}
        threadId={activeThreadId}
        otherName={activeThread.participant_name}
        currentUid={profile.uid}
        currentUser={profile}
        initialDraft={chatDraft}
        onBack={() => {
          setActiveThreadId(null);
          setChatDraft(undefined);
          refresh();
        }}
      />
    );
  } else if (activeThreadId && profile) {
    chatOverlay = (
      <ChatScreen
        key={`${activeThreadId}-${draftNonce}`}
        threadId={activeThreadId}
        otherName="Contact club"
        currentUid={profile.uid}
        currentUser={profile}
        initialDraft={chatDraft}
        onBack={() => {
          setActiveThreadId(null);
          setChatDraft(undefined);
          refresh();
        }}
      />
    );
  }

  const isLoading = loading || sponsorLoading;

  return (
    <>
    <View style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + spacing.xl }]}>
        {!shellMode ? (
          <SponsorScreenHeader
            title="Réseau sponsors"
            subtitle="Messages clubs, prospects locaux et modèles pour accélérer vos prises de contact."
          />
        ) : null}

        {profile ? (
          <SponsorQuotaBanner profile={profile} activeOffers={stats.activeOffers} />
        ) : null}

        {analytics ? (
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{threads.length}</Text>
              <Text style={styles.statLabel}>Conversations</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{analytics.leads}</Text>
              <Text style={styles.statLabel}>Contacts</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{prospects.length}</Text>
              <Text style={styles.statLabel}>Prospects</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Modèles rapides</Text>
        {pendingTemplate ? (
          <Text style={styles.templateHint}>
            Modèle prêt — choisissez un prospect pour l’insérer dans le message.
          </Text>
        ) : null}
        <View style={styles.templateRow}>
          {SPONSOR_MESSAGE_TEMPLATES.map((tpl) => (
            <TouchableOpacity
              key={tpl.id}
              style={[
                styles.templateChip,
                pendingTemplate === tpl.text && styles.templateChipActive,
              ]}
              onPress={() => applyTemplate(tpl.text)}
            >
              <Text
                style={[
                  styles.templateLabel,
                  pendingTemplate === tpl.text && styles.templateLabelActive,
                ]}
              >
                {tpl.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, segment === 'messages' && styles.segmentOn]}
            onPress={() => setSegment('messages')}
            testID="sponsor-network-segment-messages"
          >
            <Text style={[styles.segmentText, segment === 'messages' && styles.segmentTextOn]}>
              Messages ({threads.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, segment === 'prospects' && styles.segmentOn]}
            onPress={() => setSegment('prospects')}
            testID="sponsor-network-segment-prospects"
          >
            <Text style={[styles.segmentText, segment === 'prospects' && styles.segmentTextOn]}>
              Prospects ({prospects.length})
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={SPONSOR_THEME.primary} style={styles.loader} />
        ) : !profile ? (
          <Text style={styles.empty}>Connectez-vous pour accéder au réseau.</Text>
        ) : segment === 'prospects' ? (
          prospects.length === 0 ? (
            <Text style={styles.empty}>Aucun prospect pour le moment.</Text>
          ) : (
            prospects.map((p) => (
              <View key={p.id} style={styles.prospectCard}>
                <View style={styles.prospectScore}>
                  <Text style={styles.prospectScoreText}>{p.match_score}</Text>
                </View>
                <View style={styles.prospectBody}>
                  <Text style={styles.prospectName}>{p.name}</Text>
                  <Text style={styles.prospectMeta}>
                    {p.city} · {p.category}
                  </Text>
                  <Text style={styles.prospectReason}>{p.reason}</Text>
                </View>
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() => handleContactProspect(p)}
                >
                  <Text style={styles.contactBtnText}>Contacter</Text>
                </TouchableOpacity>
              </View>
            ))
          )
        ) : threads.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Aucun message</Text>
            <Text style={styles.empty}>
              Publiez une offre ou consultez les prospects pour démarrer une conversation.
            </Text>
          </View>
        ) : (
          threads.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.thread}
              onPress={() => setActiveThreadId(item.id)}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.participant_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.threadBody}>
                <Text style={styles.threadName}>{item.participant_name}</Text>
                <Text style={styles.threadPreview} numberOfLines={1}>
                  {item.last_message || 'Nouvelle conversation'}
                </Text>
              </View>
              {item.unread ? <View style={styles.unreadDot} /> : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
    <PushScreenTransition active={Boolean(activeThreadId && profile)}>{chatOverlay}</PushScreenTransition>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SPONSOR_THEME.background },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  statBox: {
    flex: 1,
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
  },
  statValue: { fontSize: 18, fontWeight: '900', color: SPONSOR_THEME.text },
  statLabel: { fontSize: 9, fontWeight: '700', color: SPONSOR_THEME.textMuted, marginTop: 4 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: SPONSOR_THEME.sectionLabel,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  templateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  templateHint: {
    fontSize: 12,
    color: SPONSOR_THEME.gold,
    marginBottom: spacing.sm,
    lineHeight: 17,
  },
  templateChip: {
    backgroundColor: SPONSOR_THEME.primarySoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.primaryBorder,
  },
  templateChipActive: {
    borderColor: SPONSOR_THEME.gold,
    backgroundColor: 'rgba(212, 175, 55, 0.12)',
  },
  templateLabel: { fontSize: 11, fontWeight: '800', color: SPONSOR_THEME.heroSubtext },
  templateLabelActive: { color: SPONSOR_THEME.gold },
  segmentRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    backgroundColor: SPONSOR_THEME.surface,
    alignItems: 'center',
  },
  segmentOn: { backgroundColor: SPONSOR_THEME.primary, borderColor: SPONSOR_THEME.primary },
  segmentText: { fontSize: 12, fontWeight: '700', color: SPONSOR_THEME.textMuted },
  segmentTextOn: { color: SPONSOR_THEME.onPrimary },
  loader: { marginTop: spacing.xl },
  emptyCard: {
    padding: spacing.xl,
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: SPONSOR_THEME.text, marginBottom: spacing.sm },
  empty: {
    color: SPONSOR_THEME.textMuted,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },
  prospectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
  },
  prospectScore: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: SPONSOR_THEME.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prospectScoreText: { fontSize: 13, fontWeight: '900', color: SPONSOR_THEME.primary },
  prospectBody: { flex: 1 },
  prospectName: { fontSize: 14, fontWeight: '800', color: SPONSOR_THEME.text },
  prospectMeta: { fontSize: 11, color: SPONSOR_THEME.textMuted, marginTop: 2 },
  prospectReason: { fontSize: 11, color: SPONSOR_THEME.textSecondary, marginTop: 4 },
  contactBtn: {
    backgroundColor: SPONSOR_THEME.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.md,
  },
  contactBtnText: { fontSize: 10, fontWeight: '800', color: SPONSOR_THEME.onPrimary },
  thread: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: SPONSOR_THEME.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: SPONSOR_THEME.borderSubtle,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: SPONSOR_THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  avatarText: { fontSize: 18, fontWeight: '900', color: SPONSOR_THEME.onPrimary },
  threadBody: { flex: 1 },
  threadName: { fontSize: 15, fontWeight: '700', color: SPONSOR_THEME.text },
  threadPreview: { fontSize: 13, color: SPONSOR_THEME.textSecondary, marginTop: 4 },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: SPONSOR_THEME.primary,
    marginLeft: spacing.sm,
  },
});
