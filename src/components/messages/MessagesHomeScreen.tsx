import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
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
  const { t } = useTranslation();
  const joueurSession = useJoueurSession();
  const joueurLive =
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);
  const [chapter, setChapter] = useState<MessagesChapterId>('inbox');
  const coachSkin = props.variant === 'coach';

  const joueurTitles = useMemo(() => {
    if (!joueurLive || !joueurSession) return null;
    if (joueurSession.ageGroup === 'youth') {
      return {
        caption: 'Messages',
        title: 'Discute',
        subtitle: 'Club, coach, potes — en sécurité.',
      };
    }
    if (joueurSession.ageGroup === 'teen') {
      return {
        caption: 'Inbox',
        title: 'Messages',
        subtitle: 'Réseau, club, staff.',
      };
    }
    return {
      caption: 'Messages',
      title: 'Messagerie',
      subtitle: 'Club, réseau, opportunités.',
    };
  }, [joueurLive, joueurSession]);

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
            variant={props.variant}
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
          />
        ),
      },
    ],
    [props]
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
      variant={props.variant}
    />
  );

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
  guestPad: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
