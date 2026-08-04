import React, { useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { User } from '../../models/User';
import {
  DEFAULT_SCOUT_ATTRIBUTES,
  SCOUT_REPORT_ATTRIBUTE_LABELS,
  SCOUT_REPORT_RECOMMENDATION_LABELS,
  type ScoutReportAttribute,
  type ScoutReportAttributeId,
  type ScoutReportRecommendation,
} from '../../models/ScoutReport';
import { computeOpportunityScore } from '../../core/recruitment/opportunityScore.engine';
import { recommendFromOpportunityBand } from '../../core/recruitment/scoutReport.engine';
import { scoutReportsService } from '../../services/scoutReports.service';
import { AnimatedModalShell } from '../motion';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface ScoutReportSheetProps {
  visible: boolean;
  onClose: () => void;
  staff: User;
  player: User;
  onSaved?: () => void;
}

const RECS: ScoutReportRecommendation[] = [
  'sign',
  'trial',
  'monitor',
  'pass',
  'need_more_data',
];

export const ScoutReportSheet: React.FC<ScoutReportSheetProps> = ({
  visible,
  onClose,
  staff,
  player,
  onSaved,
}) => {
  const clubId = staff.profile.club_id;
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const opportunity = useMemo(
    () => computeOpportunityScore({ player, viewer: staff }),
    [player, staff]
  );

  const [title, setTitle] = useState(`Rapport — ${player.display_name}`);
  const [summary, setSummary] = useState('');
  const [attributes, setAttributes] = useState<ScoutReportAttribute[]>(() =>
    DEFAULT_SCOUT_ATTRIBUTES.map((id) => ({ id, rating: 3 }))
  );
  const [recommendation, setRecommendation] = useState<ScoutReportRecommendation>(
    recommendFromOpportunityBand(opportunity.band)
  );
  const [saving, setSaving] = useState(false);

  const setRating = (id: ScoutReportAttributeId, rating: number) => {
    setAttributes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, rating } : a))
    );
  };

  const save = async () => {
    if (!clubId) {
      Alert.alert('Club requis', 'Associez un club à votre profil staff pour enregistrer un rapport.');
      return;
    }
    if (summary.trim().length < 20) {
      Alert.alert('Résumé trop court', 'Ajoutez au moins 20 caractères de synthèse.');
      return;
    }
    setSaving(true);
    try {
      await scoutReportsService.create({
        clubId,
        playerUid: player.uid,
        authorUid: staff.uid,
        title: title.trim() || `Rapport — ${player.display_name}`,
        attributes,
        summary: summary.trim(),
        opportunityBand: opportunity.band,
        opportunityScore: opportunity.score,
        recommendation,
      });
      onSaved?.();
      onClose();
      setSummary('');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedModalShell visible={visible} onClose={onClose} variant="full" handleOnly>
      <View style={styles.header}>
        <ProDayText variant="section">Rapport de scouting</ProDayText>
        <ProDayText variant="caption" muted>
          {player.display_name} · Opportunity {opportunity.score}% · {opportunity.label}
        </ProDayText>
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <ProDayText variant="caption" muted>
          Titre
        </ProDayText>
        <TextInput
          style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
          value={title}
          onChangeText={setTitle}
          placeholder="Titre du rapport"
          placeholderTextColor={c.textMuted}
        />

        <ProDayText variant="caption" muted style={styles.blockLabel}>
          Évaluation (1–5)
        </ProDayText>
        {attributes.map((attr) => (
          <View key={attr.id} style={styles.attrRow}>
            <ProDayText variant="body" style={styles.attrLabel}>
              {SCOUT_REPORT_ATTRIBUTE_LABELS[attr.id]}
            </ProDayText>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <PressableSpring
                  key={n}
                  onPress={() => setRating(attr.id, n)}
                  style={[
                    styles.ratingChip,
                    {
                      backgroundColor: attr.rating === n ? c.brand : c.surfaceMuted,
                      borderColor: attr.rating === n ? c.brand : c.border,
                    },
                  ]}
                  scaleTo={0.94}
                >
                  <ProDayText
                    variant="caption"
                    style={{ fontWeight: '800', color: attr.rating === n ? '#fff' : c.text }}
                  >
                    {n}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
          </View>
        ))}

        <ProDayText variant="caption" muted style={styles.blockLabel}>
          Recommandation
        </ProDayText>
        <View style={styles.recRow}>
          {RECS.map((rec) => (
            <PressableSpring
              key={rec}
              onPress={() => setRecommendation(rec)}
              style={[
                styles.recChip,
                {
                  backgroundColor: recommendation === rec ? c.accentSoft : c.surface,
                  borderColor: recommendation === rec ? c.brand : c.border,
                },
              ]}
              scaleTo={0.96}
            >
              <ProDayText
                variant="caption"
                style={{
                  fontWeight: '700',
                  color: recommendation === rec ? c.brand : c.textSecondary,
                }}
              >
                {SCOUT_REPORT_RECOMMENDATION_LABELS[rec]}
              </ProDayText>
            </PressableSpring>
          ))}
        </View>

        <ProDayText variant="caption" muted style={styles.blockLabel}>
          Synthèse
        </ProDayText>
        <TextInput
          style={[
            styles.input,
            styles.summary,
            { borderColor: c.border, color: c.text, backgroundColor: c.surface },
          ]}
          value={summary}
          onChangeText={setSummary}
          placeholder="Points forts, axes de progrès, contexte du match observé…"
          placeholderTextColor={c.textMuted}
          multiline
          textAlignVertical="top"
          maxLength={2000}
        />
      </ScrollView>

      <View style={styles.footer}>
        <PressableSpring
          style={[styles.saveBtn, { backgroundColor: c.brand }]}
          onPress={() => void save()}
          disabled={saving || !clubId}
          scaleTo={0.97}
          haptic
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
              Enregistrer le rapport
            </ProDayText>
          )}
        </PressableSpring>
      </View>
    </AnimatedModalShell>
  );
};

function createStyles(_c: { border: string }) {
  return StyleSheet.create({
    header: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: 4 },
    body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.xs },
    blockLabel: { marginTop: spacing.md, marginBottom: 4 },
    input: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      fontSize: 15,
    },
    summary: { minHeight: 120, marginTop: 4 },
    attrRow: { marginBottom: spacing.sm, gap: 6 },
    attrLabel: { fontWeight: '700' },
    ratingRow: { flexDirection: 'row', gap: 6 },
    ratingChip: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    recChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(0,0,0,0.08)',
    },
    saveBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      borderRadius: radius.pill,
      minHeight: 48,
    },
  });
}
