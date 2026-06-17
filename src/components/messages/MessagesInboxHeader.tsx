import React, { useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, Platform } from 'react-native';
import type { MessagesThreadFilter } from '../../content/messagesChapters';
import { getMessagesThreadFilters } from '../../i18n/localizedChapters';
import { SearchBar } from '../ui/SearchBar';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

export interface MessagesInboxHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  threadFilter: MessagesThreadFilter;
  onThreadFilterChange: (value: MessagesThreadFilter) => void;
  resultCount: number;
  loading: boolean;
}

export const MessagesInboxHeader: React.FC<MessagesInboxHeaderProps> = ({
  search,
  onSearchChange,
  threadFilter,
  onThreadFilterChange,
  resultCount,
  loading,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const threadFilters = useMemo(() => getMessagesThreadFilters(t), [t]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const threadCountLabel = useMemo(() => {
    if (loading) return t('common.loading');
    return t('messages.inbox.threadCount', { n: resultCount });
  }, [loading, resultCount, t]);

  return (
    <View style={styles.block}>
      <SearchBar
        placeholder={t('messages.inbox.search')}
        value={search}
        onChangeText={onSearchChange}
        embedded
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {threadFilters.map((opt) => {
          const on = opt.id === threadFilter;
          return (
            <PressableSpring
              key={opt.id}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? colors.accent : colors.surface,
                  borderColor: on ? colors.accent : colors.border,
                },
              ]}
              onPress={() => onThreadFilterChange(opt.id)}
              scaleTo={0.97}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: on ? colors.brandInverse : colors.textSecondary },
                ]}
              >
                {opt.label}
              </Text>
            </PressableSpring>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{t('messages.inbox.section')}</Text>
        <Text style={styles.sectionCount}>
          {threadCountLabel}
        </Text>
      </View>
    </View>
  );
};

function createStyles(c: { text: string; textMuted: string }) {
  return StyleSheet.create({
    block: { gap: spacing.md, marginBottom: spacing.sm },
    filters: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 2,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      minHeight: 34,
      justifyContent: 'center',
    },
    chipText: {
      fontFamily: fontFamily.semibold,
      fontSize: 13,
      fontWeight: '600',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    sectionTitle: {
      fontFamily: fontFamily.extrabold,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: c.text,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    sectionCount: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: c.textMuted,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
