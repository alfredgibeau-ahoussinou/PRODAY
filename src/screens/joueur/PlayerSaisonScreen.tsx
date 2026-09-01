import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { PlayerPerformanceScreen } from './PlayerPerformanceScreen';
import { PlayerProgressionScreen } from './PlayerProgressionScreen';
import { JoueurScreenChrome } from '../../components/joueur/JoueurScreenChrome';
import { ProDayText } from '../../components/ui/ProDayText';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';

type SaisonSegment = 'performance' | 'progression';

/** Saison — Performance + Progression fusionnés (4e onglet dock). */
export function PlayerSaisonScreen() {
  const theme = useJoueurTheme();
  const playerTheme = usePlayerThemeColors();
  const [segment, setSegment] = useState<SaisonSegment>('performance');
  const styles = useMemo(
    () =>
      StyleSheet.create({
        segmentRow: {
          flexDirection: 'row',
          gap: spacing.sm,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xs,
        },
        segment: {
          flex: 1,
          borderRadius: 999,
          paddingVertical: 10,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: PLAYER_DARK.border,
          backgroundColor: PLAYER_DARK.surface,
        },
        segmentActive: {
          borderColor: theme.accent,
          backgroundColor: playerTheme.accentSoft,
        },
        segmentLabel: {
          color: PLAYER_DARK.textMuted,
          fontWeight: '700',
          fontSize: 12,
        },
        segmentLabelActive: {
          color: theme.accent,
        },
        body: { flex: 1 },
      }),
    [theme.accent, playerTheme.accentSoft],
  );

  return (
    <JoueurScreenChrome variant="page" kicker="Saison" title="Stats & progression" hideHero={false}>
      <View style={styles.segmentRow}>
        {(
          [
            { id: 'performance' as const, label: 'Performance' },
            { id: 'progression' as const, label: 'Progression' },
          ] as const
        ).map((s) => {
          const active = segment === s.id;
          return (
            <Pressable
              key={s.id}
              onPress={() => setSegment(s.id)}
              style={[styles.segment, active && styles.segmentActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <ProDayText
                variant="caption"
                style={[styles.segmentLabel, active && styles.segmentLabelActive]}
              >
                {s.label}
              </ProDayText>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.body}>
        {segment === 'performance' ? (
          <PlayerPerformanceScreen />
        ) : (
          <PlayerProgressionScreen embedded />
        )}
      </View>
    </JoueurScreenChrome>
  );
}
