import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { User, UserRole } from '../../models/User';
import type { ProductLineId } from '../../models/ProductLine';
import { ProfileAvatarButton } from './ProfileAvatarButton';
import { VerificationBadge } from '../VerificationBadge';
import { getVerificationBadge } from '../../models/User';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { getUniverseIdentity } from '../../content/brandExperience';
import { isFemalePresentationForUser } from '../../utils/playerSegment';
import { useAppTheme } from '../../context/ProductLineContext';
import { gradientsForLine } from '../../theme/universeGradients';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

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
};

export interface ProfilePassportHeaderProps {
  profile: User;
  productLine: ProductLineId;
  subscriptionTier: 'free' | 'pro';
  pulseScore: number;
  level: number;
  streakDays: number;
  completionPercent: number;
  uploadingAvatar: boolean;
  onAvatarPress: () => void;
  onEditPress: () => void;
  onPublicProfile?: () => void;
}

/** Carte identité Luxe — lavis univers, stats intégrées, actions discrètes. */
export const ProfilePassportHeader: React.FC<ProfilePassportHeaderProps> = ({
  profile,
  productLine,
  subscriptionTier,
  pulseScore,
  level,
  streakDays,
  completionPercent,
  uploadingAvatar,
  onAvatarPress,
  onEditPress,
  onPublicProfile,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const mesh = gradientsForLine(productLine).ambient;
  const brand = getUniverseIdentity(productLine);
  const p = profile.profile;
  const isWomanPlayer = isFemalePresentationForUser(profile, productLine);
  const roleLabel =
    profile.role === 'player' && isWomanPlayer
      ? brand.playerLabel
      : ROLE_LABELS[profile.role];
  const verified = getVerificationBadge(profile).color === 'green';

  const meta: string[] = [];
  if (profile.city) meta.push(profile.city);
  if (p.position) meta.push(p.position);
  if (p.level) meta.push(p.level);

  return (
    <GlassCard variant="elevated" style={styles.card}>
      <LinearGradient
        colors={[mesh[0], mesh[1], mesh[2]]}
        style={styles.meshBand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.meshTop}>
          <ProDayText variant="caption" muted style={styles.brand}>
            {brand.productName}
          </ProDayText>
          <PressableSpring
            onPress={onEditPress}
            style={[styles.iconBtn, { backgroundColor: c.surface, borderColor: c.border }]}
            scaleTo={0.94}
            haptic
          >
            <Icon name="person" size={16} color={c.accent} />
          </PressableSpring>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        <PressableSpring onPress={onAvatarPress} scaleTo={0.97} style={styles.avatarWrap}>
          <View style={[styles.avatarRing, { borderColor: c.accentMuted, backgroundColor: c.surface }]}>
            <ProfileAvatarButton
              displayName={profile.display_name}
              avatarUrl={profile.avatar_url}
              uploading={uploadingAvatar}
              onPress={onAvatarPress}
              size={88}
            />
          </View>
        </PressableSpring>

        <ProDayText variant="title" style={styles.name} numberOfLines={2}>
          {profile.display_name}
        </ProDayText>

        {meta.length > 0 ? (
          <ProDayText variant="caption" muted style={styles.meta} numberOfLines={2}>
            {meta.join(' · ')}
          </ProDayText>
        ) : null}

        <View style={styles.pillRow}>
          <View style={[styles.rolePill, { backgroundColor: c.accentSoft, borderColor: c.accentMuted }]}>
            <ProDayText variant="caption" accent style={styles.roleText}>
              {roleLabel}
            </ProDayText>
          </View>
          <View
            style={[
              styles.tierPill,
              subscriptionTier === 'pro'
                ? { backgroundColor: c.accent, borderColor: c.accent }
                : { backgroundColor: c.surfaceMuted, borderColor: c.border },
            ]}
          >
            <ProDayText
              variant="caption"
              inverse={subscriptionTier === 'pro'}
              muted={subscriptionTier !== 'pro'}
              style={styles.tierText}
            >
              {subscriptionTier === 'pro' ? 'Pro' : 'Free'}
            </ProDayText>
          </View>
          {verified ? <VerificationBadge user={profile} /> : null}
        </View>

        {onPublicProfile ? (
          <PressableSpring onPress={onPublicProfile} scaleTo={0.98} haptic>
            <View style={[styles.publicBtn, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}>
              <Icon name="eye" size={14} color={c.accent} />
              <ProDayText variant="caption" accent style={styles.publicText}>
                Voir ma carte publique
              </ProDayText>
              <Icon name="chevron-forward" size={12} color={c.textMuted} />
            </View>
          </PressableSpring>
        ) : null}

        <View style={[styles.statsBar, { borderTopColor: c.border, backgroundColor: c.surfaceMuted }]}>
          <StatCell
            label="Pulse"
            value={String(pulseScore)}
            hint={pulseScore >= 70 ? 'En forme' : 'À booster'}
            accent={pulseScore >= 70}
            colors={c}
          />
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <StatCell
            label="Niveau"
            value={String(level)}
            hint={`${streakDays}j actifs`}
            colors={c}
          />
          <View style={[styles.statDivider, { backgroundColor: c.border }]} />
          <StatCell
            label="Profil"
            value={`${completionPercent}%`}
            hint={completionPercent >= 80 ? 'Complet' : 'À compléter'}
            accent={completionPercent >= 80}
            colors={c}
          />
        </View>
      </View>
    </GlassCard>
  );
};

const StatCell: React.FC<{
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
  colors: AppColors;
}> = ({ label, value, hint, accent, colors: c }) => (
  <View style={statStyles.cell}>
    <ProDayText variant="caption" muted style={statStyles.label}>
      {label}
    </ProDayText>
    <ProDayText variant="section" accent={accent} style={statStyles.value}>
      {value}
    </ProDayText>
    <ProDayText variant="caption" muted style={statStyles.hint}>
      {hint}
    </ProDayText>
  </View>
);

const statStyles = StyleSheet.create({
  cell: { flex: 1, alignItems: 'center', gap: 1 },
  label: { fontSize: 9, letterSpacing: 0.9, textTransform: 'uppercase' },
  value: { fontSize: 20, fontWeight: '800', lineHeight: 22 },
  hint: { fontSize: 10 },
});

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    card: {
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      padding: 0,
    },
    meshBand: {
      height: 88,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    meshTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    brand: {
      fontSize: 10,
      letterSpacing: 1.6,
      textTransform: 'uppercase',
      fontWeight: '600',
    },
    iconBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: 0,
      marginTop: -44,
    },
    avatarWrap: { marginBottom: spacing.sm },
    avatarRing: {
      borderRadius: 48,
      borderWidth: 3,
      padding: 2,
    },
    name: {
      fontWeight: '800',
      letterSpacing: -0.5,
      textAlign: 'center',
      fontSize: 22,
      lineHeight: 26,
    },
    meta: { textAlign: 'center', marginTop: 2, fontSize: 13 },
    pillRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    rolePill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    roleText: { fontWeight: '700', fontSize: 11 },
    tierPill: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    tierText: { fontWeight: '700', fontSize: 11 },
    publicBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    publicText: { fontWeight: '600', fontSize: 12 },
    statsBar: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      borderTopWidth: 1,
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    },
    statDivider: { width: 1, height: 36 },
  });
}
