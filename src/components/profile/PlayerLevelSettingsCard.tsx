import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import type { User } from '../../models/User';
import type { PlayerLevelId } from '../../models/PlayerLevel';
import { PLAYER_LEVEL_BADGES } from '../../models/PlayerLevel';
import { resolvePlayerLevel } from '../../utils/playerLevelBadge';
import { profileService } from '../../services/profile.service';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

const LEVELS: PlayerLevelId[] = ['amateur', 'academy', 'professional'];

type Props = {
  profile: User;
  onUpdated?: (level: PlayerLevelId) => void;
};

/** Sélection du badge Pôle Joueur (Amateur / Centre / Pro). */
export function PlayerLevelSettingsCard({ profile, onUpdated }: Props) {
  const { colors } = useAppTheme();
  const [level, setLevel] = useState<PlayerLevelId>(() => resolvePlayerLevel(profile));
  const [saving, setSaving] = useState(false);

  if (profile.role !== 'player') return null;

  const select = async (next: PlayerLevelId) => {
    if (next === level) return;
    const prev = level;
    setLevel(next);
    setSaving(true);
    try {
      await profileService.updateProfile(profile.uid, { player_level: next });
      onUpdated?.(next);
    } catch (e) {
      setLevel(prev);
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProDaySurface style={styles.card}>
      <ProDayText variant="section" style={{ color: colors.text }}>
        Badge joueur
      </ProDayText>
      <ProDayText variant="caption" muted style={styles.sub}>
        Même profil du district au contrat. À la signature pro, seul le badge change.
        {saving ? ' · Enregistrement…' : ''}
      </ProDayText>
      <View style={styles.row}>
        {LEVELS.map((id) => {
          const badge = PLAYER_LEVEL_BADGES[id];
          const active = level === id;
          return (
            <PressableSpring
              key={id}
              onPress={() => void select(id)}
              scaleTo={0.96}
              haptic
              style={[
                styles.pill,
                {
                  borderColor: active ? badge.colorHex : colors.border,
                  backgroundColor: active ? `${badge.colorHex}28` : colors.surfaceMuted,
                },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: badge.colorHex }]} />
              <ProDayText
                variant="caption"
                style={{ color: active ? badge.colorHex : colors.textMuted, fontWeight: '700' }}
                numberOfLines={2}
              >
                {badge.shortLabel}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>
    </ProDaySurface>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.md },
  sub: { lineHeight: 18 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    maxWidth: '48%',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
