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
import { ClubFinancePlanPanel } from '../../features/club/ui/ClubFinancePlanPanel';
import {
  buildClubFinanceCategoryBreakdown,
  buildClubFinanceLedgerRow,
  buildCotisationCoverage,
  clubFinanceHonestyNote,
  clubFinanceOutstandingPrerequisites,
  clubFinancePaymentProvenanceNote,
  CLUB_FINANCE_PERIOD_DEFINITION,
  CLUB_FINANCE_PERIOD_LABELS,
  defaultCotisationLabel,
  filterClubFinanceByPeriod,
  filterClubFinanceEntries,
  formatClubFinanceEur,
  matchMemberFromName,
  resolveClubFinanceSubtitle,
  type ClubFinanceLedgerFilter,
  type ClubFinancePeriod,
} from '../../features/club/ui/clubFinanceModel';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../../features/club/theme/clubDesignSystem';
import {
  CLUB_FINANCE_CATEGORY_SUGGESTIONS,
  CLUB_FINANCE_PAYMENT_METHODS,
  CLUB_FINANCE_PAYMENT_METHOD_LABELS,
  CLUB_FINANCE_TYPE_LABELS,
  isClubFinanceIncomeType,
  type ClubFinanceEntry,
  type ClubFinanceEntryType,
  type ClubFinancePaymentMethod,
} from '../../models/ClubFinanceEntry';
import type { ClubFee } from '../../models/ClubFee';
import { clubFeesService } from '../../services/clubFees.service';
import { clubSeasonLabelForDate } from '../../utils/clubSeason';
import { humanizeClubFinanceWriteError } from '../../features/club/ui/clubFeeModel';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';

const TYPE_OPTIONS: { id: ClubFinanceEntryType; label: string }[] = [
  { id: 'cotisation', label: 'Cotisation' },
  { id: 'depense', label: 'Dépense' },
  { id: 'recette', label: 'Recette' },
  { id: 'autre', label: 'Autre' },
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
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().slice(0, 10));
  const [ledgerFilter, setLedgerFilter] = useState<ClubFinanceLedgerFilter>('all');
  const [period, setPeriod] = useState<ClubFinancePeriod>('all');
  const [paymentMethod, setPaymentMethod] = useState<ClubFinancePaymentMethod | null>(null);
  const [feeId, setFeeId] = useState<string | null>(null);
  const [feeOptions, setFeeOptions] = useState<ClubFee[]>([]);
  const [feesLoading, setFeesLoading] = useState(false);

  /**
   * Échéances de la saison en cours, chargées **à l'ouverture du formulaire** : c'est le
   * seul moment où le rattachement est décidé. Les charger en permanence coûterait une
   * lecture à chaque affichage du registre pour une donnée utilisée rarement.
   */
  const loadFeeOptions = useCallback(() => {
    if (!clubId) {
      setFeeOptions([]);
      return;
    }
    setFeesLoading(true);
    void clubFeesService
      .listByClub(clubId, clubSeasonLabelForDate(new Date()))
      .then(setFeeOptions)
      .catch(() => setFeeOptions([]))
      .finally(() => setFeesLoading(false));
  }, [clubId]);

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

  /**
   * Période appliquée aux **totaux et à la ventilation**. Les écritures annulées ou supprimées
   * sont écartées à la source : un solde qui les inclurait ne serait pas réconciliable avec le registre.
   */
  const periodEntries = useMemo(
    () => filterClubFinanceByPeriod(entries, period),
    [entries, period],
  );
  const periodTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const e of periodEntries) {
      if (isClubFinanceIncomeType(e.type)) income += e.amount_eur;
      else expense += e.amount_eur;
    }
    return { income, expense, net: income - expense };
  }, [periodEntries]);
  const breakdown = useMemo(
    () => buildClubFinanceCategoryBreakdown(periodEntries),
    [periodEntries],
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

  const resetForm = useCallback(() => {
    setType('cotisation');
    setLabel('');
    setAmount('');
    setCategory('Licence');
    setMemberName('');
    setDateStr(new Date().toISOString().slice(0, 10));
    setPaymentMethod(null);
    setFeeId(null);
  }, []);

  const openForm = useCallback(
    (preset?: ClubFinanceEntryType) => {
      resetForm();
      if (preset) setType(preset);
      loadFeeOptions();
      setFormOpen(true);
    },
    [loadFeeOptions, resetForm],
  );

  const openCotisationForMember = useCallback(
    (name: string) => {
      resetForm();
      setType('cotisation');
      setMemberName(name);
      setLabel(defaultCotisationLabel(name));
      loadFeeOptions();
      setFormOpen(true);
    },
    [loadFeeOptions, resetForm],
  );

  /**
   * Échéances qui concernent l'adhérent saisi. Le rapprochement se fait sur l'UID quand
   * l'adhérent existe, sinon sur le nom — un encaissement ne doit pas être rattaché à
   * l'échéance d'un homonyme par simple ressemblance de chaîne.
   */
  const matchingFees = useMemo(() => {
    const matched = memberName.trim() ? matchMemberFromName(memberName, players) : null;
    const query = memberName.trim().toLowerCase();
    return feeOptions.filter((fee) => {
      if (matched) return fee.member_uid === matched.uid;
      if (!query) return false;
      return (fee.member_name ?? '').trim().toLowerCase() === query;
    });
  }, [feeOptions, memberName, players]);

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
    setSaving(true);
    try {
      await create({
        club_id: clubId,
        type,
        amount_eur: amountEur,
        label: resolvedLabel,
        category: category.trim() || 'Divers',
        entry_date: entryDate,
        created_by_uid: profile.uid,
        created_by_name: profile.display_name,
        member_uid: matched?.uid ?? null,
        member_name: memberName.trim() || matched?.display_name || null,
        payment_method: paymentMethod,
        fee_id: type === 'cotisation' ? feeId : null,
      });
      setFormOpen(false);
      resetForm();
      Alert.alert(
        'Enregistré',
        feeId
          ? `${CLUB_FINANCE_TYPE_LABELS[type]} ajoutée au ledger et rattachée à l’échéance.`
          : `${CLUB_FINANCE_TYPE_LABELS[type]} ajoutée au ledger.`,
      );
    } catch (e) {
      Alert.alert('Refusé', humanizeClubFinanceWriteError(e));
    } finally {
      setSaving(false);
    }
  }, [
    amount,
    category,
    clubId,
    create,
    dateStr,
    feeId,
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
        />

        {/* Ce qui est dû (échéances) et ce qui est prévu (budget) — séparé du registre. */}
        <ClubFinancePlanPanel clubId={clubId} entries={entries} />

        {/* Période appliquée aux totaux — l'intervalle est écrit sous les puces. */}
        <View style={styles.periodPills}>
          {(Object.keys(CLUB_FINANCE_PERIOD_LABELS) as ClubFinancePeriod[]).map((p) => {
            const isActive = p === period;
            return (
              <PressableSpring
                key={p}
                onPress={() => setPeriod(p)}
                scaleTo={0.97}
                haptic
                style={[
                  styles.periodPill,
                  { borderColor: tokens.border },
                  isActive ? { backgroundColor: tokens.accentSoft, borderColor: tokens.accent } : null,
                ]}
                accessibilityLabel={`Période ${CLUB_FINANCE_PERIOD_LABELS[p]}`}
              >
                <ClubText
                  variant="caption"
                  style={{ color: isActive ? tokens.accent : tokens.muted, fontWeight: '700' }}
                >
                  {CLUB_FINANCE_PERIOD_LABELS[p]}
                </ClubText>
              </PressableSpring>
            );
          })}
        </View>
        <ClubText variant="caption" muted style={styles.periodNote}>
          {CLUB_FINANCE_PERIOD_DEFINITION}
        </ClubText>

        <View style={[styles.breakdownCard, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}> {
          /* Ventilation calculée depuis les seules écritures de la période. */
        }
          <ClubText variant="label" muted>
            Ventilation par catégorie
          </ClubText>
          {breakdown.length === 0 ? (
            <ClubText variant="caption" muted style={styles.breakdownEmpty}>
              Aucune écriture sur cette période.
            </ClubText>
          ) : (
            breakdown.map((row) => (
              <View key={row.category} style={[styles.breakdownRow, { borderColor: tokens.border }]}>
                <View style={styles.breakdownLabel}>
                  <ClubText variant="caption" numberOfLines={1}>
                    {row.category}
                  </ClubText>
                  <ClubText variant="caption" muted>
                    {row.count} écriture{row.count > 1 ? 's' : ''} · {formatClubFinanceEur(row.incomeEur)} en entrée · {formatClubFinanceEur(row.expenseEur)} en sortie
                  </ClubText>
                </View>
                <ClubText
                  variant="caption"
                  style={{ color: row.netEur >= 0 ? tokens.pitch : tokens.danger, fontWeight: '800' }}
                >
                  {row.netEur >= 0 ? '+' : ''}
                  {formatClubFinanceEur(row.netEur)}
                </ClubText>
              </View>
            ))
          )}
          <View style={[styles.breakdownTotal, { borderColor: tokens.borderStrong }]}>
            <ClubText variant="caption" muted>
              Net de la période
            </ClubText>
            <ClubText
              variant="body"
              style={{
                color: periodTotals.net >= 0 ? tokens.pitch : tokens.danger,
                fontWeight: '800',
              }}
            >
              {periodTotals.net >= 0 ? '+' : ''}
              {formatClubFinanceEur(periodTotals.net)}
            </ClubText>
          </View>
        </View>

        {/* Deux limites du modèle, dites telles quelles : elles ne sont pas masquées par un chiffre. */}
        <View style={[styles.limitCard, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>{
          /* Aucune intégration bancaire : les écritures sont saisies à la main. */
        }
          <Icon name="alert-circle" size={16} color={tokens.muted} />
          <View style={styles.limitBody}>
            <ClubText variant="caption" muted>
              {clubFinancePaymentProvenanceNote()}
            </ClubText>
            <ClubText variant="caption" muted style={styles.limitSecond}>
              {clubFinanceOutstandingPrerequisites()}
            </ClubText>
          </View>
        </View>

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
            <ClubText variant="caption" muted>
              {filteredEntries.length}
            </ClubText>
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
        {/* Moyen de paiement — facultatif, jamais déduit. « Non renseigné » est un état valide. */}
        <ClubText variant="caption" muted style={styles.fieldLabel}>
          Moyen de paiement
        </ClubText>
        <View style={styles.chips}>
          {(Object.keys(CLUB_FINANCE_PAYMENT_METHOD_LABELS) as ClubFinancePaymentMethod[]).map(
            (m) => {
              const isOn = paymentMethod === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setPaymentMethod(isOn ? null : m)}
                  style={[styles.chip, isOn && styles.chipOn]}
                  accessibilityRole="button"
                  accessibilityLabel={`Moyen de paiement ${CLUB_FINANCE_PAYMENT_METHOD_LABELS[m]}`}
                >
                  <ClubText
                    variant="caption"
                    style={{
                      color: isOn ? tokens.onAccent : tokens.foreground,
                      fontWeight: '600',
                    }}
                  >
                    {CLUB_FINANCE_PAYMENT_METHOD_LABELS[m]}
                  </ClubText>
                </Pressable>
              );
            },
          )}
        </View>
        <ClubText variant="caption" muted>
          {paymentMethod
            ? clubFinancePaymentProvenanceNote()
            : 'Aucun moyen renseigné — « Non renseigné » reste un état valide, jamais remplacé par un défaut.'}
        </ClubText>

        {/* Rattachement à une échéance — c'est ce qui réduit un reste dû. */}
        {type === 'cotisation' ? (
          <>
            <ClubText variant="caption" muted style={styles.fieldLabel}>
              Échéance réglée
            </ClubText>
            {feesLoading ? (
              <ActivityIndicator color={tokens.accent} />
            ) : matchingFees.length > 0 ? (
              <View style={styles.chips}>
                {matchingFees.map((fee) => {
                  const isOn = feeId === fee.id;
                  return (
                    <Pressable
                      key={fee.id}
                      onPress={() => setFeeId(isOn ? null : fee.id)}
                      style={[styles.chip, isOn && styles.chipOn]}
                      accessibilityRole="button"
                      accessibilityLabel={`Rattacher à l’échéance ${fee.category} du ${fee.due_date.toLocaleDateString('fr-FR')}`}
                    >
                      <ClubText
                        variant="caption"
                        style={{
                          color: isOn ? tokens.onAccent : tokens.foreground,
                          fontWeight: '600',
                        }}
                      >
                        {`${fee.category} · ${formatClubFinanceEur(fee.amount_due_eur - fee.discount_eur)} · ${fee.due_date.toLocaleDateString('fr-FR')}`}
                      </ClubText>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <ClubText variant="caption" muted>
                {memberName.trim()
                  ? 'Aucune échéance enregistrée pour cet adhérent sur la saison en cours : l’encaissement sera enregistré sans être rattaché, et n’éteindra aucun reste dû.'
                  : 'Choisissez l’adhérent pour voir ses échéances.'}
              </ClubText>
            )}
            <ClubText variant="caption" muted style={{ marginTop: clubSpace.xs }}>
              {clubFinanceHonestyNote()}
            </ClubText>
          </>
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
    periodPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: clubSpace.sm,
      paddingHorizontal: clubSpace.lg,
      marginBottom: clubSpace.sm,
    },
    periodPill: {
      paddingHorizontal: clubSpace.md,
      paddingVertical: clubSpace.sm,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
    },
    periodNote: {
      paddingHorizontal: clubSpace.lg,
      marginBottom: clubSpace.md,
    },
    breakdownCard: {
      marginHorizontal: clubSpace.lg,
      marginBottom: clubSpace.md,
      padding: clubSpace.lg,
      borderRadius: clubRadius.md,
      borderWidth: 1,
      gap: clubSpace.sm,
    },
    breakdownEmpty: { paddingVertical: clubSpace.sm },
    breakdownRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.md,
      paddingVertical: clubSpace.sm,
      borderTopWidth: 1,
    },
    breakdownLabel: { flex: 1, gap: 2 },
    breakdownTotal: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: clubSpace.md,
      borderTopWidth: 1,
    },
    limitCard: {
      flexDirection: 'row',
      gap: clubSpace.md,
      marginHorizontal: clubSpace.lg,
      marginBottom: clubSpace.md,
      padding: clubSpace.md,
      borderRadius: clubRadius.md,
      borderWidth: 1,
    },
    limitBody: { flex: 1, gap: clubSpace.sm },
    limitSecond: { lineHeight: 16 },
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
