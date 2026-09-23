import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ProductLineContext';
import { ProDaySymbol } from '../../components/branding/ProDaySymbol';
import { SupporterEncouragementFeed } from '../../features/supporter';
import { colors, radius, spacing } from '../../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { Icon } from '../../components/ui/Icon';
import { AnimatedEntrance } from '../../components/motion';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useAuth } from '../../context/AuthContext';
import { supporterProfileService } from '../../services/supporterProfile.service';
import { encouragementsService } from '../../services/encouragements.service';
import { teamEventsService } from '../../services/teamEvents.service';
import { clubsService } from '../../services/clubs.service';
import { isCoachMatchEvent } from '../../models/TeamEvent';

export const SupporterHomeScreen: React.FC = () => {
  const { colors: themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const { firebaseUser } = useAuth();
  const currentUid = profile?.uid || firebaseUser?.uid || '';

  const [refreshing, setRefreshing] = useState(false);
  const [encouragementsCount, setEncouragementsCount] = useState<number>(0);
  const [upcomingMatchesCount, setUpcomingMatchesCount] = useState<number>(0);
  const [divisionText, setDivisionText] = useState<string>('—');
  const [subDivisionText, setSubDivisionText] = useState<string>('Club favori');

  const loadData = useCallback(async () => {
    try {
      // 1. Nombre d'encouragements
      const allEncouragements = await encouragementsService.list();
      setEncouragementsCount(allEncouragements.length);

      if (!currentUid) {
        setUpcomingMatchesCount(0);
        setDivisionText('—');
        setSubDivisionText('Aucun club');
        return;
      }

      // 2. Clubs suivis
      const followed = await supporterProfileService.getFollowedClubs(currentUid);
      if (followed.length === 0) {
        setUpcomingMatchesCount(0);
        setDivisionText('—');
        setSubDivisionText('Aucun club');
        return;
      }

      // 3. Matchs à venir des clubs suivis
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let totalUpcoming = 0;
      await Promise.all(
        followed.map(async (c) => {
          try {
            const evts = await teamEventsService.listForClub(c.clubId, 30);
            const matches = evts.filter(
              (e) => isCoachMatchEvent(e) && new Date(e.starts_at) >= startOfToday,
            );
            totalUpcoming += matches.length;
          } catch {
            // Ignorer
          }
        }),
      );
      setUpcomingMatchesCount(totalUpcoming);

      // 4. Division / Poule du premier club suivi
      const firstClubId = followed[0].clubId;
      const clubDetails = await clubsService.getById(firstClubId);
      if (clubDetails) {
        const div = clubDetails.fff_division_label || 'FFF';
        const group = clubDetails.fff_group_label || clubDetails.name;
        setDivisionText(div);
        setSubDivisionText(group);
      } else {
        setDivisionText('Club');
        setSubDivisionText(followed[0].clubName);
      }
    } catch {
      // Ignorer
    }
  }, [currentUid]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

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
        <AnimatedEntrance kind="fadeUp" index={0}>
          <View style={styles.hero}>
            <ProDaySymbol size={44} tone="white" />
            <Text style={styles.eyebrow}>Pôle Supporter</Text>
            <Text style={styles.title}>12e Homme</Text>
            <Text style={styles.subtitle}>
              Vibrez avec vos clubs favoris, suivez les scores en direct et encouragez les joueurs.
            </Text>
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance kind="fadeUp" index={1}>
          <View style={styles.quickStatsRow}>
            <View style={styles.statCard}>
              <Icon name="heart" size={18} color={colors.brand} />
              <Text style={styles.statNumber}>{encouragementsCount}</Text>
              <Text style={styles.statLabel}>Encouragements</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="football" size={18} color={colors.tone4} />
              <Text style={styles.statNumber}>{upcomingMatchesCount}</Text>
              <Text style={styles.statLabel}>Matchs à venir</Text>
            </View>
            <View style={styles.statCard}>
              <Icon name="trophy" size={18} color={colors.bookmark} />
              <Text style={styles.statNumber} numberOfLines={1}>
                {divisionText}
              </Text>
              <Text style={styles.statLabel} numberOfLines={1}>
                {subDivisionText}
              </Text>
            </View>
          </View>
        </AnimatedEntrance>

        <SupporterEncouragementFeed />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  hero: {
    alignItems: 'center',
    gap: 4,
    marginBottom: spacing.xs,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.brand,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
    marginTop: 2,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
