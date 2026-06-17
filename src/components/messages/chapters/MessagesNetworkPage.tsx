import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, Text, Platform } from 'react-native';
import type { SocialProfileSuggestion } from '../../../features/v3/engines/socialRecommendation.engine';
import { MessagesNetworkIntro } from '../MessagesNetworkIntro';
import { MessagesNetworkCard } from '../MessagesNetworkCard';
import { InteractiveListItem, SkeletonList } from '../../motion';
import { ListEmptyPanel } from '../../ui/ListEmptyPanel';
import { PressableSpring } from '../../motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing } from '../../../theme/designTokens';
import { fontFamily } from '../../../theme/typography';
import { MESSAGES_CHAPTER_PAD } from './messagesChapterLayout';

const scrollProps = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
};

export interface MessagesNetworkPageProps {
  suggestions: SocialProfileSuggestion[];
  loading?: boolean;
  savedCount: number;
  isSaved: (targetUid?: string) => boolean;
  hiddenCount: number;
  onRestoreHidden: () => void;
  refreshing: boolean;
  onRefresh: () => void;
  onPressSuggestion: (suggestion: SocialProfileSuggestion) => void;
  onOpenMercato: () => void;
}

export const MessagesNetworkPage: React.FC<MessagesNetworkPageProps> = ({
  suggestions,
  loading = false,
  savedCount,
  isSaved,
  hiddenCount,
  onRestoreHidden,
  refreshing,
  onRefresh,
  onPressSuggestion,
  onOpenMercato,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const profileCountLabel = useMemo(() => {
    if (loading) return t('common.loading');
    return t('messages.network.profileCount', { n: suggestions.length });
  }, [loading, suggestions.length, t]);

  return (
    <ScrollView
      contentContainerStyle={MESSAGES_CHAPTER_PAD}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      {...scrollProps}
    >
      <MessagesNetworkIntro savedCount={savedCount} />

      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('messages.network.suggestions')}</Text>
        <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
          {profileCountLabel}
        </Text>
      </View>

      {loading ? (
        <SkeletonList count={4} variant="card" />
      ) : suggestions.length === 0 ? (
        <ListEmptyPanel
          icon="people"
          title={t('messages.network.empty.title')}
          subtitle={t('messages.network.empty.subtitle')}
          primaryCta={{ label: t('messages.inbox.empty.cta'), onPress: onOpenMercato }}
        />
      ) : (
        <View style={styles.list}>
          {suggestions.map((item, index) => (
            <InteractiveListItem key={item.id} index={index}>
              <MessagesNetworkCard
                suggestion={item}
                isSaved={isSaved(item.targetUid)}
                onPress={() => onPressSuggestion(item)}
              />
            </InteractiveListItem>
          ))}
        </View>
      )}

      {hiddenCount > 0 ? (
        <PressableSpring onPress={onRestoreHidden} scaleTo={0.98} style={styles.restoreWrap}>
          <Text style={[styles.restoreText, { color: colors.textMuted }]}>
            {t('messages.network.restoreHidden', { n: hiddenCount })}
          </Text>
        </PressableSpring>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontFamily: fontFamily.extrabold,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  sectionCount: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
  list: { gap: 0 },
  restoreWrap: { marginTop: spacing.md, paddingVertical: spacing.sm },
  restoreText: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    ...Platform.select({ android: { includeFontPadding: false } }),
  },
});
