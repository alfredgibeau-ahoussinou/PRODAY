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
  loading: boolean;
  variant?: 'default' | 'coach' | 'joueur';
}

export const MessagesInboxHeader: React.FC<MessagesInboxHeaderProps> = ({
  search,
  onSearchChange,
  threadFilter,
  onThreadFilterChange,
  resultCount,
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
    return t('messages.inbox.threadCount', { n: resultCount });
  }, [loading, resultCount, t]);

  return (
    <View style={styles.block}>
      <SearchBar
        placeholder={t('messages.inbox.search')}
        value={search}
        onChangeText={onSearchChange}
        embedded
        palette={
          coach
            ? {
                surface: coachTokens.surface,
                border: 'transparent',
                text: coachTokens.foreground,
                textMuted: coachTokens.muted,
              }
            : joueur
              ? {
                  surface: JOUEUR_SURFACES.listRow,
                  border: joueurTheme.border,
                  text: joueurTheme.ink,
                  textMuted: joueurTheme.inkMuted,
                }
              : undefined
        }
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
                        : colors.accent
                    : coach
                      ? coachTokens.surface
                      : joueur
                        ? JOUEUR_SURFACES.chip
                        : colors.surface,
                  borderColor: on
                    ? coach
                      ? coachTokens.accent
                      : joueur
                        ? joueurTheme.accent
                        : colors.accent
                    : coach
                      ? 'transparent'
                      : joueur
                        ? joueurTheme.border
                        : colors.border,
                },
              ]}
              onPress={() => onThreadFilterChange(opt.id)}
              scaleTo={0.97}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: on
                      ? coach || joueur
                        ? '#fff'
                        : colors.brandInverse
                      : coach
                        ? coachTokens.muted
                        : joueur
                          ? joueurTheme.inkMuted
                          : colors.textSecondary,
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
        <Text style={styles.sectionTitle}>{t('messages.inbox.section')}</Text>
        <Text style={styles.sectionCount}>
          {threadCountLabel}
        </Text>
      </View>
    </View>
  );
};

function createStyles(
  c: { text: string; textMuted: string },
  coach: boolean,
  joueur: boolean,
  coachTokens: CoachThemeTokens,
  joueurTheme: ReturnType<typeof useJoueurTheme>,
) {
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
      borderWidth: coach || joueur ? StyleSheet.hairlineWidth : StyleSheet.hairlineWidth,
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
      color: coach ? coachTokens.foreground : joueur ? joueurTheme.ink : c.text,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    sectionCount: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      color: coach ? coachTokens.muted : joueur ? joueurTheme.inkMuted : c.textMuted,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
