/**
 * Composition visuelle Joueurs Club — hero adhésions + raccourcis.
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

/** Hero adhésions en attente — actions Valider / Voir. */
export function ClubPlayersPendingHero({
  count,
  previewNames,
  onReview,
  onFilterPending,
}: {
  count: number;
  previewNames: string[];
  onReview: () => void;
  onFilterPending: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => heroStyles(tokens), [tokens]);
  if (count <= 0) return null;

  const names =
    previewNames.length > 0
      ? previewNames.slice(0, 3).join(', ') + (previewNames.length > 3 ? '…' : '')
      : 'Demandes à traiter';

  return (
    <AnimatedEntrance kind="fadeUp" index={0} delayStep={36}>
      <View style={styles.card}>
        <LinearGradient
          colors={[tokens.warningSoft, tokens.surface]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.rail, { backgroundColor: tokens.warning }]} />
        <View style={[styles.iconBadge, { backgroundColor: tokens.warningSoft }]}>
          <Icon name="checkmark-circle" size={20} color={tokens.warning} />
        </View>
        <View style={styles.col}>
          <ClubText variant="label" style={{ color: tokens.warning }}>
            Adhésions
          </ClubText>
          <ClubText variant="h2" style={styles.title}>
            {count} en attente
          </ClubText>
          <ClubText variant="caption" muted numberOfLines={2}>
            {names}
          </ClubText>
          <View style={styles.ctaRow}>
            <PressableSpring onPress={onFilterPending} scaleTo={0.97} haptic style={styles.ctaPrimary}>
              <ClubText variant="caption" style={styles.ctaPrimaryLabel}>
                Confirmer
              </ClubText>
              <Icon name="chevron-forward" size={12} color={tokens.onAccent} />
            </PressableSpring>
            <PressableSpring
              onPress={onReview}
              scaleTo={0.97}
              haptic
              style={[styles.ctaGhost, { borderColor: tokens.warning + '66' }]}
            >
              <ClubText variant="caption" style={{ color: tokens.warning, fontWeight: '800' }}>
                Voir la liste
              </ClubText>
            </PressableSpring>
          </View>
        </View>
      </View>
    </AnimatedEntrance>
  );
}

export type LicenseFolderStatus = {
  medicalCertificate?: 'valid' | 'pending' | 'missing';
  membershipFee?: 'paid' | 'pending' | 'unpaid';
  fffLicense?: 'validated' | 'in_review' | 'pending';
};

/** Ligne demande pending avec Valider / Refuser et tracker de dossier de licence. */
export function ClubPlayersPendingRow({
  name,
  teamHint,
  roleBadge,
  categoryHint,
  identityDocName,
  identityDocType,
  busy,
  licenseStatus,
  onOpen,
  onApprove,
  onReject,
}: {
  name: string;
  teamHint?: string;
  roleBadge?: string;
  categoryHint?: string;
  identityDocName?: string;
  identityDocType?: string;
  busy?: boolean;
  licenseStatus?: LicenseFolderStatus;
  onOpen: () => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => pendingRowStyles(tokens), [tokens]);

  const medical = licenseStatus?.medicalCertificate ?? 'missing';
  const payment = licenseStatus?.membershipFee ?? 'pending';
  const fff = licenseStatus?.fffLicense ?? 'pending';

  const badgeColor = (status: string) => {
    if (status === 'valid' || status === 'paid' || status === 'validated') return tokens.pitch;
    if (status === 'in_review' || status === 'pending') return tokens.warning;
    return tokens.danger;
  };

  return (
    <View style={styles.row}>
      <PressableSpring onPress={onOpen} scaleTo={0.98} haptic style={styles.main}>
        <View style={[styles.avatar, { backgroundColor: tokens.warningSoft }]}>
          <Icon name="person" size={16} color={tokens.warning} />
        </View>
        <View style={styles.col}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <ClubText variant="body" numberOfLines={1} style={{ fontWeight: '700' }}>
              {name}
            </ClubText>
            {roleBadge && (
              <View style={[styles.rolePill, { backgroundColor: tokens.accentSoft, borderColor: tokens.accent + '44' }]}>
                <ClubText variant="caption" style={{ color: tokens.accent, fontSize: 10, fontWeight: '800' }}>
                  {roleBadge}
                </ClubText>
              </View>
            )}
            {categoryHint && (
              <View style={[styles.rolePill, { backgroundColor: tokens.surfaceElevated, borderColor: tokens.borderStrong }]}>
                <ClubText variant="caption" style={{ color: tokens.foreground, fontSize: 10, fontWeight: '700' }}>
                  {categoryHint}
                </ClubText>
              </View>
            )}
          </View>
          <ClubText variant="caption" muted numberOfLines={1}>
            {teamHint?.trim() || 'Adhésion en attente'}
          </ClubText>
          <View style={styles.trackerRow}>
            {identityDocName ? (
              <View style={[styles.trackerPill, { borderColor: tokens.pitch + '66', backgroundColor: tokens.pitch + '20' }]}>
                <Icon name="checkmark-circle" size={11} color={tokens.pitch} />
                <ClubText variant="caption" style={{ color: tokens.pitch, fontSize: 10, fontWeight: '800' }}>
                  {identityDocType === 'fff_license' ? 'Licence FFF fournie' : identityDocType === 'club_mandate' ? 'Attestation fournie' : 'Pièce d\'identité fournie'}
                </ClubText>
              </View>
            ) : null}
            <View style={[styles.trackerPill, { borderColor: badgeColor(medical) + '55', backgroundColor: badgeColor(medical) + '15' }]}>
              <Icon
                name={medical === 'valid' ? 'checkmark-circle' : medical === 'pending' ? 'time' : 'alert-circle'}
                size={11}
                color={badgeColor(medical)}
              />
              <ClubText variant="caption" style={{ color: badgeColor(medical), fontSize: 10, fontWeight: '700' }}>
                Certif. médical
              </ClubText>
            </View>
            <View style={[styles.trackerPill, { borderColor: badgeColor(payment) + '55', backgroundColor: badgeColor(payment) + '15' }]}>
              <Icon
                name={payment === 'paid' ? 'checkmark-circle' : 'gift'}
                size={11}
                color={badgeColor(payment)}
              />
              <ClubText variant="caption" style={{ color: badgeColor(payment), fontSize: 10, fontWeight: '700' }}>
                Cotisation
              </ClubText>
            </View>
            <View style={[styles.trackerPill, { borderColor: badgeColor(fff) + '55', backgroundColor: badgeColor(fff) + '15' }]}>
              <Icon
                name={fff === 'validated' ? 'checkmark-circle' : fff === 'in_review' ? 'time' : 'document'}
                size={11}
                color={badgeColor(fff)}
              />
              <ClubText variant="caption" style={{ color: badgeColor(fff), fontSize: 10, fontWeight: '700' }}>
                Licence FFF
              </ClubText>
            </View>
          </View>
        </View>
      </PressableSpring>
      <View style={styles.actions}>
        <PressableSpring
          onPress={onReject}
          scaleTo={0.96}
          haptic
          disabled={busy}
          style={[styles.btn, styles.btnGhost]}
        >
          <ClubText variant="caption" style={{ color: tokens.danger, fontWeight: '800' }}>
            Refuser
          </ClubText>
        </PressableSpring>
        <PressableSpring
          onPress={onApprove}
          scaleTo={0.96}
          haptic
          disabled={busy}
          style={[styles.btn, styles.btnOk]}
        >
          <ClubText variant="caption" style={{ color: tokens.onAccent, fontWeight: '800' }}>
            Confirmer
          </ClubText>
        </PressableSpring>
      </View>
    </View>
  );
}

const heroStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: clubSpace.md,
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
    iconBadge: {
      width: 44,
      height: 44,
      borderRadius: clubRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    col: { flex: 1, minWidth: 0, gap: 6 },
    title: {
      fontWeight: '800',
      letterSpacing: -0.35,
      color: tokens.foreground,
    },
    ctaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: clubSpace.sm,
      marginTop: clubSpace.xs,
    },
    ctaPrimary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: clubRadius.pill,
      backgroundColor: tokens.accent,
    },
    ctaPrimaryLabel: {
      color: tokens.onAccent,
      fontWeight: '800',
      fontSize: 12,
    },
    ctaGhost: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      backgroundColor: tokens.elevated,
    },
  });

const pendingRowStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    row: {
      gap: clubSpace.sm,
      paddingVertical: clubSpace.md,
      paddingHorizontal: clubSpace.md,
      borderRadius: clubRadius.lg,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      ...clubShadow.soft,
    },
    main: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: clubSpace.sm,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: clubRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    col: { flex: 1, minWidth: 0, gap: 2 },
    trackerRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 4,
    },
    trackerPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
    },
    rolePill: {
      paddingVertical: 1,
      paddingHorizontal: 6,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: clubSpace.sm,
    },
    btn: {
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderRadius: clubRadius.pill,
    },
    btnGhost: {
      borderWidth: 1,
      borderColor: tokens.danger + '55',
      backgroundColor: tokens.elevated,
    },
    btnOk: {
      backgroundColor: tokens.accent,
    },
  });
