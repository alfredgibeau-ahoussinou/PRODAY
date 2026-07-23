import React, { useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { MessageThread } from '../../lib/firestoreMappers';
import type { SocialProfileSuggestion } from '../../features/v3/engines/socialRecommendation.engine';
import type { MessagesChapterId } from '../../content/messagesChapters';
import type { MessagesThreadFilter } from '../../content/messagesChapters';
import { TabScreenShell } from '../app/TabScreenShell';
import { useTranslation } from '../../context/LocaleContext';
import { MessagesPager } from './MessagesPager';
import { MessagesInboxPage } from './chapters/MessagesInboxPage';
import { MessagesNetworkPage } from './chapters/MessagesNetworkPage';
import { ListEmptyPanel } from '../ui/ListEmptyPanel';
import { spacing } from '../../theme/designTokens';

export interface MessagesHomeScreenProps {
  profile: { uid: string } | null;
  authLoading: boolean;
  threads: MessageThread[];
  filteredThreads: MessageThread[];
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
  onRefresh: () => void;
  onLogin: () => void;
  onSignup: () => void;
  onOpenMercato: () => void;
  onResetFilters: () => void;
  kineLabelFor: (thread: MessageThread) => string | undefined;
  isWoman: boolean;
}

export const MessagesHomeScreen: React.FC<MessagesHomeScreenProps> = (props) => {
  const { t } = useTranslation();
  const [chapter, setChapter] = useState<MessagesChapterId>('inbox');

  const subtitle = useMemo(() => {
    if (props.unreadCount > 0) {
      return t('messages.subtitle.unread', { n: props.unreadCount });
    }
    return t('messages.subtitle.default');
  }, [props.unreadCount, t]);

  const pages = useMemo(
    () => [
      {
        id: 'inbox' as const,
        render: () => (
          <MessagesInboxPage
            threads={props.threads}
            filteredThreads={props.filteredThreads}
            loading={props.loading}
            refreshing={props.refreshing}
            search={props.search}
            onSearchChange={props.onSearchChange}
            threadFilter={props.threadFilter}
            onThreadFilterChange={props.onThreadFilterChange}
            unreadCount={props.unreadCount}
            mustVerify={props.mustVerify}
            onOpenThread={props.onOpenThread}
            onRefresh={props.onRefresh}
            onResetFilters={props.onResetFilters}
            onOpenMercato={props.onOpenMercato}
            kineLabelFor={props.kineLabelFor}
            isWoman={props.isWoman}
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
    return (
      <TabScreenShell caption={t('messages.caption')} title={t('messages.title')} subtitle={t('messages.subtitle.guest')} flat>
        <View style={styles.guestPad}>
          <ListEmptyPanel
            icon="chat"
            title={t('common.guest.loginTitle')}
            subtitle={t('messages.guest.loginSubtitle')}
            primaryCta={{ label: t('common.guest.login'), onPress: props.onLogin }}
            secondaryCta={{ label: t('common.guest.signup'), onPress: props.onSignup }}
          />
        </View>
      </TabScreenShell>
    );
  }

  return (
    <TabScreenShell
      caption={t('messages.caption')}
      title={t('messages.title')}
      subtitle={subtitle}
      flat
    >
      <MessagesPager
        pages={pages}
        activeChapter={chapter}
        onChapterChange={setChapter}
        unreadBadge={props.unreadCount}
      />
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  guestPad: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
});
