import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ProDayText } from '../components/ui/ProDayText';
import { PressableSpring } from '../components/motion';
import { useAuth } from '../context/AuthContext';
import { followsService } from '../services/follows.service';
import type { Follow } from '../models/Follow';
import { clubsService } from '../services/clubs.service';
import { useTournaments } from '../hooks/useTournaments';
import { useAppTheme } from '../context/ProductLineContext';
import { radius, spacing } from '../theme/designTokens';

export const SupporterSuivisScreen: React.FC = () => {
  const { profile } = useAuth();
  const { colors } = useAppTheme();
  const { tournaments } = useTournaments();
  const [clubs, setClubs] = useState<{ id: string; name: string; city: string }[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) return;
    const list = await followsService.listByFollower(profile.uid);
    setFollows(list);
  }, [profile?.uid]);

  useEffect(() => {
    clubsService
      .list(12)
      .then((rows) => setClubs(rows.map((club) => ({ id: club.id, name: club.name, city: club.city }))))
      .catch(() => setClubs([]));
  }, []);

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

  const followedKeys = useMemo(
    () => new Set(follows.map((follow) => `${follow.target_type}:${follow.target_id}`)),
    [follows]
  );

  const toggleFollow = async (
    targetType: 'club' | 'tournament',
    targetId: string,
    targetLabel: string
  ) => {
    if (!profile?.uid) return;
    await followsService.toggle(profile.uid, targetType, targetId, targetLabel);
    await loadFollows();
  };

  const followedItems = follows.filter((follow) => follow.target_type === 'club' || follow.target_type === 'tournament');
  const followedClubCount = followedItems.filter((follow) => follow.target_type === 'club').length;
  const followedTournamentCount = followedItems.filter(
    (follow) => follow.target_type === 'tournament'
  ).length;

  const renderRow = (
    type: 'club' | 'tournament',
    id: string,
    title: string,
    subtitle?: string
  ) => {
    const key = `${type}:${id}`;
    const active = followedKeys.has(key);
    return (
      <View
        key={key}
        style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.copy}>
          <ProDayText variant="section">{title}</ProDayText>
          {subtitle ? <ProDayText variant="caption" muted>{subtitle}</ProDayText> : null}
        </View>
        <PressableSpring
          onPress={() => void toggleFollow(type, id, title)}
          style={[
            styles.action,
            {
              backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
              borderColor: active ? colors.accent : colors.border,
            },
          ]}
        >
          <ProDayText variant="caption" style={{ color: active ? colors.accent : colors.textSecondary }}>
            {active ? 'Suivi' : 'Suivre'}
          </ProDayText>
        </PressableSpring>
      </View>
    );
  };

  return (
    <TabScreenShell
      caption="TRIBUNE"
      title="Mes suivis"
      subtitle="Clubs et tournois favoris"
      flat
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ProDayText variant="eyebrow" muted>
          MES SUIVIS
        </ProDayText>
        <View style={[styles.summary, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <ProDayText variant="caption" muted>
            {followedClubCount} club(s) · {followedTournamentCount} tournoi(s)
          </ProDayText>
        </View>
        {followedItems.length > 0 ? (
          followedItems.map((follow) =>
            renderRow(
              follow.target_type as 'club' | 'tournament',
              follow.target_id,
              follow.target_label ?? follow.target_id,
              follow.target_type === 'club' ? 'Club' : 'Tournoi'
            )
          )
        ) : (
          <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <ProDayText variant="body">Aucun suivi pour le moment.</ProDayText>
          </View>
        )}

        <ProDayText variant="eyebrow" muted style={styles.sectionTitle}>
          CLUBS SUGGÉRÉS
        </ProDayText>
        {clubs.slice(0, 8).map((club) => renderRow('club', club.id, club.name, club.city))}

        <ProDayText variant="eyebrow" muted style={styles.sectionTitle}>
          TOURNOIS SUGGÉRÉS
        </ProDayText>
        {tournaments.slice(0, 8).map((tournament) =>
          renderRow('tournament', tournament.id, tournament.title, tournament.city)
        )}
      </ScrollView>
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  sectionTitle: {
    marginTop: spacing.lg,
  },
  empty: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  summary: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  row: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  action: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});

