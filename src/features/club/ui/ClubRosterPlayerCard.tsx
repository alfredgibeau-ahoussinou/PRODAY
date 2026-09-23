import React from 'react';
import { AnimatedEntrance } from '../../../components/motion';
import { ClubPlayerCard } from './ClubPlayerCard';
import type { User } from '../../../models/User';
import type { Membership } from '../../../models/Membership';
import {
  membershipStatusLabel,
  membershipStatusTone,
} from './clubPlayersModel';

type Props = {
  player: User;
  membership?: Membership | null;
  teamName?: string | null;
  clubName?: string | null;
  index?: number;
  onPress?: () => void;
};

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
        /** Libellé et teinte viennent du modèle partagé, pas d'une copie locale. */
        statusLabel={membershipStatusLabel(status, hasLicense)}
        statusTone={membershipStatusTone(status)}
        metaLabel={metaParts.join(' · ') || undefined}
        stats={stats}
        onPress={onPress}
      />
    </AnimatedEntrance>
  );
}
