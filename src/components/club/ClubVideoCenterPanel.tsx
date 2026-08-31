import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { User } from '../../models/User';
import type { ClubCamera, ClubMatchVideo } from '../../models/ClubCameras';
import {
  CAMERA_STATUS_LABELS,
  MATCH_VIDEO_STATUS_LABELS,
  vendorLabel,
} from '../../models/ClubCameras';
import { clubCamerasService } from '../../services/clubCameras.service';
import { ClubCamerasPanel } from './ClubCamerasPanel';
import {
  VIDEO_ACCESS_ROLES,
  VIDEO_AI_PROMPTS,
  VIDEO_CENTER_TABS,
  VIDEO_LIBRARY_BUCKETS,
  VIDEO_PACKS_COPY,
  VIDEO_PROCESSING_STAGES,
  VIDEO_SHARE_TARGETS,
  VIDEO_TALK_SECTIONS,
  formatStorageGb,
  type VideoCenterTabId,
} from '../../content/clubVideoCenter';
import { VIDEO_VENDORS } from '../../content/videoOffers';
import { CLUB_SITE } from '../../content/clubPageIdentity';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { spacing } from '../../theme/designTokens';

type Props = {
  clubId: string;
  profile: User;
  onRequestQuote: () => void;
};

export function ClubVideoCenterPanel({ clubId, profile, onRequestQuote }: Props) {
  const [tab, setTab] = useState<VideoCenterTabId>('dashboard');
  const [loading, setLoading] = useState(true);
  const [cameras, setCameras] = useState<ClubCamera[]>([]);
  const [videos, setVideos] = useState<ClubMatchVideo[]>([]);
  const [scheduleForm, setScheduleForm] = useState({
    opponent: '',
    team_label: '',
    venue: '',
    competition: '',
    camera_id: '',
  });
  const [scheduling, setScheduling] = useState(false);
  const [aiPrompt, setAiPrompt] = useState(VIDEO_AI_PROMPTS[0] ?? '');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [teamEditCameraId, setTeamEditCameraId] = useState<string | null>(null);
  const [teamEditValue, setTeamEditValue] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cams, vids] = await Promise.all([
        clubCamerasService.listCameras(clubId),
        clubCamerasService.listMatchVideos(clubId),
      ]);
      setCameras(cams);
      setVideos(vids);
      setScheduleForm((f) =>
        f.camera_id || !cams[0] ? f : { ...f, camera_id: cams[0].id },
      );
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(
    () => clubCamerasService.computeCenterStats(cameras, videos),
    [cameras, videos],
  );

  const recentVideos = useMemo(() => videos.slice(0, 6), [videos]);

  const onSchedule = async () => {
    if (!scheduleForm.camera_id) {
      Alert.alert('Caméra', 'Ajoute ou sélectionne une caméra.');
      return;
    }
    if (!scheduleForm.opponent.trim()) {
      Alert.alert('Adversaire', 'Indique l’adversaire.');
      return;
    }
    setScheduling(true);
    try {
      const team = scheduleForm.team_label.trim() || 'Équipe';
      const result = await clubCamerasService.scheduleCapture({
        club_id: clubId,
        camera_id: scheduleForm.camera_id,
        team_label: team,
        opponent: scheduleForm.opponent.trim(),
        event_title: `${team} vs ${scheduleForm.opponent.trim()}`,
        venue: scheduleForm.venue.trim() || undefined,
        competition: scheduleForm.competition.trim() || undefined,
        match_type: 'match',
        scheduled_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        created_by_uid: profile.uid,
      });
      Alert.alert('Captation', result.message);
      setScheduleForm((f) => ({ ...f, opponent: '' }));
      setTab('library');
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de programmer');
    } finally {
      setScheduling(false);
    }
  };

  const runAiSearch = () => {
    const prompt = aiPrompt.trim();
    if (!prompt) return;
    const pool = videos.filter((v) => v.status === 'ready' || v.highlights_ready);
    const sample = pool.slice(0, 3);
    if (!sample.length) {
      setAiResult(
        'Aucune vidéo prête pour l’instant. Importe ou filme un match, puis relance la recherche.',
      );
      return;
    }
    setAiResult(
      `Playlist générée pour « ${prompt} » · ${sample.length} match(s) · ${sample
        .flatMap((v) => v.clips)
        .length || sample.length} séquence(s) candidate(s). Les connecteurs fabricants livreront les vrais timestamps une fois branchés.`,
    );
  };

  const associateTeams = async (camera: ClubCamera) => {
    setTeamEditCameraId(camera.id);
    setTeamEditValue(camera.team_labels?.join(', ') || camera.team_label || '');
  };

  const saveTeamAssociation = async () => {
    if (!teamEditCameraId) return;
    const labels = teamEditValue
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    try {
      await clubCamerasService.setCameraTeams(teamEditCameraId, {
        team_ids: labels.map((l) => l.toLowerCase().replace(/\s+/g, '_')),
        team_labels: labels,
      });
      setTeamEditCameraId(null);
      setTeamEditValue('');
      await load();
    } catch (e) {
      Alert.alert('Équipes', e instanceof Error ? e.message : 'Impossible de mettre à jour');
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[CLUB_SITE.band, CLUB_SITE.surface, CLUB_SITE.bg]}
        style={styles.hero}
      >
        <View style={styles.heroTop}>
          <Icon name="videocam" size={14} color={CLUB_SITE.accent} />
          <ProDayText variant="caption" style={styles.kicker}>
            Centre Vidéo
          </ProDayText>
        </View>
        <ProDayText variant="title" style={styles.heroTitle}>
          Le centre vidéo intelligent du club
        </ProDayText>
        <ProDayText variant="caption" style={styles.heroSupport}>
          Caméra → Match → Vidéo → IA → Clips → Causerie → Joueurs. Veo, XbotGo, autres
          caméras ou smartphone — jamais obligatoire.
        </ProDayText>
      </LinearGradient>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        style={styles.tabsScroll}
      >
        {VIDEO_CENTER_TABS.map((t) => {
          const on = tab === t.id;
          return (
            <PressableSpring
              key={t.id}
              onPress={() => setTab(t.id)}
              scaleTo={0.97}
              style={[styles.tab, on && styles.tabOn]}
            >
              <ProDayText variant="caption" style={[styles.tabText, on && styles.tabTextOn]}>
                {t.label}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator color={CLUB_SITE.accent} style={{ marginTop: spacing.lg }} />
      ) : null}

      {!loading && tab === 'dashboard' ? (
        <View style={styles.stack}>
          <View style={styles.kpiGrid}>
            {(
              [
                { label: 'Matchs filmés (mois)', value: String(stats.matchesFilmedMonth) },
                { label: 'Analysés IA', value: String(stats.matchesAiAnalyzed) },
                { label: 'Équipes équipées', value: String(stats.teamsEquipped) },
                { label: 'Caméras connectées', value: String(stats.camerasConnected) },
                { label: 'Stockage', value: formatStorageGb(stats.storageUsedMb) },
                {
                  label: 'Vidéos joueurs',
                  value: String(stats.videosSharedWithPlayers),
                },
              ] as const
            ).map((k) => (
              <View key={k.label} style={styles.kpi}>
                <ProDayText variant="title" style={styles.kpiValue}>
                  {k.value}
                </ProDayText>
                <ProDayText variant="caption" style={styles.kpiLabel}>
                  {k.label}
                </ProDayText>
              </View>
            ))}
          </View>

          <Card
            kicker="Flux"
            title="Récemment importées"
            body={
              recentVideos.length
                ? undefined
                : 'Aucune vidéo encore. Connecte une caméra ou importe un match.'
            }
          >
            {recentVideos.map((v) => (
              <VideoRow key={v.id} video={v} />
            ))}
          </Card>

          <Card kicker="Parcours" title="Traitement type">
            <View style={styles.stages}>
              {VIDEO_PROCESSING_STAGES.map((s, i) => (
                <View key={s.id} style={styles.stage}>
                  <ProDayText variant="caption" style={styles.stageIndex}>
                    {String(i + 1).padStart(2, '0')}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.stageLabel}>
                    {s.label}
                  </ProDayText>
                </View>
              ))}
            </View>
          </Card>

          <View style={styles.quickRow}>
            <PressableSpring
              onPress={() => setTab('cameras')}
              scaleTo={0.97}
              style={styles.quickPrimary}
            >
              <ProDayText variant="caption" style={styles.quickPrimaryText}>
                Mes caméras
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              onPress={() => setTab('schedule')}
              scaleTo={0.97}
              style={styles.quickSecondary}
            >
              <ProDayText variant="caption" style={styles.quickSecondaryText}>
                Programmer
              </ProDayText>
            </PressableSpring>
          </View>
        </View>
      ) : null}

      {!loading && tab === 'cameras' ? (
        <View style={styles.stack}>
          <Card
            kicker="Parc"
            title="Caméras connectées"
            body="Veo · XbotGo · compatibles · smartphone / tablette"
          >
            {cameras.length ? (
              cameras.map((c) => (
                <View key={c.id}>
                  <CameraRow
                    camera={c}
                    onAssociateTeams={() => void associateTeams(c)}
                  />
                  {teamEditCameraId === c.id ? (
                    <View style={styles.teamEdit}>
                      <ProDayText variant="caption" style={styles.fieldLabel}>
                        Équipes (séparées par des virgules)
                      </ProDayText>
                      <TextInput
                        value={teamEditValue}
                        onChangeText={setTeamEditValue}
                        placeholder="Seniors A, U18, U16"
                        placeholderTextColor="rgba(245,245,240,0.35)"
                        style={styles.input}
                      />
                      <View style={styles.quickRow}>
                        <PressableSpring
                          onPress={() => void saveTeamAssociation()}
                          scaleTo={0.97}
                          style={styles.quickPrimary}
                        >
                          <ProDayText variant="caption" style={styles.quickPrimaryText}>
                            Enregistrer
                          </ProDayText>
                        </PressableSpring>
                        <PressableSpring
                          onPress={() => {
                            setTeamEditCameraId(null);
                            setTeamEditValue('');
                          }}
                          scaleTo={0.97}
                          style={styles.quickSecondary}
                        >
                          <ProDayText variant="caption" style={styles.quickSecondaryText}>
                            Annuler
                          </ProDayText>
                        </PressableSpring>
                      </View>
                    </View>
                  ) : null}
                </View>
              ))
            ) : (
              <ProDayText variant="caption" style={styles.muted}>
                Aucune caméra. Utilise le panneau ci-dessous pour en ajouter.
              </ProDayText>
            )}
          </Card>
          <ClubCamerasPanel clubId={clubId} profile={profile} />
        </View>
      ) : null}

      {!loading && tab === 'schedule' ? (
        <View style={styles.stack}>
          <Card
            kicker="Captation"
            title="Programmer un match à filmer"
            body="Associe équipe, adversaire et caméra. La fiche match pourra aussi déclencher la captation."
          >
            <Field
              label="Adversaire"
              value={scheduleForm.opponent}
              onChange={(opponent) => setScheduleForm((f) => ({ ...f, opponent }))}
              placeholder="Paris FC"
            />
            <Field
              label="Équipe"
              value={scheduleForm.team_label}
              onChange={(team_label) => setScheduleForm((f) => ({ ...f, team_label }))}
              placeholder="U15"
            />
            <Field
              label="Terrain"
              value={scheduleForm.venue}
              onChange={(venue) => setScheduleForm((f) => ({ ...f, venue }))}
              placeholder="Terrain d’honneur"
            />
            <Field
              label="Compétition"
              value={scheduleForm.competition}
              onChange={(competition) => setScheduleForm((f) => ({ ...f, competition }))}
              placeholder="Championnat"
            />
            <ProDayText variant="caption" style={styles.fieldLabel}>
              Caméra
            </ProDayText>
            <View style={styles.chipRow}>
              {cameras.map((c) => {
                const on = scheduleForm.camera_id === c.id;
                return (
                  <PressableSpring
                    key={c.id}
                    onPress={() => setScheduleForm((f) => ({ ...f, camera_id: c.id }))}
                    scaleTo={0.97}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <ProDayText
                      variant="caption"
                      style={[styles.chipText, on && styles.chipTextOn]}
                    >
                      {c.display_name || c.model}
                    </ProDayText>
                  </PressableSpring>
                );
              })}
            </View>
            <PressableSpring
              onPress={() => void onSchedule()}
              scaleTo={0.97}
              haptic
              style={styles.quickPrimary}
            >
              <ProDayText variant="caption" style={styles.quickPrimaryText}>
                {scheduling ? 'Programmation…' : 'Programmer la captation'}
              </ProDayText>
            </PressableSpring>
          </Card>
        </View>
      ) : null}

      {!loading && tab === 'library' ? (
        <View style={styles.stack}>
          <Card kicker="Organisation" title="Bibliothèque">
            <View style={styles.chipRow}>
              {VIDEO_LIBRARY_BUCKETS.map((b) => (
                <View key={b.id} style={styles.chip}>
                  <ProDayText variant="caption" style={styles.chipText}>
                    {b.label}
                  </ProDayText>
                </View>
              ))}
            </View>
          </Card>
          <Card kicker="Matchs" title={`${videos.length} vidéo(s)`}>
            {videos.length ? (
              videos.map((v) => <VideoRow key={v.id} video={v} detailed />)
            ) : (
              <ProDayText variant="caption" style={styles.muted}>
                Bibliothèque vide.
              </ProDayText>
            )}
          </Card>
          <Card kicker="Partage" title="Droits & diffusion">
            <View style={styles.chipRow}>
              {VIDEO_SHARE_TARGETS.map((t) => (
                <View key={t.id} style={styles.chip}>
                  <ProDayText variant="caption" style={styles.chipText}>
                    {t.label}
                  </ProDayText>
                </View>
              ))}
            </View>
            {VIDEO_ACCESS_ROLES.map((r) => (
              <View key={r.id} style={styles.accessRow}>
                <ProDayText variant="section" style={styles.accessTitle}>
                  {r.label}
                </ProDayText>
                <ProDayText variant="caption" style={styles.muted}>
                  {r.scope}
                </ProDayText>
              </View>
            ))}
          </Card>
        </View>
      ) : null}

      {!loading && tab === 'ai' ? (
        <View style={styles.stack}>
          <Card
            kicker="Recherche intelligente"
            title="Montre-moi…"
            body="Transforme une question coach en playlist de séquences."
          >
            <View style={styles.chipRow}>
              {VIDEO_AI_PROMPTS.slice(0, 4).map((p) => (
                <PressableSpring
                  key={p}
                  onPress={() => setAiPrompt(p)}
                  scaleTo={0.98}
                  style={styles.chip}
                >
                  <ProDayText variant="caption" style={styles.chipText} numberOfLines={2}>
                    {p}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
            <TextInput
              value={aiPrompt}
              onChangeText={setAiPrompt}
              placeholder="Ex. Montre-moi nos corners offensifs"
              placeholderTextColor="rgba(245,245,240,0.35)"
              style={styles.input}
              multiline
            />
            <PressableSpring onPress={runAiSearch} scaleTo={0.97} style={styles.quickPrimary}>
              <ProDayText variant="caption" style={styles.quickPrimaryText}>
                Générer la playlist
              </ProDayText>
            </PressableSpring>
            {aiResult ? (
              <ProDayText variant="caption" style={styles.aiResult}>
                {aiResult}
              </ProDayText>
            ) : null}
          </Card>

          <Card
            kicker="Causerie"
            title="Générateur de causerie"
            body="L’IA propose des séquences défense / attaque / transitions / CPA."
          >
            {VIDEO_TALK_SECTIONS.map((s) => (
              <View key={s.id} style={styles.talkRow}>
                <ProDayText variant="section" style={styles.accessTitle}>
                  {s.label}
                </ProDayText>
                <ProDayText variant="caption" style={styles.muted}>
                  {s.defaultClips} séquence(s)
                </ProDayText>
              </View>
            ))}
            <PressableSpring
              onPress={() =>
                Alert.alert(
                  'Causerie',
                  'La vidéo courte vestiaire sera générée dès qu’un match analysé est sélectionné.',
                )
              }
              scaleTo={0.97}
              style={styles.quickSecondary}
            >
              <ProDayText variant="caption" style={styles.quickSecondaryText}>
                Générer la vidéo de causerie
              </ProDayText>
            </PressableSpring>
          </Card>
        </View>
      ) : null}

      {!loading && tab === 'offers' ? (
        <View style={styles.stack}>
          <Card kicker="Compatible" title="Caméras ProDay">
            <View style={styles.chipRow}>
              {VIDEO_VENDORS.map((v) => (
                <View key={v.id} style={styles.chip}>
                  <ProDayText variant="caption" style={styles.chipText}>
                    {v.label}
                  </ProDayText>
                </View>
              ))}
            </View>
          </Card>
          {(
            [VIDEO_PACKS_COPY.essentiel, VIDEO_PACKS_COPY.video, VIDEO_PACKS_COPY.camera] as const
          ).map((pack) => (
            <Card key={pack.title} kicker="Offre" title={pack.title} body={pack.body} />
          ))}
          <PressableSpring onPress={onRequestQuote} scaleTo={0.97} style={styles.quickPrimary}>
            <ProDayText variant="caption" style={styles.quickPrimaryText}>
              Demander un devis vidéo / caméra
            </ProDayText>
          </PressableSpring>
        </View>
      ) : null}
    </View>
  );
}

function Card({
  kicker,
  title,
  body,
  children,
}: {
  kicker: string;
  title: string;
  body?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <ProDayText variant="caption" style={styles.cardKicker}>
        {kicker}
      </ProDayText>
      <ProDayText variant="section" style={styles.cardTitle}>
        {title}
      </ProDayText>
      {body ? (
        <ProDayText variant="caption" style={styles.muted}>
          {body}
        </ProDayText>
      ) : null}
      {children}
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <ProDayText variant="caption" style={styles.fieldLabel}>
        {label}
      </ProDayText>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="rgba(245,245,240,0.35)"
        style={styles.input}
      />
    </View>
  );
}

function CameraRow({
  camera,
  onAssociateTeams,
}: {
  camera: ClubCamera;
  onAssociateTeams?: () => void;
}) {
  const online = camera.status === 'connected';
  return (
    <PressableSpring
      onPress={onAssociateTeams}
      disabled={!onAssociateTeams}
      scaleTo={0.98}
      style={styles.listRow}
    >
      <View style={[styles.dot, { backgroundColor: online ? '#22c55e' : '#ef4444' }]} />
      <View style={styles.listCopy}>
        <ProDayText variant="section" style={styles.listTitle}>
          {camera.display_name || `${vendorLabel(camera.vendor)} · ${camera.model}`}
        </ProDayText>
        <ProDayText variant="caption" style={styles.muted}>
          {CAMERA_STATUS_LABELS[camera.status]}
          {camera.team_label ? ` · ${camera.team_label}` : ''}
          {camera.team_labels?.length ? ` · ${camera.team_labels.join(', ')}` : ''}
          {camera.last_match_title ? ` · ${camera.last_match_title}` : ''}
          {camera.battery_pct != null ? ` · ${camera.battery_pct}%` : ''}
        </ProDayText>
        {onAssociateTeams ? (
          <ProDayText variant="caption" style={styles.associateHint}>
            Toucher pour associer des équipes
          </ProDayText>
        ) : null}
      </View>
    </PressableSpring>
  );
}

function VideoRow({ video, detailed }: { video: ClubMatchVideo; detailed?: boolean }) {
  return (
    <View style={styles.listRow}>
      <Icon name="videocam" size={16} color={CLUB_SITE.accent} />
      <View style={styles.listCopy}>
        <ProDayText variant="section" style={styles.listTitle}>
          {video.title}
        </ProDayText>
        <ProDayText variant="caption" style={styles.muted}>
          {MATCH_VIDEO_STATUS_LABELS[video.status]}
          {video.vendor ? ` · ${vendorLabel(video.vendor)}` : ''}
          {video.team_label ? ` · ${video.team_label}` : ''}
          {video.highlights_ready || video.ai_ready ? ' · Analyse IA' : ''}
          {detailed && video.opponent ? ` · vs ${video.opponent}` : ''}
        </ProDayText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  hero: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CLUB_SITE.border,
    borderLeftWidth: 2,
    borderLeftColor: CLUB_SITE.accent,
    padding: spacing.lg,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  kicker: {
    color: CLUB_SITE.accent,
    textTransform: 'uppercase',
    letterSpacing: 2.2,
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitle: {
    color: CLUB_SITE.foreground,
    fontWeight: '800',
    letterSpacing: -0.5,
    fontSize: 24,
  },
  heroSupport: { color: CLUB_SITE.muted, lineHeight: 18 },
  tabsScroll: { flexGrow: 0 },
  tabs: { gap: 6, paddingVertical: 2 },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CLUB_SITE.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tabOn: { borderColor: CLUB_SITE.accent, backgroundColor: CLUB_SITE.soft },
  tabText: { color: CLUB_SITE.muted, fontWeight: '700', fontSize: 11 },
  tabTextOn: { color: CLUB_SITE.foreground },
  stack: { gap: spacing.md },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kpi: {
    width: '31%',
    flexGrow: 1,
    minWidth: 100,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CLUB_SITE.border,
    padding: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.02)',
    gap: 4,
  },
  kpiValue: { color: CLUB_SITE.accent, fontWeight: '800', fontSize: 20 },
  kpiLabel: {
    color: CLUB_SITE.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontSize: 9,
    fontWeight: '700',
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CLUB_SITE.border,
    borderLeftWidth: 2,
    borderLeftColor: CLUB_SITE.accent,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  cardKicker: {
    color: CLUB_SITE.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontSize: 10,
    fontWeight: '800',
  },
  cardTitle: { color: CLUB_SITE.foreground, fontWeight: '800' },
  muted: { color: CLUB_SITE.muted, lineHeight: 18 },
  stages: { gap: 6, marginTop: spacing.sm },
  stage: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stageIndex: { color: CLUB_SITE.accent, fontWeight: '800', width: 24 },
  stageLabel: { color: CLUB_SITE.foreground, fontWeight: '600' },
  quickRow: { flexDirection: 'row', gap: spacing.sm },
  quickPrimary: {
    backgroundColor: CLUB_SITE.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  quickPrimaryText: { color: '#fff', fontWeight: '800' },
  quickSecondary: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  quickSecondaryText: { color: CLUB_SITE.foreground, fontWeight: '700' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CLUB_SITE.border,
  },
  listCopy: { flex: 1, gap: 2 },
  listTitle: { color: CLUB_SITE.foreground, fontWeight: '800' },
  associateHint: {
    color: CLUB_SITE.accent,
    fontWeight: '600',
    fontSize: 10,
    marginTop: 2,
  },
  teamEdit: { gap: 6, paddingBottom: spacing.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  field: { gap: 4, marginTop: spacing.sm },
  fieldLabel: {
    color: CLUB_SITE.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    fontSize: 10,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CLUB_SITE.border,
    color: CLUB_SITE.foreground,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    minHeight: 42,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CLUB_SITE.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    maxWidth: '100%',
  },
  chipOn: { borderColor: CLUB_SITE.accent, backgroundColor: CLUB_SITE.soft },
  chipText: { color: CLUB_SITE.muted, fontWeight: '600', fontSize: 11 },
  chipTextOn: { color: CLUB_SITE.foreground },
  accessRow: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CLUB_SITE.border,
    gap: 2,
  },
  accessTitle: { color: CLUB_SITE.foreground, fontWeight: '800' },
  talkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: CLUB_SITE.border,
  },
  aiResult: {
    color: CLUB_SITE.foreground,
    lineHeight: 18,
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: CLUB_SITE.border,
    padding: spacing.sm,
  },
});
