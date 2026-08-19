import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import type { MessageThread } from '../../../lib/firestoreMappers';
import type { MessagesThreadFilter } from '../../../content/messagesChapters';
import { MessagesInboxHeader } from '../MessagesInboxHeader';
import { MessageRequestsPanel } from '../MessageRequestsPanel';
import { ProDayText } from '../../ui/ProDayText';
import { Icon } from '../../ui/Icon';
import { MessageThreadRow } from '../MessageThreadRow';
import { SkeletonList, InteractiveListItem } from '../../motion';
import { ListEmptyPanel } from '../../ui/ListEmptyPanel';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing, radius } from '../../../theme/designTokens';
import { MESSAGES_CHAPTER_PAD } from './messagesChapterLayout';
import { CoachEmptyState } from '../../coach/coachPortalUi';
import { useCoachTokens } from '../../../features/coach/shell/CoachThemeContext';
import { JoueurEmptyState } from '../../player/joueurPortalUi';
import { useJoueurTheme } from '../../../hooks/useJoueurTheme';

const scrollProps = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
};

export interface MessagesInboxPageProps {
  threads: MessageThread[];
  filteredThreads: MessageThread[];
  pendingRequestThreads: MessageThread[];
  currentUid: string;
  loading: boolean;
  refreshing: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  threadFilter: MessagesThreadFilter;
  onThreadFilterChange: (value: MessagesThreadFilter) => void;
  unreadCount: number;
  mustVerify: boolean;
  onOpenThread: (threadId: string) => void;
  onAcceptRequest: (threadId: string) => void;
  onRefuseRequest: (threadId: string) => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  onOpenMercato: () => void;
  kineLabelFor: (thread: MessageThread) => string | undefined;
  isWoman: boolean;
  variant?: 'default' | 'coach' | 'joueur';
}

export const MessagesInboxPage: React.FC<MessagesInboxPageProps> = ({
  threads,
  filteredThreads,
  pendingRequestThreads,
  currentUid,
  loading,
  refreshing,
  search,
  onSearchChange,
  threadFilter,
  onThreadFilterChange,
  mustVerify,
  onOpenThread,
  onAcceptRequest,
  onRefuseRequest,
  onRefresh,
  onResetFilters,
  onOpenMercato,
  kineLabelFor,
  isWoman,
  variant,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const coach = variant === 'coach';
  const joueur = variant === 'joueur';
  const coachTokens = useCoachTokens();
  const joueurTheme = useJoueurTheme();
  const refreshTint = coach ? coachTokens.accent : joueur ? joueurTheme.accent : colors.accent;

  return (
    <ScrollView
      contentContainerStyle={MESSAGES_CHAPTER_PAD}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={refreshTint} />
      }
      {...scrollProps}
    >
      <MessagesInboxHeader
        search={search}
        onSearchChange={onSearchChange}
        threadFilter={threadFilter}
        onThreadFilterChange={onThreadFilterChange}
        resultCount={filteredThreads.length}
        loading={loading}
        variant={variant}
      />

      <MessageRequestsPanel
        pendingThreads={pendingRequestThreads}
        loading={loading}
        currentUid={currentUid}
        onAccept={onAcceptRequest}
        onRefuse={onRefuseRequest}
        onOpen={onOpenThread}
      />

      {mustVerify ? (
        <View style={[styles.alert, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
          <Icon name="warning" size={20} color={colors.warning} />
          <ProDayText variant="caption" style={{ color: colors.warning, flex: 1, lineHeight: 18 }}>
            {t('messages.inbox.verifyBanner')}
          </ProDayText>
        </View>
      ) : null}

      {loading ? (
        <SkeletonList count={5} variant="card" />
      ) : threads.length === 0 ? (
        coach ? (
          <CoachEmptyState
            title={t('messages.inbox.empty.title')}
            body={
              isWoman
                ? t('messages.inbox.empty.subtitle.woman')
                : t('messages.inbox.empty.subtitle.default')
            }
            cta={t('messages.inbox.empty.cta')}
            onPress={onOpenMercato}
          />
        ) : joueur ? (
          <JoueurEmptyState
            title={t('messages.inbox.empty.title')}
            body={
              isWoman
                ? t('messages.inbox.empty.subtitle.woman')
                : t('messages.inbox.empty.subtitle.default')
            }
            cta={t('messages.inbox.empty.cta')}
            onPress={onOpenMercato}
          />
        ) : (
          <ListEmptyPanel
            icon="chat"
            title={t('messages.inbox.empty.title')}
            subtitle={
              isWoman
                ? t('messages.inbox.empty.subtitle.woman')
                : t('messages.inbox.empty.subtitle.default')
            }
            primaryCta={{ label: t('messages.inbox.empty.cta'), onPress: onOpenMercato }}
          />
        )
      ) : filteredThreads.length === 0 ? (
        coach ? (
          <CoachEmptyState
            title={t('messages.inbox.noResults.title')}
            body={t('messages.inbox.noResults.subtitle')}
            cta={t('messages.inbox.noResults.reset')}
            onPress={onResetFilters}
          />
        ) : joueur ? (
          <JoueurEmptyState
            title={t('messages.inbox.noResults.title')}
            body={t('messages.inbox.noResults.subtitle')}
            cta={t('messages.inbox.noResults.reset')}
            onPress={onResetFilters}
          />
        ) : (
          <ListEmptyPanel
            icon="search"
            title={t('messages.inbox.noResults.title')}
            subtitle={t('messages.inbox.noResults.subtitle')}
            primaryCta={{ label: t('messages.inbox.noResults.reset'), onPress: onResetFilters }}
          />
        )
      ) : (
        <View style={styles.list}>
          {filteredThreads.map((thread, index) => (
            <InteractiveListItem key={thread.id} index={index}>
              <MessageThreadRow
                thread={thread}
                kineLabel={kineLabelFor(thread)}
                onPress={() => onOpenThread(thread.id)}
                disabled={mustVerify}
                variant={variant}
              />
            </InteractiveListItem>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  alert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  list: { gap: 0 },
});
