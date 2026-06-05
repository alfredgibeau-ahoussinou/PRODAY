import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { User, UserRole } from '../../models/User';
import { ProfileAvatarButton } from './ProfileAvatarButton';
import { VerificationBadge } from '../VerificationBadge';
import { getVerificationBadge } from '../../models/User';
import { UniverseBadge } from '../branding/UniverseBadge';
import type { ProductLineId } from '../../models/ProductLine';
import { getUniverseIdentity } from '../../content/brandExperience';
import type { AppColors } from '../../theme/universeTheme';
import { ProDayShopButton } from '../shop/ProDayShopButton';
import { spacing, radius } from '../../theme/designTokens';

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

interface ProfileHubHeaderProps {
  profile: User;
  productLine: ProductLineId;
  colors: AppColors;
  uploadingAvatar: boolean;
  onAvatarPress: () => void;
}

export const ProfileHubHeader: React.FC<ProfileHubHeaderProps> = ({
  profile,
  productLine,
  colors,
  uploadingAvatar,
  onAvatarPress,
}) => {
  const brand = getUniverseIdentity(productLine);
  const p = profile.profile;
  const roleLabel =
    profile.role === 'player' && productLine === 'woman'
      ? brand.playerLabel
      : ROLE_LABELS[profile.role];
  const showVerificationBadge = getVerificationBadge(profile).color === 'green';

  const meta: string[] = [];
  if (profile.city) meta.push(profile.city);
  if (p.position) meta.push(p.position);
  if (p.level) meta.push(p.level);
  if (profile.role === 'physio' && p.medical_specialty) meta.push(p.medical_specialty);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.accentBar, { backgroundColor: colors.accent }]} />
      <View style={styles.topRow}>
        <UniverseBadge productLine={productLine} colors={colors} compact />
        <View style={styles.topRight}>
          <ProDayShopButton compact />
        </View>
      </View>

      <View style={styles.hero}>
        <ProfileAvatarButton
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          uploading={uploadingAvatar}
          onPress={onAvatarPress}
        />
        <Text style={[styles.name, { color: colors.text }]}>{profile.display_name}</Text>
        <View style={[styles.rolePill, { backgroundColor: colors.ink }]}>
          <Text style={[styles.roleText, { color: colors.brandInverse }]}>{roleLabel}</Text>
        </View>
        {meta.length > 0 ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>{meta.join(' · ')}</Text>
        ) : null}
        {showVerificationBadge ? (
          <View style={styles.badgeWrap}>
            <VerificationBadge user={profile} />
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    paddingTop: spacing.sm,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: spacing.md,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  rolePill: {
    marginTop: spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  roleText: { fontSize: 11, fontWeight: '800' },
  meta: {
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  badgeWrap: { marginTop: spacing.sm },
});
