import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { InteractiveListItem, SkeletonList } from '../components/motion';
import { SearchBar } from '../components/ui/SearchBar';
import { ProDayModuleHeader } from '../components/ui/ProDayModuleHeader';
import { ProDayScreenCanvas } from '../components/ui/ProDayScreenCanvas';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { ProDayText } from '../components/ui/ProDayText';
import { Icon } from '../components/ui/Icon';
import { MessageThreadRow } from '../components/messages/MessageThreadRow';
import { MessagesEmptyState } from '../components/messages/MessagesEmptyState';
import { useMessagesData } from '../hooks/useAppData';
import { Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { profileService } from '../services/profile.service';
import { ROLES_REQUIRING_VERIFICATION } from '../models/User';
import { physioCareThreadLabel } from '../utils/physioMessaging';
import { ChatScreen } from './ChatScreen';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { ProDaySelect } from '../components/ui/ProDaySelect';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { V3TabShell } from '../components/v3/V3TabShell';
import { isV3ShellEnabled } from '../config/featureFlags';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import { useDashboardData } from '../hooks/useDashboardData';
import { buildSocialSuggestions } from '../features/v3/engines/socialRecommendation.engine';
import type { SocialProfileSuggestion } from '../features/v3/engines/socialRecommendation.engine';
import { SocialSuggestionsStrip } from '../components/messages/SocialSuggestionsStrip';
import { openContactConversation } from '../utils/openContactConversation';
import { usersService } from '../services/users.service';
import { trackV3Event } from '../core/analytics/v3Events';

export const MessagesScreen: React.FC = () => {
  const { profile, loading: authLoading } = useAuth();
  const { pendingChatThreadId, clearPendingChat, openAuth } = useTabNavigation();
  const nav = useTabNavigationActions();
  const { threads, loading, refresh } = useMessagesData(profile?.uid);
  const { data: dashboardData } = useDashboardData(profile);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [threadFilter, setThreadFilter] = useState<'all' | 'unread' | 'care'>('all');
  const { colors: c, productLine } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const isWoman = productLine === 'woman';
  const useV3Header = isV3ShellEnabled();

  const mustVerify =
    profile &&
    ROLES_REQUIRING_VERIFICATION.includes(profile.role) &&
    !profileService.canPerformSensitiveAction(profile);

  const unreadCount = threads.filter((t) => t.unread).length;
  const intelligence = useSectionIntelligence('messages', profile, productLine, {
    unreadMessages: unreadCount,
  });

  const socialSuggestions = useMemo(() => {
    if (!useV3Header || !profile) return [];
    return buildSocialSuggestions({
      user: profile,
      userLocation: profile.location,
      openMatches: dashboardData.openMatches,
    });
  }, [useV3Header, profile, dashboardData.openMatches]);

  const handleSocialSuggestion = async (suggestion: SocialProfileSuggestion) => {
    if (!profile) return;
    trackV3Event('social_suggestion_tap', {
      id: suggestion.id,
      score: suggestion.matchScore,
    });
    if (suggestion.targetUid) {
      const target = await usersService.getById(suggestion.targetUid);
      if (target) {
        await openContactConversation(
          profile,
          target,
          suggestion.displayName,
          setActiveThreadId
        );
        return;
      }
    }
    if (suggestion.actionTab) {
      nav.setActiveTab(suggestion.actionTab);
    }
  };

  const filteredThreads = useMemo(() => {
    const q = search.trim().toLowerCase();
    return threads.filter((t) => {
      if (threadFilter === 'unread' && !t.unread) return false;
      if (threadFilter === 'care' && !t.thread_kind?.startsWith('physio')) return false;
      if (!q) return true;
      return (
        t.participant_name.toLowerCase().includes(q) ||
        (t.last_message?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [threads, search, threadFilter]);

  useEffect(() => {
    if (pendingChatThreadId) {
      if (mustVerify) {
        clearPendingChat();
        Alert.alert(
          'Messagerie bloquée',
          'Validez votre diplôme ou licence depuis l’onglet Profil.',
        );
        return;
      }
      setActiveThreadId(pendingChatThreadId);
      clearPendingChat();
    }
  }, [pendingChatThreadId, clearPendingChat, mustVerify]);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (activeThreadId && profile && !mustVerify) {
    return (
      <ChatScreen
        threadId={activeThreadId}
        otherName={activeThread?.participant_name ?? 'Conversation'}
        currentUid={profile.uid}
        currentUser={profile}
        onBack={() => {
          setActiveThreadId(null);
          refresh();
        }}
      />
    );
  }

  const messagesBody = (
    <>
        {profile && unreadCount > 0 ? (
          <ProDaySurface variant="accent" style={styles.unreadBanner}>
            <Icon name="chat" size={16} color={c.accent} variant="filled" />
            <ProDayText variant="caption" accent style={styles.unreadBannerText}>
              {unreadCount} message{unreadCount > 1 ? 's' : ''} non lu{unreadCount > 1 ? 's' : ''}
            </ProDayText>
          </ProDaySurface>
        ) : null}

        {profile ? (
          <ProDaySurface variant="flat" style={styles.notice}>
            <Icon name="shield" size={16} color={c.textMuted} />
            <ProDayText variant="caption" muted style={styles.noticeText}>
              Comptes mineurs : contacts approuvés uniquement. Coachs et agents vérifiés pour
              contacter un mineur.
            </ProDayText>
          </ProDaySurface>
        ) : null}

        {profile ? (
          <>
            <SearchBar placeholder="Rechercher une conversation…" value={search} onChangeText={setSearch} />
            <ProDaySelect<'all' | 'unread' | 'care'>
              label="Filtrer"
              placeholder="Toutes les conversations"
              options={[
                { id: 'all', label: 'Tous' },
                {
                  id: 'unread',
                  label: 'Non lus',
                  hint:
                    unreadCount > 0
                      ? `${unreadCount} non lu${unreadCount > 1 ? 's' : ''}`
                      : undefined,
                },
                { id: 'care', label: 'Kiné' },
              ]}
              value={threadFilter}
              onChange={setThreadFilter}
            />
          </>
        ) : null}

        {profile && useV3Header ? (
          <SocialSuggestionsStrip
            suggestions={socialSuggestions}
            onPress={(suggestion) => void handleSocialSuggestion(suggestion)}
          />
        ) : null}

        {!authLoading && !profile ? (
          <MessagesEmptyState
            variant="guest"
            title="Connectez-vous"
            description="Accédez à vos conversations avec les clubs, coachs et kinés de la communauté ProDay."
            ctaLabel="Se connecter"
            onCta={() => openAuth('login')}
            secondaryCtaLabel="Créer un compte"
            onSecondaryCta={() => openAuth('signup')}
          />
        ) : null}

        {mustVerify ? (
          <ProDaySurface variant="module" style={styles.blocked}>
            <Icon name="warning" size={22} color={c.warning} />
            <View style={styles.blockedCopy}>
              <ProDayText variant="section" style={{ color: c.warning }}>
                Messagerie bloquée
              </ProDayText>
              <ProDayText variant="body" muted>
                Validez votre diplôme ou licence depuis l&apos;onglet Profil.
              </ProDayText>
            </View>
          </ProDaySurface>
        ) : null}

        {loading && profile ? (
          <SkeletonList count={5} variant="row" />
        ) : profile && threads.length === 0 ? (
          <MessagesEmptyState
            title="Aucune conversation"
            description={
              isWoman
                ? 'Contactez une joueuse ou un coach depuis le Mercato pour démarrer un échange.'
                : 'Contactez un joueur ou un coach depuis le Mercato pour démarrer un échange.'
            }
            ctaLabel="Ouvrir le Mercato"
            onCta={() => nav.setActiveTab('recrutement')}
          />
        ) : profile && filteredThreads.length === 0 ? (
          <MessagesEmptyState
            title="Aucun résultat"
            description="Essayez un autre filtre ou une autre recherche."
            ctaLabel="Réinitialiser les filtres"
            onCta={() => {
              setSearch('');
              setThreadFilter('all');
            }}
          />
        ) : profile ? (
          <FlatList
            data={filteredThreads}
            keyExtractor={(t) => t.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={c.accent}
              />
            }
            renderItem={({ item, index }) => (
              <InteractiveListItem index={index}>
                <MessageThreadRow
                  thread={item}
                  kineLabel={physioCareThreadLabel(item.thread_kind) ?? undefined}
                  onPress={() => setActiveThreadId(item.id)}
                  disabled={!!mustVerify}
                />
              </InteractiveListItem>
            )}
          />
        ) : null}
    </>
  );

  if (useV3Header) {
    return (
      <V3TabShell
        caption="Messagerie"
        title="Messages"
        subtitle={
          isWoman ? 'Échanges coach, agent & kiné' : 'Échanges coach, agent & kiné'
        }
        flat
        intelligence={intelligence}
        stats={
          profile
            ? [
                { value: threads.length, label: 'Fils' },
                {
                  value: unreadCount,
                  label: 'Non lus',
                  highlight: unreadCount > 0,
                },
                {
                  value: threads.filter((t) => t.thread_kind?.startsWith('physio')).length,
                  label: 'Kiné',
                },
              ]
            : undefined
        }
      >
        {messagesBody}
      </V3TabShell>
    );
  }

  return (
    <ProDayScreenCanvas flat>
      <View style={styles.container}>
        <ProDayModuleHeader
          eyebrow="Messagerie"
          title="Messages"
          subtitle={
            isWoman
              ? 'Échanges coach, agent & kiné'
              : 'Échanges coach, agent & kiné'
          }
          icon="chat"
        />

        {messagesBody}
      </View>
    </ProDayScreenCanvas>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1 },
    unreadBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.sm,
      padding: spacing.sm,
    },
    unreadBannerText: { fontWeight: '800' },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    noticeText: { flex: 1, lineHeight: 18 },
    loader: { marginTop: spacing.xl },
    blocked: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      padding: spacing.md,
      borderColor: c.warning,
      borderWidth: 1,
      borderRadius: radius.lg,
    },
    blockedCopy: { flex: 1, gap: 4 },
    list: {
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
    },
  });
}
