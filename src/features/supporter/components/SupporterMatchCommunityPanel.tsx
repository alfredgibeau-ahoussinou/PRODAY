import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { SUPPORTER_SITE } from '../../../content/supporterPageIdentity';
import { spacing, radius } from '../../../theme/designTokens';

type Props = {
  homeScore?: number;
  awayScore?: number;
};

/** Scaffold community — MOTM poll + prédiction score (beta local). */
export const SupporterMatchCommunityPanel: React.FC<Props> = ({ homeScore, awayScore }) => {
  const [motm, setMotm] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<string | null>(null);

  const options = ['Joueur domicile', 'Joueur extérieur', 'Gardien'];

  return (
    <View style={styles.root}>
      <ProDayText variant="section" style={styles.title}>
        Communauté
      </ProDayText>
      <ProDayText variant="caption" style={styles.hint}>
        Sondages beta — Firestore Phase 2
      </ProDayText>

      <ProDayText variant="caption" style={styles.label}>
        Homme du match
      </ProDayText>
      <View style={styles.chips}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            onPress={() => setMotm(opt)}
            style={[styles.chip, motm === opt && styles.chipOn]}
          >
            <ProDayText variant="caption" style={motm === opt ? styles.chipTextOn : styles.chipText}>
              {opt}
            </ProDayText>
          </Pressable>
        ))}
      </View>

      <ProDayText variant="caption" style={styles.label}>
        Prédiction score
      </ProDayText>
      <View style={styles.chips}>
        {['1-0', '2-1', '1-1', '0-0'].map((opt) => (
          <Pressable
            key={opt}
            onPress={() => setPrediction(opt)}
            style={[styles.chip, prediction === opt && styles.chipOn]}
          >
            <ProDayText variant="caption" style={prediction === opt ? styles.chipTextOn : styles.chipText}>
              {opt}
            </ProDayText>
          </Pressable>
        ))}
      </View>

      {homeScore != null && awayScore != null ? (
        <ProDayText variant="caption" style={styles.muted}>
          Score actuel : {homeScore} – {awayScore}
        </ProDayText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: spacing.sm, paddingVertical: spacing.md },
  title: { color: SUPPORTER_SITE.foreground },
  hint: { color: SUPPORTER_SITE.muted, fontSize: 11 },
  label: {
    color: SUPPORTER_SITE.muted,
    letterSpacing: 1.2,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
  },
  chipOn: { backgroundColor: SUPPORTER_SITE.soft, borderColor: SUPPORTER_SITE.accent },
  chipText: { color: SUPPORTER_SITE.muted },
  chipTextOn: { color: SUPPORTER_SITE.foreground },
  muted: { color: SUPPORTER_SITE.muted, marginTop: spacing.sm },
});
