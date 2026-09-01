/**
 * Composition visuelle Finances Club — hero solde + lignes ledger.
 */
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring, AnimatedEntrance } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';
import { ClubText } from './clubUi';
import type { ClubFinanceLedgerRowModel } from './clubFinanceModel';
import { formatClubFinanceEur } from './clubFinanceModel';
import type { ClubFinanceTotals } from '../../../models/ClubFinanceEntry';
import type { ClubCotisationSummary, CotisationCoverageRow } from './clubFinanceModel';

/** Hero solde du jour — pas de grille KPI SaaS. */
export function ClubFinanceSoldeHero({
  totals,
  onAdd,
}: {
  totals: ClubFinanceTotals;
  onAdd?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);
  const positive = totals.solde_eur >= 0;

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.card}>
        <LinearGradient
          colors={[tokens.pitchSoft, tokens.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: positive ? tokens.pitch : tokens.danger }]} />
        <ClubText variant="label" style={{ color: positive ? tokens.pitch : tokens.danger }}>
          Solde club
        </ClubText>
        <ClubText
          style={[
            styles.solde,
            { color: positive ? tokens.foreground : tokens.danger },
          ]}
        >
          {formatClubFinanceEur(totals.solde_eur)}
        </ClubText>
        <View style={styles.flowRow}>
          <View style={styles.flowCell}>
            <ClubText variant="caption" muted>
              Recettes
            </ClubText>
            <ClubText variant="body" style={{ color: tokens.success, fontWeight: '800' }}>
              {formatClubFinanceEur(totals.recettes_eur)}
            </ClubText>
          </View>
          <View style={[styles.flowSep, { backgroundColor: tokens.border }]} />
          <View style={styles.flowCell}>
            <ClubText variant="caption" muted>
              Dépenses
            </ClubText>
            <ClubText variant="body" style={{ color: tokens.danger, fontWeight: '800' }}>
              {formatClubFinanceEur(totals.depenses_eur)}
            </ClubText>
          </View>
        </View>
        {onAdd ? (
          <PressableSpring onPress={onAdd} scaleTo={0.97} haptic style={styles.cta}>
            <ClubText variant="caption" style={styles.ctaLabel}>
              Nouvelle écriture
            </ClubText>
            <Icon name="add" size={14} color={tokens.onAccent} />
          </PressableSpring>
        ) : null}
      </View>
    </AnimatedEntrance>
  );
}

/** Ligne ledger — montant aligné, type lisible. */
export function ClubFinanceLedgerRow({
  model,
  index,
  onPress,
}: {
  model: ClubFinanceLedgerRowModel;
  index: number;
  onPress: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => rowStyles(tokens), [tokens]);

  return (
    <AnimatedEntrance kind="fadeUp" index={index + 1} delayStep={24}>
      <PressableSpring onPress={onPress} scaleTo={0.98} haptic style={styles.row}>
        <View
          style={[
            styles.icon,
            {
              backgroundColor: model.isExpense ? tokens.dangerSoft : tokens.successSoft,
            },
          ]}
        >
          <Icon
            name={model.isExpense ? 'bag' : 'checkmark-circle'}
            size={16}
            color={model.isExpense ? tokens.danger : tokens.success}
          />
        </View>
        <View style={styles.col}>
          <ClubText variant="body" numberOfLines={2} style={{ fontWeight: '700' }}>
            {model.label}
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {model.meta}
          </ClubText>
          {model.statusLabel ? (
            <View style={[styles.statusPill, { backgroundColor: tokens.successSoft }]}>
              <ClubText variant="caption" style={{ color: tokens.success, fontWeight: '800' }}>
                {model.statusLabel}
              </ClubText>
            </View>
          ) : null}
        </View>
        <ClubText
          variant="body"
          style={{
            fontWeight: '800',
            color: model.isExpense ? tokens.danger : tokens.success,
            letterSpacing: -0.2,
          }}
        >
          {model.amountLabel}
        </ClubText>
      </PressableSpring>
    </AnimatedEntrance>
  );
}

/** Bandeau cotisations + couverture adhérents (payé / non enregistré). */
export function ClubFinanceCotisationPanel({
  summary,
  paid,
  unrecorded,
  onAddCotisation,
  onOpenPlayers,
}: {
  summary: ClubCotisationSummary;
  paid: CotisationCoverageRow[];
  unrecorded: CotisationCoverageRow[];
  onAddCotisation: () => void;
  onOpenPlayers?: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => cotisStyles(tokens), [tokens]);

  return (
    <View style={styles.wrap}>
      <View style={styles.head}>
        <ClubText variant="label" muted style={styles.headLabel}>
          Cotisations
        </ClubText>
        <ClubText variant="caption" muted>
          {summary.label}
        </ClubText>
      </View>

      {paid.length === 0 && unrecorded.length === 0 ? (
        <ClubText variant="body" muted style={styles.empty}>
          Enregistrez une cotisation avec le nom de l’adhérent pour suivre qui a payé.
        </ClubText>
      ) : null}

      {paid.slice(0, 5).map((row) => (
        <View key={row.key} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: tokens.success }]} />
          <View style={styles.rowCopy}>
            <ClubText variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>
              {row.name}
            </ClubText>
            <ClubText variant="caption" muted numberOfLines={1}>
              {row.hint}
            </ClubText>
          </View>
          <ClubText variant="caption" style={{ color: tokens.success, fontWeight: '800' }}>
            {row.statusLabel}
          </ClubText>
        </View>
      ))}

      {unrecorded.slice(0, 5).map((row) => (
        <View key={row.key} style={styles.row}>
          <View style={[styles.dot, { backgroundColor: tokens.warning }]} />
          <View style={styles.rowCopy}>
            <ClubText variant="body" style={{ fontWeight: '700' }} numberOfLines={1}>
              {row.name}
            </ClubText>
            <ClubText variant="caption" muted numberOfLines={1}>
              {row.hint}
            </ClubText>
          </View>
          <ClubText variant="caption" style={{ color: tokens.warning, fontWeight: '800' }}>
            {row.statusLabel}
          </ClubText>
        </View>
      ))}

      {unrecorded.length > 5 ? (
        <ClubText variant="caption" muted>
          +{unrecorded.length - 5} adhérent{unrecorded.length - 5 > 1 ? 's' : ''} sans écriture
        </ClubText>
      ) : null}

      <View style={styles.actions}>
        <PressableSpring onPress={onAddCotisation} scaleTo={0.97} haptic style={styles.cta}>
          <ClubText variant="caption" style={styles.ctaLabel}>
            Enregistrer une cotisation
          </ClubText>
        </PressableSpring>
        {onOpenPlayers ? (
          <PressableSpring onPress={onOpenPlayers} scaleTo={0.97} haptic style={styles.ghost}>
            <ClubText variant="caption" style={{ color: tokens.foreground, fontWeight: '700' }}>
              Voir les joueurs
            </ClubText>
          </PressableSpring>
        ) : null}
      </View>
    </View>
  );
}

const cotisStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    wrap: {
      gap: clubSpace.sm,
      padding: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    head: { gap: 2 },
    headLabel: { letterSpacing: 1.05 },
    empty: { lineHeight: 20 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: 4,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    rowCopy: { flex: 1, minWidth: 0, gap: 1 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: clubSpace.sm, marginTop: 4 },
    cta: {
      backgroundColor: tokens.accent,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: clubRadius.pill,
    },
    ctaLabel: { color: tokens.onAccent, fontWeight: '800' },
    ghost: {
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: clubRadius.pill,
    },
  });

const heroStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      gap: clubSpace.sm,
      paddingVertical: clubSpace.lg,
      paddingHorizontal: clubSpace.lg,
      borderRadius: clubRadius.xxl,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.borderStrong,
      overflow: 'hidden',
      ...clubShadow.lift,
    },
    rail: {
      position: 'absolute',
      left: 0,
      top: 16,
      bottom: 16,
      width: 4,
      borderTopRightRadius: 2,
      borderBottomRightRadius: 2,
    },
    solde: {
      fontSize: 36,
      lineHeight: 40,
      fontWeight: '800',
      letterSpacing: -1,
    },
    flowRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      marginTop: clubSpace.xs,
      paddingVertical: clubSpace.sm,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    flowCell: { flex: 1, gap: 2 },
    flowSep: {
      width: StyleSheet.hairlineWidth,
      marginHorizontal: clubSpace.md,
      alignSelf: 'stretch',
    },
    cta: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: clubSpace.sm,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: clubRadius.pill,
      backgroundColor: tokens.accent,
    },
    ctaLabel: {
      color: tokens.onAccent,
      fontWeight: '800',
      fontSize: 12,
    },
  });

const rowStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    icon: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
    statusPill: {
      alignSelf: 'flex-start',
      marginTop: 2,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: clubRadius.pill,
    },
  });
