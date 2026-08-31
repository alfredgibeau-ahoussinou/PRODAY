import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { User, UserRole } from '../../models/User';
import { ProfileAvatarButton } from './ProfileAvatarButton';
import { VerificationBadge } from '../VerificationBadge';
import { getVerificationBadge } from '../../models/User';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { ProDayGradient } from '../ui/ProDayGradient';
import { PlayerLevelBadgePill } from '../player/PlayerLevelBadgePill';
import type { ProductLineId } from '../../models/ProductLine';
import { getUniverseIdentity } from '../../content/brandExperience';
import { isFemalePresentationForUser } from '../../utils/playerSegment';
import { useAppTheme } from '../../context/ProductLineContext';
import type { ProdayPulseResult } from '../../utils/prodayPulse';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

const AVATAR_FULL = 64;
const AVATAR_COMPACT = 48;

const ROLE_LABELS: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  recruiter: 'Recruteur',
  organizer: 'Organisateur',
  sponsor: 'Sponsor',
  supporter: 'Supporter',
  physio: 'Pôle santé',
  parent: 'Parent',
};

interface ProfileIdentityHeaderProps {
  profile: User;
  productLine: ProductLineId;
  uploadingAvatar: boolean;
  completionPercent: number;
  pulse: ProdayPulseResult;
  subscriptionTier: 'free' | 'pro';
  onAvatarPress: () => void;
  onEditPress: () => void;
  onPublicProfile?: () => void;
  /** Bandeau réduit — sans titre « Profil » ni carte volumineuse. */
  compact?: boolean;
}

export const ProfileIdentityHeader: React.FC<ProfileIdentityHeaderProps> = ({
  profile,
  productLine,
  uploadingAvatar,
  completionPercent,
  pulse,
  subscriptionTier,
  onAvatarPress,
  onEditPress,
  onPublicProfile,
  compact = false,
}) => {
  const insets = useSafeAreaInsets();
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c, compact), [c, compact]);
  const brand = getUniverseIdentity(productLine);
  const p = profile.profile;
  const isWomanPlayer = isFemalePresentationForUser(profile, productLine);
  const roleLabel =
    profile.role === 'player' && isWomanPlayer
      ? brand.playerLabel
      : ROLE_LABELS[profile.role];
  const verified = getVerificationBadge(profile).color === 'green';
  const avatarSize = compact ? AVATAR_COMPACT : AVATAR_FULL;

  const meta: string[] = [];
  if (profile.city) meta.push(profile.city);
  if (p.position) meta.push(p.position);

  if (compact) {
    return (
      <View style={[styles.compactShell, { paddingTop: spacing.xs }]}>
        <View style={styles.compactRow}>
          <ProfileAvatarButton
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            uploading={uploadingAvatar}
            onPress={onAvatarPress}
            size={avatarSize}
          />
          <View style={styles.compactCopy}>
            <ProDayText variant="section" numberOfLines={2} style={styles.compactName}>
              {profile.display_name}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={1}>
              {profile.email}
            </ProDayText>
            <View style={styles.pillRow}>
              <View style={[styles.rolePill, { backgroundColor: c.accentSoft }]}>
                <ProDayText variant="caption" accent style={styles.rolePillText}>
                  {roleLabel}
                </ProDayText>
              </View>
              {profile.role === 'player' ? (
                <PlayerLevelBadgePill user={profile} compact showVerified={false} />
              ) : null}
              {verified ? <VerificationBadge user={profile} /> : null}
              {meta.length > 0 ? (
                <ProDayText variant="caption" muted numberOfLines={1} style={styles.metaInline}>
                  {meta.join(' · ')}
                </ProDayText>
              ) : null}
            </View>
          </View>
          <PressableSpring
            style={[styles.iconBtn, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
            onPress={onEditPress}
            scaleTo={0.94}
            haptic
          >
            <Icon name="person" size={16} color={c.accent} />
          </PressableSpring>
        </View>

        <View style={[styles.chipRow, { paddingLeft: avatarSize + spacing.sm }]}>
          <StatChip label="Profil" value={`${completionPercent}%`} colors={c} />
          <StatChip label="Visibilité" value={String(pulse.score)} colors={c} />
          <StatChip
            label="Plan"
            value={subscriptionTier === 'pro' ? 'Pro' : 'Gratuit'}
            colors={c}
            accent={subscriptionTier === 'pro'}
          />
          {onPublicProfile ? (
            <PressableSpring onPress={onPublicProfile} scaleTo={0.97} haptic>
              <View style={[styles.publicChip, { borderColor: c.border }]}>
                <Icon name="eye" size={12} color={c.accent} />
                <ProDayText variant="caption" accent style={styles.publicChipText}>
                  Public
                </ProDayText>
              </View>
            </PressableSpring>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.headerShell}>
      <ProDayGradient kind="cta" style={styles.accentBar} />
      <View style={[styles.shell, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
        <View style={styles.topRow}>
          <View style={styles.titleBlock}>
            <ProDayText variant="caption" muted style={styles.caption} numberOfLines={1}>
              {brand.productName}
            </ProDayText>
            <ProDayText variant="title" style={styles.screenTitle} numberOfLines={1}>
              Profil
            </ProDayText>
          </View>
          <PressableSpring
            style={[styles.editChip, { borderColor: c.borderStrong, backgroundColor: c.surfaceMuted }]}
            onPress={onEditPress}
            scaleTo={0.96}
            haptic
          >
            <Icon name="person" size={14} color={c.accent} />
            <ProDayText variant="caption" accent style={styles.editLabel}>
              Modifier
            </ProDayText>
          </PressableSpring>
        </View>

        <View style={styles.card}>
          <View style={styles.identityRow}>
            <ProfileAvatarButton
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
              uploading={uploadingAvatar}
              onPress={onAvatarPress}
              size={avatarSize}
            />
            <View style={styles.copy}>
              <ProDayText
                variant="title"
                numberOfLines={2}
                style={styles.heroName}
              >
                {profile.display_name}
              </ProDayText>
              <ProDayText variant="caption" muted numberOfLines={1}>
                {profile.email}
              </ProDayText>
              <View style={styles.pillRow}>
                <View style={[styles.rolePill, { backgroundColor: c.accentSoft }]}>
                  <ProDayText variant="caption" accent style={styles.rolePillText}>
                    {roleLabel}
                  </ProDayText>
                </View>
                {profile.role === 'player' ? <PlayerLevelBadgePill user={profile} /> : null}
                {verified ? <VerificationBadge user={profile} /> : null}
              </View>
              {meta.length > 0 ? (
                <ProDayText variant="caption" muted numberOfLines={1}>
                  {meta.join(' · ')}
                </ProDayText>
              ) : null}
            </View>
          </View>

          <View style={styles.metrics}>
            <MetricCell label="Complétion" value={`${completionPercent}%`} colors={c} />
            <View style={[styles.metricDivider, { backgroundColor: c.border }]} />
            <MetricCell label="Visibilité" value={String(pulse.score)} colors={c} />
            <View style={[styles.metricDivider, { backgroundColor: c.border }]} />
            <MetricCell
              label="Plan"
              value={subscriptionTier === 'pro' ? 'Pro' : 'Gratuit'}
              colors={c}
              accent={subscriptionTier === 'pro'}
            />
          </View>

          {onPublicProfile ? (
            <PressableSpring
              style={[styles.publicBtn, { borderColor: c.border }]}
              onPress={onPublicProfile}
              scaleTo={0.98}
              haptic
            >
              <Icon name="eye" size={14} color={c.accent} />
              <ProDayText variant="caption" style={styles.publicText}>
                Profil public
              </ProDayText>
              <Icon name="chevron-forward" size={12} color={c.textMuted} />
            </PressableSpring>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const StatChip: React.FC<{
  label: string;
  value: string;
  colors: AppColors;
  accent?: boolean;
}> = ({ label, value, colors: c, accent }) => (
  <View style={[chipStyles.chip, { backgroundColor: c.surfaceMuted, borderColor: c.border }]}>
    <ProDayText
      variant="caption"
      style={[chipStyles.value, accent && { color: c.accent }]}
    >
      {value}
    </ProDayText>
    <ProDayText variant="caption" muted style={chipStyles.label}>
      {label}
    </ProDayText>
  </View>
);

const chipStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    minWidth: 52,
  },
  value: { fontWeight: '900', fontSize: 13, lineHeight: 16 },
  label: { fontSize: 9, fontWeight: '700', textTransform: 'uppercase' },
});

const MetricCell: React.FC<{
  label: string;
  value: string;
  colors: AppColors;
  accent?: boolean;
}> = ({ label, value, colors: c, accent }) => (
  <View style={metricStyles.cell}>
    <ProDayText variant="section" style={[metricStyles.value, accent && { color: c.accent }]}>
      {value}
    </ProDayText>
    <ProDayText variant="caption" muted>
      {label}
    </ProDayText>
  </View>
);

const metricStyles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: 16, fontWeight: '900', letterSpacing: -0.4 },
});

function createStyles(c: AppColors, compact: boolean) {
  return StyleSheet.create({
    headerShell: {
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    accentBar: { height: 3, width: '100%' },
    shell: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    compactShell: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xs,
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      gap: spacing.xs,
    },
    compactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    compactCopy: { flex: 1, flexShrink: 1, minWidth: 0, gap: 1 },
    compactName: { fontWeight: '900', fontSize: 16, flexShrink: 1 },
    iconBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
    },
    publicChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
    },
    publicChipText: { fontWeight: '800', fontSize: 11 },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    titleBlock: { flex: 1, minWidth: 0 },
    caption: {
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontSize: 10,
      marginBottom: 2,
    },
    screenTitle: {
      fontSize: compact ? 20 : 22,
      lineHeight: compact ? 24 : 26,
      fontWeight: '800',
      letterSpacing: -0.4,
      flexShrink: 1,
    },
    editChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      ...shadows.soft,
    },
    editLabel: { fontWeight: '800', fontSize: 11 },
    card: {
      borderRadius: radius.lg,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing.sm + 2,
      gap: spacing.sm,
      ...shadows.soft,
    },
    identityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    copy: { flex: 1, flexShrink: 1, minWidth: 0, gap: 2 },
    heroName: { fontWeight: '800', fontSize: 17, lineHeight: 21, flexShrink: 1 },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: 2,
    },
    rolePill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    rolePillText: { fontWeight: '800', fontSize: 10 },
    metaInline: { flexShrink: 1 },
    metrics: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    metricDivider: { width: StyleSheet.hairlineWidth, height: 28 },
    publicBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    publicText: { flex: 1, fontWeight: '700', fontSize: 12 },
  });
}
