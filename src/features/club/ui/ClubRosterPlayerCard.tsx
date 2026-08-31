import React from 'react';
import { AnimatedEntrance } from '../../../components/motion';
import { ClubPlayerCard } from './ClubPlayerCard';
import type { User } from '../../../models/User';
import type { Membership } from '../../../models/Membership';

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
 * Carte effectif Club — identité maillot/crest (pas le bouclier pôle Joueur).
 * Données club réelles uniquement (poste, licence, catégorie, n°).
 */
export function ClubRosterPlayerCard({
  player,
  membership,
  teamName,
  clubName,
  index = 0,
  onPress,
}: Props) {
  const season = player.profile?.season_stats;
  const hasLicense = Boolean(membership?.license_number?.trim());
  const status = membership?.status;
  const metaParts = [
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
      <ClubPlayerCard
        displayName={player.display_name || 'Joueur'}
        position={player.profile?.position}
        jerseyNumber={player.profile?.jersey_number}
        photoUrl={player.avatar_url}
        teamOrClub={teamName || clubName || undefined}
        statusLabel={membershipLabel(status, hasLicense)}
        statusTone={membershipTone(status)}
        metaLabel={metaParts.join(' · ') || undefined}
        stats={stats}
        onPress={onPress}
      />
    </AnimatedEntrance>
  );
}
