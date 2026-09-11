import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
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
  CoachEmptyState,
} from '../../components/coach/coachPortalUi';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { radius, spacing } from '../../theme/designTokens';
import { ELITE_COLORS } from '../../theme/prodayEliteTheme';
import { prodayHaptics } from '../../utils/prodayHaptics';
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
  const [checkedPreflight, setCheckedPreflight] = useState<Record<string, boolean>>({});

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

  const totalClips = useMemo(
    () => videos.reduce((acc, v) => acc + (v.clips?.length ?? 0), 0),
    [videos],
  );

  const aiReadyCount = useMemo(
    () => videos.filter((v) => v.highlights_ready || v.ai_ready).length,
    [videos],
  );

  const isPreflightComplete = useMemo(() => {
    return VIDEO_CAMERA_PREFLIGHT.every((c) => checkedPreflight[c.id]);
  }, [checkedPreflight]);

  const togglePreflight = (id: string) => {
    prodayHaptics.press();
    setCheckedPreflight((prev) => ({ ...prev, [id]: !prev[id] }));
  };

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
        {/* 1. BARRE D'ONGLETS HORIZONTALE */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
          style={styles.railScroll}
        >
          {(
            [
              { id: 'library' as const, label: 'Mes vidéos', icon: 'videocam' as const },
              { id: 'prepare' as const, label: 'Préparer', icon: 'list' as const },
              { id: 'live' as const, label: 'Live Center', icon: 'flash' as const },
              { id: 'ai' as const, label: 'Analyse IA', icon: 'sparkles' as const },
            ] as const
          ).map((p) => {
            const on = pane === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                onPress={() => {
                  prodayHaptics.tabSwitch();
                  setPane(p.id);
                }}
                activeOpacity={0.85}
                style={[styles.railPill, on && styles.railPillOn]}
              >
                <Icon
                  name={p.icon}
                  size={14}
                  color={on ? '#000000' : ELITE_COLORS.textMuted}
                />
                <ProDayText
                  variant="caption"
                  style={[styles.railText, on && styles.railTextOn]}
                >
                  {p.label}
                </ProDayText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.pad}
          showsVerticalScrollIndicator={false}
        >
          {loading ? (
            <ActivityIndicator color={tokens.accent} style={{ marginVertical: spacing.lg }} />
          ) : null}

          {/* VUE 1 : BIBLIOTHÈQUE VIDÉO */}
          {!loading && pane === 'library' ? (
            <>
              {/* HERO METRICS */}
              <View style={styles.heroCard}>
                <View style={styles.heroHeaderRow}>
                  <View style={styles.heroTitleGroup}>
                    <View style={styles.liveDot} />
                    <ProDayText variant="section" style={styles.heroTitle}>
                      Vidéothèque Matchs
                    </ProDayText>
                  </View>
                  <View style={styles.cameraBadge}>
                    <Icon name="videocam" size={12} color={tokens.accent} />
                    <ProDayText variant="caption" style={styles.cameraBadgeText}>
                      Veo & Caméras Club
                    </ProDayText>
                  </View>
                </View>

                <View style={styles.statsRibbon}>
                  <View style={styles.statItem}>
                    <ProDayText variant="hero" style={styles.statNum}>
                      {videos.length}
                    </ProDayText>
                    <ProDayText variant="caption" muted style={styles.statLabel}>
                      Matchs filmés
                    </ProDayText>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <ProDayText variant="hero" style={[styles.statNum, { color: tokens.accent }]}>
                      {aiReadyCount}
                    </ProDayText>
                    <ProDayText variant="caption" muted style={styles.statLabel}>
                      Analyses IA
                    </ProDayText>
                  </View>

                  <View style={styles.statDivider} />

                  <View style={styles.statItem}>
                    <ProDayText variant="hero" style={[styles.statNum, { color: '#38BDF8' }]}>
                      {totalClips}
                    </ProDayText>
                    <ProDayText variant="caption" muted style={styles.statLabel}>
                      Clips prêts
                    </ProDayText>
                  </View>
                </View>
              </View>

              {/* LISTE DES MATCHS VIDÉO */}
              {videos.length === 0 ? (
                <CoachEmptyState
                  title="Pas encore de vidéos"
                  body={coachVideoEmptyLibraryBody()}
                  cta="Voir Profil / offre"
                  onPress={() => shellNav?.requestNav('profil')}
                />
              ) : (
                videos.map((v) => {
                  const isSelected = selected?.id === v.id;
                  const dateStr = v.scheduled_at
                    ? v.scheduled_at.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : v.created_at.toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                  const isReady = v.status === 'ready';

                  return (
                    <PressableSpring
                      key={v.id}
                      onPress={() => {
                        prodayHaptics.press();
                        setSelectedId(v.id);
                      }}
                      scaleTo={0.98}
                      haptic
                      style={[styles.videoCard, isSelected && styles.videoCardSelected]}
                    >
                      {/* PREVIEW BANNER / HEADER */}
                      <View style={styles.videoPreviewHeader}>
                        <View style={styles.vendorPill}>
                          <Icon name="videocam" size={11} color="#FFFFFF" />
                          <ProDayText variant="caption" style={styles.vendorText}>
                            {v.vendor ? vendorLabel(v.vendor) : 'Caméra Club'}
                          </ProDayText>
                        </View>

                        <View style={styles.datePill}>
                          <Icon name="calendar" size={11} color={ELITE_COLORS.textMuted} />
                          <ProDayText variant="caption" muted style={styles.dateText}>
                            {dateStr}
                          </ProDayText>
                        </View>

                        <View
                          style={[
                            styles.statusPill,
                            isReady ? styles.statusPillReady : styles.statusPillPending,
                          ]}
                        >
                          <View
                            style={[
                              styles.miniStatusDot,
                              { backgroundColor: isReady ? '#10B981' : '#F59E0B' },
                            ]}
                          />
                          <ProDayText
                            variant="caption"
                            style={{
                              color: isReady ? '#10B981' : '#F59E0B',
                              fontWeight: '800',
                              fontSize: 10,
                            }}
                          >
                            {MATCH_VIDEO_STATUS_LABELS[v.status]}
                          </ProDayText>
                        </View>
                      </View>

                      {/* MATCH TITLE */}
                      <View style={styles.videoBody}>
                        <ProDayText variant="section" style={styles.videoTitle}>
                          {v.title}
                        </ProDayText>

                        {v.opponent || v.venue ? (
                          <View style={styles.metaLocationRow}>
                            {v.opponent ? (
                              <View style={styles.metaLocationItem}>
                                <Icon name="shield" size={12} color={ELITE_COLORS.textMuted} />
                                <ProDayText variant="caption" muted>
                                  vs {v.opponent}
                                </ProDayText>
                              </View>
                            ) : null}
                            {v.venue ? (
                              <View style={styles.metaLocationItem}>
                                <Icon name="location" size={12} color={ELITE_COLORS.textMuted} />
                                <ProDayText variant="caption" muted>
                                  {v.venue}
                                </ProDayText>
                              </View>
                            ) : null}
                          </View>
                        ) : null}

                        {/* BADGES CLIPS & IA */}
                        <View style={styles.featureBadgesRow}>
                          {v.highlights_ready || v.ai_ready ? (
                            <View style={[styles.featureBadge, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                              <Icon name="sparkles" size={11} color={tokens.accent} />
                              <ProDayText
                                variant="caption"
                                style={{ color: tokens.accent, fontWeight: '800', fontSize: 10 }}
                              >
                                Analyse IA prête
                              </ProDayText>
                            </View>
                          ) : null}

                          {v.talk_ready ? (
                            <View style={[styles.featureBadge, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                              <Icon name="mic" size={11} color="#38BDF8" />
                              <ProDayText
                                variant="caption"
                                style={{ color: '#38BDF8', fontWeight: '800', fontSize: 10 }}
                              >
                                Causerie
                              </ProDayText>
                            </View>
                          ) : null}

                          {v.clips?.length ? (
                            <View style={[styles.featureBadge, { backgroundColor: 'rgba(255, 255, 255, 0.06)' }]}>
                              <Icon name="document-text" size={11} color="#FFFFFF" />
                              <ProDayText
                                variant="caption"
                                style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 10 }}
                              >
                                {v.clips.length} clips
                              </ProDayText>
                            </View>
                          ) : null}
                        </View>
                      </View>

                      {/* QUICK ACTIONS BAR */}
                      <View style={styles.videoActionsBar}>
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() =>
                            Alert.alert(
                              'Lecture vidéo',
                              v.storage_url
                                ? 'Lien stockage disponible — ouverture via le lecteur vidéo du club.'
                                : 'Le fichier est en cours de synchronisation par le club.',
                            )
                          }
                          style={[styles.actionBtn, styles.actionBtnPrimary]}
                        >
                          <Icon name="play" size={13} color="#000000" />
                          <ProDayText variant="caption" style={styles.actionBtnPrimaryText}>
                            Regarder
                          </ProDayText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() =>
                            Alert.alert(
                              'Clips tactiques',
                              v.clips.length
                                ? `${v.clips.length} clip(s) découpé(s) disponibles pour ce match.`
                                : coachVideoAiHonestAlert('Clips'),
                            )
                          }
                          style={[styles.actionBtn, styles.actionBtnOutline]}
                        >
                          <Icon name="document-text" size={13} color="#FFFFFF" />
                          <ProDayText variant="caption" style={styles.actionBtnOutlineText}>
                            Clips
                          </ProDayText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => {
                            setSelectedId(v.id);
                            setPane('ai');
                          }}
                          style={[styles.actionBtn, styles.actionBtnOutline]}
                        >
                          <Icon name="sparkles" size={13} color={tokens.accent} />
                          <ProDayText
                            variant="caption"
                            style={[styles.actionBtnOutlineText, { color: tokens.accent }]}
                          >
                            IA
                          </ProDayText>
                        </TouchableOpacity>
                      </View>
                    </PressableSpring>
                  );
                })
              )}
            </>
          ) : null}

          {/* VUE 2 : PRÉPARATION & CHECKLIST CAMÉRA */}
          {!loading && pane === 'prepare' ? (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <Icon name="list" size={16} color={tokens.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="section" style={styles.cardHeaderTitle}>
                    Checklist Avant-Match
                  </ProDayText>
                  <ProDayText variant="caption" muted style={styles.cardHeaderSub}>
                    {selected ? `Match ciblé : ${selected.title}` : 'Préparez votre captation'}
                  </ProDayText>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    isPreflightComplete ? styles.statusPillReady : styles.statusPillPending,
                  ]}
                >
                  <ProDayText
                    variant="caption"
                    style={{
                      color: isPreflightComplete ? '#10B981' : '#F59E0B',
                      fontWeight: '800',
                      fontSize: 10,
                    }}
                  >
                    {isPreflightComplete ? 'Prêt' : 'À valider'}
                  </ProDayText>
                </View>
              </View>

              <View style={styles.checklistWrap}>
                {VIDEO_CAMERA_PREFLIGHT.map((c) => {
                  const isChecked = Boolean(checkedPreflight[c.id]);
                  return (
                    <TouchableOpacity
                      key={c.id}
                      activeOpacity={0.8}
                      onPress={() => togglePreflight(c.id)}
                      style={[styles.checklistItem, isChecked && styles.checklistItemChecked]}
                    >
                      <View
                        style={[
                          styles.checkboxCircle,
                          isChecked && { backgroundColor: tokens.accent, borderColor: tokens.accent },
                        ]}
                      >
                        {isChecked ? (
                          <Icon name="checkmark-circle" size={12} color="#000000" />
                        ) : null}
                      </View>
                      <ProDayText
                        variant="caption"
                        style={[styles.checklistText, isChecked && styles.checklistTextChecked]}
                      >
                        {c.label}
                      </ProDayText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  setCheckedPreflight(
                    VIDEO_CAMERA_PREFLIGHT.reduce<Record<string, boolean>>((acc, item) => {
                      acc[item.id] = true;
                      return acc;
                    }, {}),
                  );
                  Alert.alert(
                    'Préparation validée',
                    'Checklist validée. Vous pouvez basculer sur le Live Center pendant la rencontre.',
                  );
                }}
                style={[styles.mainActionBtn, { backgroundColor: tokens.accent }]}
              >
                <Icon name="checkmark-circle" size={16} color="#000000" />
                <ProDayText variant="caption" style={styles.mainActionBtnText}>
                  Tout valider & Passer au Live
                </ProDayText>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* VUE 3 : LIVE CENTER */}
          {!loading && pane === 'live' ? (
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardIconBox}>
                  <Icon name="flash" size={16} color="#F43F5E" />
                </View>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="section" style={styles.cardHeaderTitle}>
                    Live Center & Marquage
                  </ProDayText>
                  <ProDayText variant="caption" muted style={styles.cardHeaderSub}>
                    {coachVideoLiveUnavailableBody()}
                  </ProDayText>
                </View>
              </View>

              <ProDayText variant="eyebrow" muted style={{ marginTop: 4 }}>
                Boutons de marquage rapide
              </ProDayText>

              <View style={styles.liveGrid}>
                {VIDEO_LIVE_EVENTS.map((e) => (
                  <PressableSpring
                    key={e.id}
                    onPress={() => {
                      prodayHaptics.press();
                      Alert.alert(
                        e.label,
                        `Événement « ${e.label} » horodaté. Il sera synchronisé dès l'import de la vidéo.`,
                      );
                    }}
                    scaleTo={0.95}
                    haptic
                    style={styles.liveGridItem}
                  >
                    <Icon name={e.icon} color={e.iconColor ?? tokens.accent} size={18} />
                    <ProDayText variant="caption" style={styles.liveGridLabel} numberOfLines={1}>
                      {e.label}
                    </ProDayText>
                  </PressableSpring>
                ))}
              </View>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() =>
                  Alert.alert(
                    'Note de match',
                    'Ajoutez une consigne ou une remarque tactique enregistrée avec horodatage.',
                  )
                }
                style={[styles.mainActionBtn, styles.actionBtnOutline, { marginTop: 6 }]}
              >
                <Icon name="document-text" size={15} color="#FFFFFF" />
                <ProDayText variant="caption" style={styles.actionBtnOutlineText}>
                  Ajouter une note de match
                </ProDayText>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* VUE 4 : ANALYSE IA & CAUSERIES */}
          {!loading && pane === 'ai' ? (
            <>
              {/* PIPELINE DE TRAITEMENT */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardIconBox}>
                    <Icon name="refresh" size={16} color={tokens.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="section" style={styles.cardHeaderTitle}>
                      Traitement & Détection IA
                    </ProDayText>
                    <ProDayText variant="caption" muted style={styles.cardHeaderSub}>
                      Pipeline vidéo automatisé
                    </ProDayText>
                  </View>
                </View>

                <View style={styles.stagesRow}>
                  {VIDEO_PROCESSING_STAGES.map((s, i) => (
                    <View key={s.id} style={styles.stageItem}>
                      <View style={styles.stageNumberBadge}>
                        <ProDayText variant="caption" style={styles.stageNumberText}>
                          {i + 1}
                        </ProDayText>
                      </View>
                      <ProDayText variant="caption" style={styles.stageLabelText} numberOfLines={1}>
                        {s.label}
                      </ProDayText>
                    </View>
                  ))}
                </View>
              </View>

              {/* REQUÊTES TACTIQUES IA */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardIconBox}>
                    <Icon name="sparkles" size={16} color={tokens.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="section" style={styles.cardHeaderTitle}>
                      Montre-moi…
                    </ProDayText>
                    <ProDayText variant="caption" muted style={styles.cardHeaderSub}>
                      Extraction automatique de playlists par consigne
                    </ProDayText>
                  </View>
                </View>

                <View style={styles.promptsList}>
                  {VIDEO_AI_PROMPTS.slice(0, 5).map((p) => (
                    <TouchableOpacity
                      key={p}
                      activeOpacity={0.8}
                      onPress={() =>
                        Alert.alert('Analyse IA', coachVideoAiHonestAlert(`« ${p} »`))
                      }
                      style={styles.promptItem}
                    >
                      <Icon name="play" size={15} color={tokens.accent} />
                      <ProDayText variant="caption" style={styles.promptItemText}>
                        {p}
                      </ProDayText>
                      <Icon name="chevron-forward" size={13} color={ELITE_COLORS.textMuted} />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* GÉNÉRATEUR DE CAUSERIE */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardIconBox}>
                    <Icon name="mic" size={16} color="#38BDF8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="section" style={styles.cardHeaderTitle}>
                      Générateur de Causerie
                    </ProDayText>
                    <ProDayText variant="caption" muted style={styles.cardHeaderSub}>
                      Séquences prêtes pour le vestiaire
                    </ProDayText>
                  </View>
                </View>

                <View style={styles.talkGrid}>
                  {VIDEO_TALK_SECTIONS.map((s) => (
                    <View key={s.id} style={styles.talkBox}>
                      <ProDayText variant="caption" style={styles.talkBoxTitle}>
                        {s.label}
                      </ProDayText>
                      <ProDayText variant="caption" muted style={styles.talkBoxClips}>
                        {s.defaultClips} séquences
                      </ProDayText>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() =>
                    Alert.alert('Causerie Vidéo', coachVideoAiHonestAlert('Vidéo de causerie'))
                  }
                  style={[styles.mainActionBtn, { backgroundColor: tokens.accent, marginTop: 4 }]}
                >
                  <Icon name="document-text" size={15} color="#000000" />
                  <ProDayText variant="caption" style={styles.mainActionBtnText}>
                    Préparer la causerie vidéo
                  </ProDayText>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </ScrollView>
      </View>
    </CoachPane>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: {
      flex: 1,
      minHeight: 0,
    },
    railScroll: {
      flexGrow: 0,
      maxHeight: 44,
      marginBottom: spacing.xs,
    },
    rail: {
      paddingHorizontal: spacing.md,
      gap: 6,
      paddingVertical: 2,
    },
    railPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: ELITE_COLORS.bgSurface,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
    },
    railPillOn: {
      backgroundColor: tokens.accent,
      borderColor: tokens.accent,
    },
    railText: {
      color: ELITE_COLORS.textMuted,
      fontWeight: '700',
      fontSize: 11,
    },
    railTextOn: {
      color: '#000000',
      fontWeight: '800',
    },
    scroll: {
      flex: 1,
    },
    pad: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.sm,
    },
    heroCard: {
      backgroundColor: ELITE_COLORS.bgSurface,
      borderRadius: 16,
      padding: 12,
      borderWidth: 1,
      borderColor: ELITE_COLORS.borderAccent,
      gap: 10,
    },
    heroHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    heroTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: tokens.accent,
    },
    heroTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    cameraBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(245, 158, 11, 0.12)',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    cameraBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.accent,
    },
    statsRibbon: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: ELITE_COLORS.bgSurfaceElevated,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    statNum: {
      fontSize: 18,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    statLabel: {
      fontSize: 10,
      fontWeight: '700',
    },
    statDivider: {
      width: 1,
      height: 24,
      backgroundColor: ELITE_COLORS.border,
    },
    videoCard: {
      backgroundColor: ELITE_COLORS.bgSurface,
      borderRadius: 14,
      padding: 12,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
      gap: 8,
    },
    videoCardSelected: {
      borderColor: 'rgba(245, 158, 11, 0.4)',
      backgroundColor: ELITE_COLORS.bgSurfaceElevated,
    },
    videoPreviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },
    vendorPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    vendorText: {
      fontSize: 10,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    datePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      flex: 1,
    },
    dateText: {
      fontSize: 10,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
    },
    statusPillReady: {
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
    },
    statusPillPending: {
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
    },
    miniStatusDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
    },
    videoBody: {
      gap: 4,
    },
    videoTitle: {
      fontSize: 14,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    metaLocationRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    metaLocationItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    featureBadgesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 5,
      marginTop: 2,
    },
    featureBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
    },
    videoActionsBar: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 4,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderRadius: 8,
      gap: 4,
    },
    actionBtnPrimary: {
      backgroundColor: tokens.accent,
      flex: 1.2,
    },
    actionBtnPrimaryText: {
      color: '#000000',
      fontWeight: '800',
      fontSize: 11,
    },
    actionBtnOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
      flex: 1,
    },
    actionBtnOutlineText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 11,
    },
    card: {
      backgroundColor: ELITE_COLORS.bgSurface,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
      gap: 10,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    cardIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: 'rgba(245, 158, 11, 0.12)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardHeaderTitle: {
      fontSize: 13,
      fontWeight: '900',
      color: '#FFFFFF',
    },
    cardHeaderSub: {
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.55)',
      marginTop: 1,
    },
    checklistWrap: {
      gap: 6,
    },
    checklistItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: ELITE_COLORS.bgSurfaceElevated,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
    },
    checklistItemChecked: {
      borderColor: 'rgba(245, 158, 11, 0.35)',
      backgroundColor: 'rgba(245, 158, 11, 0.06)',
    },
    checkboxCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1.5,
      borderColor: ELITE_COLORS.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checklistText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.8)',
      flex: 1,
    },
    checklistTextChecked: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    mainActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      borderRadius: 10,
      gap: 6,
    },
    mainActionBtnText: {
      color: '#000000',
      fontWeight: '800',
      fontSize: 12,
    },
    liveGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    liveGridItem: {
      width: '23%',
      flexGrow: 1,
      minWidth: 70,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: ELITE_COLORS.bgSurfaceElevated,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
      gap: 4,
    },
    liveGridLabel: {
      fontSize: 9,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
    },
    stagesRow: {
      flexDirection: 'row',
      gap: 4,
    },
    stageItem: {
      flex: 1,
      alignItems: 'center',
      gap: 4,
    },
    stageNumberBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stageNumberText: {
      color: '#000000',
      fontWeight: '900',
      fontSize: 11,
    },
    stageLabelText: {
      fontSize: 9,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.7)',
      textAlign: 'center',
    },
    promptsList: {
      gap: 6,
    },
    promptItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: ELITE_COLORS.bgSurfaceElevated,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
    },
    promptItemText: {
      flex: 1,
      fontSize: 11,
      color: 'rgba(255, 255, 255, 0.85)',
      lineHeight: 15,
    },
    talkGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    talkBox: {
      width: '48%',
      flexGrow: 1,
      backgroundColor: ELITE_COLORS.bgSurfaceElevated,
      padding: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: ELITE_COLORS.border,
      gap: 2,
    },
    talkBoxTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    talkBoxClips: {
      fontSize: 10,
    },
  });
}

