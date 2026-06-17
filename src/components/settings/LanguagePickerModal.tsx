import React, { useMemo, useState } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from 'react-native';
import { AnimatedModalShell } from '../motion/AnimatedModalShell';
import { SearchBar } from '../ui/SearchBar';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { getLocaleCatalog } from '../../i18n/localeCatalog';
import type { LocaleOption } from '../../i18n/types';
import { spacing, radius } from '../../theme/designTokens';

interface LanguagePickerModalProps {
  visible: boolean;
  value: string;
  onClose: () => void;
  onSelect: (locale: string) => void;
}

export const LanguagePickerModal: React.FC<LanguagePickerModalProps> = ({
  visible,
  value,
  onClose,
  onSelect,
}) => {
  const { colors } = useAppTheme();
  const { t, catalogLoading } = useTranslation();
  const [query, setQuery] = useState('');

  const options = useMemo(() => {
    const catalog = getLocaleCatalog();
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (item) =>
        item.code.includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.nativeLabel.toLowerCase().includes(q)
    );
  }, [query]);

  const renderItem = ({ item }: { item: LocaleOption }) => {
    const selected =
      item.code === value.toLowerCase() ||
      item.code === value.toLowerCase().split('-')[0];
    return (
      <TouchableOpacity
        style={[
          styles.row,
          {
            borderBottomColor: colors.border,
            backgroundColor: selected ? colors.accentSoft : colors.surface,
          },
        ]}
        onPress={() => {
          onSelect(item.code);
          onClose();
        }}
      >
        <View style={styles.rowCopy}>
          <Text style={[styles.native, { color: colors.text }]}>{item.nativeLabel}</Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {item.label} · {item.code}
          </Text>
        </View>
        {selected ? <Icon name="checkmark-circle" size={20} color={colors.accent} variant="filled" /> : null}
      </TouchableOpacity>
    );
  };

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} closeLabel={t('common.close')}>
      <View style={styles.sheet}>
        <ProDayText variant="title" style={styles.title}>
          {t('language.title')}
        </ProDayText>
        <ProDayText variant="caption" muted style={styles.hint}>
          {t('language.hint')}
        </ProDayText>
        <SearchBar
          embedded
          placeholder={t('language.search')}
          value={query}
          onChangeText={setQuery}
        />
        {catalogLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.accent} />
            <ProDayText variant="caption" muted>
              {t('language.translating')}
            </ProDayText>
          </View>
        ) : null}
        <FlatList
          data={options}
          keyExtractor={(item) => item.code}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          initialNumToRender={24}
          maxToRenderPerBatch={32}
          windowSize={10}
          style={styles.list}
          contentContainerStyle={styles.listContent}
        />
      </View>
    </AnimatedModalShell>
  );
};

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  title: { marginBottom: 2 },
  hint: { marginBottom: spacing.sm, lineHeight: 18 },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
  rowCopy: { flex: 1, gap: 2 },
  native: { fontSize: 16, fontWeight: '800' },
  meta: { fontSize: 12, fontWeight: '600' },
});
