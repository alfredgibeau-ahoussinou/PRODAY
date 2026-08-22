/**
 * Interface caméras / captation — aucun vendeur imposé.
 * Veo · XbotGo · Smartphone · autre.
 */

export type ClubVideoProviderId = 'veo' | 'xbotgo' | 'smartphone' | 'other';

export type ClubVideoProvider = {
  id: ClubVideoProviderId;
  label: string;
  description: string;
  /** true si une intégration native est branchée. */
  connected: boolean;
};

export const CLUB_VIDEO_PROVIDERS: ClubVideoProvider[] = [
  {
    id: 'veo',
    label: 'Veo',
    description: 'Caméra automatique — fiche club / import. OAuth fabricant hors app tant que non livré.',
    connected: false,
  },
  {
    id: 'xbotgo',
    label: 'XbotGo',
    description: 'Tracking autonome — option libre, jamais imposée.',
    connected: false,
  },
  {
    id: 'smartphone',
    label: 'Smartphone',
    description: 'Filmez depuis le téléphone du staff — zéro matériel dédié.',
    connected: false,
  },
  {
    id: 'other',
    label: 'Autre',
    description: 'Toute autre solution de captation compatible fichiers / lien.',
    connected: false,
  },
];

export type ClubVideoSessionStub = {
  id: string;
  title: string;
  providerId: ClubVideoProviderId;
  status: 'idle' | 'recording' | 'processing' | 'ready';
};

/** Stub exécuteur — pas d’auto-upload forcé. */
export async function listClubVideoSessions(_clubId: string): Promise<ClubVideoSessionStub[]> {
  return [];
}
