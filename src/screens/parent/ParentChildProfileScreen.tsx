import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { spacing, radius } from '../../theme/designTokens';
import { useParentShell } from '../../navigation/parentShellContext';

/** Profil enfant en lecture seule — stats sportives non modifiables. */
export const ParentChildProfileScreen: React.FC = () => {
  const { colors: c } = useThemedScreen();
  const { selected } = useParentShell();

  if (!selected) {
    return (
      <View style={styles.center}>
        <ProDayText variant="body" muted>
          Sélectionnez un enfant depuis l’accueil.
        </ProDayText>
      </View>
    );
  }

  const p = selected.profile.profile;
  const stats = p.season_stats;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <ProDaySurface variant="module" style={styles.card}>
        <ProDayText variant="section">{selected.display_name}</ProDayText>
        <ProDayText variant="caption" muted>
          Profil joueur mineur — lecture seule
        </ProDayText>
        <ProDayText variant="body">
          {p.position ?? 'Poste —'} · {p.category ?? 'Catégorie —'} · {p.level ?? 'Niveau —'}
        </ProDayText>
        {p.age != null ? (
          <ProDayText variant="caption" muted>
            Âge : {p.age} ans
          </ProDayText>
        ) : null}
        {p.bio ? (
          <ProDayText variant="body" muted style={styles.bio}>
            {p.bio}
          </ProDayText>
        ) : null}
      </ProDaySurface>

      <ProDaySurface variant="module" style={styles.card}>
        <ProDayText variant="section">Statistiques sportives</ProDayText>
        <ProDayText variant="caption" muted style={styles.note}>
          Vous ne pouvez pas modifier ces statistiques (réservé au staff / matchs).
        </ProDayText>
        <View style={[styles.statsRow, { borderColor: c.border }]}>
          <Stat label="Matchs" value={stats?.matches ?? 0} />
          <Stat label="Buts" value={stats?.goals ?? 0} />
          <Stat label="Passes" value={stats?.assists ?? 0} />
        </View>
      </ProDaySurface>

      <ProDaySurface variant="module" style={styles.card}>
        <ProDayText variant="section">Supervision</ProDayText>
        <ProDayText variant="caption" muted>
          Temps d’écran : {selected.settings.screen_time_enabled ? 'activé' : 'désactivé'} ·{' '}
          {selected.minutesUsedToday} / {selected.settings.daily_limit_minutes} min
        </ProDayText>
        <ProDayText variant="caption" muted>
          Filtre contacts :{' '}
          {selected.settings.contacts_filter_enabled !== false ? 'actif' : 'inactif'}
        </ProDayText>
        <ProDayText variant="caption" muted>
          Messagerie restreinte :{' '}
          {selected.settings.messaging_restricted !== false ? 'oui' : 'non'}
        </ProDayText>
      </ProDaySurface>
    </ScrollView>
  );
};

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <ProDayText variant="section">{value}</ProDayText>
      <ProDayText variant="caption" muted>
        {label}
      </ProDayText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  card: { padding: spacing.lg, gap: spacing.sm, borderRadius: radius.lg },
  bio: { lineHeight: 22 },
  note: { lineHeight: 18 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
  },
  stat: { alignItems: 'center', gap: 4 },
});
