import React, { useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, Platform } from 'react-native';
import type { MessagesThreadFilter } from '../../content/messagesChapters';
import {
  getCoachMessagesThreadFilters,
  getJoueurMessagesThreadFilters,
  getMessagesThreadFilters,
} from '../../i18n/localizedChapters';
import { SearchBar } from '../ui/SearchBar';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import { useCoachTokens } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { JOUEUR_SURFACES } from '../../theme/joueurDesignSystem';

export interface MessagesInboxHeaderProps {
  search: string;
  onSearchChange: (value: string) => void;
  threadFilter: MessagesThreadFilter;
  onThreadFilterChange: (value: MessagesThreadFilter) => void;
  resultCount: number;
  unreadCount?: number;
  loading: boolean;
  variant?: 'default' | 'coach' | 'joueur';
}

export const MessagesInboxHeader: React.FC<MessagesInboxHeaderProps> = ({
  search,
  onSearchChange,
  threadFilter,
  onThreadFilterChange,
  resultCount,
  unreadCount = 0,
  loading,
  variant,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const coach = variant === 'coach';
  const joueur = variant === 'joueur';
  const coachTokens = useCoachTokens();
  const joueurTheme = useJoueurTheme();
  const threadFilters = useMemo(
    () =>
      coach
        ? getCoachMessagesThreadFilters(t)
        : joueur
          ? getJoueurMessagesThreadFilters(t)
          : getMessagesThreadFilters(t),
    [coach, joueur, t],
  );
  const styles = useMemo(
    () => createStyles(colors, coach, joueur, coachTokens, joueurTheme),
    [colors, coach, joueur, coachTokens, joueurTheme],
  );

  const threadCountLabel = useMemo(() => {
    if (loading) return t('common.loading');
    if (unreadCount > 0) {
      return t('messages.inbox.threadCountWithUnread', { n: resultCount, u: unreadCount });
    }
    return t('messages.inbox.threadCount', { n: resultCount });
  }, [loading, resultCount, unreadCount, t]);

  return (
    <View style={styles.block}>
      <SearchBar
        placeholder={t('messages.inbox.search')}
        value={search}
        onChangeText={onSearchChange}
        embedded
        palette={{
          surface: '#141418',
          border: 'rgba(255, 255, 255, 0.08)',
          text: '#FFFFFF',
          textMuted: '#8E8E9F',
        }}
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
                  backgroundColor: on
                    ? coach
                      ? coachTokens.accent
                      : joueur
                        ? joueurTheme.accent
                        : '#FFFFFF'
                    : '#141418',
                  borderColor: on
                    ? coach
                      ? coachTokens.accent
                      : joueur
                        ? joueurTheme.accent
                        : '#FFFFFF'
                    : 'rgba(255, 255, 255, 0.08)',
                },
              ]}
              onPress={() => onThreadFilterChange(opt.id)}
              scaleTo={0.96}
              haptic
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: on
                      ? coach
                        ? '#FFFFFF'
                        : '#000000'
                      : '#8E8E9F',
                    fontWeight: on ? '800' : '600',
                  },
                ]}
              >
                {opt.label}
              </Text>
            </PressableSpring>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>
          {t('messages.inbox.section')}
        </Text>
        <Text style={styles.sectionCount}>
          {threadCountLabel}
        </Text>
      </View>
    </View>
  );
};

function createStyles(
  _c: { text: string; textMuted: string },
  _coach: boolean,
  _joueur: boolean,
  _coachTokens: CoachThemeTokens,
  _joueurTheme: ReturnType<typeof useJoueurTheme>,
) {
  return StyleSheet.create({
    block: { gap: spacing.md, marginBottom: spacing.sm },
    filters: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 18,
      borderWidth: 1,
      minHeight: 36,
      justifyContent: 'center',
      alignItems: 'center',
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
      marginTop: 2,
    },
    sectionTitle: {
      fontFamily: fontFamily.extrabold,
      fontSize: 17,
      fontWeight: '800',
      letterSpacing: -0.2,
      color: '#FFFFFF',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    sectionCount: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      color: '#8E8E9F',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
