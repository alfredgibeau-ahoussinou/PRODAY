import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AnimatedEntrance } from '../../../components/motion';
import { PlayerShieldCardCompact } from '../../../components/joueur/PlayerShieldCardCompact';
import { ClubStatusPill } from './clubUi';
import { useClubTheme } from '../shell/ClubThemeContext';
import type { User } from '../../../models/User';
import type { Membership } from '../../../models/Membership';
import { spacing } from '../../../theme/designTokens';

type Props = {
  player: User;
  membership?: Membership | null;
  teamName?: string | null;
  clubName?: string | null;
  index?: number;
  onPress?: () => void;
};

function membershipTone(
  status: Membership['status'] | undefined,
): 'ok' | 'warn' | 'alert' | 'neutral' {
  if (status === 'active') return 'ok';
  if (status === 'pending') return 'warn';
  if (status === 'suspended' || status === 'rejected') return 'alert';
  return 'neutral';
}

function membershipLabel(status: Membership['status'] | undefined, hasLicense: boolean): string {
  if (status === 'pending') return 'Adhésion en attente';
  if (status === 'suspended') return 'Suspendu';
  if (status === 'rejected') return 'Refusé';
  if (status === 'left') return 'Parti';
  if (status === 'active' && hasLicense) return 'Licencié';
  if (status === 'active') return 'Actif';
  return 'Profil club';
}

/**
 * Carte joueur style pôle Joueur (bouclier compact) — données club réelles uniquement
 * (poste, licence, catégorie). Pas de score inventé.
 */
export function ClubRosterPlayerCard({
  player,
  membership,
  teamName,
  clubName,
  index = 0,
  onPress,
}: Props) {
  const { tokens } = useClubTheme();
  const season = player.profile?.season_stats;
  const hasLicense = Boolean(membership?.license_number?.trim());
  const status = membership?.status;
  const metaParts = [
    membershipLabel(status, hasLicense),
    player.profile?.category,
    membership?.license_number ? `N° ${membership.license_number}` : null,
  ].filter(Boolean);

  const stats =
    season && (season.matches != null || season.goals != null || season.assists != null)
      ? {
          matches: season.matches ?? undefined,
          goals: season.goals ?? undefined,
          assists: season.assists ?? undefined,
        }
      : undefined;

  return (
    <AnimatedEntrance kind="fadeUp" index={index} delayStep={36}>
      <View style={styles.wrap}>
        <PlayerShieldCardCompact
          displayName={player.display_name || 'Joueur'}
          position={player.profile?.position}
          photoUrl={player.avatar_url}
          clubName={teamName || clubName || undefined}
          stats={stats}
          accent={tokens.accent}
          accentSoft={tokens.accentSoft}
          metaLabel={metaParts.join(' · ')}
          onPress={onPress}
        />
        <View style={styles.pill}>
          <ClubStatusPill label={membershipLabel(status, hasLicense)} tone={membershipTone(status)} />
        </View>
      </View>
    </AnimatedEntrance>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  pill: { paddingLeft: 4 },
});
