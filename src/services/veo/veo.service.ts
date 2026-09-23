/**
 * Service d'intégration VEO — ProDay.
 * Les URL associées et les flux directs sont distincts d'une connexion partenaire réelle.
 */

import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore';
import { getDb } from '../../lib/firebase';
import { isFirebaseConfigured } from '../../config/firebase';
import type {
  ClubMatchVideo,
  MatchVideoKind,
  MatchVideoSource,
} from '../../models/ClubCameras';

export interface VeoAuthStatus {
  hasPartnerOAuth: boolean;
  status: 'active' | 'blocked_documented';
  message: string;
  clientIdConfigured: boolean;
}

export interface VeoConnectionState {
  status: 'not_configured' | 'connected' | 'expired' | 'revoked' | 'error';
  clubId?: string;
  accountLabel?: string;
  connectedAt?: Date;
  message: string;
}

export interface ParsedVeoUrl {
  isValid: boolean;
  rawUrl: string;
  matchId?: string;
  normalizedUrl?: string;
  embedUrl?: string;
  streamUrl?: string;
  isDirectStream: boolean;
  isVeoDomain: boolean;
  error?: string;
}

export interface AssociateVeoMatchInput {
  clubId: string;
  teamId?: string;
  teamLabel?: string;
  eventId?: string;
  eventTitle?: string;
  title: string;
  opponent?: string;
  competition?: string;
  venue?: string;
  scheduledAt?: Date;
  veoUrl: string;
  kind?: MatchVideoKind;
  createdByUid: string;
  shareWith?: ('coaches' | 'players' | 'parents' | 'staff')[];
}

export class VeoService {
  getVeoAuthStatus(): VeoAuthStatus {
    const clientId = process.env.EXPO_PUBLIC_VEO_CLIENT_ID || process.env.VEO_CLIENT_ID;
    const clientSecret = process.env.VEO_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return {
        hasPartnerOAuth: false,
        status: 'blocked_documented',
        clientIdConfigured: Boolean(clientId),
        message:
          'Blocage documenté : Identifiants Partenaire Veo (Client ID & Secret) non délivrés par Veo Technologies ApS. L’association par URL est préparée, mais aucune connexion ou diffusion VEO réelle n’est déclarée.',
      };
    }

    return {
      hasPartnerOAuth: true,
      status: 'active',
      clientIdConfigured: true,
      message: 'Identifiants API VEO présents ; le compte et la diffusion doivent encore être vérifiés auprès du service.',
    };
  }

  getConnectionState(clubId?: string): VeoConnectionState {
    if (!clubId) {
      return {
        status: 'not_configured',
        message: 'Aucun club VEO sélectionné. Associez d’abord une source à un club autorisé.',
      };
    }

    const auth = this.getVeoAuthStatus();
    return {
      status: 'not_configured',
      clubId,
      message: auth.hasPartnerOAuth
        ? 'Identifiants VEO présents, mais aucun compte ou club VEO n’est connecté dans ProDay.'
        : 'Connexion directe VEO indisponible : les identifiants Partenaire OAuth manquent.',
    };
  }

  parseVeoUrl(url: string): ParsedVeoUrl {
    const trimmed = (url || '').trim();
    if (!trimmed) {
      return {
        isValid: false,
        rawUrl: trimmed,
        isDirectStream: false,
        isVeoDomain: false,
        error: 'URL de captation vide.',
      };
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:') {
        throw new Error('Seules les URL HTTPS sont acceptées.');
      }

      const isVeoDomain =
        parsed.hostname === 'veo.co' ||
        parsed.hostname.endsWith('.veo.co') ||
        parsed.hostname === 'veo.co.uk' ||
        parsed.hostname.endsWith('.veo.co.uk');
      const isDirectStream = /\.(mp4|m3u8|mov)$/i.test(parsed.pathname);

      if (isVeoDomain) {
        const segments = parsed.pathname.split('/').filter(Boolean);
        const matchIdx = segments.indexOf('matches');
        const embedIdx = segments.indexOf('embed');
        const matchId =
          matchIdx !== -1 && segments[matchIdx + 1]
            ? segments[matchIdx + 1]
            : embedIdx !== -1 && segments[embedIdx + 1]
              ? segments[embedIdx + 1]
              : segments.at(-1);

        return {
          isValid: Boolean(matchId),
          rawUrl: trimmed,
          matchId,
          normalizedUrl: matchId ? `https://app.veo.co/matches/${matchId}/` : trimmed,
          embedUrl: matchId ? `https://app.veo.co/embed/${matchId}/` : undefined,
          streamUrl: trimmed,
          isDirectStream: false,
          isVeoDomain: true,
          error: matchId ? undefined : 'Identifiant de match VEO introuvable.',
        };
      }

      return {
        isValid: true,
        rawUrl: trimmed,
        normalizedUrl: trimmed,
        streamUrl: trimmed,
        isDirectStream,
        isVeoDomain: false,
      };
    } catch (error) {
      return {
        isValid: false,
        rawUrl: trimmed,
        isDirectStream: false,
        isVeoDomain: false,
        error: error instanceof Error && error.message.includes('HTTPS')
          ? error.message
          : 'Format d’URL invalide.',
      };
    }
  }

  async associateMatch(input: AssociateVeoMatchInput): Promise<ClubMatchVideo> {
    const parsed = this.parseVeoUrl(input.veoUrl);
    if (!parsed.isValid) throw new Error(parsed.error || 'URL VEO invalide');

    const now = new Date();
    const title = input.title.trim() || 'Match VEO';
    const payload = {
      club_id: input.clubId,
      vendor: 'veo' as const,
      source: (parsed.isDirectStream ? 'upload' : 'external_link') as MatchVideoSource,
      source_verified: false,
      kind: input.kind ?? 'unknown',
      team_id: input.teamId ?? null,
      team_label: input.teamLabel ?? null,
      event_id: input.eventId ?? null,
      event_title: input.eventTitle ?? title,
      title,
      opponent: input.opponent ?? null,
      competition: input.competition ?? null,
      venue: input.venue ?? null,
      scheduled_at: input.scheduledAt ? Timestamp.fromDate(input.scheduledAt) : Timestamp.fromDate(now),
      storage_url: parsed.streamUrl ?? parsed.normalizedUrl ?? input.veoUrl,
      duration_sec: null,
      highlights_ready: false,
      ai_ready: false,
      talk_ready: false,
      clips: [],
      player_uids: [],
      share_with: input.shareWith ?? ['coaches', 'players'],
      created_by_uid: input.createdByUid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    if (isFirebaseConfigured()) {
      const db = getDb();
      if (db) {
        const ref = await addDoc(collection(db, 'club_match_videos'), payload);
        return {
          id: ref.id,
          club_id: input.clubId,
          vendor: 'veo',
          source: payload.source,
          status: 'ready',
          persistence: 'firestore',
          source_verified: false,
          kind: payload.kind,
          team_id: input.teamId,
          team_label: input.teamLabel,
          event_id: input.eventId,
          event_title: input.eventTitle ?? title,
          title,
          opponent: input.opponent,
          competition: input.competition,
          venue: input.venue,
          scheduled_at: input.scheduledAt ?? now,
          storage_url: payload.storage_url,
          highlights_ready: false,
          ai_ready: false,
          talk_ready: false,
          clips: [],
          player_uids: [],
          share_with: input.shareWith ?? ['coaches', 'players'],
          created_by_uid: input.createdByUid,
          created_at: now,
          updated_at: now,
        };
      }
    }

    return {
      id: `veo-${Date.now().toString(36)}`,
      club_id: input.clubId,
      vendor: 'veo',
      status: 'ready',
      persistence: 'local_only',
      source: payload.source,
      source_verified: false,
      kind: payload.kind,
      team_id: input.teamId,
      team_label: input.teamLabel,
      event_id: input.eventId,
      event_title: input.eventTitle ?? title,
      title,
      opponent: input.opponent,
      competition: input.competition,
      venue: input.venue,
      scheduled_at: input.scheduledAt ?? now,
      storage_url: payload.storage_url,
      highlights_ready: false,
      ai_ready: false,
      talk_ready: false,
      clips: [],
      player_uids: [],
      share_with: input.shareWith ?? ['coaches', 'players'],
      created_by_uid: input.createdByUid,
      created_at: now,
      updated_at: now,
    };
  }

  async checkStreamReachability(url: string): Promise<boolean> {
    if (!url || typeof fetch === 'undefined') return false;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok || response.status === 403 || response.status === 405;
    } catch {
      return true;
    }
  }

  async listClubVeoVideos(clubId: string): Promise<ClubMatchVideo[]> {
    if (!isFirebaseConfigured()) return [];
    const db = getDb();
    if (!db) return [];

    try {
      const snapshot = await getDocs(
        query(
          collection(db, 'club_match_videos'),
          where('club_id', '==', clubId),
          where('vendor', '==', 'veo'),
          orderBy('created_at', 'desc'),
        ),
      );
      return snapshot.docs.map((document) => {
        const data = document.data();
        return {
          id: document.id,
          club_id: String(data.club_id ?? ''),
          vendor: 'veo',
          source: (data.source as MatchVideoSource) ?? 'external_link',
          status: (data.status as ClubMatchVideo['status']) ?? 'ready',
          kind: (data.kind as MatchVideoKind) ?? 'unknown',
          source_verified: Boolean(data.source_verified),
          title: String(data.title ?? 'Match VEO'),
          team_id: data.team_id ? String(data.team_id) : undefined,
          team_label: data.team_label ? String(data.team_label) : undefined,
          event_id: data.event_id ? String(data.event_id) : undefined,
          event_title: data.event_title ? String(data.event_title) : undefined,
          opponent: data.opponent ? String(data.opponent) : undefined,
          competition: data.competition ? String(data.competition) : undefined,
          venue: data.venue ? String(data.venue) : undefined,
          storage_url: data.storage_url ? String(data.storage_url) : undefined,
          duration_sec: data.duration_sec ? Number(data.duration_sec) : undefined,
          highlights_ready: Boolean(data.highlights_ready),
          ai_ready: Boolean(data.ai_ready),
          talk_ready: Boolean(data.talk_ready),
          clips: Array.isArray(data.clips) ? data.clips : [],
          player_uids: Array.isArray(data.player_uids) ? data.player_uids : [],
          share_with: Array.isArray(data.share_with) ? data.share_with : ['coaches'],
          created_by_uid: String(data.created_by_uid ?? ''),
          created_at: data.created_at instanceof Timestamp ? data.created_at.toDate() : new Date(),
          updated_at: data.updated_at instanceof Timestamp ? data.updated_at.toDate() : undefined,
        };
      });
    } catch {
      return [];
    }
  }
}

export const veoService = new VeoService();
