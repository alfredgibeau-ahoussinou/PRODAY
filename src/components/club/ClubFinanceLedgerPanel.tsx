import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useClubFinance } from '../../features/club/hooks/useClubFinance';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubButton,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubModalSurface,
  ClubSectionCard,
  ClubSegmentedControl,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../../features/club/theme/clubDesignSystem';
import {
  CLUB_FINANCE_CATEGORY_SUGGESTIONS,
  CLUB_FINANCE_TYPE_LABELS,
  isClubFinanceExpenseType,
  type ClubFinanceEntry,
  type ClubFinanceEntryType,
} from '../../models/ClubFinanceEntry';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';

function formatEur(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function formatEntryDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const TYPE_OPTIONS: { id: ClubFinanceEntryType; label: string }[] = [
  { id: 'cotisation', label: 'Cotisation' },
  { id: 'depense', label: 'Dépense' },
  { id: 'recette', label: 'Recette' },
  { id: 'autre', label: 'Autre' },
];

type Props = {
  clubId: string | null;
};

/**
 * Ledger club — listes, totaux, ajout cotisation / dépense / recette.
 */
export function ClubFinanceLedgerPanel({ clubId }: Props) {
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const { entries, totals, loading, refreshing, refresh, create, softDelete } =
    useClubFinance(clubId);

  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [type, setType] = useState<ClubFinanceEntryType>('cotisation');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Licence');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));

  const resetForm = useCallback(() => {
    setType('cotisation');
    setLabel('');
    setAmount('');
    setCategory('Licence');
    setDateStr(new Date().toISOString().slice(0, 10));
  }, []);

  const openForm = useCallback(
    (preset?: ClubFinanceEntryType) => {
      resetForm();
      if (preset) setType(preset);
      setFormOpen(true);
    },
    [resetForm],
  );

  const submit = useCallback(async () => {
    if (!clubId || !profile?.uid) {
      Alert.alert('Club requis', 'Liez un club à votre compte pour enregistrer une écriture.');
      return;
    }
    const amountEur = Number(String(amount).replace(',', '.'));
    if (!Number.isFinite(amountEur) || amountEur <= 0) {
      Alert.alert('Montant', 'Saisissez un montant positif.');
      return;
    }
    if (!label.trim()) {
      Alert.alert('Libellé', 'Indiquez un libellé (ex. Cotisation U15 — Martin).');
      return;
    }
    const entryDate = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(entryDate.getTime())) {
      Alert.alert('Date', 'Date invalide (AAAA-MM-JJ).');
      return;
    }
    setSaving(true);
    try {
      await create({
        club_id: clubId,
        type,
        amount_eur: amountEur,
        label: label.trim(),
        category: category.trim() || 'Divers',
        entry_date: entryDate,
        created_by_uid: profile.uid,
        created_by_name: profile.display_name,
      });
      setFormOpen(false);
      resetForm();
      Alert.alert('Enregistré', `${CLUB_FINANCE_TYPE_LABELS[type]} ajoutée au ledger.`);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  }, [
    amount,
    category,
    clubId,
    create,
    dateStr,
    label,
    profile,
    resetForm,
    type,
  ]);

  const confirmDelete = useCallback(
    (entry: ClubFinanceEntry) => {
      Alert.alert(
        'Supprimer cette écriture ?',
        `${entry.label} · ${formatEur(entry.amount_eur)}`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: () => {
              void softDelete(entry.id).catch((e) =>
                Alert.alert('Erreur', e instanceof Error ? e.message : 'Suppression impossible.'),
              );
            },
          },
        ],
      );
    },
    [softDelete],
  );

  if (!clubId) {
    return (
      <View style={styles.root}>
        <ClubChapterScroll>
          <ClubBrandHeader title="Finances" subtitle="Cotisations & dépenses" />
          <ClubEmptyState
            title="Club requis"
            body="Liez un club pour suivre cotisations, recettes et dépenses."
            icon="bag"
          />
        </ClubChapterScroll>
      </View>
    );
  }

  if (loading && entries.length === 0) {
    return (
      <View style={styles.root}>
        <ClubLoading />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={refreshing} onRefresh={() => void refresh()}>
        <ClubBrandHeader
          title="Finances"
          subtitle="Cotisations · dépenses · recettes"
        />

        <View style={styles.kpiRow}>
          <View style={[styles.kpi, styles.kpiIn]}>
            <ClubText variant="caption" muted>
              Recettes
            </ClubText>
            <ClubText variant="h3" style={{ color: tokens.success }}>
              {formatEur(totals.recettes_eur)}
            </ClubText>
          </View>
          <View style={[styles.kpi, styles.kpiOut]}>
            <ClubText variant="caption" muted>
              Dépenses
            </ClubText>
            <ClubText variant="h3" style={{ color: tokens.danger }}>
              {formatEur(totals.depenses_eur)}
            </ClubText>
          </View>
          <View style={[styles.kpi, styles.kpiSolde]}>
            <ClubText variant="caption" muted>
              Solde
            </ClubText>
            <ClubText
              variant="h3"
              style={{ color: totals.solde_eur >= 0 ? tokens.accent : tokens.danger }}
            >
              {formatEur(totals.solde_eur)}
            </ClubText>
          </View>
        </View>

        <ClubSectionCard title="Ajouter">
          <View style={styles.addRow}>
            <ClubButton
              label="Cotisation"
              icon="people"
              onPress={() => openForm('cotisation')}
            />
            <ClubButton
              label="Dépense"
              variant="secondary"
              icon="bag"
              onPress={() => openForm('depense')}
            />
            <ClubButton
              label="Recette"
              variant="ghost"
              icon="stats-chart"
              onPress={() => openForm('recette')}
            />
          </View>
        </ClubSectionCard>

        <ClubSectionCard title={`Écritures (${totals.count})`}>
          {entries.length === 0 ? (
            <ClubEmptyState
              title="Aucune écriture"
              body="Ajoutez une cotisation, une dépense ou une recette pour démarrer le ledger."
              icon="bag"
            />
          ) : (
            entries.map((e) => {
              const expense = isClubFinanceExpenseType(e.type);
              return (
                <ClubActionRow
                  key={e.id}
                  icon={expense ? 'close' : 'checkmark-circle'}
                  label={e.label}
                  hint={`${CLUB_FINANCE_TYPE_LABELS[e.type]} · ${e.category} · ${formatEntryDate(e.entry_date)} · ${expense ? '−' : '+'}${formatEur(e.amount_eur)}`}
                  onPress={() => confirmDelete(e)}
                />
              );
            })
          )}
        </ClubSectionCard>

        <ClubText variant="caption" muted>
          Touchez une écriture pour la retirer du ledger. Les objectifs de financement sponsors
          restent dans Sponsoring.
        </ClubText>
      </ClubChapterScroll>

      <PressableSpring
        onPress={() => openForm()}
        scaleTo={0.94}
        haptic
        style={styles.fab}
        accessibilityLabel="Ajouter une écriture"
      >
        <Icon name="add" size={26} color={tokens.onAccent} />
      </PressableSpring>

      <ClubModalSurface
        visible={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title="Nouvelle écriture"
      >
        <ClubSegmentedControl options={TYPE_OPTIONS} value={type} onChange={setType} />
        <ClubText variant="caption" muted style={styles.fieldLabel}>
          Libellé
        </ClubText>
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="Ex. Cotisation saison — Dupont"
          placeholderTextColor={tokens.muted}
          style={styles.input}
        />
        <ClubText variant="caption" muted style={styles.fieldLabel}>
          Montant (€)
        </ClubText>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={tokens.muted}
          style={styles.input}
        />
        <ClubText variant="caption" muted style={styles.fieldLabel}>
          Catégorie
        </ClubText>
        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder="Licence"
          placeholderTextColor={tokens.muted}
          style={styles.input}
        />
        <View style={styles.chips}>
          {CLUB_FINANCE_CATEGORY_SUGGESTIONS.map((c) => (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, category === c && styles.chipOn]}
            >
              <ClubText
                variant="caption"
                style={{
                  color: category === c ? tokens.onAccent : tokens.foreground,
                  fontWeight: '600',
                }}
              >
                {c}
              </ClubText>
            </Pressable>
          ))}
        </View>
        <ClubText variant="caption" muted style={styles.fieldLabel}>
          Date (AAAA-MM-JJ)
        </ClubText>
        <TextInput
          value={dateStr}
          onChangeText={setDateStr}
          autoCapitalize="none"
          placeholder="2026-08-21"
          placeholderTextColor={tokens.muted}
          style={styles.input}
        />
        <View style={styles.formActions}>
          <ClubButton
            label="Annuler"
            variant="ghost"
            disabled={saving}
            onPress={() => setFormOpen(false)}
          />
          <ClubButton
            label={saving ? 'Enregistrement…' : 'Enregistrer'}
            disabled={saving}
            onPress={() => void submit()}
          />
        </View>
        {saving ? <ActivityIndicator color={tokens.accent} style={{ marginTop: 8 }} /> : null}
      </ClubModalSurface>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    kpiRow: {
      flexDirection: 'row',
      gap: clubSpace.sm,
    },
    kpi: {
      flex: 1,
      padding: clubSpace.md,
      borderRadius: clubRadius.lg,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: 4,
      ...clubShadow.soft,
    },
    kpiIn: { backgroundColor: tokens.headerWash },
    kpiOut: { backgroundColor: tokens.surface },
    kpiSolde: { backgroundColor: tokens.elevated },
    addRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: clubSpace.sm,
    },
    fab: {
      position: 'absolute',
      right: clubSpace.lg,
      bottom: clubSpace.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...clubShadow.soft,
    },
    fieldLabel: { marginTop: clubSpace.sm, marginBottom: 4 },
    input: {
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: clubRadius.md,
      paddingHorizontal: clubSpace.md,
      paddingVertical: 10,
      color: tokens.foreground,
      backgroundColor: tokens.surface,
      fontSize: 15,
    },
    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: clubSpace.sm,
    },
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    chipOn: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: clubSpace.sm,
      marginTop: clubSpace.md,
    },
  });
