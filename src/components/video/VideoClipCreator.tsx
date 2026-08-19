/**
 * VideoClipCreator — UI coach pour créer un clip (segment début→fin) + tag + joueurs.
 */

import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Alert } from 'react-native';
import { AnimatedModalShell, PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import {
  VIDEO_CLIP_TAG_LABELS,
  type VideoClipTag,
  type CreateVideoClipInput,
} from '../../models/VideoClip';

const TAGS: VideoClipTag[] = [
  'goal', 'shot', 'chance', 'foul', 'card', 'substitution', 'tactical', 'other',
];

interface VideoClipCreatorProps {
  visible: boolean;
  onClose: () => void;
  videoId: string;
  matchId?: string;
  videoDurationSec?: number;
  authorUid: string;
  players?: { uid: string; name: string }[];
  onSubmit: (input: CreateVideoClipInput) => void;
}

export const VideoClipCreator: React.FC<VideoClipCreatorProps> = ({
  visible,
  onClose,
  videoId,
  matchId,
  videoDurationSec,
  authorUid,
  players = [],
  onSubmit,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  const [startSec, setStartSec] = useState('');
  const [endSec, setEndSec] = useState('');
  const [tag, setTag] = useState<VideoClipTag>('tactical');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [note, setNote] = useState('');

  const togglePlayer = (uid: string) => {
    setSelectedPlayers((prev) =>
      prev.includes(uid) ? prev.filter((p) => p !== uid) : [...prev, uid],
    );
  };

  const submit = () => {
    const s = Number(startSec.replace(',', '.'));
    const e = Number(endSec.replace(',', '.'));
    if (!Number.isFinite(s) || !Number.isFinite(e) || s < 0) {
      Alert.alert('Erreur', 'Temps invalide');
      return;
    }
    if (e <= s) {
      Alert.alert('Erreur', 'La fin doit être après le début');
      return;
    }
    if (videoDurationSec && e > videoDurationSec) {
      Alert.alert('Erreur', `La vidéo fait ${Math.floor(videoDurationSec)}s`);
      return;
    }
    onSubmit({
      video_id: videoId,
      match_id: matchId,
      start_sec: s,
      end_sec: e,
      tag,
      player_uids: selectedPlayers,
      note: note.trim() || undefined,
      created_by: authorUid,
    });
    setStartSec('');
    setEndSec('');
    setNote('');
    setSelectedPlayers([]);
    onClose();
  };

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} variant="compact" handleOnly>
      <View style={styles.header}>
        <ProDayText variant="section">Créer un clip</ProDayText>
        <ProDayText variant="caption" muted>
          Sélectionnez le segment et taguez l'action
        </ProDayText>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <ProDayText variant="caption" muted>Début (sec)</ProDayText>
            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
              value={startSec}
              onChangeText={setStartSec}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor={c.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ProDayText variant="caption" muted>Fin (sec)</ProDayText>
            <TextInput
              style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
              value={endSec}
              onChangeText={setEndSec}
              keyboardType="decimal-pad"
              placeholder="30"
              placeholderTextColor={c.textMuted}
            />
          </View>
        </View>

        <ProDayText variant="caption" muted style={{ marginTop: spacing.xs }}>
          Type d'action
        </ProDayText>
        <View style={styles.tagRow}>
          {TAGS.map((t) => (
            <PressableSpring
              key={t}
              onPress={() => setTag(t)}
              scaleTo={0.96}
              style={[
                styles.tagChip,
                {
                  borderColor: tag === t ? c.brand : c.border,
                  backgroundColor: tag === t ? c.accentSoft : c.surface,
                },
              ]}
            >
              <ProDayText
                variant="caption"
                style={{ fontWeight: '700', color: tag === t ? c.brand : c.textSecondary }}
              >
                {VIDEO_CLIP_TAG_LABELS[t]}
              </ProDayText>
            </PressableSpring>
          ))}
        </View>

        {players.length > 0 && (
          <>
            <ProDayText variant="caption" muted style={{ marginTop: spacing.xs }}>
              Joueurs concernés
            </ProDayText>
            <View style={styles.tagRow}>
              {players.map((p) => (
                <PressableSpring
                  key={p.uid}
                  onPress={() => togglePlayer(p.uid)}
                  scaleTo={0.96}
                  style={[
                    styles.tagChip,
                    {
                      borderColor: selectedPlayers.includes(p.uid) ? c.brand : c.border,
                      backgroundColor: selectedPlayers.includes(p.uid) ? c.accentSoft : c.surface,
                    },
                  ]}
                >
                  <ProDayText
                    variant="caption"
                    numberOfLines={1}
                    style={{
                      fontWeight: '600',
                      color: selectedPlayers.includes(p.uid) ? c.brand : c.textSecondary,
                    }}
                  >
                    {p.name}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
          </>
        )}

        <TextInput
          style={[styles.input, styles.multi, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
          value={note}
          onChangeText={setNote}
          placeholder="Note coach (optionnel)"
          placeholderTextColor={c.textMuted}
          multiline
        />

        <PressableSpring
          style={[styles.submitBtn, { backgroundColor: c.brand }]}
          onPress={submit}
          scaleTo={0.97}
          haptic
        >
          <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
            Ajouter le clip
          </ProDayText>
        </PressableSpring>
      </ScrollView>
    </AnimatedModalShell>
  );
};

function createStyles(_c: { border: string }) {
  return StyleSheet.create({
    header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 4 },
    body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xs },
    timeRow: { flexDirection: 'row', gap: spacing.md },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      fontSize: 14,
    },
    multi: { minHeight: 64, textAlignVertical: 'top' },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: spacing.xs },
    tagChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    submitBtn: {
      marginTop: spacing.md,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: radius.pill,
    },
  });
}
