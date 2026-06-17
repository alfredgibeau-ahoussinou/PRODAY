import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import type { MercatoExperienceConfig } from '../../content/mercatoExperience';
import type { PositionFilterId } from '../../content/candidatureChapters';
import { getPositionFilters } from '../../i18n/localizedChapters';
import {
  POST_CATEGORY_OPTIONS,
  POST_LEVEL_OPTIONS,
  countActivePostFilters,
  type PostListFilters,
} from '../../utils/postFilters';
import type { MercatoAlertCriteria } from '../../services/mercatoAlerts.service';
import type { ProfileCompletionResult } from '../../utils/profileCompletion';
import type { RecruitmentPost } from '../../models/Player';
import { SearchBar } from '../ui/SearchBar';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { CandidatureFilterChips } from './CandidatureFilterChips';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

interface CandidatureSearchHeaderProps {
  config: MercatoExperienceConfig;
  search: string;
  onSearchChange: (value: string) => void;
  postFilters: PostListFilters;
  onUpdatePostFilter: <K extends keyof PostListFilters>(key: K, value: PostListFilters[K]) => void;
  posts: RecruitmentPost[];
  filteredCount: number;
  loading: boolean;
  filtersActive: boolean;
  onResetFilters: () => void;
  onSearchPlayers: (query?: string) => void;
  alertCriteria: MercatoAlertCriteria | null;
  alertMatches: RecruitmentPost[];
  onToggleAlert: () => void;
  profileCompletion: ProfileCompletionResult;
}

export const CandidatureSearchHeader: React.FC<CandidatureSearchHeaderProps> = ({
  config,
  search,
  onSearchChange,
  postFilters,
  onUpdatePostFilter,
  posts,
  filteredCount,
  loading,
  filtersActive,
  onResetFilters,
  onSearchPlayers,
  alertCriteria,
  alertMatches,
  onToggleAlert,
  profileCompletion,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const positionFilters = useMemo(() => getPositionFilters(t), [t]);
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount = countActivePostFilters(postFilters);

  const cityOptions = useMemo(
    () =>
      Array.from(new Set(posts.map((p) => p.city).filter(Boolean)))
        .slice(0, 10)
        .map((city) => ({ id: city, label: city })),
    [posts]
  );

  const filterSummary = useMemo(() => {
    if (!filtersActive) return t('mercato.search.placeholder');
    const parts: string[] = [];
    const position = positionFilters.find((f) => f.id === postFilters.position)?.label;
    if (postFilters.position !== 'all' && position) parts.push(position);
    const level = POST_LEVEL_OPTIONS.find((o) => o.id === postFilters.level)?.label;
    if (postFilters.level !== 'all' && level) parts.push(level);
    const category = POST_CATEGORY_OPTIONS.find((o) => o.id === postFilters.category)?.label;
    if (postFilters.category !== 'all' && category) parts.push(category);
    if (postFilters.city.trim()) parts.push(postFilters.city.trim());
    return parts.join(' · ');
  }, [filtersActive, postFilters, positionFilters, t]);

  return (
    <View style={styles.root}>
      <SearchBar
        placeholder={config.searchPlaceholder}
        value={search}
        onChangeText={onSearchChange}
        embedded
      />

      <PressableSpring
        style={[styles.playerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => onSearchPlayers(search.trim() || undefined)}
        scaleTo={0.98}
        haptic
      >
        <View style={[styles.playerIcon, { backgroundColor: colors.accentSoft }]}>
          <Icon name="people" size={20} color={colors.accent} variant="filled" />
        </View>
        <View style={styles.playerCopy}>
          <Text style={[styles.playerTitle, { color: colors.text }]}>{t('mercato.playersDirectory.title')}</Text>
          <Text style={[styles.playerSub, { color: colors.textMuted }]}>
            {t('mercato.playersDirectory.subtitle')}
          </Text>
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      </PressableSpring>

      {search.trim().length > 0 ? (
        <TouchableOpacity
          style={[styles.queryBridge, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          onPress={() => onSearchPlayers(search.trim())}
          activeOpacity={0.88}
        >
          <Icon name="search" size={14} color={colors.accent} />
          <Text style={[styles.queryBridgeText, { color: colors.textSecondary }]}>
            Chercher aussi « {search.trim()} » parmi les joueurs
          </Text>
        </TouchableOpacity>
      ) : null}

      <View style={[styles.statsPanel, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {loading ? '…' : filteredCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>annonces</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: colors.text }]}>{profileCompletion.percent}%</Text>
          <Text style={[styles.statLabel, { color: colors.textMuted }]}>profil</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.filtersTrigger,
          {
            backgroundColor: filtersOpen ? colors.surface : colors.surfaceMuted,
            borderColor: filtersActive ? colors.accent : colors.border,
          },
        ]}
        onPress={() => setFiltersOpen((open) => !open)}
        activeOpacity={0.88}
      >
        <View style={[styles.filtersTriggerIcon, { backgroundColor: colors.accentSoft }]}>
          <Icon name="settings" size={16} color={colors.accent} />
        </View>
        <View style={styles.filtersTriggerCopy}>
          <Text style={[styles.filtersTriggerTitle, { color: colors.text }]}>Filtres</Text>
          <Text style={[styles.filtersTriggerSub, { color: colors.textMuted }]} numberOfLines={1}>
            {filterSummary}
          </Text>
        </View>
        {activeFilterCount > 0 ? (
          <View style={[styles.filtersBadge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.filtersBadgeText, { color: colors.brandInverse }]}>
              {activeFilterCount}
            </Text>
          </View>
        ) : null}
        <Icon name={filtersOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </TouchableOpacity>

      {filtersOpen ? (
        <View style={[styles.filtersPanel, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <CandidatureFilterChips<PositionFilterId>
            label="Poste"
            options={positionFilters.map((f) => ({ id: f.id, label: f.label }))}
            value={postFilters.position}
            onChange={(id) => onUpdatePostFilter('position', id)}
          />
          <CandidatureFilterChips<PostListFilters['level']>
            label="Niveau"
            options={POST_LEVEL_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
            value={postFilters.level}
            onChange={(id) => onUpdatePostFilter('level', id)}
          />
          <CandidatureFilterChips<PostListFilters['category']>
            label={t('mercato.alert.category')}
            options={POST_CATEGORY_OPTIONS.map((o) => ({ id: o.id, label: o.label }))}
            value={postFilters.category}
            onChange={(id) => onUpdatePostFilter('category', id)}
          />

          {cityOptions.length > 0 ? (
            <CandidatureFilterChips<string>
              label="Ville"
              options={[{ id: 'all', label: t('mercato.filters.cityAll') }, ...cityOptions]}
              value={postFilters.city || 'all'}
              onChange={(id) => onUpdatePostFilter('city', id === 'all' ? '' : id)}
            />
          ) : (
            <View style={styles.cityRow}>
              <Text style={[styles.cityLabel, { color: colors.textMuted }]}>Ville</Text>
              <TextInput
                style={[
                  styles.cityInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colors.surfaceMuted,
                  },
                ]}
                placeholder={t('mercato.filters.cityPlaceholder')}
                placeholderTextColor={colors.textMuted}
                value={postFilters.city}
                onChangeText={(text) => onUpdatePostFilter('city', text)}
              />
            </View>
          )}

          {filtersActive ? (
            <TouchableOpacity style={styles.resetRow} onPress={onResetFilters} hitSlop={8}>
              <Text style={[styles.resetText, { color: colors.accent }]}>{t('common.resetFilters')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      <TouchableOpacity
        style={[
          styles.alertRow,
          {
            backgroundColor: alertCriteria?.enabled ? colors.accentSoft : colors.surface,
            borderColor: colors.border,
          },
        ]}
        onPress={onToggleAlert}
        activeOpacity={0.88}
      >
        <Icon name="notifications" size={18} color={colors.accent} />
        <View style={styles.alertCopy}>
          <Text style={[styles.alertTitle, { color: colors.text }]}>
            {alertCriteria?.enabled ? t('mercato.alert.active') : t('mercato.alert.create')}
          </Text>
          <Text style={[styles.alertSub, { color: colors.textMuted }]}>
            {alertCriteria?.enabled
              ? t('mercato.alert.matches', { n: alertMatches.length })
              : t('mercato.alert.hint')}
          </Text>
        </View>
        <View
          style={[
            styles.alertToggle,
            {
              backgroundColor: alertCriteria?.enabled ? colors.accent : colors.surfaceMuted,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.alertKnob,
              {
                backgroundColor: alertCriteria?.enabled ? colors.brandInverse : colors.textMuted,
                alignSelf: alertCriteria?.enabled ? 'flex-end' : 'flex-start',
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      {profileCompletion.percent < 80 ? (
        <View style={[styles.profileHint, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <View style={styles.profileHead}>
            <Text style={[styles.profileTitle, { color: colors.text }]}>
              Profil à {profileCompletion.percent}%
            </Text>
            <Text style={[styles.profileSub, { color: colors.textMuted }]}>
              {profileCompletion.missingLabels.slice(0, 2).join(' · ')}
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceMuted }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${profileCompletion.percent}%`, backgroundColor: colors.accent },
              ]}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
};

function createStyles(c: { text: string }) {
  return StyleSheet.create({
    root: { gap: spacing.md, marginBottom: spacing.md },
    playerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
    },
    playerIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    playerCopy: { flex: 1, gap: 2 },
    playerTitle: {
      fontFamily: fontFamily.extrabold,
      fontSize: 15,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    playerSub: {
      fontFamily: fontFamily.regular,
      fontSize: 13,
      lineHeight: 18,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    queryBridge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
    },
    queryBridgeText: {
      flex: 1,
      fontFamily: fontFamily.regular,
      fontSize: 13,
      lineHeight: 18,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    statsPanel: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      gap: spacing.md,
    },
    stat: { alignItems: 'center', minWidth: 72 },
    statValue: {
      fontFamily: fontFamily.extrabold,
      fontSize: 20,
      fontWeight: '800',
      lineHeight: 24,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    statLabel: {
      fontFamily: fontFamily.regular,
      fontSize: 11,
      marginTop: 2,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    statDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch' },
    filtersTrigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
    },
    filtersTriggerIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filtersTriggerCopy: { flex: 1, gap: 1, minWidth: 0 },
    filtersTriggerTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      fontWeight: '600',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    filtersTriggerSub: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      lineHeight: 16,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    filtersBadge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 5,
    },
    filtersBadgeText: {
      fontFamily: fontFamily.extrabold,
      fontSize: 11,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    filtersPanel: {
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      marginTop: -spacing.xs,
    },
    resetRow: { alignItems: 'center', paddingTop: spacing.xs },
    resetText: {
      fontFamily: fontFamily.bold,
      fontSize: 13,
      fontWeight: '700',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    cityRow: { gap: spacing.xs },
    cityLabel: {
      fontFamily: fontFamily.bold,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    cityInput: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontFamily: fontFamily.regular,
      fontSize: 14,
      minHeight: 40,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    alertRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
    },
    alertCopy: { flex: 1, gap: 2 },
    alertTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      fontWeight: '600',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    alertSub: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      lineHeight: 17,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    alertToggle: {
      width: 40,
      height: 24,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      padding: 3,
      justifyContent: 'center',
    },
    alertKnob: {
      width: 16,
      height: 16,
      borderRadius: 8,
    },
    profileHint: {
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      gap: spacing.sm,
    },
    profileHead: { gap: 2 },
    profileTitle: {
      fontFamily: fontFamily.semibold,
      fontSize: 14,
      fontWeight: '600',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    profileSub: {
      fontFamily: fontFamily.regular,
      fontSize: 12,
      lineHeight: 17,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    progressTrack: {
      height: 6,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.pill,
    },
  });
}
