import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { useMessagesData } from '../hooks/useAppData';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { useFavorites } from '../hooks/useFavorites';
import { profileService } from '../services/profile.service';
import { ROLES_REQUIRING_VERIFICATION, type User, type UserRole } from '../models/User';
import {
  categorizeConversations,
  filterByCategory,
  matchesConversationQuery,
  type ConversationCategory,
  type ConversationKind,
} from '../features/messaging/conversationCategories';
import { physioCareThreadLabel } from '../utils/physioMessaging';
import { ChatScreen } from './ChatScreen';
import { PlayerProfileScreen } from './PlayerProfileScreen';
import { CoachProfileScreen } from './CoachProfileScreen';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { useDashboardData } from '../hooks/useDashboardData';
import { fetchSocialSuggestions } from '../services/socialSuggestions.service';
import type { SocialProfileSuggestion } from '../features/v3/engines/socialRecommendation.engine';
import { openContactConversation } from '../utils/openContactConversation';
import { usersService } from '../services/users.service';
import { networkSuggestionsService } from '../services/networkSuggestions.service';
import { messagesService } from '../services/messages.service';
import { evaluateMessagingPermission } from '../utils/parentalMessaging';
import { isPlayerProfileRole } from '../utils/isPlayerProfileRole';
import { trackV3Event } from '../core/analytics/v3Events';
import type { MessagesThreadFilter } from '../content/messagesChapters';

/** Catégories par rôle : seules ces valeurs déclenchent une résolution de rôle réseau. */
const ROLE_CATEGORY_FILTERS: MessagesThreadFilter[] = ['players', 'parents', 'coaches', 'club_staff'];
import { MessagesHomeScreen } from '../components/messages/MessagesHomeScreen';
import { useTranslation } from '../context/LocaleContext';
import { useCoachShellNav } from '../features/coach/shell/CoachShellNavContext';
import { useJoueurSession } from '../context/JoueurSessionContext';
import {
  MessagesNetworkSheet,
  type NetworkSheetAction,
} from '../components/messages/MessagesNetworkSheet';
import { PushScreenTransition } from '../components/motion';
import { sortThreadsForInbox } from '../utils/messagesInboxModel';
import { CreateGroupSheet } from '../components/messages/CreateGroupSheet';

export const MessagesScreen: React.FC = () => {
  const { t } = useTranslation();
  const { profile, loading: authLoading } = useAuth();
  const { pendingChatThreadId, clearPendingChat, openAuth } = useTabNavigation();
  const nav = useTabNavigationActions();
  const coachShell = Boolean(useCoachShellNav());
  const joueurSession = useJoueurSession();
  const joueurLive = Boolean(
    joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate,
  );
  const messagesVariant = coachShell ? 'coach' : joueurLive ? 'joueur' : 'default';
  const { threads, loading, refresh } = useMessagesData(profile?.uid);
  const { data: dashboardData } = useDashboardData(profile);
  const favorites = useFavorites(profile?.uid);

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [threadFilter, setThreadFilter] = useState<MessagesThreadFilter>('all');

  const [networkSheet, setNetworkSheet] = useState<SocialProfileSuggestion | null>(null);
  const [networkTarget, setNetworkTarget] = useState<User | null>(null);
  const [loadingNetworkTarget, setLoadingNetworkTarget] = useState(false);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [networkProfileUser, setNetworkProfileUser] = useState<User | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const { productLine, isWoman } = useThemedScreen();

  const mustVerify =
    profile &&
    ROLES_REQUIRING_VERIFICATION.includes(profile.role) &&
    !profileService.canPerformSensitiveAction(profile);

  const unreadCount = threads.filter((t) => t.unread).length;

  const [allSocialSuggestions, setAllSocialSuggestions] = useState<SocialProfileSuggestion[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);

  const socialSuggestions = useMemo(
    () => allSocialSuggestions.filter((s) => !dismissedIds.has(s.id)),
    [allSocialSuggestions, dismissedIds]
  );

  const hiddenNetworkCount = allSocialSuggestions.length - socialSuggestions.length;

  const loadSocialSuggestions = useCallback(async () => {
    if (!profile) {
      setAllSocialSuggestions([]);
      return;
    }
    setLoadingSocial(true);
    try {
      const list = await fetchSocialSuggestions({
        user: profile,
        openMatches: dashboardData.openMatches,
      });
      setAllSocialSuggestions(list);
    } catch {
      setAllSocialSuggestions([]);
    } finally {
      setLoadingSocial(false);
    }
  }, [profile, dashboardData.openMatches]);

  useEffect(() => {
    void loadSocialSuggestions();
  }, [loadSocialSuggestions]);

  useEffect(() => {
    if ((coachShell || (joueurLive && !coachShell)) && threadFilter === 'care') {
      setThreadFilter('all');
    }
  }, [coachShell, joueurLive, threadFilter]);

  useEffect(() => {
    if (!profile?.uid) {
      setDismissedIds(new Set());
      return;
    }
    void networkSuggestionsService.loadDismissedIds(profile.uid).then(setDismissedIds);
  }, [profile?.uid]);

  const pendingRequestThreads = useMemo(
    () =>
      threads.filter(
        (t) =>
          t.request_status === 'pending' ||
          (t.thread_kind === 'message_request' && t.request_status !== 'accepted'),
      ),
    [threads],
  );

  /**
   * Rôles des participants des conversations **directes**, résolus à la demande.
   * Les groupes portent déjà leurs rôles (`participant_roles`) : rien à résoudre pour eux.
   * Un rôle non résolu laisse la conversation dans « Tous » uniquement — on ne devine pas.
   */
  const [threadRoles, setThreadRoles] = useState<Record<string, UserRole>>({});
  const requestedRolesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!ROLE_CATEGORY_FILTERS.includes(threadFilter)) return;
    const missing = Array.from(
      new Set(
        threads
          .filter((t) => !t.is_group && t.other_user_id)
          .map((t) => t.other_user_id),
      ),
    )
      .filter((uid) => uid && !requestedRolesRef.current.has(uid))
      .slice(0, 20);
    if (missing.length === 0) return;
    missing.forEach((uid) => requestedRolesRef.current.add(uid));

    let cancelled = false;
    void Promise.all(
      missing.map(async (uid) => {
        try {
          const user = await usersService.getById(uid);
          return user ? ([uid, user.role] as const) : null;
        } catch {
          return null;
        }
      }),
    ).then((pairs) => {
      if (cancelled) return;
      setThreadRoles((prev) => {
        const next = { ...prev };
        for (const pair of pairs) if (pair) next[pair[0]] = pair[1];
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [threadFilter, threads]);

  /**
   * Catégorisation et filtrage par les données réelles.
   *
   * La version précédente déduisait la nature d'un fil en cherchant des mots dans son **nom**
   * (`includes('club')`, `includes('officiel')`, `includes('groupe')`) : un simple titre
   * contenant « club » suffisait à le classer en « Annonce ». La classification s'appuie
   * désormais sur `thread_kind`, `is_group` et `is_announcement`.
   */
  const categorizedThreads = useMemo(
    () =>
      categorizeConversations(threads, profile?.uid ?? '', (uid) => threadRoles[uid] ?? null),
    [threads, profile?.uid, threadRoles],
  );

  const filteredThreads = useMemo(() => {
    let list = categorizedThreads;

    if (threadFilter === 'unread') {
      list = list.filter((entry) => entry.thread.unread);
    } else if (ROLE_CATEGORY_FILTERS.includes(threadFilter)) {
      list = filterByCategory(list, threadFilter as ConversationCategory);
    } else if (threadFilter === 'direct' || threadFilter === 'groups' || threadFilter === 'announcements') {
      const wanted: ConversationKind =
        threadFilter === 'direct' ? 'direct' : threadFilter === 'groups' ? 'group' : 'announcement';
      list = list.filter((entry) => entry.kind === wanted);
    } else if (threadFilter === 'care') {
      list = list.filter((entry) => entry.thread.thread_kind?.startsWith('physio'));
    }

    const searched = list.filter((entry) => matchesConversationQuery(entry, search));
    return sortThreadsForInbox(searched.map((entry) => entry.thread));
  }, [categorizedThreads, search, threadFilter]);

  /** Nature affichée sur la ligne : distingue direct, groupe et annonce sans filtre dédié. */
  const threadKindById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const entry of categorizedThreads) map[entry.thread.id] = entry.kind;
    return map;
  }, [categorizedThreads]);


  const resolveRequest = useCallback(
    async (threadId: string, action: 'accept' | 'refuse') => {
      if (!profile?.uid) return;
      try {
        await messagesService.resolveThreadRequest(threadId, profile.uid, action);
        refresh();
      } catch (e) {
        Alert.alert(
          'Demande',
          e instanceof Error ? e.message : 'Impossible de traiter la demande.',
        );
      }
    },
    [profile?.uid, refresh],
  );

  useEffect(() => {
    if (pendingChatThreadId) {
      if (mustVerify) {
        clearPendingChat();
        Alert.alert(
          t('messages.alert.blocked.title'),
          t('messages.alert.blocked.body'),
        );
        return;
      }
      setActiveThreadId(pendingChatThreadId);
      clearPendingChat();
    }
  }, [pendingChatThreadId, clearPendingChat, mustVerify]);

  const activeThread = threads.find((t) => t.id === activeThreadId);

  const loadNetworkTarget = useCallback(async (suggestion: SocialProfileSuggestion) => {
    if (!suggestion.targetUid) {
      setNetworkTarget(null);
      return;
    }
    setLoadingNetworkTarget(true);
    const user = await usersService.getPublicById(suggestion.targetUid);
    setNetworkTarget(user);
    setLoadingNetworkTarget(false);
  }, []);

  const openNetworkSheet = useCallback(
    (suggestion: SocialProfileSuggestion) => {
      if (!profile) return;
      trackV3Event('social_suggestion_tap', {
        id: suggestion.id,
        score: suggestion.matchScore,
        kind: suggestion.kind,
      });
      setNetworkSheet(suggestion);
      setNetworkTarget(null);
      void loadNetworkTarget(suggestion);
    },
    [profile, loadNetworkTarget]
  );

  const closeNetworkSheet = useCallback(() => {
    setNetworkSheet(null);
    setNetworkTarget(null);
    setLoadingNetworkTarget(false);
  }, []);

  const messagePermission = useMemo(() => {
    if (!profile || !networkTarget) return { allowed: false, message: null as string | null };
    if (mustVerify) {
      return {
        allowed: false,
        message: t('messages.verifyDiploma'),
      };
    }
    const result = evaluateMessagingPermission(profile, networkTarget);
    return {
      allowed: result.allowed,
      message: result.allowed ? null : result.message ?? t('messages.unavailable'),
    };
  }, [profile, networkTarget, mustVerify, t]);

  const handleNetworkSheetAction = async (action: NetworkSheetAction) => {
    if (!profile || !networkSheet) return;

    switch (action) {
      case 'profile': {
        if (!networkTarget) return;
        closeNetworkSheet();
        setNetworkProfileUser(networkTarget);
        return;
      }
      case 'favorite': {
        if (!networkSheet.targetUid || favoriteBusy) return;
        setFavoriteBusy(true);
        try {
          await favorites.toggle(
            networkSheet.targetUid,
            networkTarget?.role ?? networkSheet.targetRole
          );
        } catch (e) {
          Alert.alert(
            t('feed.alert.error'),
            e instanceof Error ? e.message : t('messages.favoritesError')
          );
        } finally {
          setFavoriteBusy(false);
        }
        return;
      }
      case 'message': {
        if (!networkTarget) return;
        const suggestion = networkSheet;
        closeNetworkSheet();
        await openContactConversation(
          profile,
          networkTarget,
          suggestion.displayName,
          setActiveThreadId
        );
        return;
      }
      case 'explore': {
        closeNetworkSheet();
        if (networkSheet.actionTab === 'recrutement') {
          nav.setActiveTab('recrutement');
        } else if (networkSheet.matchId) {
          nav.openMatchs({ homeTab: 'matches' });
        } else if (networkSheet.actionTab) {
          nav.setActiveTab(networkSheet.actionTab);
        }
        return;
      }
      case 'dismiss': {
        const next = await networkSuggestionsService.dismiss(profile.uid, networkSheet.id);
        setDismissedIds(next);
        closeNetworkSheet();
        return;
      }
      default:
        return;
    }
  };

  const handleContactFromProfile = async (target: User) => {
    if (!profile) return;
    setNetworkProfileUser(null);
    await openContactConversation(profile, target, target.display_name, setActiveThreadId);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refresh(), favorites.refresh(), loadSocialSuggestions()]);
    setRefreshing(false);
  };

  const restoreHiddenNetwork = async () => {
    if (!profile?.uid) return;
    await networkSuggestionsService.reset(profile.uid);
    setDismissedIds(new Set());
  };

  let profileOverlay: React.ReactNode = null;
  if (networkProfileUser) {
    profileOverlay = isPlayerProfileRole(networkProfileUser.role) ? (
      <PlayerProfileScreen
        player={networkProfileUser}
        onBack={() => setNetworkProfileUser(null)}
        onContact={(user) => void handleContactFromProfile(user)}
      />
    ) : (
      <CoachProfileScreen
        staff={networkProfileUser}
        onBack={() => setNetworkProfileUser(null)}
        onContact={(user) => void handleContactFromProfile(user)}
        onHire={(user) => void handleContactFromProfile(user)}
      />
    );
  }

  let chatOverlay: React.ReactNode = null;
  if (activeThreadId && profile && !mustVerify) {
    chatOverlay = (
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

  return (
    <>
      <MessagesHomeScreen
        profile={profile}
        authLoading={authLoading}
        threads={threads}
        filteredThreads={filteredThreads}
        pendingRequestThreads={pendingRequestThreads}
        loading={loading}
        refreshing={refreshing}
        search={search}
        onSearchChange={setSearch}
        threadFilter={threadFilter}
        onThreadFilterChange={setThreadFilter}
        unreadCount={unreadCount}
        mustVerify={Boolean(mustVerify)}
        socialSuggestions={socialSuggestions}
        loadingSocial={loadingSocial}
        networkSavedCount={favorites.ids.size}
        isNetworkSaved={(uid) => (uid ? favorites.isFavorite(uid) : false)}
        hiddenNetworkCount={hiddenNetworkCount}
        onRestoreHiddenNetwork={() => void restoreHiddenNetwork()}
        onSocialSuggestion={openNetworkSheet}
        onOpenThread={setActiveThreadId}
        onAcceptRequest={(id) => void resolveRequest(id, 'accept')}
        onRefuseRequest={(id) => void resolveRequest(id, 'refuse')}
        onRefresh={() => void onRefresh()}
        onLogin={() => openAuth('login')}
        onSignup={() => openAuth('signup')}
        onOpenMercato={() => nav.setActiveTab('recrutement')}
        onCreateGroup={() => setGroupSheetOpen(true)}
        onResetFilters={() => {
          setSearch('');
          setThreadFilter('all');
        }}
        kineLabelFor={(thread) => physioCareThreadLabel(thread.thread_kind) ?? undefined}
        isWoman={isWoman}
        variant={coachShell ? 'coach' : 'default'}
      />

      <MessagesNetworkSheet
        visible={Boolean(networkSheet)}
        suggestion={networkSheet}
        targetUser={networkTarget}
        loadingTarget={loadingNetworkTarget}
        isFavorite={
          networkSheet?.targetUid ? favorites.isFavorite(networkSheet.targetUid) : false
        }
        favoriteBusy={favoriteBusy}
        canMessage={messagePermission.allowed}
        messageBlockedReason={messagePermission.message}
        onClose={closeNetworkSheet}
        onAction={(action) => void handleNetworkSheetAction(action)}
        variant={messagesVariant}
      />

      <PushScreenTransition active={Boolean(networkProfileUser)}>{profileOverlay}</PushScreenTransition>
      <PushScreenTransition active={Boolean(activeThreadId && profile && !mustVerify)}>
        {chatOverlay}
      </PushScreenTransition>

      {/*
        Création de groupe. `onCreated` n'est déclenché qu'après confirmation du service :
        le fil ouvert est bien celui qui vient d'être écrit, jamais un fil supposé.
      */}
      <CreateGroupSheet
        visible={groupSheetOpen}
        onClose={() => setGroupSheetOpen(false)}
        profile={profile}
        onCreated={(threadId) => setActiveThreadId(threadId)}
      />
    </>
  );
};
