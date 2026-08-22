import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import type { User } from '../../models/User';
import type { ClubMatchVideo } from '../../models/ClubCameras';
import {
  MATCH_VIDEO_STATUS_LABELS,
  vendorLabel,
} from '../../models/ClubCameras';
import { clubCamerasService } from '../../services/clubCameras.service';
import {
  VIDEO_AI_PROMPTS,
  VIDEO_CAMERA_PREFLIGHT,
  VIDEO_LIVE_EVENTS,
  VIDEO_PROCESSING_STAGES,
  VIDEO_TALK_SECTIONS,
} from '../../content/clubVideoCenter';
import { CoachPane } from '../../components/coach/CoachScreenHeader';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import {
  CoachActionRow,
  CoachEmptyState,
  CoachSectionCard,
} from '../../components/coach/coachPortalUi';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { spacing } from '../../theme/designTokens';
import {
  coachVideoAiHonestAlert,
  coachVideoEmptyLibraryBody,
  coachVideoLiveUnavailableBody,
} from '../../utils/coachVideoHonesty';

type Props = {
  profile: User;
};

type CoachVideoPane = 'library' | 'prepare' | 'live' | 'ai';

export function CoachMesVideosScreen({ profile }: Props) {
  const shellNav = useCoachShellNav();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const clubId = profile.profile.club_id;
  const [pane, setPane] = useState<CoachVideoPane>('library');
  const [loading, setLoading] = useState(true);
  const [videos, setVideos] = useState<ClubMatchVideo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [preflightOk, setPreflightOk] = useState(false);

  const load = useCallback(async () => {
    if (!clubId) {
      setVideos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const all = await clubCamerasService.listMatchVideos(clubId);
      setVideos(all);
      if (!selectedId && all[0]) setSelectedId(all[0].id);
    } finally {
      setLoading(false);
    }
  }, [clubId, selectedId]);

  useEffect(() => {
    void load();
  }, [clubId]);

  const selected = useMemo(
    () => videos.find((v) => v.id === selectedId) ?? videos[0] ?? null,
    [videos, selectedId],
  );

  if (!clubId) {
    return (
      <CoachPane title={getCoachPageIdentity('mes_videos').title}>
        <ScrollView contentContainerStyle={styles.pad}>
          <CoachEmptyState
            title="Club requis"
            body="Lie ton compte coach à un club pour voir les matchs filmés de tes équipes."
            cta="Ouvrir Membres"
            onPress={() => shellNav?.requestNav('effectif')}
          />
        </ScrollView>
      </CoachPane>
    );
  }

  return (
    <CoachPane title={getCoachPageIdentity('mes_videos').title}>
    <View style={styles.root}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
          style={styles.railScroll}
        >
          {(
            [
              { id: 'library' as const, label: 'Mes vidéos' },
              { id: 'prepare' as const, label: 'Préparer' },
              { id: 'live' as const, label: 'Live Center' },
              { id: 'ai' as const, label: 'Analyse IA' },
            ] as const
          ).map((p) => {
            const on = pane === p.id;
            return (
              <PressableSpring
                key={p.id}
                onPress={() => setPane(p.id)}
                scaleTo={0.97}
                style={[styles.railPill, on && styles.railPillOn]}
              >
                <ProDayText
                  variant="caption"
                  style={[styles.railText, on && styles.railTextOn]}
                >
                  {p.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
        >
          {loading ? <ActivityIndicator color={tokens.accent} /> : null}

          {!loading && pane === 'library' ? (
            <>
              <CoachSectionCard
                kicker="Bibliothèque coach"
                title={`${videos.length} match(s) vidéo`}
                body="Uniquement les contenus de ton club / tes équipes."
              >
                {videos.length ? (
                  videos.map((v) => (
                    <PressableSpring
                      key={v.id}
                      onPress={() => setSelectedId(v.id)}
                      scaleTo={0.98}
                      style={[
                        styles.matchCard,
                        selected?.id === v.id && styles.matchCardOn,
                      ]}
                    >
                      <ProDayText variant="section" style={styles.matchTitle}>
                        {v.title}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.muted}>
                        {v.scheduled_at
                          ? v.scheduled_at.toLocaleDateString('fr-FR')
                          : v.created_at.toLocaleDateString('fr-FR')}
                        {v.vendor ? ` · ${vendorLabel(v.vendor)}` : ''}
                        {` · ${MATCH_VIDEO_STATUS_LABELS[v.status]}`}
                      </ProDayText>
                      <View style={styles.badges}>
                        {v.highlights_ready || v.ai_ready ? (
                          <Badge label="Analyse IA" />
                        ) : null}
                        {v.talk_ready ? <Badge label="Causerie" /> : null}
                        {v.clips.length ? (
                          <Badge label={`${v.clips.length} clips`} />
                        ) : null}
                      </View>
                    </PressableSpring>
                  ))
                ) : (
                  <CoachEmptyState
                    title="Pas encore de vidéos"
                    body={coachVideoEmptyLibraryBody()}
                    cta="Voir Profil / offre"
                    onPress={() => shellNav?.requestNav('profil')}
                  />
                )}
              </CoachSectionCard>

              {selected ? (
                <CoachSectionCard
                  kicker="Fiche match"
                  title={selected.title}
                  body="Match · Vidéo · Analyse — une seule fiche."
                >
                  <Row label="Statut" value={MATCH_VIDEO_STATUS_LABELS[selected.status]} />
                  <Row
                    label="Caméra"
                    value={selected.vendor ? vendorLabel(selected.vendor) : '—'}
                  />
                  <Row label="Adversaire" value={selected.opponent ?? '—'} />
                  <Row label="Terrain" value={selected.venue ?? '—'} />
                  <CoachActionRow
                    primary="Regarder"
                    onPrimary={() =>
                      Alert.alert(
                        'Lecture',
                        selected.storage_url
                          ? 'Lien stockage disponible — ouverture via le player club quand le flux est prêt.'
                          : 'Pas encore de fichier synchronisé. Le club importe ou capture dans Centre Vidéo.',
                      )
                    }
                    secondary="Clips"
                    onSecondary={() =>
                      Alert.alert(
                        'Clips',
                        selected.clips.length
                          ? `${selected.clips.length} clip(s) liés à ce match.`
                          : coachVideoAiHonestAlert('Clips'),
                      )
                    }
                  />
                  <CoachActionRow
                    primary="Analyse IA"
                    onPrimary={() => setPane('ai')}
                    secondary="Préparer"
                    onSecondary={() => setPane('prepare')}
                  />
                </CoachSectionCard>
              ) : null}
            </>
          ) : null}

          {!loading && pane === 'prepare' ? (
            <CoachSectionCard
              kicker="Avant le match"
              title="Préparer la vidéo"
              body={
                selected
                  ? `Match sélectionné : ${selected.title}`
                  : 'Sélectionne un match dans Mes vidéos.'
              }
            >
              {VIDEO_CAMERA_PREFLIGHT.map((c) => (
                <View key={c.id} style={styles.preflightRow}>
                  <Icon
                    name={preflightOk ? 'checkmark-circle' : 'time'}
                    size={16}
                    color={preflightOk ? tokens.accent : tokens.muted}
                  />
                  <ProDayText variant="caption" style={styles.preflightLabel}>
                    {c.label}
                  </ProDayText>
                </View>
              ))}
              <CoachActionRow
                primary={preflightOk ? 'Checklist notée' : 'Noter la checklist'}
                onPrimary={() => {
                  setPreflightOk(true);
                  Alert.alert(
                    'Préparation',
                    'Checklist coach enregistrée localement. Le test matériel réel se fait sur la caméra / le club — pas une simulation ProDay.',
                  );
                }}
                secondary="Live Center"
                onSecondary={() => setPane('live')}
              />
            </CoachSectionCard>
          ) : null}

          {!loading && pane === 'live' ? (
            <CoachSectionCard
              kicker="Pendant le match"
              title="Live Center"
              body={coachVideoLiveUnavailableBody()}
            >
              {selected && selected.status === 'recording' ? (
                <View style={styles.liveStats}>
                  <LiveStat label="Match" value={selected.title} />
                  <LiveStat
                    label="Statut"
                    value={MATCH_VIDEO_STATUS_LABELS[selected.status]}
                  />
                </View>
              ) : (
                <CoachEmptyState
                  title="Pas de captation live"
                  body="Quand le club démarre une captation, le statut apparaît ici. Les tags rapides restent disponibles pour notes coach."
                />
              )}
              <View style={styles.eventGrid}>
                {VIDEO_LIVE_EVENTS.map((e) => (
                  <PressableSpring
                    key={e.id}
                    onPress={() =>
                      Alert.alert(
                        e.label,
                        `Note « ${e.label} » — à croiser avec la vidéo club une fois synchronisée. Pas d’horodatage automatique sans flux.`,
                      )
                    }
                    scaleTo={0.96}
                    style={styles.eventBtn}
                  >
                    <Icon
                      name={e.icon}
                      color={e.iconColor ?? tokens.accent}
                      size={22}
                    />
                    <ProDayText variant="caption" style={styles.eventLabel}>
                      {e.label}
                    </ProDayText>
                  </PressableSpring>
                ))}
              </View>
              <CoachActionRow
                primary="Ajouter une note"
                onPrimary={() =>
                  Alert.alert(
                    'Note',
                    'Les notes restent locales / match — elles ne génèrent pas de clip tant que la vidéo n’est pas analysée.',
                  )
                }
                secondary="Analyse"
                onSecondary={() => setPane('ai')}
              />
            </CoachSectionCard>
          ) : null}

          {!loading && pane === 'ai' ? (
            <>
              <CoachSectionCard
                kicker="Après le match"
                title="Traitement vidéo"
                body="Synchronisation → Traitement → Analyse IA → Clips"
              >
                <View style={styles.stages}>
                  {VIDEO_PROCESSING_STAGES.map((s, i) => (
                    <View key={s.id} style={styles.stageRow}>
                      <ProDayText variant="caption" style={styles.stageIndex}>
                        {String(i + 1).padStart(2, '0')}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.stageLabel}>
                        {s.label}
                      </ProDayText>
                    </View>
                  ))}
                </View>
              </CoachSectionCard>

              <CoachSectionCard
                kicker="Analyse IA"
                title="Montre-moi…"
                body="Transforme une consigne coach en playlist."
              >
                {VIDEO_AI_PROMPTS.slice(0, 5).map((p) => (
                  <PressableSpring
                    key={p}
                    onPress={() =>
                      Alert.alert('Analyse IA', coachVideoAiHonestAlert(`« ${p} »`))
                    }
                    scaleTo={0.98}
                    style={styles.promptRow}
                  >
                    <ProDayText variant="caption" style={styles.promptText}>
                      {p}
                    </ProDayText>
                    <Icon name="chevron-forward" size={14} color={tokens.muted} />
                  </PressableSpring>
                ))}
              </CoachSectionCard>

              <CoachSectionCard
                kicker="Causerie"
                title="Générateur de causerie"
                body="Défense · Attaque · Transitions · CPA"
              >
                {VIDEO_TALK_SECTIONS.map((s) => (
                  <View key={s.id} style={styles.talkRow}>
                    <ProDayText variant="section" style={styles.matchTitle}>
                      {s.label}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.muted}>
                      {s.defaultClips} séq.
                    </ProDayText>
                  </View>
                ))}
                <CoachActionRow
                  primary="Préparer la causerie"
                  onPrimary={() =>
                    Alert.alert(
                      'Causerie',
                      coachVideoAiHonestAlert('Vidéo de causerie'),
                    )
                  }
                  secondary="Tactique IA"
                  onSecondary={() => shellNav?.requestNav('smart_tactics')}
                />
              </CoachSectionCard>
            </>
          ) : null}
        </ScrollView>
    </View>
    </CoachPane>
  );
}

function Badge({ label }: { label: string }) {
  const styles = useCoachThemedStyles(createStyles);
  return (
    <View style={styles.badge}>
      <ProDayText variant="caption" style={styles.badgeText}>
        {label}
      </ProDayText>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const styles = useCoachThemedStyles(createStyles);
  return (
    <View style={styles.metaRow}>
      <ProDayText variant="caption" style={styles.metaLabel}>
        {label}
      </ProDayText>
      <ProDayText variant="caption" style={styles.metaValue}>
        {value}
      </ProDayText>
    </View>
  );
}

function LiveStat({ label, value }: { label: string; value: string }) {
  const styles = useCoachThemedStyles(createStyles);
  return (
    <View style={styles.liveStat}>
      <ProDayText variant="caption" style={styles.metaLabel}>
        {label}
      </ProDayText>
      <ProDayText variant="section" style={styles.matchTitle}>
        {value}
      </ProDayText>
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  railScroll: { flexGrow: 0, maxHeight: 44 },
  rail: {
    paddingHorizontal: spacing.md,
    gap: 6,
    paddingBottom: 6,
  },
  railPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: tokens.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border,
  },
  railPillOn: {
    backgroundColor: tokens.soft,
    borderColor: tokens.accent,
  },
  railText: { color: tokens.muted, fontWeight: '700', fontSize: 11 },
  railTextOn: { color: tokens.accent, fontWeight: '800' },
  scroll: { flex: 1 },
  pad: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  matchCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border,
    padding: spacing.md,
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: tokens.isLight ? tokens.surface : 'rgba(255,255,255,0.02)',
  },
  matchCardOn: {
    borderColor: tokens.accent,
    backgroundColor: tokens.soft,
  },
  matchTitle: { color: tokens.foreground, fontWeight: '800' },
  muted: { color: tokens.muted },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  badge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${tokens.accent}66`,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: tokens.accent,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.border,
  },
  metaLabel: {
    color: tokens.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 10,
    fontWeight: '700',
  },
  metaValue: { color: tokens.foreground, fontWeight: '600' },
  preflightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.border,
  },
  preflightLabel: { color: tokens.foreground, fontWeight: '600' },
  liveStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  liveStat: {
    width: '47%',
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border,
    padding: spacing.sm,
    gap: 4,
    backgroundColor: tokens.isLight ? tokens.surface : 'transparent',
  },
  eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  eventBtn: {
    width: '31%',
    flexGrow: 1,
    minWidth: 96,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: tokens.border,
    backgroundColor: tokens.elevated,
  },
  eventLabel: { color: tokens.foreground, fontWeight: '700', fontSize: 10, textAlign: 'center' },
  stages: { gap: 6, marginTop: spacing.sm },
  stageRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  stageIndex: { color: tokens.accent, fontWeight: '800', width: 24 },
  stageLabel: { color: tokens.foreground, fontWeight: '600' },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.border,
  },
  promptText: { flex: 1, color: tokens.foreground, lineHeight: 18 },
  talkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: tokens.border,
  },
  });
}
