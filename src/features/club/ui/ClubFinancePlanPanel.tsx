/**
 * Finances — **ce qui est dû** et **ce qui est prévu**.
 *
 * Deux sections, un seul principe : rien n'est affiché qui n'ait été saisi par le club. Le
 * reste dû vient d'échéances enregistrées, l'écart budgétaire d'un prévu saisi. Là où la
 * donnée manque, l'écran écrit ce qui manque au lieu de le combler.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import {
  CLUB_FINANCE_CATEGORY_SUGGESTIONS,
  type ClubFinanceEntry,
} from '../../../models/ClubFinanceEntry';
import { CLUB_FEE_DEFAULT_CATEGORY, type CreateClubFeeInput } from '../../../models/ClubFee';
import { clubRadius, clubSpace } from '../theme/clubDesignSystem';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { useClubFinancePlan } from '../hooks/useClubFinancePlan';
import { useClubWorkspace } from '../hooks/useClubWorkspace';
import { useClubTheme } from '../shell/ClubThemeContext';
import {
  buildClubBudgetReport,
  clubBudgetUnplannedNote,
  clubBudgetVarianceDefinition,
  resolveClubBudgetSummaryLabel,
} from './clubBudgetModel';
import {
  buildClubFeeRows,
  clubFeeOutstandingDefinition,
  clubFeeUnallocatedNote,
  humanizeClubFinanceWriteError,
  resolveClubFeeSummaryLabel,
  summarizeClubFees,
  type ClubFeeRow,
} from './clubFeeModel';
import { formatClubFinanceEur } from './clubFinanceModel';
import {
  ClubActionRow,
  ClubButton,
  ClubListGroup,
  ClubModalSurface,
  ClubPill,
  ClubSearchField,
  ClubSectionCard,
  ClubSectionHeader,
  ClubSegmentedControl,
  ClubStatusPill,
  ClubText,
} from './clubUi';

const CATEGORY_SUGGESTIONS: string[] = [
  CLUB_FEE_DEFAULT_CATEGORY,
  ...CLUB_FINANCE_CATEGORY_SUGGESTIONS,
].slice(0, 6);

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\s/g, '').replace(',', '.');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function parseIsoDate(raw: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function agingTone(aging: ClubFeeRow['aging']): 'ok' | 'warn' | 'alert' | 'neutral' {
  if (aging === 'overdue') return 'alert';
  if (aging === 'due_soon') return 'warn';
  if (aging === 'settled') return 'ok';
  return 'neutral';
}

type Props = {
  clubId: string;
  /** Écritures du ledger — seules sources des encaissements rattachés. */
  entries: ClubFinanceEntry[];
};

export function ClubFinancePlanPanel({ clubId, entries }: Props) {
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const plan = useClubFinancePlan(clubId);

  const players = useMemo(
    () => (ws.players ?? []).map((p) => ({ uid: p.uid, display_name: p.display_name })),
    [ws.players],
  );

  const feeRows = useMemo(
    () => buildClubFeeRows({ fees: plan.fees, entries, season: plan.season }),
    [plan.fees, entries, plan.season],
  );
  const feeSummary = useMemo(() => summarizeClubFees(feeRows, entries), [feeRows, entries]);

  const budgetReport = useMemo(
    () => buildClubBudgetReport({ lines: plan.budgetLines, entries, season: plan.season }),
    [plan.budgetLines, entries, plan.season],
  );

  /* ----------------------------- Échéance ----------------------------- */

  const [feeFormOpen, setFeeFormOpen] = useState(false);
  const [feeSaving, setFeeSaving] = useState(false);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberUid, setMemberUid] = useState<string | null>(null);
  const [memberName, setMemberName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeDiscount, setFeeDiscount] = useState('');
  const [feeCategory, setFeeCategory] = useState<string>(CLUB_FEE_DEFAULT_CATEGORY);
  const [feeDueDate, setFeeDueDate] = useState('');
  const [feeConflict, setFeeConflict] = useState<{
    message: string;
    input: CreateClubFeeInput;
  } | null>(null);

  const openFeeForm = useCallback(() => {
    setFeeConflict(null);
    setMemberQuery('');
    setMemberUid(null);
    setMemberName('');
    setFeeAmount('');
    setFeeDiscount('');
    setFeeCategory(CLUB_FEE_DEFAULT_CATEGORY);
    const inTwoWeeks = new Date();
    inTwoWeeks.setDate(inTwoWeeks.getDate() + 14);
    setFeeDueDate(inTwoWeeks.toISOString().slice(0, 10));
    setFeeFormOpen(true);
  }, []);

  const memberCandidates = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return players.slice(0, 6);
    return players.filter((p) => p.display_name.toLowerCase().includes(q)).slice(0, 6);
  }, [memberQuery, players]);

  const submitFee = useCallback(
    async (overwrite: boolean) => {
      const amount = parseAmount(feeAmount);
      if (amount === null || amount <= 0) {
        Alert.alert('Montant dû', 'Saisissez un montant dû supérieur à zéro.');
        return;
      }
      const discount = feeDiscount.trim() ? parseAmount(feeDiscount) : 0;
      if (discount === null || discount < 0) {
        Alert.alert('Remise', 'La remise doit être un nombre positif (ou vide).');
        return;
      }
      if (discount > amount) {
        Alert.alert('Remise', 'La remise ne peut pas dépasser le montant dû.');
        return;
      }
      const dueDate = parseIsoDate(feeDueDate);
      if (!dueDate) {
        Alert.alert('Échéance', 'Date d’échéance invalide (AAAA-MM-JJ).');
        return;
      }
      const name = memberName.trim();
      if (!memberUid && !name) {
        Alert.alert('Adhérent', 'Choisissez l’adhérent concerné.');
        return;
      }
      if (!profile?.uid) {
        Alert.alert('Session', 'Session expirée : reconnectez-vous avant d’enregistrer.');
        return;
      }

      const input: CreateClubFeeInput = {
        club_id: clubId,
        season: plan.season,
        amount_due_eur: amount,
        discount_eur: discount,
        due_date: dueDate,
        category: feeCategory.trim() || CLUB_FEE_DEFAULT_CATEGORY,
        member_uid: memberUid,
        member_name: name || null,
        created_by_uid: profile.uid,
        created_by_name: profile.display_name ?? undefined,
      };

      setFeeSaving(true);
      try {
        const result = await plan.createFee(input, { overwrite });
        if (result.outcome === 'skipped_conflict') {
          setFeeConflict({ message: result.message ?? 'Échéance déjà existante.', input });
          return;
        }
        setFeeConflict(null);
        setFeeFormOpen(false);
        Alert.alert(
          result.outcome === 'unchanged' ? 'Déjà à jour' : 'Enregistré',
          result.outcome === 'unchanged'
            ? 'Une échéance identique existait déjà : rien n’a été dupliqué.'
            : `Échéance enregistrée pour la saison ${plan.season}.`,
        );
      } catch (e) {
        Alert.alert('Refusé', humanizeClubFinanceWriteError(e));
      } finally {
        setFeeSaving(false);
      }
    },
    [clubId, feeAmount, feeCategory, feeDiscount, feeDueDate, memberName, memberUid, plan, profile],
  );

  const askFeeActions = useCallback(
    (row: ClubFeeRow) => {
      Alert.alert(row.memberName, `${row.hint}\n\n${row.agingLabel}`, [
        { text: 'Fermer', style: 'cancel' },
        {
          text: 'Annuler l’échéance',
          style: 'destructive',
          onPress: () => {
            void plan
              .cancelFee(row.feeId)
              .catch((e) => Alert.alert('Refusé', humanizeClubFinanceWriteError(e)));
          },
        },
      ]);
    },
    [plan],
  );

  /* ----------------------------- Budget ----------------------------- */

  const [budgetFormOpen, setBudgetFormOpen] = useState(false);
  const [budgetSaving, setBudgetSaving] = useState(false);
  const [budgetCategory, setBudgetCategory] = useState('');
  const [plannedIncome, setPlannedIncome] = useState('');
  const [plannedExpense, setPlannedExpense] = useState('');

  const openBudgetForm = useCallback(() => {
    setBudgetCategory('');
    setPlannedIncome('');
    setPlannedExpense('');
    setBudgetFormOpen(true);
  }, []);

  const submitBudget = useCallback(async () => {
    const category = budgetCategory.trim();
    if (!category) {
      Alert.alert('Catégorie', 'Indiquez la catégorie budgétée.');
      return;
    }
    const income = plannedIncome.trim() ? parseAmount(plannedIncome) : 0;
    const expense = plannedExpense.trim() ? parseAmount(plannedExpense) : 0;
    if (income === null || income < 0 || expense === null || expense < 0) {
      Alert.alert('Montants', 'Les montants prévus doivent être positifs (ou vides).');
      return;
    }
    if (!profile?.uid) {
      Alert.alert('Session', 'Session expirée : reconnectez-vous avant d’enregistrer.');
      return;
    }
    setBudgetSaving(true);
    try {
      await plan.saveBudgetLine({
        club_id: clubId,
        season: plan.season,
        category,
        planned_income_eur: income,
        planned_expense_eur: expense,
        created_by_uid: profile.uid,
        created_by_name: profile.display_name ?? undefined,
      });
      setBudgetFormOpen(false);
      Alert.alert('Enregistré', `Budget « ${category} » mis à jour pour ${plan.season}.`);
    } catch (e) {
      Alert.alert('Refusé', humanizeClubFinanceWriteError(e));
    } finally {
      setBudgetSaving(false);
    }
  }, [budgetCategory, clubId, plan, plannedExpense, plannedIncome, profile]);

  const askBudgetActions = useCallback(
    (category: string, lineId: string) => {
      Alert.alert(
        category,
        'Retirer cette ligne budgétaire ? Le prévu de cette catégorie repassera à zéro ; les écritures déjà enregistrées ne sont pas touchées.',
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Retirer',
            style: 'destructive',
            onPress: () => {
              void plan
                .removeBudgetLine(lineId)
                .catch((e) => Alert.alert('Refusé', humanizeClubFinanceWriteError(e)));
            },
          },
        ],
      );
    },
    [plan],
  );

  return (
    <View>
      <ClubSectionHeader
        label={`COTISATIONS DUES · ${plan.season}`}
        actionLabel="Définir"
        onAction={openFeeForm}
      />
      <ClubSectionCard subtitle={resolveClubFeeSummaryLabel(feeSummary)}>
        <ClubText variant="caption" muted style={styles.note}>
          {clubFeeOutstandingDefinition()}
        </ClubText>
        <ClubText variant="caption" muted style={styles.note}>
          {clubFeeUnallocatedNote(feeSummary)}
        </ClubText>

        {feeRows.length > 0 ? (
          <ClubListGroup style={styles.group}>
            {feeRows.map((row) => (
              <ClubActionRow
                key={row.feeId}
                label={row.memberName}
                hint={row.hint}
                onPress={() => askFeeActions(row)}
                trailing={<ClubStatusPill label={row.agingLabel} tone={agingTone(row.aging)} />}
              />
            ))}
          </ClubListGroup>
        ) : (
          <ClubText variant="caption" muted style={styles.note}>
            Aucune échéance enregistrée pour cette saison. Sans montant dû ni date d’échéance,
            aucun impayé n’est calculable.
          </ClubText>
        )}

        <ClubButton label="Définir une cotisation due" icon="add" onPress={openFeeForm} />
      </ClubSectionCard>

      <ClubSectionHeader
        label={`BUDGET · ${plan.season}`}
        actionLabel="Ajouter"
        onAction={openBudgetForm}
      />
      <ClubSectionCard subtitle={resolveClubBudgetSummaryLabel(budgetReport)}>
        <ClubText variant="caption" muted style={styles.note}>
          {clubBudgetVarianceDefinition()}
        </ClubText>
        {clubBudgetUnplannedNote(budgetReport) ? (
          <ClubText variant="caption" muted style={styles.note}>
            {clubBudgetUnplannedNote(budgetReport)}
          </ClubText>
        ) : null}

        {budgetReport.rows.length > 0 ? (
          <ClubListGroup style={styles.group}>
            {budgetReport.rows.map((row) => (
              <ClubActionRow
                key={row.category}
                label={row.category}
                hint={row.hint}
                onPress={() => {
                  const line = plan.budgetLines.find((l) => l.category === row.category);
                  if (line) askBudgetActions(row.category, line.id);
                }}
                trailing={
                  <ClubStatusPill
                    label={row.coverageLabel}
                    tone={
                      row.coverage === 'unplanned_actual'
                        ? 'warn'
                        : row.coverage === 'budgeted'
                          ? 'ok'
                          : 'neutral'
                    }
                  />
                }
              />
            ))}
          </ClubListGroup>
        ) : (
          <ClubText variant="caption" muted style={styles.note}>
            Aucun prévu ni aucune écriture sur cette saison : l’écart budgétaire n’est pas
            calculable.
          </ClubText>
        )}

        <ClubButton label="Ajouter une ligne budgétaire" icon="add" onPress={openBudgetForm} />
      </ClubSectionCard>

      <ClubSectionHeader label="Saison de référence" />
      <ClubSegmentedControl
        options={plan.seasonOptions.map((s) => ({ id: s, label: s }))}
        value={plan.season}
        onChange={plan.setSeason}
      />

      {plan.loadError ? (
        <ClubText variant="caption" muted style={styles.note}>
          {plan.loadError}
        </ClubText>
      ) : null}

      {/* --------------------------- Feuille échéance --------------------------- */}
      <ClubModalSurface
        visible={feeFormOpen}
        onClose={() => setFeeFormOpen(false)}
        title="Cotisation due"
      >
        <ClubText variant="caption" muted style={styles.note}>
          Le montant dû et la date d’échéance sont saisis ensemble : c’est ce couple qui rend un
          « en retard » vérifiable. Une échéance identique n’est jamais dupliquée.
        </ClubText>

        <ClubText variant="label" style={styles.fieldLabel}>
          Adhérent
        </ClubText>
        {memberName ? (
          <View style={styles.selectedRow}>
            <ClubText variant="body">{memberName}</ClubText>
            <ClubPill
              label="Changer"
              variant="outline"
              onPress={() => {
                setMemberUid(null);
                setMemberName('');
              }}
            />
          </View>
        ) : (
          <>
            <ClubSearchField
              value={memberQuery}
              onChangeText={setMemberQuery}
              placeholder="Rechercher un adhérent"
            />
            {memberCandidates.length > 0 ? (
              <ClubListGroup style={styles.group}>
                {memberCandidates.map((p) => (
                  <ClubActionRow
                    key={p.uid}
                    label={p.display_name}
                    onPress={() => {
                      setMemberUid(p.uid);
                      setMemberName(p.display_name);
                    }}
                  />
                ))}
              </ClubListGroup>
            ) : (
              <ClubText variant="caption" muted style={styles.note}>
                Aucun adhérent ne correspond dans cet effectif.
              </ClubText>
            )}
          </>
        )}

        <ClubText variant="label" style={styles.fieldLabel}>
          Catégorie
        </ClubText>
        <View style={styles.pillRow}>
          {CATEGORY_SUGGESTIONS.map((c) => (
            <ClubPill
              key={c}
              label={c}
              variant={feeCategory === c ? 'filled' : 'outline'}
              onPress={() => setFeeCategory(c)}
            />
          ))}
        </View>

        <ClubText variant="label" style={styles.fieldLabel}>
          Montant dû (€)
        </ClubText>
        <TextInput
          value={feeAmount}
          onChangeText={setFeeAmount}
          keyboardType="decimal-pad"
          placeholder="120"
          placeholderTextColor={tokens.faint}
          style={styles.input}
        />

        <ClubText variant="label" style={styles.fieldLabel}>
          Remise (€) — facultatif
        </ClubText>
        <TextInput
          value={feeDiscount}
          onChangeText={setFeeDiscount}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={tokens.faint}
          style={styles.input}
        />

        <ClubText variant="label" style={styles.fieldLabel}>
          Échéance (AAAA-MM-JJ)
        </ClubText>
        <TextInput
          value={feeDueDate}
          onChangeText={setFeeDueDate}
          placeholder="2026-10-01"
          placeholderTextColor={tokens.faint}
          autoCapitalize="none"
          style={styles.input}
        />

        {feeConflict ? (
          <View style={styles.conflict}>
            <ClubText variant="caption" style={{ color: tokens.warning }}>
              {feeConflict.message}
            </ClubText>
            <ClubButton
              label="Écraser l’échéance existante"
              variant="outline"
              disabled={feeSaving}
              onPress={() => void submitFee(true)}
            />
          </View>
        ) : null}

        <View style={styles.formActions}>
          <ClubButton
            label="Annuler"
            variant="ghost"
            onPress={() => setFeeFormOpen(false)}
          />
          <ClubButton
            label={feeSaving ? 'Enregistrement…' : 'Enregistrer'}
            disabled={feeSaving}
            onPress={() => void submitFee(false)}
          />
        </View>
      </ClubModalSurface>

      {/* --------------------------- Feuille budget --------------------------- */}
      <ClubModalSurface
        visible={budgetFormOpen}
        onClose={() => setBudgetFormOpen(false)}
        title="Ligne budgétaire"
      >
        <ClubText variant="caption" muted style={styles.note}>
          Saison {plan.season}. Préciser les entrées et les sorties attendues par catégorie : le
          réalisé de cette catégorie sera comparé à ces montants.
        </ClubText>

        <ClubText variant="label" style={styles.fieldLabel}>
          Catégorie
        </ClubText>
        <View style={styles.pillRow}>
          {CATEGORY_SUGGESTIONS.map((c) => (
            <ClubPill
              key={c}
              label={c}
              variant={budgetCategory === c ? 'filled' : 'outline'}
              onPress={() => setBudgetCategory(c)}
            />
          ))}
        </View>
        <TextInput
          value={budgetCategory}
          onChangeText={setBudgetCategory}
          placeholder="Catégorie budgétée"
          placeholderTextColor={tokens.faint}
          style={styles.input}
        />

        <ClubText variant="label" style={styles.fieldLabel}>
          Entrées prévues (€)
        </ClubText>
        <TextInput
          value={plannedIncome}
          onChangeText={setPlannedIncome}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={tokens.faint}
          style={styles.input}
        />

        <ClubText variant="label" style={styles.fieldLabel}>
          Sorties prévues (€)
        </ClubText>
        <TextInput
          value={plannedExpense}
          onChangeText={setPlannedExpense}
          keyboardType="decimal-pad"
          placeholder="0"
          placeholderTextColor={tokens.faint}
          style={styles.input}
        />

        <View style={styles.formActions}>
          <ClubButton label="Annuler" variant="ghost" onPress={() => setBudgetFormOpen(false)} />
          <ClubButton
            label={budgetSaving ? 'Enregistrement…' : 'Enregistrer'}
            disabled={budgetSaving}
            onPress={() => void submitBudget()}
          />
        </View>
      </ClubModalSurface>
    </View>
  );
}

/** Réexporté pour les tests de rendu éventuels. */
export { formatClubFinanceEur };

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    note: {
      marginTop: clubSpace.xs,
      lineHeight: 17,
    },
    group: {
      marginTop: clubSpace.sm,
      marginBottom: clubSpace.sm,
    },
    fieldLabel: {
      marginTop: clubSpace.md,
      marginBottom: clubSpace.xs,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: clubSpace.xs,
      marginBottom: clubSpace.xs,
    },
    selectedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.borderStrong,
      borderRadius: clubRadius.md,
      paddingHorizontal: clubSpace.sm,
      paddingVertical: clubSpace.sm,
      color: tokens.foreground,
      backgroundColor: tokens.elevated,
      fontSize: 16,
    },
    conflict: {
      marginTop: clubSpace.sm,
      gap: clubSpace.xs,
    },
    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: clubSpace.sm,
      marginTop: clubSpace.md,
    },
  });
