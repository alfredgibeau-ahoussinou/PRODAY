import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import type { User } from '../../models/User';
import type { WeeklyQuestionResponse } from '../../models/WeeklyQuestion';
import { useWeeklyQuestion } from '../../hooks/useWeeklyQuestion';
import { canParticipateWeeklyQuestion } from '../../utils/weeklyQuestionAccess';
import { isSupporterFreeAccess } from '../../utils/supporterFreeAccess';
import { platformFeedService } from '../../services/platformFeed.service';
import { PressableSpring, SkeletonList } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { TabScreenShell } from '../app/TabScreenShell';
import { useAppTheme } from '../../context/ProductLineContext';
import { useFemalePlayerPresentation } from '../../hooks/useFemalePlayerPresentation';
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
import { SUPPORTER_SITE } from '../../theme/prodaySupporterTheme';

interface FeedCommunityPageProps {
  profile: User;
  onOpenChat: (threadId: string) => void;
  onOpenMessages: () => void;
  /** Sans TabScreenShell (déjà dans un PageFrame parent). */
  embedded?: boolean;
  /** Variante tribune supporter. */
  variant?: 'default' | 'tribune';
}

type FilRailId = 'question' | 'reponses' | 'actus';

export const FeedCommunityPage: React.FC<FeedCommunityPageProps> = ({
  profile,
  onOpenChat,
  onOpenMessages,
  embedded = false,
  variant = 'default',
}) => {
  const { colors: c } = useAppTheme();
  const isFemalePresentation = useFemalePlayerPresentation();
  const { t, locale } = useTranslation();
  const tribune = variant === 'tribune' || isSupporterFreeAccess(profile.role);
  const styles = useMemo(
    () => createStyles(c, tribune),
    [c, tribune],
  );
  const [refreshSignal, setRefreshSignal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [rail, setRail] = useState<FilRailId>('question');

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

  const subtitle = tribune
    ? t('supporter.fil.subtitle')
    : isFemalePresentation
      ? t('feed.subtitle.womanCommunity')
      : t('feed.subtitle.community');

  const title = tribune ? t('supporter.fil.title') : t('feed.title');
  const caption = tribune ? t('supporter.fil.caption') : t('feed.caption');

  const renderResponse = ({ item }: { item: WeeklyQuestionResponse }) => (
    <View style={styles.responseWrap}>
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
      scaleTo={0.98}
      haptic
      style={[styles.publishBtn, { backgroundColor: tribune ? SUPPORTER_SITE.accent : c.brand }]}
    >
      <Icon name="add" size={18} color="#fff" />
    </PressableSpring>
  ) : undefined;

  const stats = (
    <View style={styles.statsRow}>
      <Stat
        styles={styles}
        label={t('feed.stats.responses')}
        value={String(responses.length)}
        tribune={tribune}
      />
      <Stat
        styles={styles}
        label={t('feed.stats.status')}
        value={
          myResponse ? t('feed.stats.answered') : t('feed.stats.pending')
        }
        tribune={tribune}
        accent={Boolean(myResponse)}
      />
      {tribune ? (
        <Stat styles={styles} label="Accès" value="Gratuit" tribune accent />
      ) : null}
    </View>
  );

  const railChips = tribune ? (
    <View style={styles.rail}>
      {(
        [
          { id: 'question' as const, label: t('supporter.fil.rail.question') },
          { id: 'reponses' as const, label: t('supporter.fil.rail.responses') },
          { id: 'actus' as const, label: t('supporter.fil.rail.news') },
        ] as const
      ).map((item) => {
        const on = rail === item.id;
        return (
          <PressableSpring
            key={item.id}
            onPress={() => setRail(item.id)}
            scaleTo={0.97}
            style={[styles.railChip, on && styles.railChipOn]}
          >
            <ProDayText
              variant="caption"
              style={[styles.railText, on && styles.railTextOn]}
            >
              {item.label}
            </ProDayText>
          </PressableSpring>
        );
      })}
    </View>
  ) : null;

  const header = (
    <View style={styles.headerBlock}>
      {tribune && !embedded ? (
        <View style={styles.tribuneIntro}>
          <ProDayText variant="caption" style={styles.tribuneKicker}>
            {caption}
          </ProDayText>
          <ProDayText variant="title" style={styles.tribuneTitle}>
            {title}
          </ProDayText>
          <ProDayText variant="caption" style={styles.tribuneSupport}>
            {subtitle}
          </ProDayText>
        </View>
      ) : null}

      {stats}
      {railChips}

      {(!tribune || rail === 'question') && question ? (
        <FeedQuestionHero
          question={question.question}
          weekKey={weekKey}
          colors={c}
          t={t}
          tribune={tribune}
        />
      ) : null}

      {(!tribune || rail === 'question') && canParticipate && question && !myResponse ? (
        <WeeklyQuestionComposeForm
          colors={c}
          t={t}
          submitting={submitting}
          tribune={tribune}
          onSubmit={async (body) => {
            await submitAnswer(body);
            setRefreshSignal((n) => n + 1);
            await refresh();
            setRail('reponses');
          }}
        />
      ) : null}

      {(!tribune || rail === 'reponses') && question ? (
        <ProDayText variant="caption" style={styles.timelineLabel}>
          {t('feed.section.community')}
          {responses.length > 0
            ? ` · ${t('feed.weekly.responsesTitle', { n: responses.length })}`
            : ''}
        </ProDayText>
      ) : null}
    </View>
  );

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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={tribune ? SUPPORTER_SITE.accent : c.brand}
            />
          }
          ListHeaderComponent={
            <View>
              {stats}
              {railChips}
              <View style={styles.emptyWrap}>
                <View
                  style={[
                    styles.emptyIcon,
                    {
                      backgroundColor: tribune
                        ? SUPPORTER_SITE.soft
                        : c.brandSoft,
                    },
                  ]}
                >
                  <Icon
                    name="chat"
                    size={32}
                    color={tribune ? SUPPORTER_SITE.accent : c.brand}
                  />
                </View>
                <ProDayText variant="section" style={styles.emptyTitle}>
                  {tribune
                    ? t('supporter.fil.emptyTitle')
                    : t('feed.weekly.pageEmptyTitle')}
                </ProDayText>
                <ProDayText variant="body" muted style={styles.emptyBody}>
                  {tribune
                    ? t('supporter.fil.emptyBody')
                    : t('feed.weekly.pageEmptyBody')}
                </ProDayText>
              </View>
            </View>
          }
          ListFooterComponent={
            !tribune || rail === 'actus' ? (
              <PlatformFeedSection profile={profile} />
            ) : null
          }
        />
      );
    }

    const listData =
      tribune && rail === 'actus'
        ? []
        : tribune && rail === 'question'
          ? []
          : responses;

    return (
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={tribune ? SUPPORTER_SITE.accent : c.brand}
          />
        }
        ListHeaderComponent={header}
        ListEmptyComponent={
          tribune && rail === 'actus' ? null : tribune && rail === 'question' ? (
            <ProDayText variant="caption" muted style={styles.hintAfterQuestion}>
              {myResponse
                ? t('supporter.fil.answeredHint')
                : t('supporter.fil.answerHint')}
            </ProDayText>
          ) : (
            <View style={styles.responsesEmpty}>
              <Icon name="people" size={28} color={c.textMuted} />
              <ProDayText variant="body" muted style={styles.emptyBody}>
                {t('feed.weekly.empty')}
              </ProDayText>
            </View>
          )
        }
        renderItem={renderResponse}
        ListFooterComponent={
          !tribune || rail === 'actus' ? (
            <PlatformFeedSection profile={profile} />
          ) : null
        }
      />
    );
  })();

  const content = (
    <>
      {body}
      <FeedPublishModal
        visible={publishOpen}
        profile={profile}
        onClose={() => setPublishOpen(false)}
        onOpenChat={onOpenChat}
        onOpenMessages={onOpenMessages}
      />
    </>
  );

  if (embedded) {
    return <View style={styles.embeddedRoot}>{content}</View>;
  }

  return (
    <>
      <TabScreenShell
        caption={caption}
        title={title}
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

function Stat({
  styles,
  label,
  value,
  tribune,
  accent,
}: {
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
  tribune?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={[styles.stat, tribune && styles.statTribune]}>
      <ProDayText
        variant="title"
        style={[styles.statValue, accent && styles.statAccent]}
      >
        {value}
      </ProDayText>
      <ProDayText variant="caption" style={styles.statLabel}>
        {label}
      </ProDayText>
    </View>
  );
}

function createStyles(c: AppColors, tribune: boolean) {
  const accent = tribune ? SUPPORTER_SITE.accent : c.brand;
  const soft = tribune ? SUPPORTER_SITE.soft : c.brandSoft;
  const border = tribune ? SUPPORTER_SITE.border : c.border;
  const fg = tribune ? SUPPORTER_SITE.foreground : c.text;
  const muted = tribune ? SUPPORTER_SITE.muted : c.textMuted;

  return StyleSheet.create({
    embeddedRoot: { flex: 1, minHeight: 0 },
    loader: { flex: 1, padding: spacing.md },
    list: { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg },
    headerBlock: { gap: spacing.md, paddingBottom: spacing.xs },
    tribuneIntro: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      gap: 4,
    },
    tribuneKicker: {
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 2.2,
      fontSize: 10,
      fontWeight: '800',
    },
    tribuneTitle: {
      color: fg,
      fontWeight: '800',
      fontSize: 28,
      letterSpacing: -0.6,
    },
    tribuneSupport: { color: muted, lineHeight: 18 },
    statsRow: {
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: spacing.md,
    },
    stat: {
      flex: 1,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      backgroundColor: 'rgba(255,255,255,0.03)',
      padding: spacing.sm,
      gap: 2,
    },
    statTribune: {
      borderLeftWidth: 2,
      borderLeftColor: accent,
    },
    statValue: { color: fg, fontWeight: '800', fontSize: 18 },
    statAccent: { color: accent },
    statLabel: {
      color: muted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    rail: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: spacing.md,
    },
    railChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: border,
      backgroundColor: 'rgba(255,255,255,0.02)',
    },
    railChipOn: {
      borderColor: accent,
      backgroundColor: soft,
    },
    railText: { color: muted, fontWeight: '700', fontSize: 11 },
    railTextOn: { color: fg },
    timelineLabel: {
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      paddingHorizontal: spacing.md,
      color: muted,
    },
    responseWrap: { marginBottom: 2 },
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
    emptyTitle: { textAlign: 'center', color: fg, fontWeight: '800' },
    emptyBody: { textAlign: 'center', lineHeight: 22 },
    hintAfterQuestion: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      lineHeight: 18,
    },
    publishBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
