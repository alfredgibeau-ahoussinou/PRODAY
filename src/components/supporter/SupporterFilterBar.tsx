import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { radius, spacing } from '../../theme/designTokens';
import type {
  SupporterCompetitionFilter,
  SupporterGenderFilter,
  SupporterMatchFilters,
  SupporterScopeFilter,
  SupporterSourceFilter,
} from '../../services/supporterPreferences.service';

type FilterRow<K extends string> = {
  key: K;
  labelKey: string;
};

const GENDER_OPTIONS: FilterRow<SupporterGenderFilter>[] = [
  { key: 'all', labelKey: 'supporter.filters.gender.all' },
  { key: 'men', labelKey: 'supporter.filters.gender.men' },
  { key: 'women', labelKey: 'supporter.filters.gender.women' },
  { key: 'mixed', labelKey: 'supporter.filters.gender.mixed' },
];

const SOURCE_OPTIONS: FilterRow<SupporterSourceFilter>[] = [
  { key: 'all', labelKey: 'supporter.filters.source.all' },
  { key: 'proday', labelKey: 'supporter.filters.source.proday' },
  { key: 'world', labelKey: 'supporter.filters.source.world' },
];

const SCOPE_OPTIONS: FilterRow<SupporterScopeFilter>[] = [
  { key: 'all', labelKey: 'supporter.filters.scope.all' },
  { key: 'follows', labelKey: 'supporter.filters.scope.follows' },
];

const COMPETITION_OPTIONS: FilterRow<SupporterCompetitionFilter>[] = [
  { key: 'all', labelKey: 'supporter.filters.competition.all' },
  { key: 'ligue1', labelKey: 'supporter.filters.competition.ligue1' },
  { key: 'pl', labelKey: 'supporter.filters.competition.pl' },
  { key: 'laliga', labelKey: 'supporter.filters.competition.laliga' },
  { key: 'd1f', labelKey: 'supporter.filters.competition.d1f' },
];

export type SupporterFilterBarProps = {
  filters: SupporterMatchFilters;
  onChange: (next: SupporterMatchFilters) => void;
  showCompetition?: boolean;
};

export const SupporterFilterBar: React.FC<SupporterFilterBarProps> = ({
  filters,
  onChange,
  showCompetition = true,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const renderRow = <K extends keyof SupporterMatchFilters>(
    labelKey: string,
    field: K,
    options: FilterRow<SupporterMatchFilters[K]>[]
  ) => (
    <View style={styles.row}>
      <ProDayText variant="caption" muted style={styles.rowLabel}>
        {t(labelKey)}
      </ProDayText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {options.map((option) => {
          const active = filters[field] === option.key;
          return (
            <PressableSpring
              key={String(option.key)}
              onPress={() => onChange({ ...filters, [field]: option.key })}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.accent : colors.surface,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <ProDayText variant="caption" style={{ color: active ? '#fff' : colors.textSecondary }}>
                {t(option.labelKey)}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.container, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
      {renderRow('supporter.filters.gender', 'gender', GENDER_OPTIONS)}
      {renderRow('supporter.filters.source', 'source', SOURCE_OPTIONS)}
      {renderRow('supporter.filters.scope', 'scope', SCOPE_OPTIONS)}
      {showCompetition
        ? renderRow('supporter.filters.competition', 'competition', COMPETITION_OPTIONS)
        : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  row: {
    gap: 4,
  },
  rowLabel: {
    paddingHorizontal: spacing.xs,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
});
