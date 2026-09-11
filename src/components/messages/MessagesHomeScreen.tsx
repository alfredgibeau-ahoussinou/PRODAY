import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MessageThread } from '../../lib/firestoreMappers';
import type { SocialProfileSuggestion } from '../../features/v3/engines/socialRecommendation.engine';
import type { MessagesChapterId } from '../../content/messagesChapters';
import type { MessagesThreadFilter } from '../../content/messagesChapters';
import { TabScreenShell } from '../app/TabScreenShell';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import { useTranslation } from '../../context/LocaleContext';
import { MessagesPager } from './MessagesPager';
import { MessagesInboxPage } from './chapters/MessagesInboxPage';
import { MessagesNetworkPage } from './chapters/MessagesNetworkPage';
import { ListEmptyPanel } from '../ui/ListEmptyPanel';
import { spacing } from '../../theme/designTokens';
import { CoachEmptyState } from '../coach/coachPortalUi';
import { CoachPane } from '../coach/CoachScreenHeader';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import { ProDayText } from '../ui/ProDayText';
import { CrestWatermark } from '../../screens/joueur/PlayerSaisonIcons';
import { usePlayerTheme, usePlayerThemeColors } from '../../context/PlayerThemeContext';

export interface MessagesHomeScreenProps {
  profile: { uid: string } | null;
  authLoading: boolean;
  threads: MessageThread[];
  filteredThreads: MessageThread[];
  pendingRequestThreads: MessageThread[];
  loading: boolean;
  refreshing: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  threadFilter: MessagesThreadFilter;
  onThreadFilterChange: (value: MessagesThreadFilter) => void;
  unreadCount: number;
  mustVerify: boolean;
  socialSuggestions: SocialProfileSuggestion[];
  loadingSocial?: boolean;
  networkSavedCount: number;
  isNetworkSaved: (targetUid?: string) => boolean;
  hiddenNetworkCount: number;
  onRestoreHiddenNetwork: () => void;
  onSocialSuggestion: (suggestion: SocialProfileSuggestion) => void;
  onOpenThread: (threadId: string) => void;
  onAcceptRequest: (threadId: string) => void;
  onRefuseRequest: (threadId: string) => void;
  onRefresh: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onOpenMercato: () => void;
  onResetFilters: () => void;
  kineLabelFor: (thread: MessageThread) => string | undefined;
  isWoman: boolean;
  variant?: 'default' | 'coach';
}

export const MessagesHomeScreen: React.FC<MessagesHomeScreenProps> = (props) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const joueurSession = useJoueurSession();
  const joueurLive =
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);
  const playerThemeCtx = usePlayerTheme();
  const playerColors = usePlayerThemeColors();
  const teamPrimary = playerColors.accent;
  const clubName = playerThemeCtx.clubName;
  const [chapter, setChapter] = useState<MessagesChapterId>('inbox');
  const coachSkin = props.variant === 'coach';
  const messagesVariant =
    joueurLive && props.variant !== 'coach' ? 'joueur' : props.variant;

  const joueurTitles = useMemo(() => {
    if (!joueurLive || !joueurSession) return null;
    const unreadHint =
      props.unreadCount > 0
        ? `${props.unreadCount} non lu${props.unreadCount > 1 ? 's' : ''}`
        : null;
    if (joueurSession.ageGroup === 'youth') {
      return {
        caption: 'Messages',
        title: 'Discussions',
        subtitle: unreadHint ? `${unreadHint} · Club, coach, potes.` : 'Club, coach, potes.',
      };
    }
    if (joueurSession.ageGroup === 'teen') {
      return {
        caption: 'Vestiaire',
        title: 'Messagerie',
        subtitle: unreadHint ? `${unreadHint} · Réseau, club, staff.` : 'Réseau, club, staff.',
      };
    }
    return {
      caption: 'Messages',
      title: 'Messagerie',
      subtitle: unreadHint
        ? `${unreadHint} · Club, réseau, opportunités.`
        : 'Club, réseau, opportunités.',
    };
  }, [joueurLive, joueurSession, props.unreadCount]);

  const subtitle = useMemo(() => {
    if (joueurTitles) return joueurTitles.subtitle;
    if (props.unreadCount > 0) {
      return t('messages.subtitle.unread', { n: props.unreadCount });
    }
    return t('messages.subtitle.default');
  }, [props.unreadCount, t, joueurTitles]);

  const pages = useMemo(
    () => [
      {
        id: 'inbox' as const,
        render: () => (
          <MessagesInboxPage
            threads={props.threads}
            filteredThreads={props.filteredThreads}
            pendingRequestThreads={props.pendingRequestThreads}
            currentUid={props.profile?.uid ?? ''}
            loading={props.loading}
            refreshing={props.refreshing}
            search={props.search}
            onSearchChange={props.onSearchChange}
            threadFilter={props.threadFilter}
            onThreadFilterChange={props.onThreadFilterChange}
            unreadCount={props.unreadCount}
            mustVerify={props.mustVerify}
            onOpenThread={props.onOpenThread}
            onAcceptRequest={props.onAcceptRequest}
            onRefuseRequest={props.onRefuseRequest}
            onRefresh={props.onRefresh}
            onResetFilters={props.onResetFilters}
            onOpenMercato={props.onOpenMercato}
            kineLabelFor={props.kineLabelFor}
            isWoman={props.isWoman}
            variant={messagesVariant}
          />
        ),
      },
      {
        id: 'network' as const,
        render: () => (
          <MessagesNetworkPage
            suggestions={props.socialSuggestions}
            loading={props.loadingSocial ?? false}
            savedCount={props.networkSavedCount}
            isSaved={props.isNetworkSaved}
            hiddenCount={props.hiddenNetworkCount}
            onRestoreHidden={props.onRestoreHiddenNetwork}
            refreshing={props.refreshing}
            onRefresh={props.onRefresh}
            onPressSuggestion={props.onSocialSuggestion}
            onOpenMercato={props.onOpenMercato}
            variant={messagesVariant}
          />
        ),
      },
    ],
    [messagesVariant, props]
  );

  if (!props.authLoading && !props.profile) {
    const guestBody = (
      <View style={styles.guestPad}>
        {coachSkin ? (
          <CoachEmptyState
            title={t('common.guest.loginTitle')}
            body={t('messages.guest.loginSubtitle')}
            cta={t('common.guest.login')}
            onPress={props.onLogin}
          />
        ) : (
          <ListEmptyPanel
            icon="chat"
            title={t('common.guest.loginTitle')}
            subtitle={t('messages.guest.loginSubtitle')}
            primaryCta={{ label: t('common.guest.login'), onPress: props.onLogin }}
            secondaryCta={{ label: t('common.guest.signup'), onPress: props.onSignup }}
          />
        )}
      </View>
    );
    if (coachSkin) {
      return <CoachPane title={getCoachPageIdentity('messages').title}>{guestBody}</CoachPane>;
    }
    return (
      <TabScreenShell caption={t('messages.caption')} title={t('messages.title')} subtitle={t('messages.subtitle.guest')} flat>
        {guestBody}
      </TabScreenShell>
    );
  }

  const inboxPage = pages[0]?.render() ?? null;

  if (coachSkin) {
    return (
      <CoachPane title={getCoachPageIdentity('messages').title}>
        {inboxPage}
      </CoachPane>
    );
  }

  const pager = (
    <MessagesPager
      pages={pages}
      activeChapter={chapter}
      onChapterChange={setChapter}
      unreadBadge={props.unreadCount}
      variant={messagesVariant}
    />
  );

  if (joueurLive) {
    return (
      <View style={[styles.joueurRoot, { paddingTop: 6 }]}>
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View
              style={[
                styles.clubCrest,
                { borderColor: `${teamPrimary}40`, backgroundColor: `${teamPrimary}18` },
              ]}
            >
              <CrestWatermark width={22} height={26} color={teamPrimary} opacity={0.95} />
            </View>
            <View style={styles.titleCol}>
              <ProDayText variant="title" style={styles.headerTitleText}>
                {joueurTitles?.title ?? 'Messagerie'}
              </ProDayText>
              {clubName ? (
                <View style={styles.clubSubtitleRow}>
                  <View style={[styles.clubDot, { backgroundColor: teamPrimary }]} />
                  <ProDayText
                    variant="caption"
                    style={[styles.clubSubtitleText, { color: `${teamPrimary}D0` }]}
                  >
                    {clubName}
                  </ProDayText>
                  {props.unreadCount > 0 ? (
                    <ProDayText variant="caption" style={[styles.unreadBadgeText, { color: teamPrimary }]}>
                      · {props.unreadCount} non lu{props.unreadCount > 1 ? 's' : ''}
                    </ProDayText>
                  ) : null}
                </View>
              ) : (
                <ProDayText variant="caption" style={styles.headerSub}>
                  {subtitle}
                </ProDayText>
              )}
            </View>
          </View>
        </View>

        <View style={styles.joueurBody}>{pager}</View>
      </View>
    );
  }

  return (
    <TabScreenShell
      caption={joueurTitles?.caption ?? t('messages.caption')}
      title={joueurTitles?.title ?? t('messages.title')}
      subtitle={subtitle}
      flat
    >
      {pager}
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  joueurRoot: {
    flex: 1,
    backgroundColor: '#000000',
  },
  joueurBody: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#000000',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubCrest: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 21,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSub: {
    fontSize: 11.5,
    color: '#8B8B9A',
    marginTop: 1,
  },
  clubSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 1,
  },
  clubDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  clubSubtitleText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  unreadBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    marginLeft: 2,
  },
  guestPad: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});

