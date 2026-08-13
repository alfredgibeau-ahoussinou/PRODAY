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
import { COACH_SITE } from '../../content/coachPageIdentity';
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

type Props = {
  profile: User;
};

type CoachVideoPane = 'library' | 'prepare' | 'live' | 'ai';

export function CoachMesVideosScreen({ profile }: Props) {
  const shellNav = useCoachShellNav();
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
      <ScrollView contentContainerStyle={styles.pad}>
        <CoachEmptyState
          title="Club requis"
          body="Lie ton compte coach à un club pour voir les matchs filmés de tes équipes."
          cta="Ouvrir effectif"
          onPress={() => shellNav?.requestNav('effectif')}
        />
      </ScrollView>
    );
  }

  return (
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
          {loading ? <ActivityIndicator color={COACH_SITE.accent} /> : null}

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
                    body="Demande au club de connecter une caméra ou d’importer un match dans le Centre Vidéo."
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
                          ? 'Ouverture du flux (connecteur fabricant).'
                          : 'La vidéo sera lisible dès la synchronisation terminée.',
                      )
                    }
                    secondary="Clips"
                    onSecondary={() =>
                      Alert.alert(
                        'Clips',
                        selected.clips.length
                          ? `${selected.clips.length} clip(s) prêts.`
                          : 'Aucun clip encore. Lance l’analyse IA après le match.',
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
                    color={preflightOk ? COACH_SITE.accent : COACH_SITE.muted}
                  />
                  <ProDayText variant="caption" style={styles.preflightLabel}>
                    {c.label}
                  </ProDayText>
                </View>
              ))}
              <CoachActionRow
                primary={preflightOk ? 'Caméra prête' : 'Lancer le test caméra'}
                onPrimary={() => {
                  setPreflightOk(true);
                  Alert.alert('Test caméra', 'Batterie · connexion · stockage · sync OK (simulation).');
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
              body="Statut captation + tags rapides pour l’analyse."
            >
              <View style={styles.liveStats}>
                <LiveStat label="Caméra" value="En ligne" />
                <LiveStat label="Captation" value="45:12" />
                <LiveStat label="Batterie" value="78%" />
                <LiveStat label="Stockage" value="OK" />
              </View>
              <View style={styles.eventGrid}>
                {VIDEO_LIVE_EVENTS.map((e) => (
                  <PressableSpring
                    key={e.id}
                    onPress={() =>
                      Alert.alert(
                        e.label,
                        `Événement « ${e.label} » horodaté pour l’analyse vidéo.`,
                      )
                    }
                    scaleTo={0.96}
                    style={styles.eventBtn}
                  >
                    <ProDayText variant="caption" style={styles.eventSymbol}>
                      {e.symbol}
                    </ProDayText>
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
                    'Exemple : « Notre bloc défensif est trop bas. »',
                  )
                }
                secondary="Fin de match"
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
                      Alert.alert(
                        'Playlist IA',
                        `Recherche : « ${p} »\nLes séquences seront listées dès que le match est analysé.`,
                      )
                    }
                    scaleTo={0.98}
                    style={styles.promptRow}
                  >
                    <ProDayText variant="caption" style={styles.promptText}>
                      {p}
                    </ProDayText>
                    <Icon name="chevron-forward" size={14} color={COACH_SITE.muted} />
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
                  primary="Générer la vidéo de causerie"
                  onPrimary={() =>
                    Alert.alert(
                      'Causerie',
                      'Vidéo courte vestiaire prête à partager avec l’équipe.',
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
  );
}

function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <ProDayText variant="caption" style={styles.badgeText}>
        {label}
      </ProDayText>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
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

const styles = StyleSheet.create({
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
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  railPillOn: {
    borderColor: COACH_SITE.accent,
    backgroundColor: COACH_SITE.soft,
  },
  railText: { color: COACH_SITE.muted, fontWeight: '700', fontSize: 11 },
  railTextOn: { color: COACH_SITE.foreground },
  scroll: { flex: 1 },
  pad: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  matchCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    padding: spacing.md,
    gap: 6,
    marginTop: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  matchCardOn: {
    borderColor: COACH_SITE.accent,
    backgroundColor: COACH_SITE.soft,
  },
  matchTitle: { color: COACH_SITE.foreground, fontWeight: '800' },
  muted: { color: COACH_SITE.muted },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  badge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COACH_SITE.accent}66`,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: COACH_SITE.accent,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  metaLabel: {
    color: COACH_SITE.accent,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 10,
    fontWeight: '700',
  },
  metaValue: { color: COACH_SITE.foreground, fontWeight: '600' },
  preflightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  preflightLabel: { color: COACH_SITE.foreground, fontWeight: '600' },
  liveStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  liveStat: {
    width: '47%',
    flexGrow: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    padding: spacing.sm,
    gap: 4,
  },
  eventGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: spacing.sm },
  eventBtn: {
    width: '31%',
    flexGrow: 1,
    minWidth: 96,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
  },
  eventSymbol: { fontSize: 16 },
  eventLabel: { color: COACH_SITE.foreground, fontWeight: '700', fontSize: 10 },
  stages: { gap: 6, marginTop: spacing.sm },
  stageRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  stageIndex: { color: COACH_SITE.accent, fontWeight: '800', width: 24 },
  stageLabel: { color: COACH_SITE.foreground, fontWeight: '600' },
  promptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  promptText: { flex: 1, color: COACH_SITE.foreground, lineHeight: 18 },
  talkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
});
