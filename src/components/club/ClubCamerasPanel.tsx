import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { clubCamerasService } from '../../services/clubCameras.service';
import { listCameraProviders } from '../../services/video/cameraProviders';
import { VIDEO_MODULE_PRINCIPLE, type VideoCameraVendor } from '../../content/videoOffers';
import {
  CAMERA_STATUS_LABELS,
  MATCH_VIDEO_STATUS_LABELS,
  type ClubCamera,
  type ClubMatchVideo,
} from '../../models/ClubCameras';
import type { User } from '../../models/User';
import { radius, spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

type Tab = 'cameras' | 'videos' | 'connect' | 'import';

interface ClubCamerasPanelProps {
  profile: User;
  clubId: string;
}

/** Module Caméras & Vidéo — multi-marques, matériel jamais obligatoire. */
export const ClubCamerasPanel: React.FC<ClubCamerasPanelProps> = ({ profile, clubId }) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [tab, setTab] = useState<Tab>('cameras');
  const [cameras, setCameras] = useState<ClubCamera[]>([]);
  const [videos, setVideos] = useState<ClubMatchVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [vendor, setVendor] = useState<VideoCameraVendor>('veo');
  const [model, setModel] = useState('');
  const [teamLabel, setTeamLabel] = useState('');
  const [matchTitle, setMatchTitle] = useState('');
  const [importVendor, setImportVendor] = useState<VideoCameraVendor>('generic');

  const providers = useMemo(() => listCameraProviders(), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cams, vids] = await Promise.all([
        clubCamerasService.listCameras(clubId),
        clubCamerasService.listMatchVideos(clubId),
      ]);
      setCameras(cams);
      setVideos(vids);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    void load();
  }, [load]);

  const connect = async () => {
    setBusy(true);
    try {
      const res = await clubCamerasService.connectCamera({
        club_id: clubId,
        vendor,
        model: model.trim() || undefined,
        team_label: teamLabel.trim() || undefined,
        created_by_uid: profile.uid,
      });
      Alert.alert('Caméra', res.message);
      setTab('cameras');
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Connexion impossible.');
    } finally {
      setBusy(false);
    }
  };

  const importVideo = async () => {
    if (!matchTitle.trim()) {
      Alert.alert('Match', 'Indiquez le titre du match.');
      return;
    }
    setBusy(true);
    try {
      const res = await clubCamerasService.importMatchVideo({
        club_id: clubId,
        vendor: importVendor,
        source: 'import',
        title: matchTitle.trim(),
        event_title: matchTitle.trim(),
        team_label: teamLabel.trim() || undefined,
        created_by_uid: profile.uid,
        share_with: ['coaches', 'players'],
      });
      Alert.alert('Vidéo', res.message);
      setMatchTitle('');
      setTab('videos');
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Import impossible.');
    } finally {
      setBusy(false);
    }
  };

  const recordWithCamera = (cam: ClubCamera) => {
    const t = matchTitle.trim() || `Match · ${cam.brand_label}`;
    void (async () => {
      setBusy(true);
      try {
        const res = await clubCamerasService.startRecordingForMatch({
          club_id: clubId,
          camera: cam,
          event_title: t,
          team_id: cam.team_id,
          team_label: cam.team_label,
          created_by_uid: profile.uid,
        });
        Alert.alert('Enregistrement', res.message);
        setMatchTitle('');
        setTab('videos');
        await load();
      } catch (e) {
        Alert.alert('Erreur', e instanceof Error ? e.message : 'Échec.');
      } finally {
        setBusy(false);
      }
    })();
  };

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section">Caméras & Vidéo</ProDayText>
      <ProDayText variant="caption" muted>
        {VIDEO_MODULE_PRINCIPLE}
      </ProDayText>
      <ProDaySurface variant="module" style={[styles.card, { borderColor: c.border }]}>
        <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
          Connexion des caméras et captations
        </ProDayText>
        <ProDayText variant="caption" muted>
          Connectez votre compte Veo ou associez vos caméras (Veo Cam, XbotGo, smartphone…). Vos captations et vidéos sont synchronisées directement dans ProDay sans configuration technique requise.
        </ProDayText>
      </ProDaySurface>

      <View style={styles.actions}>
        {(
          [
            { id: 'connect' as const, label: '+ Connecter' },
            { id: 'import' as const, label: 'Importer' },
            { id: 'cameras' as const, label: 'Mes caméras' },
            { id: 'videos' as const, label: 'Matchs vidéo' },
          ] as const
        ).map((a) => (
          <PressableSpring
            key={a.id}
            style={[
              styles.actionBtn,
              {
                backgroundColor: tab === a.id ? c.brand : c.surfaceMuted,
                borderColor: c.border,
              },
            ]}
            onPress={() => setTab(a.id)}
            scaleTo={0.97}
            haptic
          >
            <ProDayText variant="caption" inverse={tab === a.id}>
              {a.label}
            </ProDayText>
          </PressableSpring>
        ))}
      </View>

      {loading ? <ActivityIndicator color={c.brand} /> : null}

      {tab === 'connect' ? (
        <ProDaySurface variant="module" style={[styles.panel, { borderColor: c.border }]}>
          <ProDayText variant="caption" muted>
            Veo · XbotGo · Spiideo · Pixellot · Trace · smartphone — Connexion directe ou import.
          </ProDayText>
          <View style={styles.chips}>
            {providers.map((p) => (
              <PressableSpring
                key={p.vendor}
                style={[
                  styles.chip,
                  {
                    borderColor: c.border,
                    backgroundColor: vendor === p.vendor ? c.brand : c.surfaceMuted,
                  },
                ]}
                onPress={() => setVendor(p.vendor)}
                scaleTo={0.96}
              >
                <ProDayText variant="caption" inverse={vendor === p.vendor}>
                  {p.label}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder="Modèle (optionnel)"
            placeholderTextColor={c.textMuted}
            value={model}
            onChangeText={setModel}
          />
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder="Équipe associée"
            placeholderTextColor={c.textMuted}
            value={teamLabel}
            onChangeText={setTeamLabel}
          />
          <PressableSpring
            style={[styles.cta, { backgroundColor: c.brand }]}
            disabled={busy}
            onPress={() => void connect()}
            scaleTo={0.97}
            haptic
          >
            <ProDayText variant="caption" inverse>
              Connecter une caméra
            </ProDayText>
          </PressableSpring>
        </ProDaySurface>
      ) : null}

      {tab === 'import' ? (
        <ProDaySurface variant="module" style={[styles.panel, { borderColor: c.border }]}>
          <View style={styles.chips}>
            {providers.map((p) => (
              <PressableSpring
                key={`imp-${p.vendor}`}
                style={[
                  styles.chip,
                  {
                    borderColor: c.border,
                    backgroundColor: importVendor === p.vendor ? c.brand : c.surfaceMuted,
                  },
                ]}
                onPress={() => setImportVendor(p.vendor)}
                scaleTo={0.96}
              >
                <ProDayText variant="caption" inverse={importVendor === p.vendor}>
                  {p.label}
                </ProDayText>
              </PressableSpring>
            ))}
          </View>
          <TextInput
            style={[styles.input, { borderColor: c.border, color: c.text }]}
            placeholder="Titre du match"
            placeholderTextColor={c.textMuted}
            value={matchTitle}
            onChangeText={setMatchTitle}
          />
          <PressableSpring
            style={[styles.cta, { backgroundColor: c.brand }]}
            disabled={busy}
            onPress={() => void importVideo()}
            scaleTo={0.97}
            haptic
          >
            <ProDayText variant="caption" inverse>
              Importer une vidéo
            </ProDayText>
          </PressableSpring>
        </ProDaySurface>
      ) : null}

      {tab === 'cameras' ? (
        <View style={styles.list}>
          {cameras.length === 0 ? (
            <ProDayText variant="caption" muted>
              Aucune caméra connectée.
            </ProDayText>
          ) : (
            cameras.map((cam) => (
              <ProDaySurface
                key={cam.id}
                variant="module"
                style={[styles.card, { borderColor: c.border }]}
              >
                <ProDayText variant="section">
                  {cam.brand_label} · {cam.model}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {CAMERA_STATUS_LABELS[cam.status]}
                  {cam.team_label ? ` · ${cam.team_label}` : ''}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  Dernier match : {cam.last_match_title ?? '—'} · Stockage {cam.storage_used_mb} Mo ·
                  Sync {cam.sync_status}
                </ProDayText>
                <TextInput
                  style={[styles.input, { borderColor: c.border, color: c.text }]}
                  placeholder="Titre du match"
                  placeholderTextColor={c.textMuted}
                  value={matchTitle}
                  onChangeText={setMatchTitle}
                />
                <PressableSpring
                  style={[styles.miniCta, { backgroundColor: c.brand }]}
                  disabled={busy}
                  onPress={() => recordWithCamera(cam)}
                  scaleTo={0.96}
                  haptic
                >
                  <ProDayText variant="caption" inverse>
                    Lancer / associer un match
                  </ProDayText>
                </PressableSpring>
              </ProDaySurface>
            ))
          )}
        </View>
      ) : null}

      {tab === 'videos' ? (
        <View style={styles.list}>
          {videos.length === 0 ? (
            <ProDayText variant="caption" muted>
              Aucun match vidéo.
            </ProDayText>
          ) : (
            videos.map((v) => (
              <ProDaySurface
                key={v.id}
                variant="module"
                style={[styles.card, { borderColor: c.border }]}
              >
                <ProDayText variant="section">{v.title}</ProDayText>
                <ProDayText variant="caption" muted>
                  {MATCH_VIDEO_STATUS_LABELS[v.status]}
                  {v.team_label ? ` · ${v.team_label}` : ''}
                  {v.vendor ? ` · ${v.vendor}` : ''} · {v.source}
                </ProDayText>
                {v.clips.slice(0, 3).map((clip) => (
                  <ProDayText key={clip.id} variant="caption">
                    · {clip.label}
                  </ProDayText>
                ))}
              </ProDaySurface>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
};

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    wrap: { gap: spacing.sm, marginTop: spacing.sm },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    actionBtn: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    panel: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: spacing.sm,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    cta: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    list: { gap: spacing.sm },
    card: {
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.lg,
      padding: spacing.md,
      gap: 4,
    },
    miniCta: {
      alignSelf: 'flex-start',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
    },
  });
}
