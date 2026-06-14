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
import type { ProductLineId } from '../../models/ProductLine';
import { getUniverseIdentity } from '../../content/brandExperience';
import { profileType } from './profileTypography';
import { useAppTheme } from '../../context/ProductLineContext';
import type { ProdayPulseResult } from '../../utils/prodayPulse';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

const AVATAR_SIZE = 72;

const ROLE_LABELS: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  recruiter: 'Recruteur',
  organizer: 'Organisateur',
  sponsor: 'Sponsor',
  physio: 'Pôle santé',
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
}) => {
  const insets = useSafeAreaInsets();
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const brand = getUniverseIdentity(productLine);
  const p = profile.profile;
  const roleLabel =
    profile.role === 'player' && productLine === 'woman'
      ? brand.playerLabel
      : ROLE_LABELS[profile.role];
  const verified = getVerificationBadge(profile).color === 'green';

  const meta: string[] = [];
  if (profile.city) meta.push(profile.city);
  if (p.position) meta.push(p.position);
  if (p.level) meta.push(p.level);

  return (
    <View style={styles.headerShell}>
      <ProDayGradient kind="cta" style={styles.accentBar} />
      <View style={[styles.shell, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <ProDayText variant="caption" muted style={styles.caption}>
            {brand.productName}
          </ProDayText>
          <ProDayText variant="hero" style={styles.screenTitle}>
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
        <ProDayGradient kind="ambient" style={styles.cardGlow} />
        <View style={styles.identityRow}>
          <ProfileAvatarButton
            displayName={profile.display_name}
            avatarUrl={profile.avatar_url}
            uploading={uploadingAvatar}
            onPress={onAvatarPress}
            size={AVATAR_SIZE}
          />
          <View style={styles.copy}>
            <ProDayText variant="title" numberOfLines={2} style={profileType.heroName}>
              {profile.display_name}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={1}>
              {profile.email}
            </ProDayText>
            <View style={styles.pillRow}>
              <View style={[styles.rolePill, { backgroundColor: c.accentSoft }]}>
                <ProDayText variant="caption" accent style={profileType.role}>
                  {roleLabel}
                </ProDayText>
              </View>
              {verified ? <VerificationBadge user={profile} /> : null}
            </View>
            {meta.length > 0 ? (
              <ProDayText variant="caption" muted numberOfLines={2} style={profileType.meta}>
                {meta.join(' · ')}
              </ProDayText>
            ) : null}
          </View>
        </View>

        <View style={styles.metrics}>
          <MetricCell
            label="Complétion"
            value={`${completionPercent}%`}
            colors={c}
          />
          <View style={[styles.metricDivider, { backgroundColor: c.border }]} />
          <MetricCell label="Pulse" value={String(pulse.score)} colors={c} />
          <View style={[styles.metricDivider, { backgroundColor: c.border }]} />
          <MetricCell
            label="Plan"
            value={subscriptionTier === 'pro' ? 'Pro' : 'Free'}
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
            <Icon name="eye" size={16} color={c.accent} />
            <ProDayText variant="caption" style={styles.publicText}>
              Voir mon profil public
            </ProDayText>
            <Icon name="chevron-forward" size={14} color={c.textMuted} />
          </PressableSpring>
        ) : null}
      </View>
      </View>
    </View>
  );
};

const MetricCell: React.FC<{
  label: string;
  value: string;
  colors: AppColors;
  accent?: boolean;
}> = ({ label, value, colors: c, accent }) => (
  <View style={metricStyles.cell}>
    <ProDayText
      variant="section"
      style={[metricStyles.value, accent && { color: c.accent }]}
    >
      {value}
    </ProDayText>
    <ProDayText variant="caption" muted>
      {label}
    </ProDayText>
  </View>
);

const metricStyles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', gap: 2 },
  value: { fontSize: 18, fontWeight: '900', letterSpacing: -0.4 },
});

function createStyles(c: AppColors) {
  return StyleSheet.create({
    headerShell: {
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    accentBar: {
      height: 3,
      width: '100%',
    },
    shell: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    titleBlock: { flex: 1, minWidth: 0 },
    caption: {
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontSize: 11,
      marginBottom: 2,
    },
    screenTitle: {
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '900',
      letterSpacing: -0.8,
    },
    editChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      ...shadows.soft,
    },
    editLabel: { fontWeight: '800', fontSize: 11 },
    card: {
      borderRadius: radius.xl + 2,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      padding: spacing.md,
      gap: spacing.md,
      overflow: 'hidden',
      ...shadows.soft,
    },
    cardGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 100,
      opacity: 0.5,
    },
    identityRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    copy: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
      paddingTop: 4,
    },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: 2,
    },
    rolePill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    metrics: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    metricDivider: {
      width: StyleSheet.hairlineWidth,
      height: 32,
    },
    publicBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    publicText: { flex: 1, fontWeight: '700' },
  });
}
