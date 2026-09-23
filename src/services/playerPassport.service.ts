export interface PlayerPassportData {
  playerId: string;
  fullName: string;
  licenseNumber: string;
  clubName: string;
  clubAffiliation: string;
  category: string;
  position: string;
  ovr: number;
  matchesPlayed: number;
  goals: number;
  assists: number;
  averageRating: number;
  coachVerified: boolean;
  coachName: string;
  verifiedAt: string;
  signatureHash: string;
}

export function generatePassportSignature(playerId: string, license: string, verifiedAt: string): string {
  // Deterministic verifiable hash
  let hash = 0;
  const combined = `PRODAY-VERIFIED:${playerId}:${license}:${verifiedAt}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `PD-${Math.abs(hash).toString(16).toUpperCase()}-${verifiedAt.substring(0, 10).replace(/-/g, '')}`;
}

export const playerPassportService = {
  buildPassport(params: {
    playerId: string;
    fullName: string;
    licenseNumber?: string;
    clubName?: string;
    clubAffiliation?: string;
    category?: string;
    position?: string;
    ovr?: number;
    matchesPlayed?: number;
    goals?: number;
    assists?: number;
    averageRating?: number;
    coachName?: string;
  }): PlayerPassportData {
    const now = new Date().toISOString();
    // Aucune valeur inventée (invariant DATA-01) : sans licence réelle ni
    // vérification côté serveur, le passeport n'est PAS certifié. Les anciens
    // défauts (« FFF-75482910 », « FC ProDay », « Didier Deschamps », stats
    // figées, coachVerified: true) étaient des données fictives.
    const license = params.licenseNumber?.trim() || '—';
    const isVerified = license !== '—';
    const sig = isVerified
      ? generatePassportSignature(params.playerId, license, now)
      : '';

    return {
      playerId: params.playerId,
      fullName: params.fullName,
      licenseNumber: license,
      clubName: params.clubName || '—',
      clubAffiliation: params.clubAffiliation || '—',
      category: params.category || '—',
      position: params.position || '—',
      ovr: params.ovr ?? 0,
      matchesPlayed: params.matchesPlayed ?? 0,
      goals: params.goals ?? 0,
      assists: params.assists ?? 0,
      averageRating: params.averageRating ?? 0,
      // Aucune vérification serveur n'existe encore : jamais « vérifié » côté client.
      coachVerified: false,
      coachName: params.coachName || '—',
      verifiedAt: isVerified ? now : '',
      signatureHash: sig,
    };
  },

  getPassportQrUrl(passport: PlayerPassportData): string {
    // Lien de partage du profil joueur. Sans vérification serveur, l'URL ne
    // prétend plus être un endpoint de vérification de recruteur.
    if (!passport.signatureHash) {
      return `https://proday.app/player/${encodeURIComponent(passport.playerId)}`;
    }
    const payload = encodeURIComponent(
      JSON.stringify({
        id: passport.playerId,
        lic: passport.licenseNumber,
        sig: passport.signatureHash,
        v: 1,
      })
    );
    return `https://proday.app/player/${encodeURIComponent(passport.playerId)}?d=${payload}`;
  },
};
