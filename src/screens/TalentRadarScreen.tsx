import React, { useMemo } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import type { User } from '../models/User';
import { usePlayersDirectory } from '../hooks/usePlayersDirectory';
import { buildTalentRadar, talentRadarTierLabel } from '../core/recruitment/talentRadar.engine';
import { PlayerRowCard } from '../components/ui/PlayerRowCard';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ScreenBackButton } from '../components/ui/ScreenBackButton';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius } from '../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';
import { Icon } from '../components/ui/Icon';

interface TalentRadarScreenProps {
  viewer: User;
  onBack: () => void;
  onSelectPlayer: (player: User) => void;
}

export const TalentRadarScreen: React.FC<TalentRadarScreenProps> = ({
  viewer,
  onBack,
  onSelectPlayer,
}) => {
  const { colors: c } = useAppTheme();
  const directory = usePlayersDirectory({});
  const { users, loading } = directory;

  const hits = useMemo(() => {
    const pulseByUid: Record<string, number> = {};
    const pulseDeltaByUid: Record<string, number> = {};
    for (const player of users) {
      const stats = player.profile.season_stats;
      const base = Math.min(
        90,
        40 + (stats?.matches ?? 0) * 2 + (stats?.goals ?? 0) * 3 + (stats?.assists ?? 0) * 2
      );
      pulseByUid[player.uid] = base;
      pulseDeltaByUid[player.uid] = Math.min(20, (stats?.goals ?? 0) + (stats?.assists ?? 0) + 4);
    }
    return buildTalentRadar({
      players: users,
      pulseByUid,
      pulseDeltaByUid,
      viewerCity: viewer.city,
      max: 25,
      minScore: 48,
    });
  }, [users, viewer.city]);

  const playerByUid = useMemo(() => new Map(users.map((u) => [u.uid, u])), [users]);

  return (
    <TabScreenShell
      caption="Scouting"
      title="Talent Radar"
      subtitle="Profils émergents avant qu’ils soient trop visibles"
      left={<ScreenBackButton onPress={onBack} />}
      flat
    >
      {loading ? (
        <ActivityIndicator color={c.brand} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={hits}
          keyExtractor={(item) => item.playerUid}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <ProDaySurface variant="module" style={styles.intro}>
              <ProDayText variant="eyebrow" accent>
                ProDay exclusive
              </ProDayText>
              <ProDayText variant="body" muted>
                Signaux Pulse, disponibilité et confiance — pas une bibliothèque vidéo tierce.
              </ProDayText>
              <ProDayText variant="caption" muted style={{ marginTop: spacing.xs }}>
                {hits.length} profil{hits.length > 1 ? 's' : ''} sur le radar
              </ProDayText>
            </ProDaySurface>
          }
          renderItem={({ item }) => {
            const player = playerByUid.get(item.playerUid);
            if (!player) return null;
            return (
              <View style={styles.hit}>
                <View
                  style={[
                    styles.tierPill,
                    {
                      backgroundColor: c.accentSoft,
                      borderColor: c.brand,
                    },
                  ]}
                >
                  <Text style={[styles.tierText, { color: c.brand }]}>
                    {talentRadarTierLabel(item.tier)} · {item.score}%
                  </Text>
                </View>
                <ProDayText variant="caption" muted numberOfLines={1} style={styles.headline}>
                  {item.headline}
                  {item.reasons.length ? ` · ${item.reasons.join(' · ')}` : ''}
                </ProDayText>
                <PlayerRowCard
                  user={player}
                  onPress={onSelectPlayer}
                  scoutingScore={item.score}
                  scoutingLabel={item.headline}
                />
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Icon name="star-four-points" size={36} color={c.textMuted} />
              <ProDayText variant="section">Radar calme</ProDayText>
              <ProDayText variant="caption" muted>
                Pas encore assez de signaux émergents dans l’annuaire.
              </ProDayText>
            </View>
          }
        />
      )}
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
    gap: spacing.sm,
  },
  intro: { marginBottom: spacing.md, gap: 4 },
  hit: { marginBottom: spacing.sm },
  tierPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginBottom: 4,
  },
  tierText: { fontSize: 11, fontWeight: '800' },
  headline: { marginBottom: 4 },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
