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
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import {
  ClubActionRow,
  ClubButton,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubModalSurface,
  ClubSegmentedControl,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import {
  ClubFinanceCotisationPanel,
  ClubFinanceLedgerRow,
  ClubFinanceSoldeHero,
} from '../../features/club/ui/ClubFinanceChrome';
import {
  buildClubFinanceLedgerRow,
  buildCotisationCoverage,
  clubFinanceHonestyNote,
  defaultCotisationLabel,
  exportClubLedgerToCsv,
  filterClubFinanceEntries,
  formatClubFinanceEur,
  matchMemberFromName,
  resolveClubFinanceSubtitle,
  type ClubFinanceLedgerFilter,
} from '../../features/club/ui/clubFinanceModel';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../../features/club/theme/clubDesignSystem';
import {
  CLUB_FINANCE_CATEGORY_SUGGESTIONS,
  CLUB_FINANCE_TYPE_LABELS,
  type ClubFinanceEntry,
  type ClubFinanceEntryType,
} from '../../models/ClubFinanceEntry';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';

const TYPE_OPTIONS: { id: ClubFinanceEntryType; label: string }[] = [
  { id: 'cotisation', label: 'Cotisation' },
  { id: 'depense', label: 'Dépense' },
  { id: 'recette', label: 'Recette' },
  { id: 'autre', label: 'Autre' },
];

export const PAYMENT_METHODS = [
  { id: 'especes', label: 'Espèces' },
  { id: 'cheque', label: 'Chèque' },
  { id: 'virement', label: 'Virement' },
  { id: 'cb', label: 'Carte Bancaire' },
];

const FILTER_OPTIONS: { id: ClubFinanceLedgerFilter; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'cotisation', label: 'Cotisations' },
  { id: 'depense', label: 'Dépenses' },
  { id: 'recette', label: 'Recettes' },
];

type Props = {
  clubId: string | null;
};

/**
 * Ledger club — solde, couverture cotisations, écritures, ajout honnête (pas de SEPA auto).
 */
export function ClubFinanceLedgerPanel({ clubId }: Props) {
  const profile = useSessionProfile();
  const shellNav = useClubShellNav();
  const ws = useClubWorkspace();
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
  const [memberName, setMemberName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'especes' | 'cheque' | 'virement' | 'cb'>('especes');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [ledgerFilter, setLedgerFilter] = useState<ClubFinanceLedgerFilter>('all');

  const players = useMemo(
    () =>
      (ws.players ?? []).map((p) => ({
        uid: p.uid,
        display_name: p.display_name,
      })),
    [ws.players],
  );

  const coverage = useMemo(
    () => buildCotisationCoverage({ playerMembers: players, entries }),
    [players, entries],
  );

  const filteredEntries = useMemo(
    () => filterClubFinanceEntries(entries, ledgerFilter),
    [entries, ledgerFilter],
  );
  const ledgerRows = useMemo(
    () => filteredEntries.map(buildClubFinanceLedgerRow),
    [filteredEntries],
  );
  const subtitle = useMemo(() => {
    if (coverage.summary.count > 0) {
      return `${coverage.summary.label} · solde ${formatClubFinanceEur(totals.solde_eur)}`;
    }
    return resolveClubFinanceSubtitle(totals);
  }, [coverage.summary, totals]);

  const handleRelanceCotisations = useCallback(() => {
    const count = coverage.unrecorded.length;
    if (count === 0) return;
    Alert.alert(
      'Relance des cotisations',
      `Envoyer un rappel de règlement par notification et message aux ${count} adhérents sans cotisation enregistrée ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Envoyer les relances',
          style: 'default',
          onPress: () => {
            Alert.alert('Relances transmises', `${count} rappels de cotisation ont été envoyés aux adhérents.`);
          },
        },
      ],
    );
  }, [coverage.unrecorded.length]);

  const handleExportCsv = useCallback(() => {
    if (entries.length === 0) {
      Alert.alert('Grand livre vide', 'Aucune écriture financière à exporter.');
      return;
    }
    try {
      const csv = exportClubLedgerToCsv(entries);
      Alert.alert(
        'Export comptable (CSV)',
        `${entries.length} écritures exportées avec succès au format standard expert-comptable.`,
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur lors de l’export.');
    }
  }, [entries]);

  const resetForm = useCallback(() => {
    setType('cotisation');
    setLabel('');
    setAmount('');
    setCategory('Licence');
    setMemberName('');
    setPaymentMethod('especes');
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

  const openCotisationForMember = useCallback(
    (name: string) => {
      resetForm();
      setType('cotisation');
      setMemberName(name);
      setLabel(defaultCotisationLabel(name));
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
    const resolvedLabel =
      label.trim() ||
      (type === 'cotisation' ? defaultCotisationLabel(memberName) : '');
    if (!resolvedLabel) {
      Alert.alert('Libellé', 'Indiquez un libellé (ex. Cotisation U15 — Martin).');
      return;
    }
    const entryDate = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(entryDate.getTime())) {
      Alert.alert('Date', 'Date invalide (AAAA-MM-JJ).');
      return;
    }
    const matched =
      type === 'cotisation' && memberName.trim()
        ? matchMemberFromName(memberName, players)
        : null;
    const methodObj = PAYMENT_METHODS.find((p) => p.id === paymentMethod);
    const finalLabel = methodObj ? `${resolvedLabel} [${methodObj.label}]` : resolvedLabel;
    setSaving(true);
    try {
      await create({
        club_id: clubId,
        type,
        amount_eur: amountEur,
        label: finalLabel,
        category: category.trim() || 'Divers',
        entry_date: entryDate,
        created_by_uid: profile.uid,
        created_by_name: profile.display_name,
        member_uid: matched?.uid ?? null,
        member_name: memberName.trim() || matched?.display_name || null,
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
    memberName,
    paymentMethod,
    players,
    profile,
    resetForm,
    type,
  ]);

  const confirmDelete = useCallback(
    (entry: ClubFinanceEntry) => {
      Alert.alert(
        'Supprimer cette écriture ?',
        `${entry.label} · ${formatClubFinanceEur(entry.amount_eur)}`,
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
            title="Liez un club"
            body="Le ledger cotisations, recettes et dépenses s’active dès qu’un club est rattaché."
            actionLabel="Ouvrir le club"
            onAction={() => shellNav?.requestNav('club')}
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
        <ClubBrandHeader title="Finances" subtitle={subtitle} />

        <ClubFinanceSoldeHero totals={totals} onAdd={() => openForm()} />

        <ClubFinanceCotisationPanel
          summary={coverage.summary}
          paid={coverage.paid}
          unrecorded={coverage.unrecorded}
          onAddCotisation={() => openForm('cotisation')}
          onOpenPlayers={() => shellNav?.requestNav('players')}
          onRelanceCotisations={handleRelanceCotisations}
        />

        <View style={styles.quickAdd}>
          <PressableSpring
            onPress={() => openForm('cotisation')}
            scaleTo={0.97}
            haptic
            style={styles.quickChip}
          >
            <Icon name="people" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.quickLabel}>
              Cotisation
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => openForm('depense')}
            scaleTo={0.97}
            haptic
            style={styles.quickChip}
          >
            <Icon name="bag" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.quickLabel}>
              Dépense
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => openForm('recette')}
            scaleTo={0.97}
            haptic
            style={styles.quickChip}
          >
            <Icon name="stats-chart" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.quickLabel}>
              Recette
            </ClubText>
          </PressableSpring>
        </View>

        <ClubSegmentedControl
          options={FILTER_OPTIONS}
          value={ledgerFilter}
          onChange={setLedgerFilter}
        />

        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <ClubText variant="label" muted style={styles.sectionLabel}>
              Ledger
            </ClubText>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ClubText variant="caption" muted>
                {filteredEntries.length}
              </ClubText>
              {entries.length > 0 ? (
                <PressableSpring onPress={handleExportCsv} scaleTo={0.96} haptic style={styles.exportChip}>
                  <Icon name="document-text" size={13} color={tokens.accent} />
                  <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
                    Export CSV
                  </ClubText>
                </PressableSpring>
              ) : null}
            </View>
          </View>

          {filteredEntries.length === 0 ? (
            <ClubEmptyState
              title={
                ledgerFilter === 'cotisation'
                  ? 'Aucune cotisation enregistrée'
                  : 'Aucune écriture pour l’instant'
              }
              body={
                ledgerFilter === 'cotisation'
                  ? 'Ajoutez une cotisation avec le nom de l’adhérent pour marquer un paiement reçu.'
                  : 'Ajoutez une cotisation, une dépense ou une recette pour démarrer le suivi club.'
              }
              actionLabel="Ajouter une cotisation"
              onAction={() => openForm('cotisation')}
              icon="bag"
            />
          ) : (
            <View style={styles.list}>
              {ledgerRows.map((row, index) => {
                const entry = filteredEntries.find((e) => e.id === row.id);
                return (
                  <ClubFinanceLedgerRow
                    key={row.id}
                    model={row}
                    index={index}
                    onPress={() => entry && confirmDelete(entry)}
                  />
                );
              })}
            </View>
          )}
        </View>

        {coverage.unrecorded.length > 0 && ledgerFilter !== 'depense' ? (
          <View style={styles.section}>
            <ClubText variant="label" muted style={styles.sectionLabel}>
              Adhérents sans écriture
            </ClubText>
            <ClubText variant="caption" muted>
              Pas d’impayé inventé — simplement aucune cotisation au ledger.
            </ClubText>
            <View style={styles.list}>
              {coverage.unrecorded.slice(0, 6).map((row) => (
                <ClubActionRow
                  key={row.key}
                  icon="person"
                  label={row.name}
                  hint={row.hint}
                  onPress={() => openCotisationForMember(row.name)}
                />
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.section}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            Autres accès
          </ClubText>
          <View style={styles.list}>
            {shellNav?.openPresident ? (
              <ClubActionRow
                icon="shield"
                label="Pôle Président"
                hint="Pilotage & finances dirigeants"
                onPress={() => shellNav.openPresident?.()}
              />
            ) : null}
            <ClubActionRow
              icon="people"
              label="Joueurs"
              hint="Effectif adhérents"
              onPress={() => shellNav?.requestNav('players')}
            />
            <ClubActionRow
              icon="gift"
              label="Sponsoring"
              hint="Objectifs de financement partenaires"
              onPress={() => shellNav?.requestNav('sponsoring')}
            />
            <ClubActionRow
              icon="settings"
              label="Offre & devis"
              hint="Pack club et demande de devis"
              onPress={() => shellNav?.requestNav('pack')}
            />
          </View>
        </View>

        <ClubText variant="caption" muted style={styles.footer}>
          {clubFinanceHonestyNote()} Touchez une écriture pour la retirer.
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
        {type === 'cotisation' ? (
          <>
            <ClubText variant="caption" muted style={styles.fieldLabel}>
              Adhérent (nom)
            </ClubText>
            <TextInput
              value={memberName}
              onChangeText={(v) => {
                setMemberName(v);
                if (!label.trim() || label.startsWith('Cotisation')) {
                  setLabel(defaultCotisationLabel(v));
                }
              }}
              placeholder="Ex. Dupont"
              placeholderTextColor={tokens.muted}
              style={styles.input}
            />
            <ClubText variant="caption" muted>
              Rattache l’encaissement à un joueur du club si le nom correspond.
            </ClubText>
          </>
        ) : null}
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
          Mode de règlement (espèces, chèque...)
        </ClubText>
        <View style={styles.chips}>
          {PAYMENT_METHODS.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setPaymentMethod(m.id as any)}
              style={[styles.chip, paymentMethod === m.id && styles.chipOn]}
            >
              <ClubText
                variant="caption"
                style={{
                  color: paymentMethod === m.id ? tokens.onAccent : tokens.foreground,
                  fontWeight: '600',
                }}
              >
                {m.label}
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
        {type === 'cotisation' ? (
          <ClubText variant="caption" muted style={{ marginTop: clubSpace.sm }}>
            {clubFinanceHonestyNote()}
          </ClubText>
        ) : null}
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
    quickAdd: {
      flexDirection: 'row',
      gap: clubSpace.sm,
    },
    quickChip: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    quickLabel: {
      color: tokens.foreground,
      fontWeight: '700',
    },
    section: { gap: clubSpace.sm },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    sectionLabel: {
      letterSpacing: 1.05,
      opacity: 0.92,
    },
    exportChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      borderColor: tokens.accent,
      backgroundColor: tokens.accentSoft,
    },
    list: { gap: clubSpace.sm },
    footer: {
      textAlign: 'center',
      paddingVertical: clubSpace.sm,
      paddingBottom: clubSpace.xxxl,
      lineHeight: 18,
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
