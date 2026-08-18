import React from 'react';
import { View, Text, Modal, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Icon } from '../../ui/Icon';
import { AdminButton } from '../AdminButton';
import { adminChrome } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';
import type {
  AdminPersonAgeFilter,
  AdminPersonGenderFilter,
  AdminPersonSubscriptionFilter,
} from '../../../utils/adminPersonFilters';

const AGE_OPTIONS: { id: AdminPersonAgeFilter; label: string }[] = [
  { id: 'all', label: 'Tous les univers' },
  { id: 'youth', label: 'Monde -13' },
  { id: 'teen', label: '13–17' },
  { id: 'adult', label: '18+' },
];

const GENDER_OPTIONS: { id: AdminPersonGenderFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'men', label: 'Homme' },
  { id: 'women', label: 'Femme' },
];

const SUBSCRIPTION_OPTIONS: { id: AdminPersonSubscriptionFilter; label: string }[] = [
  { id: 'all', label: 'Tous' },
  { id: 'free', label: 'Gratuit' },
  { id: 'paid', label: 'Payant' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  showPlayerFilters: boolean;
  ageFilter: AdminPersonAgeFilter;
  genderFilter: AdminPersonGenderFilter;
  subscriptionFilter: AdminPersonSubscriptionFilter;
  onAgeChange: (v: AdminPersonAgeFilter) => void;
  onGenderChange: (v: AdminPersonGenderFilter) => void;
  onSubscriptionChange: (v: AdminPersonSubscriptionFilter) => void;
  onReset: () => void;
};

function FilterSection<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      <View style={s.chipRow}>
        {options.map((opt) => {
          const active = opt.id === value;
          return (
            <Pressable
              key={opt.id}
              onPress={() => onChange(opt.id)}
              style={[s.chip, active && s.chipOn]}
            >
              <Text style={[s.chipText, active && s.chipTextOn]}>{opt.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AdminPersonFiltersSheet({
  visible,
  onClose,
  showPlayerFilters,
  ageFilter,
  genderFilter,
  subscriptionFilter,
  onAgeChange,
  onGenderChange,
  onSubscriptionChange,
  onReset,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={s.root}>
        <View style={s.head}>
          <Text style={s.title}>Affiner la liste</Text>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Fermer">
            <Icon name="close" size={22} color={adminChrome.textMuted} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          {showPlayerFilters ? (
            <>
              <FilterSection<AdminPersonAgeFilter>
                title="Univers joueur"
                options={AGE_OPTIONS}
                value={ageFilter}
                onChange={onAgeChange}
              />
              <FilterSection<AdminPersonGenderFilter>
                title="Genre"
                options={GENDER_OPTIONS}
                value={genderFilter}
                onChange={onGenderChange}
              />
            </>
          ) : null}

          <FilterSection<AdminPersonSubscriptionFilter>
            title="Abonnement"
            options={SUBSCRIPTION_OPTIONS}
            value={subscriptionFilter}
            onChange={onSubscriptionChange}
          />
        </ScrollView>

        <View style={s.footer}>
          <AdminButton label="Réinitialiser" variant="outline" flex onPress={onReset} />
          <AdminButton label="Appliquer" variant="primary" flex onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: adminChrome.band },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: adminChrome.shell,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: adminChrome.text,
    letterSpacing: -0.3,
  },
  body: { padding: spacing.md, gap: spacing.lg, paddingBottom: spacing.xl },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: adminChrome.textMuted,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: adminChrome.radiusSm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: adminChrome.shellBorder,
    backgroundColor: adminChrome.shell,
  },
  chipOn: { backgroundColor: adminChrome.accent, borderColor: adminChrome.accent },
  chipText: { fontSize: 12, fontWeight: '700', color: adminChrome.textMuted },
  chipTextOn: { color: '#FFF' },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    paddingBottom: spacing.lg,
    backgroundColor: adminChrome.shell,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: adminChrome.shellBorder,
  },
});
