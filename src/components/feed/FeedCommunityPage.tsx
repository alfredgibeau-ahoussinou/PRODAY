import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import type { User } from '../../models/User';
import type { WeeklyQuestionResponse } from '../../models/WeeklyQuestion';
import { useWeeklyQuestion } from '../../hooks/useWeeklyQuestion';
import { canParticipateWeeklyQuestion } from '../../utils/weeklyQuestionAccess';
import { platformFeedService } from '../../services/platformFeed.service';
import { PressableSpring, SkeletonList } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { TabScreenShell } from '../app/TabScreenShell';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';
import { TAB_BAR_CONTENT_INSET } from '../navigation/BottomTabBar';
import {
  WeeklyQuestionResponseRow,
  weeklyQuestionRoleLabel,
} from '../weeklyQuestion/WeeklyQuestionShared';
import { FeedQuestionHero } from './FeedQuestionHero';
import { FeedPublishModal } from './FeedPublishModal';
import { PlatformFeedSection } from './PlatformFeedSection';
import { WeeklyQuestionComposeForm } from '../weeklyQuestion/WeeklyQuestionComposeForm';
import { WeeklyQuestionReactionBar } from '../weeklyQuestion/WeeklyQuestionReactionBar';

interface FeedCommunityPageProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
}

export const FeedCommunityPage: React.FC<FeedCommunityPageProps> = ({
  profile,
  onOpenChat,
  onOpenMessages,
}) => {
  const { productLine, colors: c } = useAppTheme();
  const { t, locale } = useTranslation();
  const styles = useMemo(() => createStyles(c), [c]);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);

  const canParticipate = canParticipateWeeklyQuestion(profile.role);
  const canPublish =
    platformFeedService.canPublishFeedNews(profile.role) ||
    platformFeedService.canCreateAgentPoll(profile.role);

  const {
    question,
    responses,
    myResponse,
    loading,
    submitAnswer,
    submitting,
    weekKey,
    refresh,
  } = useWeeklyQuestion(profile, refreshSignal);

  useEffect(() => {
    if (!loading) setRefreshing(false);
  }, [loading]);

  const onRefresh = () => {
    setRefreshing(true);
    setRefreshSignal((n) => n + 1);
  };

  const isWoman = productLine === 'woman';
  const subtitle = isWoman ? t('feed.subtitle.womanCommunity') : t('feed.subtitle.community');

  const renderResponse = ({ item }: { item: WeeklyQuestionResponse }) => (
    <View>
      <WeeklyQuestionResponseRow
        name={item.display_name}
        role={weeklyQuestionRoleLabel(item.author_role, t)}
        body={item.body}
        createdAt={item.created_at}
        colors={c}
        t={t}
        locale={locale}
        highlight={item.author_uid === profile.uid}
      />
      {question ? (
        <WeeklyQuestionReactionBar
          questionId={question.id}
          responseUid={item.id}
          viewerUid={profile.uid}
        />
      ) : null}
    </View>
  );

  const publishButton = canPublish ? (
    <PressableSpring
      onPress={() => setPublishOpen(true)}
      scaleTo={0.95}
      haptic
      style={[styles.publishBtn, { backgroundColor: c.brand }]}
    >
      <Icon name="add" size={18} color={c.brandInverse} />
    </PressableSpring>
  ) : undefined;

  const body = (() => {
    if (loading) {
      return (
        <View style={styles.loader}>
          <SkeletonList count={4} variant="card" />
        </View>
      );
    }

    if (!canParticipate || !question) {
      return (
        <FlatList
          data={[]}
          renderItem={() => null}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} />
          }
          ListHeaderComponent={
            <View style={styles.emptyWrap}>
              <View style={[styles.emptyIcon, { backgroundColor: c.brandSoft }]}>
                <Icon name="chat" size={32} color={c.brand} />
              </View>
              <ProDayText variant="section" style={styles.emptyTitle}>
                {t('feed.weekly.pageEmptyTitle')}
              </ProDayText>
              <ProDayText variant="body" muted style={styles.emptyBody}>
                {t('feed.weekly.pageEmptyBody')}
              </ProDayText>
            </View>
          }
          ListFooterComponent={<PlatformFeedSection profile={profile} />}
        />
      );
    }

    return (
      <FlatList
        data={responses}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.brand} />
        }
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <FeedQuestionHero
              question={question.question}
              weekKey={weekKey}
              colors={c}
              t={t}
            />

            {canParticipate && !myResponse ? (
              <WeeklyQuestionComposeForm
                colors={c}
                t={t}
                submitting={submitting}
                onSubmit={async (body) => {
                  await submitAnswer(body);
                  setRefreshSignal((n) => n + 1);
                  await refresh();
                }}
              />
            ) : null}

            <ProDayText variant="caption" muted style={styles.timelineLabel}>
              {t('feed.section.community')}
              {responses.length > 0
                ? ` · ${t('feed.weekly.responsesTitle', { n: responses.length })}`
                : ''}
            </ProDayText>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.responsesEmpty}>
            <Icon name="people" size={28} color={c.textMuted} />
            <ProDayText variant="body" muted style={styles.emptyBody}>
              {t('feed.weekly.empty')}
            </ProDayText>
          </View>
        }
        renderItem={renderResponse}
        ListFooterComponent={<PlatformFeedSection profile={profile} />}
      />
    );
  })();

  return (
    <>
      <TabScreenShell
        caption={t('feed.caption')}
        title={t('feed.title')}
        subtitle={subtitle}
        right={publishButton}
        flat
      >
        {body}
      </TabScreenShell>

      <FeedPublishModal
        visible={publishOpen}
        profile={profile}
        onClose={() => setPublishOpen(false)}
        onOpenChat={onOpenChat}
        onOpenMessages={onOpenMessages}
      />
    </>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    loader: { flex: 1, padding: spacing.md },
    list: { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg },
    headerBlock: { gap: spacing.md, paddingBottom: spacing.xs },
    timelineLabel: {
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingHorizontal: spacing.md,
    },
    responsesEmpty: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
      paddingHorizontal: spacing.lg,
    },
    emptyWrap: {
      alignItems: 'center',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: { textAlign: 'center' },
    emptyBody: { textAlign: 'center', lineHeight: 22 },
    publishBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
