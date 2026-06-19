import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, ActivityIndicator, Alert } from 'react-native';
import type { User } from '../../models/User';
import { scoutingShortlistService } from '../../services/scoutingShortlist.service';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface PlayerScoutingShortlistPanelProps {
  staff: User;
  player: User;
  scoutingScore?: number;
}

export const PlayerScoutingShortlistPanel: React.FC<PlayerScoutingShortlistPanelProps> = ({
  staff,
  player,
  scoutingScore,
}) => {
  const clubId = staff.profile.club_id;
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [notes, setNotes] = useState('');
  const [onList, setOnList] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!clubId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const entry = await scoutingShortlistService.getEntry(clubId, player.uid);
    setOnList(Boolean(entry));
    setNotes(entry?.notes ?? '');
    setLoading(false);
  }, [clubId, player.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!clubId) return;
    setSaving(true);
    try {
      await scoutingShortlistService.upsert(clubId, player.uid, staff.uid, {
        notes: notes.trim(),
        scouting_score: scoutingScore,
      });
      setOnList(true);
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!clubId) return;
    setSaving(true);
    try {
      await scoutingShortlistService.remove(clubId, player.uid);
      setOnList(false);
      setNotes('');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Suppression impossible.');
    } finally {
      setSaving(false);
    }
  };

  if (!clubId) return null;

  if (loading) {
    return <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.md }} />;
  }

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <ProDayText variant="section">Shortlist club</ProDayText>
      <ProDayText variant="caption" muted>
        Notes privées visibles par le staff de votre club
      </ProDayText>
      <TextInput
        style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.background }]}
        placeholder="Points forts, suivi, prochain match à voir…"
        placeholderTextColor={c.textMuted}
        value={notes}
        onChangeText={setNotes}
        multiline
        maxLength={500}
        textAlignVertical="top"
      />
      <View style={styles.actions}>
        <PressableSpring
          style={[styles.btn, { backgroundColor: c.brand }]}
          onPress={() => void save()}
          disabled={saving}
          scaleTo={0.97}
          haptic
        >
          <ProDayText variant="caption" inverse style={styles.btnText}>
            {onList ? 'Mettre à jour' : 'Ajouter à la shortlist'}
          </ProDayText>
        </PressableSpring>
        {onList ? (
          <PressableSpring
            style={[styles.btnOutline, { borderColor: c.border }]}
            onPress={() => void remove()}
            disabled={saving}
            scaleTo={0.97}
          >
            <ProDayText variant="caption" style={styles.btnText}>
              Retirer
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>
    </View>
  );
};

function createStyles(_c: { border: string }) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    input: {
      minHeight: 72,
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.sm,
      fontSize: 14,
      marginTop: spacing.xs,
    },
    actions: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
    btn: {
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.pill,
    },
    btnOutline: {
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    btnText: { fontWeight: '800' },
  });
}
