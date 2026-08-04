import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TextInput, ScrollView } from 'react-native';
import {
  annotationsForMedia,
  buildHighlightAnnotation,
  formatAnnotationTimestamp,
  HIGHLIGHT_ANNOTATION_KIND_LABELS,
  type HighlightAnnotation,
  type HighlightAnnotationKind,
} from '../../core/recruitment/highlightAnnotation.engine';
import { AnimatedModalShell, PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

const KINDS: HighlightAnnotationKind[] = [
  'strength',
  'weakness',
  'tactical',
  'physical',
  'note',
];

interface HighlightAnnotationSheetProps {
  visible: boolean;
  onClose: () => void;
  mediaUrl: string;
  authorUid: string;
  annotations: HighlightAnnotation[];
  onChange: (next: HighlightAnnotation[]) => void;
}

export const HighlightAnnotationSheet: React.FC<HighlightAnnotationSheetProps> = ({
  visible,
  onClose,
  mediaUrl,
  authorUid,
  annotations,
  onChange,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [timestamp, setTimestamp] = useState('0');
  const [kind, setKind] = useState<HighlightAnnotationKind>('strength');
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');

  const forMedia = annotationsForMedia(annotations, mediaUrl);

  const add = () => {
    const sec = Number(timestamp.replace(',', '.'));
    if (!Number.isFinite(sec) || sec < 0) return;
    const next = buildHighlightAnnotation({
      mediaUrl,
      timestampSec: sec,
      kind,
      label: label.trim() || HIGHLIGHT_ANNOTATION_KIND_LABELS[kind],
      note,
      authorUid,
    });
    onChange([...annotations, next]);
    setLabel('');
    setNote('');
  };

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} variant="compact" handleOnly>
      <View style={styles.header}>
        <ProDayText variant="section">Annotations highlight</ProDayText>
        <ProDayText variant="caption" muted numberOfLines={1}>
          Timestamps sur la vidéo ProDay du joueur
        </ProDayText>
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        {forMedia.map((a) => (
          <View
            key={a.id}
            style={[styles.row, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
          >
            <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
              {formatAnnotationTimestamp(a.timestamp_sec)}
            </ProDayText>
            <View style={{ flex: 1 }}>
              <ProDayText variant="body" numberOfLines={1} style={{ fontWeight: '700' }}>
                {HIGHLIGHT_ANNOTATION_KIND_LABELS[a.kind]} · {a.label}
              </ProDayText>
              {a.note ? (
                <ProDayText variant="caption" muted numberOfLines={2}>
                  {a.note}
                </ProDayText>
              ) : null}
            </View>
          </View>
        ))}

        <ProDayText variant="caption" muted style={{ marginTop: spacing.sm }}>
          Temps (sec)
        </ProDayText>
        <TextInput
          style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
          value={timestamp}
          onChangeText={setTimestamp}
          keyboardType="decimal-pad"
          placeholder="ex. 42"
          placeholderTextColor={c.textMuted}
        />

        <View style={styles.kindRow}>
          {KINDS.map((k) => (
            <PressableSpring
              key={k}
              onPress={() => setKind(k)}
              style={[
                styles.kindChip,
                {
                  borderColor: kind === k ? c.brand : c.border,
                  backgroundColor: kind === k ? c.accentSoft : c.surface,
                },
              ]}
              scaleTo={0.96}
            >
              <ProDayText
                variant="caption"
                style={{ fontWeight: '700', color: kind === k ? c.brand : c.textSecondary }}
              >
                {HIGHLIGHT_ANNOTATION_KIND_LABELS[k]}
              </ProDayText>
            </PressableSpring>
          ))}
        </View>

        <TextInput
          style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
          value={label}
          onChangeText={setLabel}
          placeholder="Libellé"
          placeholderTextColor={c.textMuted}
        />
        <TextInput
          style={[
            styles.input,
            styles.note,
            { borderColor: c.border, color: c.text, backgroundColor: c.surface },
          ]}
          value={note}
          onChangeText={setNote}
          placeholder="Note (optionnel)"
          placeholderTextColor={c.textMuted}
          multiline
        />

        <PressableSpring
          style={[styles.addBtn, { backgroundColor: c.brand }]}
          onPress={add}
          scaleTo={0.97}
          haptic
        >
          <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
            Ajouter l’annotation
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
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1,
      marginBottom: spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      fontSize: 14,
      marginBottom: spacing.xs,
    },
    note: { minHeight: 64, textAlignVertical: 'top' },
    kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: spacing.xs },
    kindChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    addBtn: {
      marginTop: spacing.sm,
      alignItems: 'center',
      paddingVertical: 12,
      borderRadius: radius.pill,
    },
  });
}
