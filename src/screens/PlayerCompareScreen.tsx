import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Text,
} from 'react-native';
import type { User } from '../models/User';
import { computeOpportunityScore } from '../core/recruitment/opportunityScore.engine';
import { getProfileCompletion } from '../utils/profileCompletion';
import { availabilityLabel } from '../utils/playerProfileLabels';
import { resolvePlayerLevel } from '../utils/playerLevelBadge';
import { PLAYER_LEVEL_BADGES } from '../models/PlayerLevel';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ScreenBackButton } from '../components/ui/ScreenBackButton';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius } from '../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';

interface PlayerCompareScreenProps {
  viewer: User;
  candidates: User[];
  onBack: () => void;
  onSelectPlayer: (player: User) => void;
}

function metricRows(player: User, viewer: User) {
  const opp = computeOpportunityScore({ player, viewer });
  const stats = player.profile.season_stats;
  const level = PLAYER_LEVEL_BADGES[resolvePlayerLevel(player)].label;
  return [
    { label: 'Opportunity', value: `${opp.score}%` },
    { label: 'Bande', value: opp.label },
    { label: 'Poste', value: player.profile.position ?? '—' },
    { label: 'Niveau', value: player.profile.level ?? '—' },
    { label: 'Badge', value: level },
    { label: 'Ville', value: player.city ?? '—' },
    { label: 'Dispo', value: availabilityLabel(player.profile.availability) ?? '—' },
    { label: 'Profil', value: `${getProfileCompletion(player).percent}%` },
    {
      label: 'Saison',
      value: stats
        ? `${stats.matches} M · ${stats.goals} B · ${stats.assists} P`
        : '—',
    },
    {
      label: 'Highlights',
      value: String(player.profile.highlight_video_urls?.filter(Boolean).length ?? 0),
    },
  ];
}

export const PlayerCompareScreen: React.FC<PlayerCompareScreenProps> = ({
  viewer,
  candidates,
  onBack,
  onSelectPlayer,
}) => {
  const { colors: c } = useAppTheme();
  const players = candidates.filter((u) => u.role === 'player').slice(0, 8);
  const [leftUid, setLeftUid] = useState(players[0]?.uid ?? '');
  const [rightUid, setRightUid] = useState(players[1]?.uid ?? players[0]?.uid ?? '');

  const left = players.find((p) => p.uid === leftUid) ?? players[0];
  const right = players.find((p) => p.uid === rightUid) ?? players[1] ?? players[0];

  const leftRows = useMemo(
    () => (left ? metricRows(left, viewer) : []),
    [left, viewer]
  );
  const rightRows = useMemo(
    () => (right ? metricRows(right, viewer) : []),
    [right, viewer]
  );

  return (
    <TabScreenShell
      caption="Scouting"
      title="Comparer"
      subtitle="Opportunity Score & stats côte à côte"
      left={<ScreenBackButton onPress={onBack} />}
      flat
    >
      <ScrollView contentContainerStyle={styles.content}>
        {players.length < 2 ? (
          <ProDaySurface variant="module" style={styles.empty}>
            <ProDayText variant="section">Ajoutez des favoris</ProDayText>
            <ProDayText variant="caption" muted>
              Ouvrez au moins deux profils favoris pour lancer une comparaison.
            </ProDayText>
          </ProDaySurface>
        ) : (
          <>
            <View style={styles.pickers}>
              <Picker
                label="Joueur A"
                players={players}
                selectedUid={left?.uid ?? ''}
                onChange={setLeftUid}
                colors={c}
              />
              <Picker
                label="Joueur B"
                players={players}
                selectedUid={right?.uid ?? ''}
                onChange={setRightUid}
                colors={c}
              />
            </View>

            <View style={styles.columns}>
              <Column
                player={left}
                rows={leftRows}
                colors={c}
                onOpen={() => left && onSelectPlayer(left)}
              />
              <Column
                player={right}
                rows={rightRows}
                colors={c}
                onOpen={() => right && onSelectPlayer(right)}
              />
            </View>
          </>
        )}
      </ScrollView>
    </TabScreenShell>
  );
};

const Picker: React.FC<{
  label: string;
  players: User[];
  selectedUid: string;
  onChange: (uid: string) => void;
  colors: { brand: string; border: string; surface: string; text: string; textSecondary: string };
}> = ({ label, players, selectedUid, onChange, colors }) => (
  <View style={styles.pickerBlock}>
    <Text style={[styles.pickerLabel, { color: colors.textSecondary }]}>{label}</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
      {players.map((p) => {
        const active = p.uid === selectedUid;
        return (
          <TouchableOpacity
            key={p.uid}
            onPress={() => onChange(p.uid)}
            style={[
              styles.pickerChip,
              {
                borderColor: active ? colors.brand : colors.border,
                backgroundColor: active ? colors.brand : colors.surface,
              },
            ]}
          >
            <Text
              style={{
                color: active ? '#fff' : colors.text,
                fontWeight: '700',
                fontSize: 12,
              }}
              numberOfLines={1}
            >
              {p.display_name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  </View>
);

const Column: React.FC<{
  player?: User;
  rows: { label: string; value: string }[];
  colors: { surface: string; border: string; text: string; textSecondary: string; brand: string };
  onOpen: () => void;
}> = ({ player, rows, colors, onOpen }) => (
  <ProDaySurface variant="module" style={[styles.col, { borderColor: colors.border }]}>
    <TouchableOpacity onPress={onOpen}>
      <ProDayText variant="section" numberOfLines={1}>
        {player?.display_name ?? '—'}
      </ProDayText>
    </TouchableOpacity>
    {rows.map((row) => (
      <View key={row.label} style={styles.metric}>
        <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{row.label}</Text>
        <Text style={[styles.metricValue, { color: colors.text }]}>{row.value}</Text>
      </View>
    ))}
  </ProDaySurface>
);

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.lg,
    gap: spacing.md,
  },
  empty: { gap: spacing.sm },
  pickers: { gap: spacing.sm },
  pickerBlock: { gap: 6 },
  pickerLabel: { fontSize: 12, fontWeight: '700' },
  pickerRow: { gap: 8 },
  pickerChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    maxWidth: 140,
  },
  columns: { flexDirection: 'row', gap: spacing.sm },
  col: { flex: 1, gap: spacing.sm },
  metric: { gap: 2 },
  metricLabel: { fontSize: 11, fontWeight: '600' },
  metricValue: { fontSize: 13, fontWeight: '800' },
});
