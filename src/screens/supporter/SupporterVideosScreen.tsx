import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SupporterPageFrame } from '../../components/supporter/SupporterPageFrame';
import { FootballHubBackBar } from '../../components/footballHub/FootballHubBackBar';
import { getSupporterPageIdentity, SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { supporterVideoService } from '../../services/supporterVideo.service';
import type { SupporterVideo, SupporterVideoKind } from '../../models/SupporterVideo';
import { spacing, radius } from '../../theme/designTokens';

const SECTIONS: { kind: SupporterVideoKind | 'all'; label: string }[] = [
  { kind: 'proday_full', label: 'Matchs complets' },
  { kind: 'proday_highlights', label: 'Moments forts' },
  { kind: 'community_clip', label: 'Communauté' },
  { kind: 'external_legal', label: 'Externe (légal)' },
];

/** Vidéos — feed filtré par droits AVAILABLE uniquement. */
export const SupporterVideosScreen: React.FC = () => {
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const [videos, setVideos] = useState<SupporterVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await supporterVideoService.listAvailable({ prodayEvents: events, max: 32 });
      setVideos(Array.isArray(list) ? list : []);
    } catch {
      setVideos([]);
    } finally {
      setLoading(false);
    }
  }, [events]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <SupporterPageFrame identity={getSupporterPageIdentity('moments')}>
      <FootballHubBackBar />
      {loading ? (
        <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginTop: spacing.xl }} />
      ) : videos.length === 0 ? (
        <View style={styles.empty}>
          <Icon name="videocam" size={32} color={SUPPORTER_SITE.muted} />
          <ProDayText variant="body" style={styles.emptyText}>
            Aucune vidéo disponible pour le moment. Les replays ProDay apparaissent ici lorsqu’un lien officiel est publié.
          </ProDayText>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {SECTIONS.map(({ kind, label }) => {
            const sectionVideos =
              kind === 'all' ? videos : supporterVideoService.listByKind(videos, kind);
            if (sectionVideos.length === 0) return null;
            return (
              <View key={kind} style={styles.section}>
                <ProDayText variant="section" style={styles.sectionTitle}>
                  {label}
                </ProDayText>
                {sectionVideos.map((v) => (
                  <PressableSpring
                    key={v.id}
                    style={styles.card}
                    onPress={() => {
                      if (v.watchUrl) {
                        void Linking.openURL(v.watchUrl);
                        return;
                      }
                      Alert.alert(
                        v.title,
                        'Replay pas encore en ligne. Dès qu’un lien officiel est publié, il s’ouvrira ici.',
                      );
                    }}
                    scaleTo={0.98}
                  >
                    <Icon name="play" size={20} color={SUPPORTER_SITE.accent} />
                    <View style={styles.cardCopy}>
                      <ProDayText variant="section" style={styles.cardTitle}>
                        {v.title}
                      </ProDayText>
                      {v.competitionLabel ? (
                        <ProDayText variant="caption" style={styles.cardSub}>
                          {v.competitionLabel}
                        </ProDayText>
                      ) : null}
                    </View>
                  </PressableSpring>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </SupporterPageFrame>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  emptyText: { color: SUPPORTER_SITE.muted, textAlign: 'center', lineHeight: 22 },
  section: { gap: spacing.sm },
  sectionTitle: { color: SUPPORTER_SITE.foreground, marginBottom: spacing.xs },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: SUPPORTER_SITE.elevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    marginBottom: spacing.sm,
  },
  cardCopy: { flex: 1, gap: 2 },
  cardTitle: { color: SUPPORTER_SITE.foreground, fontSize: 14 },
  cardSub: { color: SUPPORTER_SITE.muted, fontSize: 11 },
});
