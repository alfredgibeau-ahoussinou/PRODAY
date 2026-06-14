import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { User, UserRole } from '../../models/User';
import { ProfileAvatarButton } from './ProfileAvatarButton';
import { VerificationBadge } from '../VerificationBadge';
import { getVerificationBadge } from '../../models/User';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import type { ProductLineId } from '../../models/ProductLine';
import { getUniverseIdentity } from '../../content/brandExperience';
import { isProfileMobile, profileType } from './profileTypography';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

const AVATAR_SIZE = isProfileMobile ? 64 : 56;

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

interface ProfileHeroBandProps {
  profile: User;
  productLine: ProductLineId;
  uploadingAvatar: boolean;
  onAvatarPress: () => void;
  onEditPress: () => void;
}

/** En-tête profil — ligne identité type app, sans bannière marketing. */
export const ProfileHeroBand: React.FC<ProfileHeroBandProps> = ({
  profile,
  productLine,
  uploadingAvatar,
  onAvatarPress,
  onEditPress,
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, spacing.sm) }]}>
      <View style={styles.topRow}>
        <ProDayText variant="hero" style={styles.screenTitle}>
          Profil
        </ProDayText>
        <TouchableOpacity
          style={[styles.editBtn, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}
          onPress={onEditPress}
          hitSlop={8}
        >
          <Icon name="person" size={14} color={colors.ink} />
          <ProDayText variant="caption" style={styles.editLabel}>
            Modifier
          </ProDayText>
        </TouchableOpacity>
      </View>

      <View style={styles.identity}>
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
          <View style={[styles.rolePill, { backgroundColor: colors.accentSoft }]}>
            <ProDayText variant="caption" accent style={profileType.role}>
              {roleLabel}
            </ProDayText>
          </View>
          {meta.length > 0 ? (
            <ProDayText variant="caption" muted numberOfLines={2} style={profileType.meta}>
              {meta.join(' · ')}
            </ProDayText>
          ) : null}
          {verified ? (
            <View style={styles.badgeWrap}>
              <VerificationBadge user={profile} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

function createStyles(c: { surface: string; border: string }) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: c.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    screenTitle: {
      fontSize: 28,
      lineHeight: 32,
      fontWeight: '800',
      letterSpacing: -0.6,
    },
    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    editLabel: { fontWeight: '800', fontSize: 11 },
    identity: {
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
    rolePill: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    badgeWrap: { marginTop: 2 },
  });
}
