import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import { isFirebaseConfigured } from '../config/firebase';
import type {
  ClubCamera,
  ClubMatchVideo,
  ClubVideoCenterStats,
  CreateClubCameraInput,
  CreateMatchVideoInput,
  MatchVideoClip,
  VideoCaptureScheduleInput,
} from '../models/ClubCameras';
import {
  defaultModelForVendor,
  vendorLabel,
  computeClubVideoCenterStats,
} from '../models/ClubCameras';
import {
  getCameraProvider,
  resolveMatchVideoSource,
} from './video/cameraProviders';
import type { VideoCameraVendor } from '../content/videoOffers';

function toDate(v: unknown): Date {
  if (v instanceof Timestamp) return v.toDate();
  if (v instanceof Date) return v;
  return new Date();
}

function cameraFromDoc(id: string, data: Record<string, unknown>): ClubCamera {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    vendor: (data.vendor as ClubCamera['vendor']) ?? 'generic',
    brand_label: String(data.brand_label ?? ''),
    model: String(data.model ?? ''),
    display_name: data.display_name ? String(data.display_name) : undefined,
    status: (data.status as ClubCamera['status']) ?? 'disconnected',
    team_id: data.team_id ? String(data.team_id) : undefined,
    team_label: data.team_label ? String(data.team_label) : undefined,
    team_ids: Array.isArray(data.team_ids) ? (data.team_ids as string[]) : undefined,
    team_labels: Array.isArray(data.team_labels)
      ? (data.team_labels as string[])
      : undefined,
    last_match_title: data.last_match_title ? String(data.last_match_title) : undefined,
    last_match_at: data.last_match_at ? toDate(data.last_match_at) : undefined,
    storage_used_mb: Number(data.storage_used_mb ?? 0),
    storage_quota_mb:
      data.storage_quota_mb != null ? Number(data.storage_quota_mb) : undefined,
    sync_status: (data.sync_status as ClubCamera['sync_status']) ?? 'idle',
    battery_pct: data.battery_pct != null ? Number(data.battery_pct) : undefined,
    connection_label: data.connection_label
      ? String(data.connection_label)
      : undefined,
    last_sync_at: data.last_sync_at ? toDate(data.last_sync_at) : undefined,
    external_device_id: data.external_device_id
      ? String(data.external_device_id)
      : undefined,
    created_by_uid: String(data.created_by_uid ?? ''),
    created_at: toDate(data.created_at),
    updated_at: data.updated_at ? toDate(data.updated_at) : undefined,
  };
}

function videoFromDoc(id: string, data: Record<string, unknown>): ClubMatchVideo {
  return {
    id,
    club_id: String(data.club_id ?? ''),
    camera_id: data.camera_id ? String(data.camera_id) : undefined,
    vendor: data.vendor as ClubMatchVideo['vendor'],
    source: (data.source as ClubMatchVideo['source']) ?? 'import',
    status: (data.status as ClubMatchVideo['status']) ?? 'ready',
    team_id: data.team_id ? String(data.team_id) : undefined,
    team_label: data.team_label ? String(data.team_label) : undefined,
    event_id: data.event_id ? String(data.event_id) : undefined,
    event_title: data.event_title ? String(data.event_title) : undefined,
    title: String(data.title ?? 'Match vidéo'),
    opponent: data.opponent ? String(data.opponent) : undefined,
    competition: data.competition ? String(data.competition) : undefined,
    match_type: data.match_type ? String(data.match_type) : undefined,
    venue: data.venue ? String(data.venue) : undefined,
    scheduled_at: data.scheduled_at ? toDate(data.scheduled_at) : undefined,
    storage_url: data.storage_url ? String(data.storage_url) : undefined,
    duration_sec: data.duration_sec != null ? Number(data.duration_sec) : undefined,
    highlights_ready: Boolean(data.highlights_ready),
    ai_ready: data.ai_ready != null ? Boolean(data.ai_ready) : Boolean(data.highlights_ready),
    talk_ready: Boolean(data.talk_ready),
    clips: Array.isArray(data.clips) ? (data.clips as MatchVideoClip[]) : [],
    player_uids: Array.isArray(data.player_uids)
      ? (data.player_uids as string[])
      : [],
    share_with: Array.isArray(data.share_with)
      ? (data.share_with as ClubMatchVideo['share_with'])
      : [],
    created_by_uid: String(data.created_by_uid ?? ''),
    created_at: toDate(data.created_at),
    updated_at: data.updated_at ? toDate(data.updated_at) : undefined,
  };
}

export const clubCamerasService = {
  async listCameras(clubId: string): Promise<ClubCamera[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'club_cameras'),
        where('club_id', '==', clubId),
        orderBy('created_at', 'desc'),
        limit(40),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => cameraFromDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'club_cameras'));
      return snap.docs
        .map((d) => cameraFromDoc(d.id, d.data() as Record<string, unknown>))
        .filter((c) => c.club_id === clubId)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  async listMatchVideos(clubId: string): Promise<ClubMatchVideo[]> {
    if (!isFirebaseConfigured()) return [];
    const database = getDb();
    if (!database) return [];
    try {
      const q = query(
        collection(database, 'club_match_videos'),
        where('club_id', '==', clubId),
        orderBy('created_at', 'desc'),
        limit(40),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => videoFromDoc(d.id, d.data() as Record<string, unknown>));
    } catch {
      const snap = await getDocs(collection(database, 'club_match_videos'));
      return snap.docs
        .map((d) => videoFromDoc(d.id, d.data() as Record<string, unknown>))
        .filter((v) => v.club_id === clubId)
        .sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    }
  },

  async connectCamera(input: CreateClubCameraInput): Promise<{ id: string; message: string }> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const provider = getCameraProvider(input.vendor);
    const result = await provider.connect({
      clubId: input.club_id,
      externalDeviceId: input.external_device_id,
    });
    if (!result.ok) throw new Error(result.message);

    const ref = await addDoc(collection(database, 'club_cameras'), {
      club_id: input.club_id,
      vendor: input.vendor,
      brand_label: vendorLabel(input.vendor),
      model: input.model?.trim() || defaultModelForVendor(input.vendor),
      status: 'connected',
      team_id: input.team_id ?? null,
      team_label: input.team_label ?? null,
      last_match_title: null,
      last_match_at: null,
      storage_used_mb: 0,
      storage_quota_mb: null,
      sync_status: 'ok',
      external_device_id: result.external_device_id ?? null,
      created_by_uid: input.created_by_uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return { id: ref.id, message: result.message };
  },

  async setCameraTeam(
    cameraId: string,
    team: { team_id?: string; team_label?: string },
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'club_cameras', cameraId), {
      team_id: team.team_id ?? null,
      team_label: team.team_label ?? null,
      updated_at: serverTimestamp(),
    });
  },

  async importMatchVideo(
    input: CreateMatchVideoInput,
  ): Promise<{ id: string; message: string }> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const vendor = input.vendor ?? 'generic';
    const provider = getCameraProvider(vendor);
    const imported = await provider.importVideo({
      clubId: input.club_id,
      fileName: input.storage_url,
    });
    if (!imported.ok) throw new Error(imported.message);

    const ref = await addDoc(collection(database, 'club_match_videos'), {
      club_id: input.club_id,
      camera_id: input.camera_id ?? null,
      vendor,
      source: input.source || resolveMatchVideoSource(vendor),
      status: 'processing',
      team_id: input.team_id ?? null,
      team_label: input.team_label ?? null,
      event_id: input.event_id ?? null,
      event_title: input.event_title ?? null,
      title: input.title,
      storage_url: imported.storage_hint ?? input.storage_url ?? null,
      duration_sec: null,
      highlights_ready: false,
      clips: [],
      player_uids: input.player_uids ?? [],
      share_with: input.share_with ?? ['coaches'],
      created_by_uid: input.created_by_uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    const highlights = await provider.generateHighlights({
      matchVideoId: ref.id,
      title: input.title,
    });
    await updateDoc(doc(database, 'club_match_videos', ref.id), {
      status: 'ready',
      highlights_ready: highlights.clips.length > 0,
      clips: highlights.clips,
      updated_at: serverTimestamp(),
    });

    if (input.camera_id) {
      await updateDoc(doc(database, 'club_cameras', input.camera_id), {
        last_match_title: input.title,
        last_match_at: serverTimestamp(),
        storage_used_mb: 450,
        sync_status: 'ok',
        updated_at: serverTimestamp(),
      });
    }

    return { id: ref.id, message: `${imported.message} ${highlights.message}` };
  },

  async startRecordingForMatch(opts: {
    club_id: string;
    camera: ClubCamera;
    event_title: string;
    event_id?: string;
    team_id?: string;
    team_label?: string;
    created_by_uid: string;
  }): Promise<{ id: string; message: string }> {
    const provider = getCameraProvider(opts.camera.vendor);
    const started = await provider.startRecording({
      clubId: opts.club_id,
      externalDeviceId: opts.camera.external_device_id,
      eventTitle: opts.event_title,
    });
    if (!started.ok) throw new Error(started.message);

    return this.importMatchVideo({
      club_id: opts.club_id,
      camera_id: opts.camera.id,
      vendor: opts.camera.vendor,
      source: resolveMatchVideoSource(opts.camera.vendor),
      team_id: opts.team_id ?? opts.camera.team_id,
      team_label: opts.team_label ?? opts.camera.team_label,
      event_id: opts.event_id,
      event_title: opts.event_title,
      title: opts.event_title,
      created_by_uid: opts.created_by_uid,
      share_with: ['coaches', 'players'],
    });
  },

  async listVideosForEvent(clubId: string, eventId: string): Promise<ClubMatchVideo[]> {
    const all = await this.listMatchVideos(clubId);
    return all.filter((v) => v.event_id === eventId);
  },

  async listClipsForPlayer(clubId: string, playerUid: string): Promise<MatchVideoClip[]> {
    const all = await this.listMatchVideos(clubId);
    const clips: MatchVideoClip[] = [];
    for (const v of all) {
      for (const c of v.clips) {
        if (c.player_uids?.includes(playerUid) || v.player_uids.includes(playerUid)) {
          clips.push(c);
        }
      }
    }
    return clips;
  },

  computeCenterStats(
    cameras: ClubCamera[],
    videos: ClubMatchVideo[],
    now: Date = new Date(),
  ): ClubVideoCenterStats {
    return computeClubVideoCenterStats(cameras, videos, now);
  },

  async setCameraTeams(
    cameraId: string,
    teams: { team_ids: string[]; team_labels: string[] },
  ): Promise<void> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    await updateDoc(doc(database, 'club_cameras', cameraId), {
      team_ids: teams.team_ids,
      team_labels: teams.team_labels,
      team_id: teams.team_ids[0] ?? null,
      team_label: teams.team_labels[0] ?? null,
      updated_at: serverTimestamp(),
    });
  },

  /** Programme une captation (fiche match + caméra associée). */
  async scheduleCapture(
    input: VideoCaptureScheduleInput,
  ): Promise<{ id: string; message: string }> {
    const database = getDb();
    if (!database) throw new Error('Firebase non configuré');
    const cameraSnap = await getDocs(
      query(collection(database, 'club_cameras'), where('club_id', '==', input.club_id), limit(40)),
    );
    const camera = cameraSnap.docs
      .map((d) => cameraFromDoc(d.id, d.data() as Record<string, unknown>))
      .find((c) => c.id === input.camera_id);
    if (!camera) throw new Error('Caméra introuvable');

    const title =
      input.event_title.trim() ||
      `${input.team_label ?? 'Équipe'} vs ${input.opponent}`.trim();

    const ref = await addDoc(collection(database, 'club_match_videos'), {
      club_id: input.club_id,
      camera_id: input.camera_id,
      vendor: camera.vendor,
      source: resolveMatchVideoSource(camera.vendor),
      status: 'processing',
      team_id: input.team_id ?? camera.team_id ?? null,
      team_label: input.team_label ?? camera.team_label ?? null,
      event_id: input.event_id ?? null,
      event_title: title,
      title,
      opponent: input.opponent,
      competition: input.competition ?? null,
      match_type: input.match_type ?? null,
      venue: input.venue ?? null,
      scheduled_at: Timestamp.fromDate(input.scheduled_at),
      storage_url: null,
      duration_sec: null,
      highlights_ready: false,
      ai_ready: false,
      talk_ready: false,
      clips: [],
      player_uids: [],
      share_with: ['coaches'],
      created_by_uid: input.created_by_uid,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    await updateDoc(doc(database, 'club_cameras', input.camera_id), {
      last_match_title: title,
      last_match_at: Timestamp.fromDate(input.scheduled_at),
      sync_status: 'ok',
      updated_at: serverTimestamp(),
    });

    return {
      id: ref.id,
      message: `Captation programmée · ${camera.display_name || camera.model}`,
    };
  },
};

export type { VideoCameraVendor };
