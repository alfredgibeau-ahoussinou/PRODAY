import React from 'react';
import { ClubVideoCenterPanel } from './ClubVideoCenterPanel';
import type { User } from '../../models/User';

type Props = {
  clubId: string;
  profile: User;
  onRequestQuote: () => void;
};

/** Centre Vidéo club — dashboard + caméras + captations + IA + offres. */
export function ClubVideoHardwarePanel({ clubId, profile, onRequestQuote }: Props) {
  return (
    <ClubVideoCenterPanel
      clubId={clubId}
      profile={profile}
      onRequestQuote={onRequestQuote}
    />
  );
}
