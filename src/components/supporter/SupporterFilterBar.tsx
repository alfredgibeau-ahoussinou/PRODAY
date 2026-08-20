import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { useTranslation } from '../../context/LocaleContext';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { spacing } from '../../theme/designTokens';
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

function activeFilterCount(
  filters: SupporterMatchFilters,
  showCompetition: boolean,
): number {
  let count = 0;
  if (filters.gender !== 'all') count += 1;
  if (filters.source !== 'all') count += 1;
  if (filters.scope !== 'all') count += 1;
  if (showCompetition && filters.competition !== 'all') count += 1;
  return count;
}

export const SupporterFilterBar: React.FC<SupporterFilterBarProps> = ({
  filters,
  onChange,
  showCompetition = true,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const active = useMemo(
    () => activeFilterCount(filters, showCompetition),
    [filters, showCompetition],
  );

  const renderRow = <K extends keyof SupporterMatchFilters>(
    labelKey: string,
    field: K,
    options: FilterRow<SupporterMatchFilters[K]>[],
  ) => (
    <View style={styles.sheetRow}>
      <ProDayText variant="caption" style={styles.sheetLabel}>
        {t(labelKey)}
      </ProDayText>
      <View style={styles.optionWrap}>
        {options.map((option) => {
          const selected = filters[field] === option.key;
          return (
            <Pressable
              key={String(option.key)}
              onPress={() => onChange({ ...filters, [field]: option.key })}
              style={styles.option}
            >
              <ProDayText
                variant="caption"
                style={[styles.optionText, selected && styles.optionTextOn]}
              >
                {t(option.labelKey)}
              </ProDayText>
              {selected ? <View style={styles.optionRule} /> : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View style={styles.bar}>
      <Pressable onPress={() => setOpen(true)} style={styles.trigger} hitSlop={8}>
        <ProDayText variant="caption" style={styles.triggerText}>
          {t('supporter.filters.open')}
          {active > 0 ? ` · ${active}` : ''}
        </ProDayText>
      </Pressable>

      <Modal
        visible={open}
        animationType="fade"
        transparent
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(event) => event.stopPropagation()}>
            <View style={styles.sheetHead}>
              <ProDayText variant="caption" style={styles.sheetTitle}>
                {t('supporter.filters.open')}
              </ProDayText>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <ProDayText variant="caption" style={styles.triggerText}>
                  {t('common.close')}
                </ProDayText>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderRow('supporter.filters.gender', 'gender', GENDER_OPTIONS)}
              {renderRow('supporter.filters.source', 'source', SOURCE_OPTIONS)}
              {renderRow('supporter.filters.scope', 'scope', SCOPE_OPTIONS)}
              {showCompetition
                ? renderRow('supporter.filters.competition', 'competition', COMPETITION_OPTIONS)
                : null}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    alignItems: 'flex-end',
  },
  trigger: {
    paddingVertical: 6,
  },
  triggerText: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 1.4,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SUPPORTER_SITE.elevated,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SUPPORTER_SITE.border,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    maxHeight: '72%',
    gap: spacing.md,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    color: SUPPORTER_SITE.foreground,
    letterSpacing: 1.8,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  sheetRow: {
    gap: 8,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SITE.border,
  },
  sheetLabel: {
    color: SUPPORTER_SITE.muted,
    letterSpacing: 1.4,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  optionWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  option: {
    paddingVertical: 4,
    gap: 4,
  },
  optionText: {
    color: SUPPORTER_SITE.muted,
    fontSize: 13,
  },
  optionTextOn: {
    color: SUPPORTER_SITE.foreground,
  },
  optionRule: {
    height: 1,
    backgroundColor: SUPPORTER_SITE.accent,
  },
});
