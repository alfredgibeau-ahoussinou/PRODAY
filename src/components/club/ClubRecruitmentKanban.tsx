import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useAppTheme } from '../../context/ProductLineContext';
import { recruitmentService } from '../../services/recruitment.service';
import type { Application } from '../../models/Player';
import {
  AMATEUR_RECRUITMENT_COLUMNS,
  CLUB_APPLICATION_STAGE_LABELS,
  type ClubApplicationStage,
} from '../../models/ClubApplicationPipeline';
import {
  canTransitionClubApplication,
  legacyStatusToPipelineStage,
  pipelineStageToLegacyStatus,
} from '../../utils/clubApplicationPipeline';
import { radius, spacing } from '../../theme/designTokens';

function stageOf(app: Application): ClubApplicationStage {
  return app.pipeline_stage ?? legacyStatusToPipelineStage(app.status);
}

/** Suivi club Observé → Contacté → Essai → Intégré. */
export const ClubRecruitmentKanban: React.FC = () => {
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile?.uid) return;
    setLoading(true);
    try {
      const posts = await recruitmentService.listOpenPosts(40);
      const mine = posts.filter(
        (p) => p.author_uid === profile.uid || p.club_id === profile.profile.club_id,
      );
      const batches = await Promise.all(
        mine.slice(0, 12).map((p) => recruitmentService.listApplicationsForPost(p.id, 40)),
      );
      setApps(batches.flat());
    } catch {
      setApps([]);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns = useMemo(() => {
    return AMATEUR_RECRUITMENT_COLUMNS.map((col) => ({
      ...col,
      items: apps.filter((a) => {
        const s = stageOf(a);
        return col.stages.includes(s) && s !== 'rejected' && s !== 'withdrawn';
      }),
    }));
  }, [apps]);

  const moveTo = async (app: Application, to: ClubApplicationStage) => {
    const from = stageOf(app);
    if (!canTransitionClubApplication(from, to)) {
      Alert.alert('Transition impossible', `${CLUB_APPLICATION_STAGE_LABELS[from]} → ${CLUB_APPLICATION_STAGE_LABELS[to]}`);
      return;
    }
    setBusyId(app.id);
    try {
      await recruitmentService.updateApplicationDetails(app.id, {
        pipelineStage: to,
        status: pipelineStageToLegacyStatus(to),
      });
      setApps((prev) =>
        prev.map((a) =>
          a.id === app.id ? { ...a, pipeline_stage: to, status: pipelineStageToLegacyStatus(to) } : a,
        ),
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.pad} showsVerticalScrollIndicator={false}>
      <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border, marginBottom: spacing.md }]}>
        <ProDayText variant="section">Pipeline externe</ProDayText>
        <ProDayText variant="caption" muted>
          Observé → Contacté → Essai → Intégré. Les montées internes passent par Accueil → Vivier.
        </ProDayText>
      </ProDaySurface>

      {loading ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
        ) : apps.length === 0 ? (
          <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
            <ProDayText variant="body" muted>
              Aucune candidature pour le moment. Publiez une annonce pour démarrer le suivi.
            </ProDayText>
          </ProDaySurface>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.board}>
            {columns.map((col) => (
              <View key={col.key} style={styles.column}>
                <ProDayText variant="caption" accent style={styles.colTitle}>
                  {col.label} · {col.items.length}
                </ProDayText>
                {col.items.map((app) => {
                  const advance = col.advanceTo;
                  return (
                    <ProDaySurface
                      key={app.id}
                      variant="module"
                      style={[styles.card, { borderColor: colors.border }]}
                    >
                      <ProDayText variant="caption" style={styles.name} numberOfLines={2}>
                        {app.player_name ?? 'Joueur'}
                      </ProDayText>
                      <ProDayText variant="caption" muted numberOfLines={2}>
                        {app.cover_letter?.trim() || 'Sans message'}
                      </ProDayText>
                      {advance ? (
                        <PressableSpring
                          onPress={() => void moveTo(app, advance)}
                          disabled={busyId === app.id}
                          scaleTo={0.96}
                          haptic
                        >
                          <ProDayText variant="caption" accent style={styles.link}>
                            → {CLUB_APPLICATION_STAGE_LABELS[advance]}
                          </ProDayText>
                        </PressableSpring>
                      ) : null}
                      {stageOf(app) !== 'hired' && stageOf(app) !== 'rejected' ? (
                        <PressableSpring
                          onPress={() => void moveTo(app, 'rejected')}
                          disabled={busyId === app.id}
                          scaleTo={0.96}
                          haptic
                        >
                          <ProDayText variant="caption" muted>
                            Refuser
                          </ProDayText>
                        </PressableSpring>
                      ) : null}
                    </ProDaySurface>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  pad: { padding: spacing.md, paddingBottom: spacing.xxl, gap: spacing.xs },
  sub: { marginBottom: spacing.sm },
  linkRow: { marginBottom: spacing.md },
  link: { fontWeight: '800' },
  empty: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  board: { gap: spacing.sm, paddingBottom: spacing.lg },
  column: { width: 168, gap: spacing.sm },
  colTitle: { fontWeight: '800', marginBottom: 2 },
  card: { borderWidth: 1, borderRadius: radius.md, padding: spacing.sm, gap: 4 },
  name: { fontWeight: '700' },
});
