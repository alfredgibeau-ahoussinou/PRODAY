import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useAuth } from '../../context/AuthContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import {
  supporterProfileService,
  type SupporterFollowedClub,
} from '../../services/supporterProfile.service';
import { VideoWorkspace } from '../../features/video/VideoWorkspace';
import { FALLBACK_VIDEO_SURFACE_TOKENS } from '../../features/video/videoSurfaceTokens';
import { Icon } from '../../components/ui/Icon';
import { AnimatedEntrance, PressableSpring } from '../../components/motion';
import { colors, radius, spacing } from '../../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';

export const SupporterVideosScreen: React.FC = () => {
  const { colors: themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const { firebaseUser } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const currentUid = profile?.uid || firebaseUser?.uid || '';

  const [followedClubs, setFollowedClubs] = useState<SupporterFollowedClub[]>([]);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClubs = useCallback(async () => {
    if (!currentUid) {
      setFollowedClubs([]);
      setSelectedClubId(null);
      setLoading(false);
      return;
    }

    try {
      const clubs = await supporterProfileService.getFollowedClubs(currentUid);
      setFollowedClubs(clubs);
      if (clubs.length > 0 && !selectedClubId) {
        setSelectedClubId(clubs[0].clubId);
      }
    } catch {
      setFollowedClubs([]);
    } finally {
      setLoading(false);
    }
  }, [currentUid, selectedClubId]);

  useEffect(() => {
    void loadClubs();
  }, [loadClubs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClubs();
    setRefreshing(false);
  };

  const activeClub = followedClubs.find((c) => c.clubId === selectedClubId) || followedClubs[0];

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.brand}
          />
        }
      >
        {/* En-tête */}
        <AnimatedEntrance kind="fadeUp" index={0}>
          <View style={styles.header}>
            <Text style={styles.title}>Vidéos & Analyses</Text>
            <Text style={styles.subtitle}>
              Clips, highlights et replays partagés par vos clubs
            </Text>
          </View>
        </AnimatedEntrance>

        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : followedClubs.length === 0 ? (
          <AnimatedEntrance kind="fadeUp" index={1}>
            <View style={styles.emptyCard}>
              <Icon name="videocam" size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Aucune vidéo accessible</Text>
              <Text style={styles.emptySubtitle}>
                Suivez des clubs dans l’onglet Mes clubs pour visionner les temps forts et les résumés de matchs.
              </Text>
              <PressableSpring
                onPress={() => setActiveTab('plus')}
                scaleTo={0.95}
                haptic
                style={styles.ctaBtn}
              >
                <Icon name="search" size={14} color="#000" />
                <Text style={styles.ctaBtnText}>Découvrir des clubs</Text>
              </PressableSpring>
            </View>
          </AnimatedEntrance>
        ) : (
          <>
            {/* Sélecteur de club si plusieurs */}
            {followedClubs.length > 1 && (
              <AnimatedEntrance kind="fadeUp" index={1}>
                <View style={styles.clubSelectorRow}>
                  {followedClubs.map((club) => {
                    const active = club.clubId === activeClub?.clubId;
                    return (
                      <PressableSpring
                        key={club.clubId}
                        onPress={() => setSelectedClubId(club.clubId)}
                        scaleTo={0.96}
                        haptic
                        style={[
                          styles.clubChip,
                          active && styles.clubChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.clubChipText,
                            active && styles.clubChipTextActive,
                          ]}
                        >
                          {club.clubName}
                        </Text>
                      </PressableSpring>
                    );
                  })}
                </View>
              </AnimatedEntrance>
            )}

            {/* Espace Vidéo Partagé */}
            <AnimatedEntrance kind="fadeUp" index={2}>
              <VideoWorkspace
                tokens={FALLBACK_VIDEO_SURFACE_TOKENS}
                userRole="supporter"
                clubId={activeClub?.clubId}
                clubLabel={activeClub?.clubName}
              />
            </AnimatedEntrance>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: { gap: 4 },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  loaderBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    minHeight: 44,
  },
  ctaBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  clubSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  clubChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 34,
    justifyContent: 'center',
  },
  clubChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  clubChipText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  clubChipTextActive: {
    color: '#000',
    fontWeight: '800',
  },
});
