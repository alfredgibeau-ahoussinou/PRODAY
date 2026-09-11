import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { MessageThread } from '../../../lib/firestoreMappers';
import type { MessagesThreadFilter } from '../../../content/messagesChapters';
import { MessagesInboxHeader } from '../MessagesInboxHeader';
import { MessageRequestsPanel } from '../MessageRequestsPanel';
import { ProDayText } from '../../ui/ProDayText';
import { Icon } from '../../ui/Icon';
import { MessageThreadRow } from '../MessageThreadRow';
import { SkeletonList, InteractiveListItem, PressableSpring } from '../../motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing, radius } from '../../../theme/designTokens';
import { MESSAGES_CHAPTER_PAD } from './messagesChapterLayout';
import { useCoachTokens } from '../../../features/coach/shell/CoachThemeContext';
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
  unreadCount,
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
  const emptyUnreadFilter = threadFilter === 'unread' && threads.length > 0;

  const renderFilterEmpty = () => {
    const title = emptyUnreadFilter
      ? t('messages.inbox.empty.unread.title')
      : t('messages.inbox.noResults.title');
    const body = emptyUnreadFilter
      ? t('messages.inbox.empty.unread.subtitle')
      : t('messages.inbox.noResults.subtitle');
    const cta = t('messages.inbox.noResults.reset');

    return (
      <View style={styles.unifiedEmptyCard}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.03)', 'rgba(14, 14, 20, 0.8)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={styles.unifiedEmptyIconOrb}>
          <Icon
            name={emptyUnreadFilter ? 'checkmark-circle' : 'search'}
            size={26}
            color="#FFFFFF"
          />
        </View>
        <ProDayText style={styles.unifiedEmptyTitle}>{title}</ProDayText>
        <ProDayText style={styles.unifiedEmptyBody}>{body}</ProDayText>
        <PressableSpring
          onPress={onResetFilters}
          scaleTo={0.96}
          haptic
          style={[styles.unifiedEmptyCta, { backgroundColor: '#FFFFFF' }]}
        >
          <ProDayText style={styles.unifiedEmptyCtaText}>{cta}</ProDayText>
        </PressableSpring>
      </View>
    );
  };

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
        unreadCount={unreadCount}
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
        variant={variant}
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
        <View style={styles.unifiedEmptyCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.03)', 'rgba(14, 14, 20, 0.8)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.unifiedEmptyIconOrb}>
            <Icon
              name="chat"
              size={26}
              color="#FFFFFF"
              variant="filled"
            />
          </View>
          <ProDayText style={styles.unifiedEmptyTitle}>
            {t('messages.inbox.empty.title')}
          </ProDayText>
          <ProDayText style={styles.unifiedEmptyBody}>
            {isWoman
              ? t('messages.inbox.empty.subtitle.woman')
              : t('messages.inbox.empty.subtitle.default')}
          </ProDayText>
          <PressableSpring
            onPress={onOpenMercato}
            scaleTo={0.96}
            haptic
            style={[styles.unifiedEmptyCta, { backgroundColor: '#FFFFFF' }]}
          >
            <Icon name="search" size={15} color="#000000" />
            <ProDayText style={styles.unifiedEmptyCtaText}>
              {t('messages.inbox.empty.cta')}
            </ProDayText>
          </PressableSpring>
        </View>
      ) : filteredThreads.length === 0 ? (
        renderFilterEmpty()
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
  unifiedEmptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
    backgroundColor: '#141418',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 12,
    overflow: 'hidden',
  },
  unifiedEmptyIconOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  unifiedEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    marginBottom: 8,
    textAlign: 'center',
  },
  unifiedEmptyBody: {
    fontSize: 13,
    color: '#8E8E9F',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 290,
    marginBottom: 24,
  },
  unifiedEmptyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  unifiedEmptyCtaText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
});
