import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import type { MessageThread } from '../../../lib/firestoreMappers';
import type { MessagesThreadFilter } from '../../../content/messagesChapters';
import { MessagesInboxHeader } from '../MessagesInboxHeader';
import { ProDayText } from '../../ui/ProDayText';
import { Icon } from '../../ui/Icon';
import { MessageThreadRow } from '../MessageThreadRow';
import { SkeletonList, InteractiveListItem } from '../../motion';
import { ListEmptyPanel } from '../../ui/ListEmptyPanel';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing, radius } from '../../../theme/designTokens';
import { MESSAGES_CHAPTER_PAD } from './messagesChapterLayout';

const scrollProps = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
};

export interface MessagesInboxPageProps {
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
  onOpenThread: (threadId: string) => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  onOpenMercato: () => void;
  kineLabelFor: (thread: MessageThread) => string | undefined;
  isWoman: boolean;
}

export const MessagesInboxPage: React.FC<MessagesInboxPageProps> = ({
  threads,
  filteredThreads,
  loading,
  refreshing,
  search,
  onSearchChange,
  threadFilter,
  onThreadFilterChange,
  mustVerify,
  onOpenThread,
  onRefresh,
  onResetFilters,
  onOpenMercato,
  kineLabelFor,
  isWoman,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <ScrollView
      contentContainerStyle={MESSAGES_CHAPTER_PAD}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
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
      ) : filteredThreads.length === 0 ? (
        <ListEmptyPanel
          icon="search"
          title={t('messages.inbox.noResults.title')}
          subtitle={t('messages.inbox.noResults.subtitle')}
          primaryCta={{ label: t('messages.inbox.noResults.reset'), onPress: onResetFilters }}
        />
      ) : (
        <View style={styles.list}>
          {filteredThreads.map((thread, index) => (
            <InteractiveListItem key={thread.id} index={index}>
              <MessageThreadRow
                thread={thread}
                kineLabel={kineLabelFor(thread)}
                onPress={() => onOpenThread(thread.id)}
                disabled={mustVerify}
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
